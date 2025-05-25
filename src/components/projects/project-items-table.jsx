import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectItemDialog } from "./project-item-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createProjectItemsColumns } from "./columns/project-items-columns";

export function ProjectItemsTable({ category, items, loading }) {
  const { deleteItem, duplicateItem } = useProjectDetail();
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
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);

  const handleCreateItem = () => {
    setEditingItem(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };

  const handleDuplicateItem = async (item) => {
    try {
      await duplicateItem(category, item.id);
    } catch (error) {
      console.error("Failed to duplicate item:", error);
    }
  };

  const confirmDeleteItem = async () => {
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
  };

  const handleBulkDelete = (selectedItems) => {
    setItemsToDelete(selectedItems);
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
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
      console.error("Failed to delete items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Update selected rows count when table changes
  useEffect(() => {
    if (table) {
      const updateSelectedCount = () => {
        const rowSelection = table.getState().rowSelection;
        const selectedCount = Object.keys(rowSelection).filter(
          (id) => rowSelection[id]
        ).length;
        setSelectedRowsCount(selectedCount);
      };

      // Initial update
      updateSelectedCount();

      // Set up a listener for row selection changes
      const interval = setInterval(updateSelectedCount, 100);
      return () => clearInterval(interval);
    }
  }, [table]);

  // Create columns with handlers after they are defined
  const columns = createProjectItemsColumns(
    handleEditItem,
    handleDuplicateItem,
    handleDeleteItem
  );

  if (loading) {
    return <DataTableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <p>No items found.</p>
            <p className="text-sm mb-8">
              Click "Add Group" to create your first item.
            </p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {table && (
              <DataTableToolbar
                table={table}
                searchColumn="name"
                searchPlaceholder={`Search ${category} items...`}
                onBulkDelete={handleBulkDelete}
                selectedRowsCount={selectedRowsCount}
                onAddItem={handleCreateItem}
                addItemLabel="Add"
              />
            )}
            <DataTable
              key={`${category}-${items.length}`}
              columns={columns}
              data={items}
              onTableReady={setTable}
            />
            {table && <DataTablePagination table={table} />}
          </div>
        )}
      </div>

      <ProjectItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={category}
        item={editingItem}
        mode={dialogMode}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteItem}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple Items"
        description={`Are you sure you want to delete ${
          itemsToDelete.length
        } selected item${
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
    </>
  );
}
