import React, { useState, useMemo, useCallback, useRef } from "react";
import { Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createDmxColumns } from "@/components/projects/dmx/dmx-columns";
import { DmxDialog } from "@/components/projects/dmx/dmx-dialog";
import { DmxColorDialog } from "@/components/projects/dmx/dmx-color-dialog";
import { SendDmxDialog } from "@/components/projects/dmx/send-dmx-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { TableSkeleton } from "@/components/projects/table-skeleton";

export function DmxTable({ items = [], loading = false }) {
  const category = "dmx";
  const { updateItem, deleteItem, duplicateItem, exportItems, importItems, projectItems } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [sceneEditingItem, setSceneEditingItem] = useState(null);

  // Send DMX state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [itemsToSend, setItemsToSend] = useState([]);

  // Table state management
  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({ description: false });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Bulk delete state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;
    pendingChangesRef.current.set(itemId, itemChanges);

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  const getEffectiveValue = useCallback((itemId, field, originalValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId);
    return itemChanges && itemChanges.hasOwnProperty(field) ? itemChanges[field] : originalValue;
  }, []);

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
        console.error("Failed to duplicate DMX item:", error);
      }
    },
    [duplicateItem]
  );

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(category, itemToDelete.id);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error("Failed to delete DMX item:", error);
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
      await Promise.all(itemsToDelete.map((item) => deleteItem(category, item.id)));

      // Close dialog and clear state first
      setBulkDeleteDialogOpen(false);
      setItemsToDelete([]);

      // Clear selection after a small delay to ensure data has been updated
      setTimeout(() => {
        table?.resetRowSelection();
      }, 100);
    } catch (error) {
      console.error("Failed to delete DMX items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [itemsToDelete, deleteItem, table]);

  // Export/Import handlers
  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export DMX items:", error);
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
        console.error("Failed to import DMX items:", error);
      }
    },
    [importItems]
  );

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  const handleSceneConfig = useCallback((item) => {
    setSceneEditingItem(item);
    setSceneDialogOpen(true);
  }, []);

  const handleSceneDialogClose = () => {
    setSceneDialogOpen(false);
    setSceneEditingItem(null);
  };

  // Send handlers
  const handleSendDmx = useCallback((item) => {
    setItemsToSend([item]);
    setSendDialogOpen(true);
  }, []);

  const handleSendAll = useCallback(() => {
    setItemsToSend(items);
    setSendDialogOpen(true);
  }, [items]);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () => createDmxColumns(handleCellEdit, getEffectiveValue, projectItems?.unit || []),
    [handleCellEdit, getEffectiveValue, projectItems?.unit]
  );

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No DMX items found.</p>
            <p className="text-sm mb-8">Click "Add DMX" to create your first DMX item.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add DMX
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder="Search DMX items..."
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add DMX"
                  onExport={handleExport}
                  onImport={handleImport}
                  category={category}
                  columnVisibility={columnVisibility}
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
                  saveLoading={saveLoading}
                  onSendAll={handleSendAll}
                  sendAllLabel="Send All DMXs"
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
                onColumnVisibilityChange={handleColumnVisibilityChange}
                onPaginationChange={handlePaginationChange}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onDmxSceneConfig={handleSceneConfig}
                onSendDmx={handleSendDmx}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <DmxDialog open={dialogOpen} onOpenChange={handleDialogClose} item={editingItem} mode={editingItem ? "edit" : "create"} />

      <DmxColorDialog open={sceneDialogOpen} onOpenChange={handleSceneDialogClose} item={sceneEditingItem} />

      <SendDmxDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} items={itemsToSend} />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete DMX Item"
        description={`Are you sure you want to delete "${itemToDelete?.name || "this DMX item"}"? This action cannot be undone.`}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple DMX Items"
        description={`Are you sure you want to delete ${itemsToDelete.length} selected DMX item${
          itemsToDelete.length !== 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmText={`Delete ${itemsToDelete.length} item${itemsToDelete.length !== 1 ? "s" : ""}`}
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
        loading={bulkDeleteLoading}
      />

      <ImportItemsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportConfirm} category={category} />
    </>
  );
}
