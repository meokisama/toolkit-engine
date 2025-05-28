import React, { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../data-table/data-table";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { DataTablePagination } from "../data-table/data-table-pagination";
import { createCurtainColumns } from "./curtain-columns";
import { CurtainDialog } from "./curtain-dialog";
import { ConfirmDialog } from "../confirm-dialog";
import { BulkDeleteDialog } from "../bulk-delete-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { TableSkeleton } from "../table-skeleton";

export function CurtainTable({ items = [], loading = false }) {
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

  // Bulk delete state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  // Get lighting items for group selection
  const lightingItems = projectItems.lighting || [];

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    const item = items.find((item) => item.id === id);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateItem("curtain", id);
    } catch (error) {
      console.error("Failed to duplicate curtain item:", error);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateItem("curtain", id, data);
    } catch (error) {
      console.error("Failed to update curtain item:", error);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem("curtain", itemToDelete.id);
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
    try {
      for (const item of itemsToDelete) {
        await deleteItem("curtain", item.id);
      }
      setBulkDeleteDialogOpen(false);
      setItemsToDelete([]);
    } catch (error) {
      console.error("Failed to delete curtain items:", error);
    }
  }, [itemsToDelete, deleteItem]);

  // Export/Import handlers
  const handleExport = useCallback(async () => {
    try {
      await exportItems("curtain");
    } catch (error) {
      console.error("Failed to export curtain items:", error);
    }
  }, [exportItems]);

  const handleImport = useCallback(
    async (importedItems) => {
      try {
        await importItems("curtain", importedItems);
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

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () =>
      createCurtainColumns(
        handleEdit,
        handleDelete,
        handleDuplicate,
        handleUpdate,
        lightingItems
      ),
    [lightingItems]
  );

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
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
                  category="curtain"
                  columnVisibility={columnVisibility}
                />
              )}
              <DataTable
                key="curtain"
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

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        items={itemsToDelete}
        category="curtain"
      />
    </>
  );
}
