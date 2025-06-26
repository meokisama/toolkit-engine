import React, { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Database } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UnitDialog } from "@/components/projects/unit/unit-dialog";
import { IOConfigDialog } from "@/components/projects/unit/common/io-config-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createUnitColumns } from "@/components/projects/unit/unit-columns";
import { NetworkUnitTable } from "@/components/projects/unit/network-unit-table";
import { toast } from "sonner";
import { createDefaultRS485Config } from "@/utils/rs485-utils";
import { createDefaultIOConfig } from "@/utils/io-config-utils";

export function UnitTable() {
  const category = "unit";
  const {
    projectItems,
    deleteItem,
    duplicateItem,
    loading,
    exportItems,
    importItems,
    updateItem,
  } = useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [databaseTable, setDatabaseTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ✅ Use ref instead of state to avoid re-renders when pendingChanges update
  const pendingChangesRef = useRef(new Map());
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [ioConfigDialogOpen, setIOConfigDialogOpen] = useState(false);
  const [ioConfigItem, setIOConfigItem] = useState(null);

  const units = projectItems.unit || [];

  // ✅ Stable function that doesn't change reference
  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;

    // If unit type is being changed, reset RS485 config and I/O config to defaults
    if (field === "type" && newValue) {
      // Reset RS485 config to default (2 configurations for RS485-1 and RS485-2)
      itemChanges.rs485_config = Array.from({ length: 2 }, () =>
        createDefaultRS485Config()
      );

      // Reset I/O config to default based on new unit type
      itemChanges.io_config = createDefaultIOConfig(newValue);

      // Mark that we need to clear I/O configs from database tables
      itemChanges._clearIOConfigs = true;
    }

    pendingChangesRef.current.set(itemId, itemChanges);

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

  // ✅ Stable function that doesn't depend on state
  const getEffectiveValue = useCallback((itemId, field, originalValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId);
    return itemChanges && itemChanges.hasOwnProperty(field)
      ? itemChanges[field]
      : originalValue;
  }, []); // No dependencies = stable function!

  // Save all pending changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingChangesRef.current.size === 0) return;

    setSaveLoading(true);
    try {
      for (const [itemId, changes] of pendingChangesRef.current) {
        const item = units.find((i) => i.id === itemId);
        if (item) {
          // Check if we need to clear I/O configurations from database tables
          if (changes._clearIOConfigs) {
            await window.electronAPI.unit.clearAllIOConfigs(item.id);
            // Remove the flag from changes before saving
            const { _clearIOConfigs, ...cleanChanges } = changes;
            const updatedItem = { ...item, ...cleanChanges };
            await updateItem(category, updatedItem.id, updatedItem);
          } else {
            const updatedItem = { ...item, ...changes };
            await updateItem(category, updatedItem.id, updatedItem);
          }
        }
      }
      pendingChangesRef.current.clear();
      setPendingChangesCount(0);
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [units, updateItem]);

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

  const handleDuplicateItem = async (item) => {
    try {
      await duplicateItem(category, item.id);
    } catch (error) {
      console.error("Failed to duplicate unit:", error);
    }
  };

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteItem(category, itemToDelete.id);
      setConfirmDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete unit:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async (selectedRows) => {
    try {
      const deletePromises = selectedRows.map((row) =>
        deleteItem(category, row.original.id)
      );
      await Promise.all(deletePromises);

      if (databaseTable) {
        databaseTable.resetRowSelection();
      }
    } catch (error) {
      console.error("Failed to bulk delete units:", error);
    }
  };

  // Handle transfer from network units to database
  const handleTransferToDatabase = async (unitsToTransfer) => {
    try {
      await importItems(category, unitsToTransfer);
      toast.success(
        `Successfully transferred ${unitsToTransfer.length} unit(s) to database`
      );
    } catch (error) {
      console.error("Failed to transfer units to database:", error);
      throw error; // Re-throw to let NetworkUnitTable handle the error display
    }
  };

  const handleExport = async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export unit items:", error);
    }
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleImportConfirm = async (items) => {
    try {
      await importItems(category, items);
      setImportDialogOpen(false);
    } catch (error) {
      console.error("Failed to import unit items:", error);
    }
  };

  // Handle I/O Config
  const handleIOConfig = useCallback((item) => {
    setIOConfigItem(item);
    setIOConfigDialogOpen(true);
  }, []);

  // Handle row selection changes from DataTable
  const handleRowSelectionChange = useCallback((selectedCount) => {
    setSelectedRowsCount(selectedCount);
  }, []);

  // Handle column visibility changes from DataTable
  const handleColumnVisibilityChange = useCallback((visibility) => {
    setColumnVisibility(visibility);
  }, []);

  // Handle pagination changes from DataTable
  const handlePaginationChange = useCallback((paginationState) => {
    setPagination(paginationState);
  }, []);

  // ✅ Now columns will be truly stable because all dependencies are stable!
  const databaseColumns = useMemo(
    () =>
      createUnitColumns(
        handleEditItem,
        handleDuplicateItem,
        handleDeleteItem,
        handleCellEdit,
        getEffectiveValue,
        handleIOConfig
      ),
    [
      handleEditItem,
      handleDuplicateItem,
      handleDeleteItem,
      handleCellEdit,
      getEffectiveValue, // This is now stable!
      handleIOConfig,
    ]
  );

  if (loading) {
    return <DataTableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="space-y-4 h-full">
        {/* Two cards side by side */}
        <div className="flex flex-col gap-4 h-full">
          {/* Database Units Card */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Units
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {units.length === 0 ? (
                <div className="text-center text-muted-foreground flex flex-col justify-center items-center h-full -mt-8">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No units found.</p>
                  <p className="text-sm mb-8">
                    Click "Add Unit" to create your first unit.
                  </p>
                  <Button
                    onClick={handleCreateItem}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Unit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4 overflow-x-auto">
                    {databaseTable && (
                      <DataTableToolbar
                        table={databaseTable}
                        searchColumn="type"
                        searchPlaceholder="Search units..."
                        onBulkDelete={handleBulkDelete}
                        selectedRowsCount={selectedRowsCount}
                        onAddItem={handleCreateItem}
                        addItemLabel="Add Unit"
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
                      key="database-unit"
                      columns={databaseColumns}
                      data={units}
                      initialPagination={pagination}
                      onTableReady={setDatabaseTable}
                      onRowSelectionChange={handleRowSelectionChange}
                      onColumnVisibilityChange={handleColumnVisibilityChange}
                      onPaginationChange={handlePaginationChange}
                      onEdit={handleEditItem}
                      onDuplicate={handleDuplicateItem}
                      onDelete={handleDeleteItem}
                      onIOConfig={handleIOConfig}
                      enableRowSelection={true}
                    />
                  </div>
                  {databaseTable && (
                    <DataTablePagination
                      table={databaseTable}
                      pagination={pagination}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Units */}
          <NetworkUnitTable
            onTransferToDatabase={handleTransferToDatabase}
            existingUnits={units}
          />
        </div>
      </div>

      <UnitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        mode={dialogMode}
      />

      <IOConfigDialog
        open={ioConfigDialogOpen}
        onOpenChange={setIOConfigDialogOpen}
        item={ioConfigItem}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Delete Unit"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteItem}
        loading={deleteLoading}
      />

      <ImportItemsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportConfirm}
        category={category}
      />
    </>
  );
}
