import React, { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Database, GitCompare, FileText } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UnitDialog } from "./database-unit-dialog";
import { IOConfigDialog } from "./io-config";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createUnitColumns } from "./database-unit-columns";
import { NetworkUnitTable } from "../network-units/network-unit-table";
import { ComparisonDifferencesDialog, useConfigComparison } from "../comparison";
import { toast } from "sonner";
import { createDefaultRS485Config } from "@/utils/rs485-utils";
import { createDefaultInputConfigs, createDefaultOutputConfigs } from "@/utils/io-config-utils";
import { readAdvancedConfigurations } from "../transfer";
import log from "electron-log/renderer";

export function UnitTable() {
  const category = "unit";
  const { selectedProject, projectItems, deleteItem, duplicateItem, loading, exportItems, importItems, updateItem, loadTabData, loadedTabs } =
    useProjectDetail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [databaseTable, setDatabaseTable] = useState(null);
  const [selectedRowsCount, setSelectedRowsCount] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState({ description: false });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const pendingChangesRef = useRef(new Map());

  // Configuration comparison hook
  const { compareConfigurations, isComparing, comparisonProgress, hasComparisonResults, comparisonSummary, getUnitRowClass, clearComparisons } =
    useConfigComparison();
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [ioConfigDialogOpen, setIOConfigDialogOpen] = useState(false);
  const [ioConfigItem, setIOConfigItem] = useState(null);

  // Network units state for comparison
  const [networkUnits, setNetworkUnits] = useState([]);

  // Comparison differences dialog state
  const [differencesDialogOpen, setDifferencesDialogOpen] = useState(false);

  const units = projectItems.unit || [];

  const handleCellEdit = useCallback((itemId, field, newValue) => {
    const itemChanges = pendingChangesRef.current.get(itemId) || {};
    itemChanges[field] = newValue;

    // If unit type is being changed, reset RS485 config and I/O config to defaults
    if (field === "type" && newValue) {
      // Reset RS485 config to default (2 configurations for RS485-1 and RS485-2)
      itemChanges.rs485_config = Array.from({ length: 2 }, () => createDefaultRS485Config());

      // Reset I/O config to default based on new unit type
      itemChanges.input_configs = createDefaultInputConfigs(newValue);
      itemChanges.output_configs = createDefaultOutputConfigs(newValue);

      // Mark that we need to clear I/O configs
      itemChanges._clearIOConfigs = true;
    }

    pendingChangesRef.current.set(itemId, itemChanges);

    // Only trigger re-render for toolbar save button
    setPendingChangesCount(pendingChangesRef.current.size);
  }, []);

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
      log.error("Failed to save changes:", error);
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
      log.error("Failed to duplicate unit:", error);
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
      log.error("Failed to delete unit:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async (selectedItems) => {
    try {
      const deletePromises = selectedItems.map((item) => deleteItem(category, item.id));
      await Promise.all(deletePromises);

      if (databaseTable) {
        databaseTable.resetRowSelection();
      }
    } catch (error) {
      log.error("Failed to bulk delete units:", error);
    }
  };

  // Handle transfer from network units to database
  const handleTransferToDatabase = async (unitsToTransfer) => {
    try {
      // First, import the basic unit data
      const importedUnits = await importItems(category, unitsToTransfer);

      // Then, read and create advanced configurations for units that have the flag
      const unitsWithAdvancedConfigs = unitsToTransfer.filter((unit) => unit.readAdvancedConfigs);

      if (unitsWithAdvancedConfigs.length > 0) {
        log.info(`Reading advanced configurations for ${unitsWithAdvancedConfigs.length} units...`);

        for (let i = 0; i < unitsWithAdvancedConfigs.length; i++) {
          const networkUnit = unitsWithAdvancedConfigs[i];
          const importedUnit = importedUnits[unitsToTransfer.indexOf(networkUnit)];

          if (importedUnit) {
            try {
              await readAdvancedConfigurations(networkUnit, importedUnit, selectedProject.id);
            } catch (error) {
              log.error(`Failed to read advanced configurations for unit ${networkUnit.ip_address}:`, error);
              // Continue with other units
            }
          }
        }
      }

      toast.success(`Successfully transferred ${unitsToTransfer.length} unit(s) with configurations to database`);
    } catch (error) {
      log.error("Failed to transfer units to database:", error);
      throw error; // Re-throw to let NetworkUnitTable handle the error display
    }
  };

  const handleExport = async () => {
    try {
      await exportItems(category);
    } catch (error) {
      log.error("Failed to export unit items:", error);
    }
  };

  // Handle configuration comparison
  const handleCompareConfigurations = useCallback(async () => {
    if (!units.length) {
      toast.warning("No database units available for comparison");
      return;
    }

    if (!networkUnits.length) {
      toast.warning("No network units available for comparison. Please scan network first.");
      return;
    }

    try {
      // Load aircon data if not already loaded (needed for device_id to address mapping)
      if (selectedProject && !loadedTabs.has("aircon")) {
        log.info("Loading aircon data for comparison...");
        toast.info("Loading aircon data...");

        try {
          await loadTabData(selectedProject.id, "aircon");
          log.info("Aircon data loaded successfully");
        } catch (loadError) {
          log.error("Failed to load aircon data:", loadError);
          toast.error("Failed to load aircon data for comparison");
          return;
        }
      }

      // Get fresh aircon data directly from API to ensure we have the latest data
      let freshProjectItems = projectItems;
      if (selectedProject) {
        try {
          const freshAirconItems = await window.electronAPI.aircon.getAll(selectedProject.id);
          freshProjectItems = {
            ...projectItems,
            aircon: freshAirconItems,
          };
          log.info("Fresh aircon data loaded:", {
            airconCount: freshAirconItems.length,
          });
        } catch (error) {
          log.error("Failed to get fresh aircon data:", error);
          // Continue with existing projectItems
        }
      }

      log.info("Starting comparison with projectItems:", {
        airconCount: freshProjectItems.aircon?.length || 0,
        lightingCount: freshProjectItems.lighting?.length || 0,
      });

      // Pass fresh projectItems for device_id to address lookup
      await compareConfigurations(units, networkUnits, freshProjectItems);
    } catch (error) {
      log.error("Failed to compare configurations:", error);
      toast.error(`Failed to compare configurations: ${error.message}`);
    }
  }, [units, networkUnits, compareConfigurations, projectItems, selectedProject, loadedTabs, loadTabData]);

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleImportConfirm = async (items) => {
    try {
      await importItems(category, items);
      setImportDialogOpen(false);
    } catch (error) {
      log.error("Failed to import unit items:", error);
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

  const databaseColumns = useMemo(
    () => createUnitColumns(handleCellEdit, getEffectiveValue),
    [
      handleCellEdit,
      getEffectiveValue, // This is now stable!
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
                  <p className="text-sm mb-8">Click "Add Unit" to create your first unit.</p>
                  <Button onClick={handleCreateItem} className="flex items-center gap-2">
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

                    {/* Configuration Comparison Buttons */}
                    <div className="flex justify-end gap-2 mb-4">
                      <Button
                        onClick={handleCompareConfigurations}
                        disabled={isComparing || !units.length}
                        className="flex items-center gap-2"
                        variant="outline"
                      >
                        <GitCompare className="h-4 w-4" />
                        {isComparing ? `Comparing...` : "Compare with Network"}
                      </Button>

                      {hasComparisonResults && (
                        <Button onClick={() => setDifferencesDialogOpen(true)} className="flex items-center gap-2" variant="secondary">
                          <FileText className="h-4 w-4" />
                          View Differences
                        </Button>
                      )}
                    </div>

                    <DataTable
                      key="database-unit"
                      columns={databaseColumns}
                      data={units}
                      initialPagination={pagination}
                      initialColumnVisibility={columnVisibility}
                      onTableReady={setDatabaseTable}
                      onRowSelectionChange={handleRowSelectionChange}
                      onColumnVisibilityChange={handleColumnVisibilityChange}
                      onPaginationChange={handlePaginationChange}
                      onEdit={handleEditItem}
                      onDuplicate={handleDuplicateItem}
                      onDelete={handleDeleteItem}
                      onIOConfig={handleIOConfig}
                      enableRowSelection={true}
                      getRowClassName={(unit) => getUnitRowClass(`db_${unit.id}`)}
                    />
                  </div>
                  {databaseTable && <DataTablePagination table={databaseTable} pagination={pagination} />}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Units */}
          <NetworkUnitTable
            onTransferToDatabase={handleTransferToDatabase}
            existingUnits={units}
            onNetworkUnitsChange={setNetworkUnits}
            getRowClassName={(unit) => getUnitRowClass(`net_${unit.ip_address}_${unit.id_can}`)}
          />
        </div>
      </div>

      <UnitDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} mode={dialogMode} />

      <IOConfigDialog open={ioConfigDialogOpen} onOpenChange={setIOConfigDialogOpen} item={ioConfigItem} />

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

      <ImportItemsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportConfirm} category={category} />

      <ComparisonDifferencesDialog open={differencesDialogOpen} onOpenChange={setDifferencesDialogOpen} comparisonSummary={comparisonSummary} />
    </>
  );
}
