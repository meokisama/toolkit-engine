import React, { useState, useCallback, memo, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectItemDialog } from "@/components/projects/lighting/lighting-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createProjectItemsColumns } from "@/components/projects/lighting/lighting-columns";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { Lightbulb } from "lucide-react";
import { useTableDialogs } from "@/hooks/use-table-dialogs";
import { useTableUI } from "@/hooks/use-table-ui";
import log from "electron-log/renderer";

// Memoized component to prevent unnecessary rerenders
function ProjectItemsTableComponent({ category, items, loading }) {
  const { deleteItem, duplicateItem, exportItems, importItems, updateItem } = useProjectDetail();
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

  const { columnVisibility, pagination, onColumnVisibilityChange, onPaginationChange } = useTableUI(category);

  const [table, setTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  // Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Stable function that doesn't change reference
  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;
    pendingChangesRef.current.set(itemId, itemChanges);

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((itemId, field, originalValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId);
    return itemChanges && itemChanges.hasOwnProperty(field) ? itemChanges[field] : originalValue;
  }, []); // No dependencies = stable function!

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
      log.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [items, updateItem, category]);

  const handleCreateItem = useCallback(() => {
    openCreate();
  }, [openCreate]);

  const handleEditItem = useCallback(
    (item) => {
      openEdit(item);
    },
    [openEdit],
  );

  const handleDeleteItem = useCallback(
    (item) => {
      openConfirm({
        title: "Delete Item",
        description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
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

  const handleBulkDelete = (selectedItems) => {
    openBulkDelete(selectedItems);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      await Promise.all(dialogs.bulkDelete.items.map((item) => deleteItem(category, item.id)));
      closeBulkDelete();
      setTimeout(() => {
        table?.resetRowSelection();
      }, 100);
    } catch (error) {
      log.error("Failed to delete items:", error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await exportItems(category);
    } catch (error) {
      log.error("Failed to export items:", error);
    }
  }, [exportItems, category]);

  const handleImport = useCallback(() => {
    openImport();
  }, [openImport]);

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

  // Now columns will be truly stable because all dependencies are stable!
  const columns = useMemo(
    () => createProjectItemsColumns(handleEditItem, handleDuplicateItem, handleDeleteItem, handleCellEdit, getEffectiveValue),
    [handleEditItem, handleDuplicateItem, handleDeleteItem, handleCellEdit, getEffectiveValue],
  );

  if (loading) {
    return <DataTableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lighting groups found.</p>
            <p className="text-sm mb-8">Click "Add Group" to create your first item.</p>
            <Button onClick={handleCreateItem}>
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {table && (
                <DataTableToolbar
                  table={table}
                  searchColumn="name"
                  searchPlaceholder={`Search ${category} items...`}
                  onBulkDelete={handleBulkDelete}
                  selectedRowsCount={selectedRowsCount}
                  onAddItem={handleCreateItem}
                  addItemLabel="Add Group"
                  onExport={handleExport}
                  onImport={handleImport}
                  category={category}
                  columnVisibility={columnVisibility}
                  onSave={handleSaveChanges}
                  hasPendingChanges={pendingChangesCount > 0}
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
                onColumnVisibilityChange={onColumnVisibilityChange}
                onPaginationChange={onPaginationChange}
                onEdit={handleEditItem}
                onDuplicate={handleDuplicateItem}
                onDelete={handleDeleteItem}
                enableRowSelection={true}
              />
            </div>
            {table && <DataTablePagination table={table} pagination={pagination} />}
          </div>
        )}
      </div>

      <ProjectItemDialog
        open={dialogs.crud.open}
        onOpenChange={(open) => !open && closeCrud()}
        category={category}
        item={dialogs.crud.item}
        mode={dialogs.crud.mode}
      />

      <ConfirmDialog
        open={dialogs.confirm.open}
        onOpenChange={(open) => !open && closeConfirm()}
        title={dialogs.confirm.title}
        description={dialogs.confirm.description}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={dialogs.confirm.onConfirm}
        loading={dialogs.confirm.loading}
      />

      <ConfirmDialog
        open={dialogs.bulkDelete.open}
        onOpenChange={(open) => !open && closeBulkDelete()}
        title="Delete Multiple Items"
        description={`Are you sure you want to delete ${dialogs.bulkDelete.items.length} selected item${
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
    </>
  );
}

// Export memoized component with custom comparison function
export const ProjectItemsTable = memo(ProjectItemsTableComponent, (prevProps, nextProps) => {
  return prevProps.category === nextProps.category && prevProps.items === nextProps.items && prevProps.loading === nextProps.loading;
});
