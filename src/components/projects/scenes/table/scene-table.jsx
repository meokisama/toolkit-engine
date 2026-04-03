import React, { useState, useCallback, memo, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { SceneDialog } from "@/components/projects/scenes/scene-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createSceneColumns } from "@/components/projects/scenes/table/scene-columns";
import { SlidersHorizontal } from "lucide-react";
import { SendSceneDialog } from "@/components/projects/scenes/dialogs/send-scene-dialog";
import { ImportCategoryDialog } from "@/components/projects/import-category-dialog";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { toast } from "sonner";
import log from "electron-log/renderer";

const SceneTable = memo(function SceneTable({ items = [], loading = false }) {
  const category = "scene";
  const { deleteItem, duplicateItem, updateItem, exportItems, importItems, selectedProject, projectItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm, openImport, closeImport } = dialogs;

  // Scene-specific state
  const [sceneItemCounts, setSceneItemCounts] = useState({});
  const [sendSceneDialog, setSendSceneDialog] = useState({ open: false, items: [] });

  const [table, setTable] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const unitItems = projectItems?.unit || [];

  useEffect(() => {
    const loadSceneItemCounts = async () => {
      const counts = {};
      for (const scene of items) {
        try {
          const sceneItems = await window.electronAPI.scene.getItemsWithDetails(scene.id);
          counts[scene.id] = sceneItems.length;
        } catch (error) {
          log.error(`Failed to load items for scene ${scene.id}:`, error);
          counts[scene.id] = 0;
        }
      }
      setSceneItemCounts(counts);
    };

    if (items.length > 0 && !loading) {
      loadSceneItemCounts();
    } else {
      setSceneItemCounts({});
    }
  }, [items, loading]);

  const reloadSceneItemCounts = useCallback(async () => {
    if (items.length > 0) {
      const counts = {};
      for (const scene of items) {
        try {
          const sceneItems = await window.electronAPI.scene.getItemsWithDetails(scene.id);
          counts[scene.id] = sceneItems.length;
        } catch (error) {
          log.error(`Failed to load items for scene ${scene.id}:`, error);
          counts[scene.id] = 0;
        }
      }
      setSceneItemCounts(counts);
    }
  }, [items]);

  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;
    pendingChangesRef.current.set(itemId, itemChanges);
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  const getEffectiveValue = useCallback((itemId, field, originalValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId);
    return itemChanges && itemChanges.hasOwnProperty(field) ? itemChanges[field] : originalValue;
  }, []);

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
      log.error("Failed to save changes:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  }, [items, updateItem]);

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);

  const handleEditItem = useCallback((item) => openEdit(item), [openEdit]);

  const handleDialogClose = useCallback(
    (open) => {
      if (!open) {
        closeCrud();
        setTimeout(() => reloadSceneItemCounts(), 100);
      }
    },
    [closeCrud, reloadSceneItemCounts],
  );

  const handleDuplicateItem = useCallback(
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        log.error("Failed to duplicate scene:", error);
      }
    },
    [duplicateItem],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete Scene",
        description: `Are you sure you want to delete "${
          item.name || `Scene ${item.address}`
        }"? This action cannot be undone and will also remove all items associated with this scene.`,
        onConfirm: async () => {
          try {
            await deleteItem(category, item.id);
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete scene:", error);
          }
        },
      });
    },
    [openConfirm, closeConfirm, deleteItem],
  );

  const handleSendToUnit = useCallback(
    (item) => {
      const sceneIndex = items.findIndex((scene) => scene.id === item.id);
      setSendSceneDialog({ open: true, items: [{ ...item, calculatedIndex: sceneIndex }] });
    },
    [items],
  );

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);
  const handleColumnVisibilityChange = useCallback((visibility) => setColumnVisibility(visibility), []);
  const handlePaginationChange = useCallback((newPagination) => setPagination(newPagination), []);

  const handleBulkDelete = useCallback(
    async (selectedItems) => {
      try {
        await Promise.all(selectedItems.map((item) => deleteItem(category, item.id)));
        if (table) table.resetRowSelection();
      } catch (error) {
        log.error("Failed to bulk delete scenes:", error);
      }
    },
    [deleteItem, table],
  );

  const handleSendAllScenes = useCallback(() => {
    const scenesWithIndex = items.map((scene, index) => ({ ...scene, calculatedIndex: index }));
    setSendSceneDialog({ open: true, items: scenesWithIndex });
  }, [items]);

  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      log.error("Failed to export scene items:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(() => openImport(), [openImport]);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems(category, items);
        closeImport();
        setTimeout(() => reloadSceneItemCounts(), 100);
      } catch (error) {
        log.error("Failed to import scene items:", error);
      }
    },
    [importItems, closeImport, reloadSceneItemCounts],
  );

  const itemsWithCounts = items.map((item) => ({ ...item, itemCount: sceneItemCounts[item.id] || 0 }));

  const columns = useMemo(() => createSceneColumns(handleCellEdit, getEffectiveValue, unitItems), [handleCellEdit, getEffectiveValue, unitItems]);

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
            <p className="text-sm mb-8">Click "Add Scene" to create your first item or "Import" to import from CSV.</p>
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
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <SceneDialog open={dialogs.crud.open} onOpenChange={handleDialogClose} scene={dialogs.crud.item} mode={dialogs.crud.mode} />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
      />

      <SendSceneDialog
        open={sendSceneDialog.open}
        onOpenChange={(open) => setSendSceneDialog((prev) => ({ ...prev, open }))}
        items={sendSceneDialog.items}
      />

      <ImportCategoryDialog
        open={dialogs.importDialog.open}
        onOpenChange={(open) => !open && closeImport()}
        category={category}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
});

export { SceneTable };
