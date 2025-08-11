import React, {
  useState,
  useCallback,
  memo,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { SceneDialog } from "@/components/projects/scenes/scene-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createSceneColumns } from "@/components/projects/scenes/scene-columns";
import { SlidersHorizontal } from "lucide-react";
import { SendSceneDialog } from "@/components/projects/scenes/send-scene-dialog";
import { ImportCategoryDialog } from "@/components/projects/import-category-dialog";
import { toast } from "sonner";

const SceneTable = memo(function SceneTable({ items = [], loading = false }) {
  const category = "scene";
  const { deleteItem, duplicateItem, updateItem, exportItems, importItems, selectedProject } = useProjectDetail();
  const [sceneItemCounts, setSceneItemCounts] = useState({});
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
  const [sendSceneDialog, setSendSceneDialog] = useState({
    open: false,
    items: [],
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);

  // ✅ Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Load scene item counts only when tab is active and has items
  useEffect(() => {
    const loadSceneItemCounts = async () => {
      const counts = {};
      for (const scene of items) {
        try {
          const sceneItems = await window.electronAPI.scene.getItemsWithDetails(
            scene.id
          );
          counts[scene.id] = sceneItems.length;
        } catch (error) {
          console.error(`Failed to load items for scene ${scene.id}:`, error);
          counts[scene.id] = 0;
        }
      }
      setSceneItemCounts(counts);
    };

    // Only load counts if we have items and not in loading state
    if (items.length > 0 && !loading) {
      loadSceneItemCounts();
    } else {
      // Clear counts when no items
      setSceneItemCounts({});
    }
  }, [items, loading]);

  // Reload scene item counts
  const reloadSceneItemCounts = useCallback(async () => {
    if (items.length > 0) {
      const counts = {};
      for (const scene of items) {
        try {
          const sceneItems = await window.electronAPI.scene.getItemsWithDetails(
            scene.id
          );
          counts[scene.id] = sceneItems.length;
        } catch (error) {
          console.error(`Failed to load items for scene ${scene.id}:`, error);
          counts[scene.id] = 0;
        }
      }
      setSceneItemCounts(counts);
    }
  }, [items]);

  // ✅ Stable function that doesn't change reference
  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;
    pendingChangesRef.current.set(itemId, itemChanges);

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // ✅ Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((itemId, field, originalValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId);
    return itemChanges && itemChanges.hasOwnProperty(field)
      ? itemChanges[field]
      : originalValue;
  }, []); // No dependencies = stable function!

  // Save all pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChangesRef.current) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const updatedItem = { ...item, ...changes };
          await updateItem(category, updatedItem.id, updatedItem);
        }
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [items, updateItem]);

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

  const handleDialogClose = useCallback(
    (open) => {
      setDialogOpen(open);
      if (!open) {
        // Reload scene item counts when dialog closes
        setTimeout(() => {
          reloadSceneItemCounts();
        }, 100);
      }
    },
    [reloadSceneItemCounts]
  );

  const handleDuplicateItem = useCallback(
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        console.error("Failed to duplicate scene:", error);
      }
    },
    [duplicateItem]
  );

  const handleDeleteItem = useCallback(
    (item) => {
      setConfirmDialog({
        open: true,
        title: "Delete Scene",
        description: `Are you sure you want to delete "${item.name || `Scene ${item.address}`
          }"? This action cannot be undone and will also remove all items associated with this scene.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            setConfirmDialog({ ...confirmDialog, open: false });
          } catch (error) {
            console.error("Failed to delete scene:", error);
          }
        },
      });
    },
    [deleteItem, confirmDialog]
  );

  const handleSendToUnit = useCallback(
    (item) => {
      // Calculate index based on array position instead of database ID
      const sceneIndex = items.findIndex((scene) => scene.id === item.id);
      setSendSceneDialog({
        open: true,
        items: [{ ...item, calculatedIndex: sceneIndex }], // Single scene as array
      });
    },
    [items]
  );

  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleBulkDelete = useCallback(async (selectedItems) => {
    try {
      const deletePromises = selectedItems.map((item) =>
        deleteItem(category, item.id)
      );
      await Promise.all(deletePromises);

      if (table) {
        table.resetRowSelection();
      }
    } catch (error) {
      console.error("Failed to bulk delete scenes:", error);
    }
  }, [deleteItem, table]);

  const handleSendAllScenes = useCallback(() => {
    // Add calculated index to all scenes
    const scenesWithIndex = items.map((scene, index) => ({
      ...scene,
      calculatedIndex: index,
    }));

    setSendSceneDialog({
      open: true,
      items: scenesWithIndex, // Pass all scenes as array
    });
  }, [items]);

  // Export/Import handlers
  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export scene items:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems(category, items);
        setImportDialogOpen(false);
        // Reload scene item counts after import
        setTimeout(() => {
          reloadSceneItemCounts();
        }, 100);
      } catch (error) {
        console.error("Failed to import scene items:", error);
      }
    },
    [importItems, reloadSceneItemCounts]
  );

  // Add item counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    itemCount: sceneItemCounts[item.id] || 0,
  }));

  // ✅ Now columns will be truly stable because all dependencies are stable!
  const columns = useMemo(
    () =>
      createSceneColumns(
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
            <SlidersHorizontal className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scenes found.</p>
            <p className="text-sm mb-8">
              Click "Add Scene" to create your first item or "Import" to import from CSV.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleCreateItem}>
                <Plus className="h-4 w-4" />
                Add Scene
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full justify-between">
            <div className="flex-1 space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  category={category}
                  columnVisibility={columnVisibility}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Scene"
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAllScenes}
                  sendAllLabel="Send All Scenes"
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  onExport={handleExport}
                  onImport={handleImport}
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
                onSendScene={handleSendToUnit}
                enableRowSelection={true}
              />
            </div>
            {table && (
              <DataTablePagination table={table} pagination={pagination} />
            )}
          </div>
        )}
      </div>

      <SceneDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        scene={editingItem}
        mode={dialogMode}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />

      <SendSceneDialog
        open={sendSceneDialog.open}
        onOpenChange={(open) =>
          setSendSceneDialog({ ...sendSceneDialog, open })
        }
        items={sendSceneDialog.items}
      />

      <ImportCategoryDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        category={category}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
});

export { SceneTable };
