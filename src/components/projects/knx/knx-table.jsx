import React, { useState, useCallback, memo, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { KnxItemDialog } from "@/components/projects/knx/knx-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createKnxItemsColumns } from "@/components/projects/knx/knx-columns";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { SendKnxDialog } from "@/components/projects/knx/send-knx-dialog";
import { GenerateFromLightingSheet } from "@/components/projects/knx/sheets/generate-lighting";
import { GenerateFromCurtainSheet } from "@/components/projects/knx/sheets/generate-curtain";
import { GenerateFromSceneSheet } from "@/components/projects/knx/sheets/generate-scene";
import { GenerateFromMultiSceneSheet } from "@/components/projects/knx/sheets/generate-multi-scene";
import { GenerateFromSequenceSheet } from "@/components/projects/knx/sheets/generate-sequence";
import { Network } from "lucide-react";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { useTableUI } from "@/hooks/use-table-ui";
import log from "electron-log/renderer";

function KnxTableComponent({ items, loading }) {
  const { deleteItem, duplicateItem, exportItems, importItems, updateItem, projectItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const {
    openCreate,
    openEdit,
    closeCrud,
    openConfirm,
    closeConfirm,
    setConfirmLoading,
    openBulkDelete,
    closeBulkDelete,
    setBulkDeleteLoading,
    openImport,
    closeImport,
  } = dialogs;

  const { columnVisibility, pagination, onColumnVisibilityChange, onPaginationChange } = useTableUI(category, { description: false });

  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // KNX-specific send/generate dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [itemsToSend, setItemsToSend] = useState([]);
  const [generateLightingSheetOpen, setGenerateLightingSheetOpen] = useState(false);
  const [generateCurtainSheetOpen, setGenerateCurtainSheetOpen] = useState(false);
  const [generateSceneSheetOpen, setGenerateSceneSheetOpen] = useState(false);
  const [generateMultiSceneSheetOpen, setGenerateMultiSceneSheetOpen] = useState(false);
  const [generateSequenceSheetOpen, setGenerateSequenceSheetOpen] = useState(false);

  const category = "knx";

  // Get unit items for source unit filtering
  const unitItems = projectItems.unit || [];

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
        const originalItem = items.find((item) => item.id === itemId);
        if (!originalItem) throw new Error(`Original item with id ${itemId} not found`);

        const completeItemData = {
          name: originalItem.name || "",
          address: originalItem.address || 0,
          type: originalItem.type || 0,
          factor: originalItem.factor || 2,
          feedback: originalItem.feedback || 0,
          rcu_group_id: originalItem.rcu_group_id || null,
          knx_switch_group: originalItem.knx_switch_group || "",
          knx_dimming_group: originalItem.knx_dimming_group || "",
          knx_value_group: originalItem.knx_value_group || "",
          knx_status_group: originalItem.knx_status_group || "",
          description: originalItem.description || "",
          source_unit: originalItem.source_unit || null,
          ...changes,
        };

        await updateItem(category, itemId, completeItemData);
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
    } catch (error) {
      log.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [updateItem, category, items]);

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);

  const handleEditItem = useCallback((item) => openEdit(item), [openEdit]);

  const handleDuplicateItem = useCallback(
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        log.error("Failed to duplicate item:", error);
      }
    },
    [duplicateItem, category],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete KNX Device",
        description: `Are you sure you want to delete "${item?.name || `Device ${item?.address}`}"? This action cannot be undone.`,
        onConfirm: async () => {
          setConfirmLoading(true);
          try {
            await deleteItem(category, item.id);
            closeConfirm();
          } catch (error) {
            log.error("Failed to delete item:", error);
          } finally {
            setConfirmLoading(false);
          }
        },
      });
    },
    [openConfirm, closeConfirm, setConfirmLoading, deleteItem, category],
  );

  const handleBulkDelete = useCallback(
    (selectedItems) => {
      openBulkDelete(selectedItems);
    },
    [openBulkDelete],
  );

  const confirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const item of dialogs.bulkDelete.items) {
        await deleteItem(category, item.id);
      }
      closeBulkDelete();
      table?.resetRowSelection();
    } catch (error) {
      log.error("Failed to delete items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [dialogs.bulkDelete.items, deleteItem, category, closeBulkDelete, setBulkDeleteLoading, table]);

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);

  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      log.error("Failed to export items:", error);
    }
  }, [exportItems, category]);

  const handleImport = useCallback(() => openImport(), [openImport]);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems(category, items);
        closeImport();
      } catch (error) {
        log.error("Failed to import items:", error);
      }
    },
    [importItems, category, closeImport],
  );

  const handleSendAll = useCallback(() => {
    setItemsToSend(items);
    setSendDialogOpen(true);
  }, [items]);

  const handleSendKnx = useCallback((knxItem) => {
    setItemsToSend([knxItem]);
    setSendDialogOpen(true);
  }, []);

  const handleGenerateFromLighting = useCallback(() => setGenerateLightingSheetOpen(true), []);
  const handleGenerateFromCurtain = useCallback(() => setGenerateCurtainSheetOpen(true), []);
  const handleGenerateFromScene = useCallback(() => setGenerateSceneSheetOpen(true), []);
  const handleGenerateFromMultiScene = useCallback(() => setGenerateMultiSceneSheetOpen(true), []);
  const handleGenerateFromSequence = useCallback(() => setGenerateSequenceSheetOpen(true), []);

  const columns = useMemo(
    () => createKnxItemsColumns(handleCellEdit, getEffectiveValue, projectItems || {}, unitItems),
    [handleCellEdit, getEffectiveValue, projectItems, unitItems],
  );

  if (loading) {
    return <DataTableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No KNX devices found.</p>
            <p className="text-sm mb-8">Click "Add Device" to create your first KNX device.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder={`Search KNX devices...`}
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Device"
                  onExport={handleExport}
                  onImport={handleImport}
                  category={category}
                  columnVisibility={columnVisibility}
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAll}
                  sendAllLabel="Send All KNXs"
                  onGenerateFromLighting={handleGenerateFromLighting}
                  onGenerateFromCurtain={handleGenerateFromCurtain}
                  onGenerateFromScene={handleGenerateFromScene}
                  onGenerateFromMultiScene={handleGenerateFromMultiScene}
                  onGenerateFromSequence={handleGenerateFromSequence}
                />
              )}
              <DataTable
                key={category}
                columns={columns}
                data={items}
                initialPagination={pagination}
                initialColumnVisibility={columnVisibility}
                onTableReady={setTable}
                onRowSelectionChange={handleRowSelectionChange}
                onColumnVisibilityChange={onColumnVisibilityChange}
                onPaginationChange={onPaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                onSendKnx={handleSendKnx}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <KnxItemDialog open={dialogs.crud.open} onOpenChange={(open) => !open && closeCrud()} mode={dialogs.crud.mode} item={dialogs.crud.item} />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        onConfirm={dialogs.confirm.onConfirm}
        loading={dialogs.confirm.loading}
      />

      <ConfirmDialog
        open={dialogs.bulkDelete.open}
        onOpenChange={(open) => !open && closeBulkDelete()}
        title="Delete KNX Devices"
        description={`Are you sure you want to delete ${dialogs.bulkDelete.items.length} selected devices? This action cannot be undone.`}
        onConfirm={confirmBulkDelete}
        loading={dialogs.bulkDelete.loading}
      />

      <ImportItemsDialog
        open={dialogs.importDialog.open}
        onOpenChange={(open) => !open && closeImport()}
        category={category}
        onConfirm={handleImportConfirm}
      />
      <SendKnxDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} items={itemsToSend} />
      <GenerateFromLightingSheet open={generateLightingSheetOpen} onOpenChange={setGenerateLightingSheetOpen} />
      <GenerateFromCurtainSheet open={generateCurtainSheetOpen} onOpenChange={setGenerateCurtainSheetOpen} />
      <GenerateFromSceneSheet open={generateSceneSheetOpen} onOpenChange={setGenerateSceneSheetOpen} />
      <GenerateFromMultiSceneSheet open={generateMultiSceneSheetOpen} onOpenChange={setGenerateMultiSceneSheetOpen} />
      <GenerateFromSequenceSheet open={generateSequenceSheetOpen} onOpenChange={setGenerateSequenceSheetOpen} />
    </>
  );
}

// Export memoized component with custom comparison function
export const KnxTable = memo(KnxTableComponent, (prevProps, nextProps) => {
  return prevProps.items === nextProps.items && prevProps.loading === nextProps.loading;
});
