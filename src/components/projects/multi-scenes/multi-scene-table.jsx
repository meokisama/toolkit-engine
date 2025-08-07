import React, {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { createMultiSceneColumns } from "@/components/projects/multi-scenes/multi-scene-columns";
import { MultiSceneDialog } from "@/components/projects/multi-scenes/multi-scene-dialog";
import { SendMultiSceneDialog } from "@/components/projects/multi-scenes/send-multi-scene-dialog";
import { Layers } from "lucide-react";
import { toast } from "sonner";

const MultiSceneTable = memo(function MultiSceneTable({
  items = [],
  loading = false,
}) {
  const category = "multi_scenes";
  const { deleteItem, duplicateItem, updateItem } = useProjectDetail();
  const [multiSceneCounts, setMultiSceneCounts] = useState({});
  const [table, setTable] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null,
  });
  const [sendMultiSceneDialog, setSendMultiSceneDialog] = useState({
    open: false,
    items: [],
  });

  // Add states for table functionality
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // ✅ Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Load scene counts for each multi-scene
  const loadMultiSceneCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const multiScene of items) {
        try {
          const scenes = await window.electronAPI.multiScenes.getScenes(
            multiScene.id
          );
          counts[multiScene.id] = scenes.length;
        } catch (error) {
          console.error(
            `Failed to load scene count for multi-scene ${multiScene.id}:`,
            error
          );
          counts[multiScene.id] = 0;
        }
      }
      setMultiSceneCounts(counts);
    } catch (error) {
      console.error("Failed to load multi-scene counts:", error);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      loadMultiSceneCounts();
    }
  }, [items, loadMultiSceneCounts]);

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    setDialogMode("create");
    setDialogOpen(true);
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setDialogMode("edit");
    setDialogOpen(true);
  }, []);

  const handleDuplicateItem = useCallback(
    async (id) => {
      try {
        await duplicateItem(category, id);
        // Reload scene counts after duplication
        setTimeout(loadMultiSceneCounts, 100);
      } catch (error) {
        console.error("Failed to duplicate multi-scene:", error);
      }
    },
    [duplicateItem, loadMultiSceneCounts]
  );

  const handleDeleteItem = useCallback(
    (item) => {
      setConfirmDialog({
        open: true,
        title: "Delete Multi-Scene",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            setConfirmDialog({ ...confirmDialog, open: false });
            // Reload scene counts after deletion
            setTimeout(loadMultiSceneCounts, 100);
          } catch (error) {
            console.error("Failed to delete multi-scene:", error);
          }
        },
      });
    },
    [deleteItem, confirmDialog, loadMultiSceneCounts]
  );

  const handleSendToUnit = useCallback(
    (item) => {
      // Calculate index based on array position instead of database ID
      const multiSceneIndex = items.findIndex(
        (multiScene) => multiScene.id === item.id
      );
      setSendMultiSceneDialog({
        open: true,
        items: [{ ...item, calculatedIndex: multiSceneIndex }], // Single multi-scene as array
      });
    },
    [items]
  );

  const handleSendAllMultiScenes = useCallback(() => {
    // Add calculated index to all multi-scenes
    const multiScenesWithIndex = items.map((multiScene, index) => ({
      ...multiScene,
      calculatedIndex: index,
    }));

    setSendMultiSceneDialog({
      open: true,
      items: multiScenesWithIndex, // Pass all multi-scenes as array
    });
  }, [items]);

  // Add handlers for table functionality
  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleBulkDelete = useCallback(
    async (selectedItems) => {
      setConfirmDialog({
        open: true,
        title: "Delete Multi-Scenes",
        description: `Are you sure you want to delete ${selectedItems.length} multi-scene(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            for (const item of selectedItems) {
              await deleteItem(category, item.id);
            }
            toast.success(
              `Successfully deleted ${selectedItems.length} multi-scene(s)`
            );
            setConfirmDialog({ ...confirmDialog, open: false });
          } catch (error) {
            console.error("Failed to delete multi-scenes:", error);
            toast.error("Failed to delete multi-scenes");
          }
        },
      });
    },
    [deleteItem, confirmDialog]
  );

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChangesRef.current) {
        await updateItem(category, itemId, changes);
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem]);

  const handleDialogClose = useCallback(
    (success) => {
      setDialogOpen(false);
      setEditingItem(null);
      if (success) {
        // Reload scene counts after successful create/edit
        setTimeout(loadMultiSceneCounts, 100);
      }
    },
    [loadMultiSceneCounts]
  );

  // ✅ Stable function that doesn't change reference
  const handleCellEdit = useCallback((itemId, field, value) => {
    const existingChanges = pendingChangesRef.current.get(itemId) || {};
    pendingChangesRef.current.set(itemId, {
      ...existingChanges,
      [field]: value,
    });

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // ✅ Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined
      ? pendingChange[field]
      : item[field];
  }, []); // No dependencies = stable function!

  // Add scene counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    sceneCount: multiSceneCounts[item.id] || 0,
  }));

  // ✅ Now columns will be truly stable because all dependencies are stable!
  const columns = useMemo(
    () =>
      createMultiSceneColumns(
        handleEditItem,
        handleDuplicateItem,
        handleDeleteItem,
        handleCellEdit,
        getEffectiveValue,
        handleSendToUnit
      ),
    [
      handleEditItem,
      handleDuplicateItem,
      handleDeleteItem,
      handleCellEdit,
      getEffectiveValue, // This is now stable!
      handleSendToUnit,
    ]
  );

  if (loading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No multi-scenes found.</p>
            <p className="text-sm mb-8">
              Click "Add Multi-Scene" to create your first multi-scene.
            </p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Multi-Scene
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder="Search multi-scenes..."
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  category={category}
                  columnVisibility={columnVisibility}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Multi-Scene"
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAllMultiScenes}
                  sendAllLabel="Send All Multi-Scenes"
                />
              )}
              <DataTable
                key={category}
                columns={columns}
                data={itemsWithCounts}
                initialPagination={pagination}
                onTableReady={setTable}
                onRowSelectionChange={handleRowSelectionChange}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onPaginationChange={handlePaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                enableRowSelection={true}
              />
            </div>
            {table && (
              <DataTablePagination table={table} pagination={pagination} />
            )}
          </div>
        )}
      </div>

      <MultiSceneDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        multiScene={editingItem}
        mode={dialogMode}
      />

      <SendMultiSceneDialog
        open={sendMultiSceneDialog.open}
        onOpenChange={(open) =>
          setSendMultiSceneDialog((prev) => ({ ...prev, open }))
        }
        items={sendMultiSceneDialog.items}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
});

export { MultiSceneTable };
