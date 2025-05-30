import React, { useState, useCallback, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { SceneDialog } from "@/components/projects/scenes/scene-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createSceneColumns } from "@/components/projects/scenes/scene-columns";
import { SlidersHorizontal } from "lucide-react";

const SceneTable = memo(function SceneTable({ items = [], loading = false }) {
  const { deleteItem, duplicateItem, updateItem } = useProjectDetail();
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
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [saveLoading, setSaveLoading] = useState(false);

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

  // Handle inline cell editing
  const handleCellEdit = useCallback((itemId, field, newValue) => {
    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      const itemChanges = newChanges.get(itemId) || {};
      itemChanges[field] = newValue;
      newChanges.set(itemId, itemChanges);
      return newChanges;
    });
  }, []);

  // Get effective value (pending change or original value)
  const getEffectiveValue = useCallback(
    (itemId, field, originalValue) => {
      const itemChanges = pendingChanges.get(itemId);
      return itemChanges && itemChanges.hasOwnProperty(field)
        ? itemChanges[field]
        : originalValue;
    },
    [pendingChanges]
  );

  // Save all pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChanges) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const updatedItem = { ...item, ...changes };
          await updateItem("scene", updatedItem.id, updatedItem);
        }
      }
      setPendingChanges(new Map());
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [pendingChanges, items, updateItem]);

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
        await duplicateItem("scene", item.id);
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
        description: `Are you sure you want to delete "${
          item.name || `Scene ${item.address}`
        }"? This action cannot be undone and will also remove all items associated with this scene.`,
        onConfirm: async () => {
          try {
            await deleteItem("scene", item.id);
            setConfirmDialog({ ...confirmDialog, open: false });
          } catch (error) {
            console.error("Failed to delete scene:", error);
          }
        },
      });
    },
    [deleteItem, confirmDialog]
  );

  const handleRowSelectionChange = useCallback((selectedRows) => {
    // Handle row selection if needed
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  // Add item counts to items data
  const itemsWithCounts = items.map((item) => ({
    ...item,
    itemCount: sceneItemCounts[item.id] || 0,
  }));

  const columns = createSceneColumns(
    handleEditItem,
    handleDuplicateItem,
    handleDeleteItem,
    handleCellEdit,
    getEffectiveValue
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
              Click "Add Scene" to create your first item.
            </p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Scene
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  category="scene"
                  columnVisibility={columnVisibility}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Scene"
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChanges.size > 0}
                  saveLoading={saveLoading}
                />
              )}
              <DataTable
                key="scene"
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
    </div>
  );
});

export { SceneTable };
