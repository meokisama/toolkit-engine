import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/store/use-project-detail";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { createMultiSceneColumns } from "@/components/projects/multi-scenes/multi-scene-columns";
import { MultiSceneDialog } from "@/components/projects/multi-scenes/multi-scene-dialog";
import { SendMultiSceneDialog } from "@/components/projects/multi-scenes/send-multi-scene-dialog";
import { Layers } from "lucide-react";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { useTableUI } from "@/hooks/use-table-ui";
import { toast } from "sonner";
import log from "electron-log/renderer";

const MultiSceneTable = memo(function MultiSceneTable({ items = [], loading = false }) {
  const category = "multi_scenes";
  const { deleteItem, duplicateItem, updateItem, projectItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm } = dialogs;

  // Multi-scene-specific state
  const [multiSceneCounts, setMultiSceneCounts] = useState({});
  const [sendMultiSceneDialog, setSendMultiSceneDialog] = useState({ open: false, items: [] });

  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const { columnVisibility, pagination, onColumnVisibilityChange, onPaginationChange } = useTableUI(category);
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const unitItems = projectItems?.unit || [];

  const loadMultiSceneCounts = useCallback(async () => {
    try {
      const counts = {};
      for (const multiScene of items) {
        try {
          const scenes = await window.electronAPI.multiScenes.getScenes(multiScene.id);
          counts[multiScene.id] = scenes.length;
        } catch (error) {
          log.error(`Failed to load scene count for multi-scene ${multiScene.id}:`, error);
          counts[multiScene.id] = 0;
        }
      }
      setMultiSceneCounts(counts);
    } catch (error) {
      log.error("Failed to load multi-scene counts:", error);
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      loadMultiSceneCounts();
    }
  }, [items, loadMultiSceneCounts]);

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);

  const handleEditItem = useCallback((item) => openEdit(item), [openEdit]);

  const handleDuplicateItem = useCallback(
    async (id) => {
      try {
        await duplicateItem(category, id);
        setTimeout(loadMultiSceneCounts, 100);
      } catch (error) {
        log.error("Failed to duplicate multi-scene:", error);
      }
    },
    [duplicateItem, loadMultiSceneCounts],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete Multi-Scene",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            closeConfirm();
            setTimeout(loadMultiSceneCounts, 100);
          } catch (error) {
            log.error("Failed to delete multi-scene:", error);
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem, loadMultiSceneCounts],
  );

  const handleSendMultiScene = useCallback(
    (item) => {
      const multiSceneIndex = items.findIndex((multiScene) => multiScene.id === item.id);
      setSendMultiSceneDialog({ open: true, items: [{ ...item, calculatedIndex: multiSceneIndex }] });
    },
    [items],
  );

  const handleSendAllMultiScenes = useCallback(() => {
    const multiScenesWithIndex = items.map((multiScene, index) => ({ ...multiScene, calculatedIndex: index }));
    setSendMultiSceneDialog({ open: true, items: multiScenesWithIndex });
  }, [items]);

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);

  const handleBulkDelete = useCallback(
    (selectedItems) => {
      openConfirm({
        title: "Delete Multi-Scenes",
        description: `Are you sure you want to delete ${selectedItems.length} multi-scene(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            for (const item of selectedItems) {
              await deleteItem(category, item.id);
            }
            toast.success(`Successfully deleted ${selectedItems.length} multi-scene(s)`);
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete multi-scenes:", error);
            toast.error("Failed to delete multi-scenes");
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem],
  );

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChangesRef.current) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const updatedItem = { ...item, ...changes };
          await updateItem(category, itemId, updatedItem);
        }
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
      toast.success("Changes saved successfully");
    } catch (error) {
      log.error("Failed to save changes:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, items]);

  const handleDialogClose = useCallback(
    (success) => {
      closeCrud();
      if (success) setTimeout(loadMultiSceneCounts, 100);
    },
    [closeCrud, loadMultiSceneCounts],
  );

  const handleCellEdit = useCallback((itemId, field, value) => {
    const existingChanges = pendingChangesRef.current.get(itemId) || {};
    pendingChangesRef.current.set(itemId, { ...existingChanges, [field]: value });
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  const getEffectiveValue = useCallback((item, field) => {
    const pendingChange = pendingChangesRef.current.get(item.id);
    return pendingChange && pendingChange[field] !== undefined ? pendingChange[field] : item[field];
  }, []);

  const itemsWithCounts = items.map((item) => ({ ...item, sceneCount: multiSceneCounts[item.id] || 0 }));

  const columns = useMemo(
    () => createMultiSceneColumns(handleCellEdit, getEffectiveValue, unitItems),
    [handleCellEdit, getEffectiveValue, unitItems],
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
            <p className="text-sm mb-8">Click "Add Multi-Scene" to create your first multi-scene.</p>
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
                onColumnVisibilityChange={onColumnVisibilityChange}
                onPaginationChange={onPaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                onSendMultiScene={handleSendMultiScene}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <MultiSceneDialog open={dialogs.crud.open} onOpenChange={handleDialogClose} multiScene={dialogs.crud.item} mode={dialogs.crud.mode} />

      <SendMultiSceneDialog
        open={sendMultiSceneDialog.open}
        onOpenChange={(open) => setSendMultiSceneDialog((prev) => ({ ...prev, open }))}
        items={sendMultiSceneDialog.items}
      />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
      />
    </div>
  );
});

export { MultiSceneTable };
