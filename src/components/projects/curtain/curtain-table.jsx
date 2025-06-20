import React, { useState, useMemo, useCallback } from "react";
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

export function CurtainTable({ items = [], loading = false }) {
  const category = "curtain";
  const {
    updateItem,
    deleteItem,
    duplicateItem,
    projectItems,
    exportItems,
    importItems,
  } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Table state management
  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [saveLoading, setSaveLoading] = useState(false);

  // Bulk delete state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Send config state
  const [sendConfigDialogOpen, setSendConfigDialogOpen] = useState(false);

  // Get lighting items for group selection
  const lightingItems = projectItems.lighting || [];

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
          await updateItem(category, updatedItem.id, updatedItem);
        }
      }
      setPendingChanges(new Map());
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [pendingChanges, items, updateItem]);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleDuplicate = useCallback(
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        console.error("Failed to duplicate curtain item:", error);
      }
    },
    [duplicateItem]
  );

  const handleUpdate = async (id, data) => {
    try {
      await updateItem(category, id, data);
    } catch (error) {
      console.error("Failed to update curtain item:", error);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(category, itemToDelete.id);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error("Failed to delete curtain item:", error);
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  // Table handlers
  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((paginationState) => {
    setPagination(paginationState);
  }, []);

  // Bulk delete handlers
  const handleBulkDelete = useCallback((selectedItems) => {
    setItemsToDelete(selectedItems);
    setBulkDeleteDialogOpen(true);
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    if (itemsToDelete.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      // Delete all selected items
      await Promise.all(
        itemsToDelete.map((item) => deleteItem(category, item.id))
      );

      // Close dialog and clear state first
      setBulkDeleteDialogOpen(false);
      setItemsToDelete([]);

      // Clear selection after a small delay to ensure data has been updated
      setTimeout(() => {
        table?.resetRowSelection();
      }, 100);
    } catch (error) {
      console.error("Failed to delete curtain items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [itemsToDelete, deleteItem, table]);

  // Export/Import handlers
  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export curtain items:", error);
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
      } catch (error) {
        console.error("Failed to import curtain items:", error);
      }
    },
    [importItems]
  );

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  // Send config handler
  const handleSendConfig = useCallback(() => {
    setSendConfigDialogOpen(true);
  }, []);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () =>
      createCurtainColumns(
        handleEdit,
        handleDelete,
        handleDuplicate,
        handleCellEdit,
        getEffectiveValue,
        lightingItems
      ),
    [
      handleEdit,
      handleDelete,
      handleDuplicate,
      handleCellEdit,
      getEffectiveValue,
      lightingItems,
    ]
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
            <p className="text-sm mb-8">
              Click "Add Curtain" to create your first curtain item.
            </p>
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
                  hasPendingChanges={pendingChanges.size > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendConfig}
                  sendAllLabel="Send Config"
                />
              )}
              <DataTable
                key={category}
                columns={columns}
                data={items}
                initialPagination={pagination}
                onTableReady={setTable}
                onRowSelectionChange={handleRowSelectionChange}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onPaginationChange={handlePaginationChange}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                enableRowSelection={true}
              />
            </div>
            {table && (
              <DataTablePagination table={table} pagination={pagination} />
            )}
          </div>
        )}
      </div>

      <CurtainDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        item={editingItem}
        mode={editingItem ? "edit" : "create"}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Curtain Item"
        description={`Are you sure you want to delete "${
          itemToDelete?.name || "this curtain item"
        }"? This action cannot be undone.`}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple Curtain Items"
        description={`Are you sure you want to delete ${
          itemsToDelete.length
        } selected curtain item${
          itemsToDelete.length !== 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmText={`Delete ${itemsToDelete.length} item${
          itemsToDelete.length !== 1 ? "s" : ""
        }`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        loading={bulkDeleteLoading}
      />

      <ImportItemsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportConfirm}
        category={category}
      />

      <SendCurtainConfigDialog
        open={sendConfigDialogOpen}
        onOpenChange={setSendConfigDialogOpen}
        items={items}
      />
    </>
  );
}
