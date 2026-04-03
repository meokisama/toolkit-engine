import React, { useState, useMemo, useCallback, useRef } from "react";
import { Blinds, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createCurtainColumns } from "@/components/projects/curtain/curtain-columns";
import { CurtainDialog } from "@/components/projects/curtain/curtain-dialog";
import { SendCurtainConfigDialog } from "@/components/projects/curtain/send-curtain-config-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { TableSkeleton } from "@/components/projects/table-skeleton";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { useTableUI } from "@/hooks/use-table-ui";
import log from "electron-log/renderer";

export function CurtainTable({ items = [], loading = false }) {
  const category = "curtain";
  const { updateItem, deleteItem, duplicateItem, projectItems, exportItems, importItems } = useProjectDetail();
  const dialogs = useTableDialogs();
  const { openCreate, openEdit, closeCrud, openConfirm, closeConfirm, openBulkDelete, closeBulkDelete, setBulkDeleteLoading, openImport, closeImport } = dialogs;

  const { columnVisibility, pagination, onColumnVisibilityChange, onPaginationChange } = useTableUI(category, { description: false });

  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Curtain-specific send dialog state
  const [sendConfigDialogOpen, setSendConfigDialogOpen] = useState(false);
  const [sendSingleCurtainDialogOpen, setSendSingleCurtainDialogOpen] = useState(false);
  const [curtainToSend, setCurtainToSend] = useState(null);

  const lightingItems = projectItems.lighting || [];
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
    } finally {
      setSaveLoading(false);
    }
  }, [items, updateItem]);

  const handleEdit = useCallback((item) => openEdit(item), [openEdit]);

  const handleDelete = useCallback((item) => {
    openConfirm({
      title: "Delete Curtain Item",
      description: `Are you sure you want to delete "${item?.name || "this curtain item"}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteItem(category, item.id);
          closeConfirm();
        } catch (error) {
          log.error("Failed to delete curtain item:", error);
        }
      },
    });
  }, [openConfirm, closeConfirm, deleteItem, category]);

  const handleDuplicate = useCallback(
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        log.error("Failed to duplicate curtain item:", error);
      }
    },
    [duplicateItem]
  );

  const handleRowSelectionChange = useCallback((selectedCount) => setSelectedRowsCount(selectedCount), []);

  const handleBulkDelete = useCallback((selectedItems) => {
    openBulkDelete(selectedItems);
  }, [openBulkDelete]);

  const confirmBulkDelete = useCallback(async () => {
    if (dialogs.bulkDelete.items.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      await Promise.all(dialogs.bulkDelete.items.map((item) => deleteItem(category, item.id)));
      closeBulkDelete();
      setTimeout(() => {
        table?.resetRowSelection();
      }, 100);
    } catch (error) {
      log.error("Failed to delete curtain items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [dialogs.bulkDelete.items, deleteItem, category, closeBulkDelete, setBulkDeleteLoading, table]);

  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      log.error("Failed to export curtain items:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(() => openImport(), [openImport]);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems(category, items);
        closeImport();
      } catch (error) {
        log.error("Failed to import curtain items:", error);
      }
    },
    [importItems, closeImport]
  );

  const handleCreateItem = useCallback(() => openCreate(), [openCreate]);
  const handleSendConfig = useCallback(() => setSendConfigDialogOpen(true), []);

  const handleSendCurtain = useCallback((curtain) => {
    setCurtainToSend(curtain);
    setSendSingleCurtainDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createCurtainColumns(handleCellEdit, getEffectiveValue, lightingItems, unitItems),
    [handleCellEdit, getEffectiveValue, lightingItems, unitItems]
  );

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Blinds className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No curtain items found.</p>
            <p className="text-sm mb-8">Click "Add Curtain" to create your first curtain item.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Curtain
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder="Search curtain items..."
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Curtain"
                  onExport={handleExport}
                  onImport={handleImport}
                  category={category}
                  columnVisibility={columnVisibility}
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendConfig}
                  sendAllLabel="Send All Curtains"
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
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onSendCurtain={handleSendCurtain}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <CurtainDialog
        open={dialogs.crud.open}
        onOpenChange={(open) => !open && closeCrud()}
        item={dialogs.crud.item}
        mode={dialogs.crud.mode}
      />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        onConfirm={dialogs.confirm.onConfirm}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
      />

      <ConfirmDialog
        open={dialogs.bulkDelete.open}
        onOpenChange={(open) => !open && closeBulkDelete()}
        title="Delete Multiple Curtain Items"
        description={`Are you sure you want to delete ${dialogs.bulkDelete.items.length} selected curtain item${
          dialogs.bulkDelete.items.length !== 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmText={`Delete ${dialogs.bulkDelete.items.length} item${dialogs.bulkDelete.items.length !== 1 ? "s" : ""}`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        loading={dialogs.bulkDelete.loading}
      />

      <ImportItemsDialog
        open={dialogs.importDialog.open}
        onOpenChange={(open) => !open && closeImport()}
        onImport={handleImportConfirm}
        category={category}
      />

      <SendCurtainConfigDialog open={sendConfigDialogOpen} onOpenChange={setSendConfigDialogOpen} items={items} />

      <SendCurtainConfigDialog
        open={sendSingleCurtainDialogOpen}
        onOpenChange={setSendSingleCurtainDialogOpen}
        items={curtainToSend ? [curtainToSend] : []}
      />
    </>
  );
}
