import React, { useState, useCallback, memo } from "react";
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
import { Network } from "lucide-react";

// Memoized component to prevent unnecessary rerenders
function KnxTableComponent({ items, loading }) {
  const { deleteItem, duplicateItem, exportItems, importItems, updateItem } =
    useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [table, setTable] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [saveLoading, setSaveLoading] = useState(false);

  const category = "knx";

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

  // Save pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChanges) {
        // Find the original item to merge with changes
        const originalItem = items.find((item) => item.id === itemId);
        if (!originalItem) {
          throw new Error(`Original item with id ${itemId} not found`);
        }

        // Merge changes with original item data to ensure all required fields are present
        const completeItemData = {
          name: originalItem.name || "",
          address: originalItem.address || "",
          description: originalItem.description || "",
          object_type: originalItem.object_type || "OBJ_KNX",
          ...changes, // Apply the pending changes on top
        };

        await updateItem(category, itemId, completeItemData);
      }
      setPendingChanges(new Map());
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [pendingChanges, updateItem, category, items]);

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
    async (item) => {
      try {
        await duplicateItem(category, item.id);
      } catch (error) {
        console.error("Failed to duplicate item:", error);
      }
    },
    [duplicateItem, category]
  );

  const handleDeleteItem = useCallback((item) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteItem(category, itemToDelete.id);
      setConfirmDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteItem, itemToDelete, category]);

  const handleBulkDelete = useCallback((selectedItems) => {
    setItemsToDelete(selectedItems);
    setBulkDeleteDialogOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    setBulkDeleteLoading(true);
    try {
      for (const item of itemsToDelete) {
        await deleteItem(category, item.id);
      }
      setBulkDeleteDialogOpen(false);
      setItemsToDelete([]);
      table?.resetRowSelection();
    } catch (error) {
      console.error("Failed to delete items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [deleteItem, itemsToDelete, table, category]);

  const handleRowSelectionChange = useCallback((selectedRows) => {
    setSelectedRowsCount(selectedRows.length);
  }, []);

  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  const handlePaginationChange = useCallback((newPagination) => {
    setPagination(newPagination);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export items:", error);
    }
  }, [exportItems, category]);

  const handleImport = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportConfirm = useCallback(
    async (items) => {
      try {
        await importItems(category, items);
        setImportDialogOpen(false);
      } catch (error) {
        console.error("Failed to import items:", error);
      }
    },
    [importItems, category]
  );

  // Create columns with handlers after they are defined
  const columns = createKnxItemsColumns(
    handleEditItem,
    handleDuplicateItem,
    handleDeleteItem,
    handleCellEdit,
    getEffectiveValue
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
            <p className="text-sm mb-8">
              Click "Add Device" to create your first KNX device.
            </p>
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
                  hasPendingChanges={pendingChanges.size > 0}
                  saveLoading={saveLoading}
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

      <KnxItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        item={editingItem}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete KNX Device"
        description={`Are you sure you want to delete "${
          itemToDelete?.name || `Device ${itemToDelete?.address}`
        }"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete KNX Devices"
        description={`Are you sure you want to delete ${itemsToDelete.length} selected devices? This action cannot be undone.`}
        onConfirm={handleConfirmBulkDelete}
        loading={bulkDeleteLoading}
      />

      <ImportItemsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        category={category}
        onConfirm={handleImportConfirm}
      />
    </>
  );
}

// Export memoized component with custom comparison function
export const KnxTable = memo(KnxTableComponent, (prevProps, nextProps) => {
  // Only rerender if items array reference or loading state changes
  return (
    prevProps.items === nextProps.items &&
    prevProps.loading === nextProps.loading
  );
});
