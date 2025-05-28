import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Database, Network } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UnitDialog } from "@/components/projects/unit/unit-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createUnitColumns } from "@/components/projects/unit/unit-columns";

export function UnitTable() {
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
  const [networkTable, setNetworkTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [networkUnits] = useState([]); // Placeholder for network units
  const [scanLoading, setScanLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [saveLoading, setSaveLoading] = useState(false);

  const units = projectItems.unit || [];

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
        const item = units.find((i) => i.id === itemId);
        if (item) {
          const updatedItem = { ...item, ...changes };
          await updateItem("unit", updatedItem.id, updatedItem);
        }
      }
      setPendingChanges(new Map());
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setSaveLoading(false);
    }
  }, [pendingChanges, units, updateItem]);

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
      await duplicateItem("unit", item.id);
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
      await deleteItem("unit", itemToDelete.id);
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
        deleteItem("unit", row.original.id)
      );
      await Promise.all(deletePromises);

      if (databaseTable) {
        databaseTable.resetRowSelection();
      }
    } catch (error) {
      console.error("Failed to bulk delete units:", error);
    }
  };

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      // Placeholder for network scanning functionality
      // This will be implemented later
      console.log("Scanning network for units...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate scan
    } catch (error) {
      console.error("Failed to scan network:", error);
    } finally {
      setScanLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportItems("unit");
    } catch (error) {
      console.error("Failed to export unit items:", error);
    }
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleImportConfirm = async (items) => {
    try {
      await importItems("unit", items);
      setImportDialogOpen(false);
    } catch (error) {
      console.error("Failed to import unit items:", error);
    }
  };

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

  // Create columns with handlers
  const columns = createUnitColumns(
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
                  <div className="space-y-4">
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
                        category="unit"
                        columnVisibility={columnVisibility}
                        onSave={handleSaveChanges}
                        hasPendingChanges={pendingChanges.size > 0}
                        saveLoading={saveLoading}
                      />
                    )}
                    <DataTable
                      key="database-unit"
                      columns={columns}
                      data={units}
                      initialPagination={pagination}
                      onTableReady={setDatabaseTable}
                      onRowSelectionChange={handleRowSelectionChange}
                      onColumnVisibilityChange={handleColumnVisibilityChange}
                      onPaginationChange={handlePaginationChange}
                      onEdit={handleEditItem}
                      onDuplicate={handleDuplicateItem}
                      onDelete={handleDeleteItem}
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

          {/* Network Units Card */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Units
                </CardTitle>
                <Button
                  onClick={handleScanNetwork}
                  disabled={scanLoading}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {scanLoading ? "Scanning..." : "Scan"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {networkUnits.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 flex flex-col justify-center items-center h-full -mt-8">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No network units found.</p>
                  <p className="text-sm">
                    Click "Scan Network" to discover units on your network.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  {/* Network units table will be displayed here */}
                  <DataTable
                    key="network-unit"
                    columns={columns}
                    data={networkUnits}
                    onTableReady={setNetworkTable}
                    onEdit={handleEditItem}
                    onDuplicate={handleDuplicateItem}
                    onDelete={handleDeleteItem}
                  />
                  {networkTable && <DataTablePagination table={networkTable} />}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UnitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        mode={dialogMode}
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
        category="unit"
      />
    </>
  );
}
