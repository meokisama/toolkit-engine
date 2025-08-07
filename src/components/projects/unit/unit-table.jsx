import React, { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Database, GitCompare, FileText } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UnitDialog } from "@/components/projects/unit/unit-dialog";
import { IOConfigDialog } from "@/components/projects/unit/common/io-config-dialog";
import { ConfirmDialog } from "@/components/projects/confirm-dialog";
import { ImportItemsDialog } from "@/components/projects/import-category-dialog";
import { ComparisonDifferencesDialog } from "@/components/projects/unit/comparison-differences-dialog";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTableToolbar } from "@/components/projects/data-table/data-table-toolbar";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/projects/table-skeleton";
import { createUnitColumns } from "@/components/projects/unit/unit-columns";
import { NetworkUnitTable } from "@/components/projects/unit/network-unit-table";
import { useConfigComparison } from "@/hooks/use-config-comparison";
import { toast } from "sonner";
import { createDefaultRS485Config } from "@/utils/rs485-utils";
import {
  createDefaultInputConfigs,
  createDefaultOutputConfigs,
} from "@/utils/io-config-utils";

export function UnitTable() {
  const category = "unit";
  const {
    selectedProject,
    projectItems,
    deleteItem,
    duplicateItem,
    loading,
    exportItems,
    importItems,
    updateItem,
    loadTabData,
    loadedTabs,
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

  // Configuration comparison hook
  const {
    compareConfigurations,
    isComparing,
    comparisonProgress,
    hasComparisonResults,
    comparisonSummary,
    getUnitRowClass,
    clearComparisons
  } = useConfigComparison();
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [ioConfigDialogOpen, setIOConfigDialogOpen] = useState(false);
  const [ioConfigItem, setIOConfigItem] = useState(null);

  // Network units state for comparison
  const [networkUnits, setNetworkUnits] = useState([]);

  // Comparison differences dialog state
  const [differencesDialogOpen, setDifferencesDialogOpen] = useState(false);

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
      itemChanges.input_configs = createDefaultInputConfigs(newValue);
      itemChanges.output_configs = createDefaultOutputConfigs(newValue);

      // Mark that we need to clear I/O configs
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

  const handleBulkDelete = async (selectedItems) => {
    try {
      const deletePromises = selectedItems.map((item) =>
        deleteItem(category, item.id)
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
      // First, import the basic unit data
      const importedUnits = await importItems(category, unitsToTransfer);

      // Then, read and create advanced configurations for units that have the flag
      const unitsWithAdvancedConfigs = unitsToTransfer.filter(unit => unit.readAdvancedConfigs);

      if (unitsWithAdvancedConfigs.length > 0) {
        console.log(`Reading advanced configurations for ${unitsWithAdvancedConfigs.length} units...`);

        for (let i = 0; i < unitsWithAdvancedConfigs.length; i++) {
          const networkUnit = unitsWithAdvancedConfigs[i];
          const importedUnit = importedUnits[unitsToTransfer.indexOf(networkUnit)];

          if (importedUnit) {
            try {
              await readAdvancedConfigurations(networkUnit, importedUnit, selectedProject.id);
            } catch (error) {
              console.error(`Failed to read advanced configurations for unit ${networkUnit.ip_address}:`, error);
              // Continue with other units
            }
          }
        }
      }

      toast.success(
        `Successfully transferred ${unitsToTransfer.length} unit(s) with configurations to database`
      );
    } catch (error) {
      console.error("Failed to transfer units to database:", error);
      throw error; // Re-throw to let NetworkUnitTable handle the error display
    }
  };

  // Function to read advanced configurations after unit is created in database
  const readAdvancedConfigurations = async (networkUnit, importedUnit, projectId) => {
    try {
      console.log(`Reading advanced configurations for unit ${networkUnit.ip_address}...`);

      // Read curtain configurations FIRST to avoid conflicts with scene auto-creation
      const createdCurtains = await readCurtainConfigurations(networkUnit, projectId);

      // Add delay between different configuration types
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read scene configurations (after curtains to avoid auto-creating duplicate curtains)
      const { createdScenes, sceneAddressMap } = await readSceneConfigurations(networkUnit, projectId);

      // Add delay between different configuration types
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read schedule configurations
      const createdSchedules = await readScheduleConfigurations(networkUnit, projectId, sceneAddressMap);

      // Add delay between different configuration types
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read KNX configurations
      const createdKnxConfigs = await readKnxConfigurations(networkUnit, projectId);

      // Add delay between different configuration types
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read Multi-Scene configurations
      const { createdMultiScenes, multiSceneAddressMap } = await readMultiSceneConfigurations(networkUnit, projectId, sceneAddressMap);

      // Add delay between different configuration types
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Read Sequence configurations
      const createdSequences = await readSequenceConfigurations(networkUnit, projectId, multiSceneAddressMap);

      // Log summary of created configurations
      const configSummary = {
        scenes: createdScenes.length,
        schedules: createdSchedules.length,
        curtains: createdCurtains.length,
        knxConfigs: createdKnxConfigs.length,
        multiScenes: createdMultiScenes.length,
        sequences: createdSequences.length,
      };

      const totalConfigs = Object.values(configSummary).reduce((sum, count) => sum + count, 0);
      console.log(`Advanced configurations read successfully for unit ${networkUnit.ip_address}:`, configSummary);
      console.log(`Total configurations created: ${totalConfigs}`);
    } catch (error) {
      console.error(`Failed to read advanced configurations for unit ${networkUnit.ip_address}:`, error);
      throw error;
    }
  };

  // Helper function to read scene configurations from network unit
  const readSceneConfigurations = async (networkUnit, projectId) => {
    const createdScenes = [];
    const sceneAddressMap = new Map(); // Map network scene address to database scene ID

    try {
      console.log("Reading scene configurations...");

      const result = await window.electronAPI.rcuController.getAllScenesInformation({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      if (result?.scenes && result.scenes.length > 0) {
        console.log(`Found ${result.scenes.length} scenes on network unit`);

        for (const networkScene of result.scenes) {
          try {
            // Get detailed scene information including items
            const detailedScene = await window.electronAPI.rcuController.getSceneInformation({
              unitIp: networkUnit.ip_address,
              canId: networkUnit.id_can,
              sceneIndex: networkScene.index,
            });

            if (detailedScene) {
              // Create scene in database
              const sceneData = {
                name: networkScene.name || `Scene ${networkScene.index}`,
                address: networkScene.address.toString(),
                description: `Transferred from network unit ${networkUnit.ip_address}`,
              };

              const createdScene = await window.electronAPI.scene.create(
                projectId,
                sceneData
              );

              // Map network address to database ID for schedule references
              sceneAddressMap.set(networkScene.address, createdScene.id);

              // Create scene items if they exist
              if (detailedScene.items && detailedScene.items.length > 0) {
                for (const item of detailedScene.items) {
                  try {
                    // Map object_value to item_type and find or create corresponding database item
                    const { itemType, itemId } = await findOrCreateDatabaseItemByNetworkItem(
                      item,
                      projectId
                    );

                    if (itemType && itemId) {
                      // Convert network item value to database format
                      let itemValue = item.itemValue;
                      if (item.objectValue === 1) {
                        // LIGHTING: Convert from 0-255 to 0-100
                        itemValue = Math.round((item.itemValue / 255) * 100);
                      }

                      await window.electronAPI.scene.addItem(
                        createdScene.id,
                        itemType,
                        itemId,
                        itemValue.toString(),
                        null, // command
                        getObjectTypeFromValue(item.objectValue)
                      );
                    }
                  } catch (error) {
                    console.error(`Failed to create scene item:`, error);
                    // Continue with other items
                  }
                }
              }

              createdScenes.push(createdScene);
              console.log(`Created scene: ${createdScene.name} (ID: ${createdScene.id})`);
            }

            // Add delay between scene reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Failed to process scene ${networkScene.index}:`, error);
            // Continue with other scenes
          }
        }
      }

      console.log(`Successfully created ${createdScenes.length} scenes`);
      return { createdScenes, sceneAddressMap };
    } catch (error) {
      console.error("Failed to read scene configurations:", error);
      return { createdScenes, sceneAddressMap };
    }
  };

  // Helper function to find or create database item by network item
  const findOrCreateDatabaseItemByNetworkItem = async (networkItem, projectId) => {
    try {
      const objectValue = networkItem.objectValue;
      const itemAddress = networkItem.itemAddress;

      // Map object_value to item type
      let itemType;
      switch (objectValue) {
        case 1: // LIGHTING
          itemType = "lighting";
          break;
        case 2: // CURTAIN
          itemType = "curtain";
          break;
        case 3: // AC_POWER
        case 4: // AC_MODE
        case 5: // AC_FAN_SPEED
        case 6: // AC_TEMPERATURE
        case 7: // AC_SWING
          itemType = "aircon";
          break;
        default:
          return { itemType: null, itemId: null };
      }

      // Find item in database by address
      const items = await window.electronAPI[itemType].getAll(projectId);

      let foundItem = items.find(item => item.address === itemAddress.toString());

      if (foundItem) {
        return { itemType, itemId: foundItem.id };
      } else {
        const newItemData = {
          name: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${itemAddress}`,
          address: itemAddress.toString(),
          description: `Auto-created from scene transfer`,
        };

        // Add specific fields for each item type
        if (itemType === "lighting") {
          newItemData.object_type = "OBJ_LIGHTING";
          newItemData.object_value = 1;
        } else if (itemType === "aircon") {
          // For aircon, we create one item that can handle all aircon properties
          newItemData.label = "Aircon";
        } else if (itemType === "curtain") {
          newItemData.object_type = "OBJ_CURTAIN";
          newItemData.object_value = 2;
          newItemData.curtain_type = "";
          newItemData.curtain_value = 0;
          newItemData.pause_period = 0;
          newItemData.transition_period = 0;
          // Note: open_group_id, close_group_id, stop_group_id will be null
        }

        const createdItem = await window.electronAPI[itemType].create(projectId, newItemData);

        return { itemType, itemId: createdItem.id };
      }
    } catch (error) {
      console.error("Error finding or creating database item:", error);
      return { itemType: null, itemId: null };
    }
  };

  // Helper function to read schedule configurations from network unit
  const readScheduleConfigurations = async (networkUnit, projectId, sceneAddressMap) => {
    const createdSchedules = [];

    try {
      console.log("Reading schedule configurations...");

      const result = await window.electronAPI.rcuController.getAllSchedulesInformation({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      if (result?.data && result.data.length > 0) {
        console.log(`Found ${result.data.length} schedules on network unit`);

        for (const networkSchedule of result.data) {
          try {
            // Only process enabled schedules with scenes
            if (!networkSchedule.enabled || !networkSchedule.sceneAddresses || networkSchedule.sceneAddresses.length === 0) {
              console.log(`Skipping schedule ${networkSchedule.scheduleIndex}: disabled or no scenes`);
              continue;
            }

            // Convert weekDays array to days string format for database
            const daysArray = networkSchedule.weekDays || [false, false, false, false, false, false, false];
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const enabledDays = dayNames.filter((_, index) => daysArray[index]);

            // Format time as HH:MM
            const timeString = `${networkSchedule.hour.toString().padStart(2, '0')}:${networkSchedule.minute.toString().padStart(2, '0')}`;

            // Create schedule in database
            const scheduleData = {
              name: `Schedule ${networkSchedule.scheduleIndex}`,
              description: `Transferred from network unit ${networkUnit.ip_address}`,
              time: timeString,
              days: enabledDays,
              enabled: networkSchedule.enabled,
            };

            const createdSchedule = await window.electronAPI.schedule.create(
              projectId,
              scheduleData
            );

            // Add scenes to schedule
            for (const sceneAddress of networkSchedule.sceneAddresses) {
              const sceneId = sceneAddressMap.get(sceneAddress);
              if (sceneId) {
                try {
                  await window.electronAPI.schedule.addScene(
                    createdSchedule.id,
                    sceneId
                  );
                } catch (error) {
                  console.error(`Failed to add scene ${sceneId} to schedule ${createdSchedule.id}:`, error);
                  // Continue with other scenes
                }
              } else {
                console.warn(`Scene with address ${sceneAddress} not found in created scenes`);
              }
            }

            createdSchedules.push(createdSchedule);
            console.log(`Created schedule: ${createdSchedule.name} (ID: ${createdSchedule.id}) with ${networkSchedule.sceneAddresses.length} scenes`);

            // Add delay between schedule reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Failed to process schedule ${networkSchedule.scheduleIndex}:`, error);
            // Continue with other schedules
          }
        }
      }

      console.log(`Successfully created ${createdSchedules.length} schedules`);
      return createdSchedules;
    } catch (error) {
      console.error("Failed to read schedule configurations:", error);
      return createdSchedules;
    }
  };

  // Helper function to read curtain configurations from network unit
  const readCurtainConfigurations = async (networkUnit, projectId) => {
    const createdCurtains = [];

    try {
      const result = await window.electronAPI.rcuController.getCurtainConfig({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
        curtainIndex: null, // Get all curtains
      });

      if (result?.curtains && result.curtains.length > 0) {

        for (const networkCurtain of result.curtains) {
          try {
            // Only process curtains with valid type (not 0)
            if (networkCurtain.curtainType === 0) {
              continue;
            }
            const openGroup = await findOrCreateLightingByAddress(networkCurtain.openGroup, projectId);
            const closeGroup = await findOrCreateLightingByAddress(networkCurtain.closeGroup, projectId);
            const stopGroup = (networkCurtain.stopGroup && networkCurtain.stopGroup > 0) ?
              await findOrCreateLightingByAddress(networkCurtain.stopGroup, projectId) : null;

            // Create curtain in database
            const curtainTypeName = getCurtainTypeName(networkCurtain.curtainType);

            const curtainData = {
              name: `Curtain ${networkCurtain.address}`,
              address: networkCurtain.address.toString(),
              description: `Transferred from network unit ${networkUnit.ip_address}`,
              object_type: "OBJ_CURTAIN",
              object_value: 2, // CURTAIN object value
              curtain_type: curtainTypeName,
              curtain_value: networkCurtain.curtainType,
              open_group_id: openGroup?.id || null,
              close_group_id: closeGroup?.id || null,
              stop_group_id: stopGroup?.id || null,
              pause_period: networkCurtain.pausePeriod || 0,
              transition_period: networkCurtain.transitionPeriod || 0,
            };

            const createdCurtain = await window.electronAPI.curtain.create(
              projectId,
              curtainData
            );

            createdCurtains.push(createdCurtain);

            // Add delay between curtain reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            // Continue with other curtains
          }
        }
      } else {
        console.log("No curtains found on network unit or invalid result structure");
      }

      console.log(`Successfully created ${createdCurtains.length} curtains`);
      return createdCurtains;
    } catch (error) {
      console.error("Failed to read curtain configurations:", error);
      return createdCurtains;
    }
  };

  // Helper function to find or create lighting by address
  const findOrCreateLightingByAddress = async (address, projectId) => {
    try {
      if (!address || address === 0) {
        return null;
      }

      const lightingItems = await window.electronAPI.lighting.getAll(projectId);
      let foundItem = lightingItems.find(item => item.address === address.toString());

      if (foundItem) {
        return foundItem;
      } else {
        const newLightingData = {
          name: `Lighting ${address}`,
          address: address.toString(),
          description: `Auto-created from configuration transfer`,
          object_type: "OBJ_LIGHTING",
          object_value: 1,
        };

        const createdItem = await window.electronAPI.lighting.create(projectId, newLightingData);
        return createdItem;
      }
    } catch (error) {
      console.error(`Error finding or creating lighting with address ${address}:`, error);
      return null;
    }
  };

  // Helper function to get curtain type name from value (based on constants.js)
  const getCurtainTypeName = (curtainType) => {
    let typeName;
    switch (curtainType) {
      case 1:
        typeName = "CURTAIN_PULSE_1G_2P";
        break;
      case 2:
        typeName = "CURTAIN_PULSE_1G_3P";
        break;
      case 3:
        typeName = "CURTAIN_PULSE_2P";
        break;
      case 4:
        typeName = "CURTAIN_PULSE_3P";
        break;
      case 5:
        typeName = "CURTAIN_HOLD_1G";
        break;
      case 6:
        typeName = "CURTAIN_HOLD";
        break;
      default:
        typeName = "";
        break;
    }

    return typeName;
  };

  // Helper function to read KNX configurations from network unit
  const readKnxConfigurations = async (networkUnit, projectId) => {
    const createdKnxConfigs = [];

    try {
      console.log("Reading KNX configurations...");

      const result = await window.electronAPI.rcuController.getKnxConfig({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
        knxAddress: null, // Get all KNX configs
      });

      if (result?.knxConfigs && result.knxConfigs.length > 0) {
        console.log(`Found ${result.knxConfigs.length} KNX configs on network unit`);

        for (const networkKnx of result.knxConfigs) {
          try {
            // Only process KNX configs with valid type (not 0)
            if (networkKnx.type === 0) {
              console.log(`Skipping KNX address ${networkKnx.address}: invalid type`);
              continue;
            }

            // Find or create corresponding RCU group (lighting item)
            const rcuGroup = await findOrCreateLightingByAddress(networkKnx.rcuGroup, projectId);

            // Create KNX config in database
            const knxData = {
              name: `KNX ${networkKnx.address}`,
              address: networkKnx.address,
              type: networkKnx.type,
              factor: networkKnx.factor || 1,
              feedback: networkKnx.feedback || 0,
              rcu_group_id: rcuGroup?.id || null,
              knx_switch_group: networkKnx.knxSwitchGroup || "",
              knx_dimming_group: networkKnx.knxDimmingGroup || "",
              knx_value_group: networkKnx.knxValueGroup || "",
              description: `Transferred from network unit ${networkUnit.ip_address}`,
            };

            const createdKnx = await window.electronAPI.knx.create(
              projectId,
              knxData
            );

            createdKnxConfigs.push(createdKnx);
            console.log(`Created KNX config: ${createdKnx.name} (ID: ${createdKnx.id})`);

            // Add delay between KNX reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Failed to process KNX address ${networkKnx.address}:`, error);
            // Continue with other KNX configs
          }
        }
      }

      console.log(`Successfully created ${createdKnxConfigs.length} KNX configs`);
      return createdKnxConfigs;
    } catch (error) {
      console.error("Failed to read KNX configurations:", error);
      return createdKnxConfigs;
    }
  };

  // Helper function to read Multi-Scene configurations from network unit
  const readMultiSceneConfigurations = async (networkUnit, projectId, sceneAddressMap) => {
    const createdMultiScenes = [];
    const multiSceneAddressMap = new Map(); // Map network multi-scene address to database multi-scene ID

    try {
      console.log("Reading Multi-Scene configurations...");

      const result = await window.electronAPI.rcuController.getAllMultiScenesInformation({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      if (result?.multiScenes && result.multiScenes.length > 0) {
        console.log(`Found ${result.multiScenes.length} multi-scenes on network unit`);

        for (const networkMultiScene of result.multiScenes) {
          try {
            // Only process multi-scenes with scenes
            if (!networkMultiScene.sceneAddresses || networkMultiScene.sceneAddresses.length === 0) {
              console.log(`Skipping multi-scene ${networkMultiScene.multiSceneIndex}: no scenes`);
              continue;
            }

            // Create multi-scene in database
            const multiSceneData = {
              name: networkMultiScene.multiSceneName || `Multi-Scene ${networkMultiScene.multiSceneIndex}`,
              address: networkMultiScene.multiSceneAddress.toString(),
              type: networkMultiScene.multiSceneType || 0,
              description: `Transferred from network unit ${networkUnit.ip_address}`,
            };

            const createdMultiScene = await window.electronAPI.multiScenes.create(
              projectId,
              multiSceneData
            );

            // Map network address to database ID for sequence references
            multiSceneAddressMap.set(networkMultiScene.multiSceneAddress, createdMultiScene.id);

            // Add scenes to multi-scene
            for (let i = 0; i < networkMultiScene.sceneAddresses.length; i++) {
              const sceneAddress = networkMultiScene.sceneAddresses[i];
              const sceneId = sceneAddressMap.get(sceneAddress);
              if (sceneId) {
                try {
                  await window.electronAPI.multiScenes.addScene(
                    createdMultiScene.id,
                    sceneId,
                    i // scene_order
                  );
                } catch (error) {
                  console.error(`Failed to add scene ${sceneId} to multi-scene ${createdMultiScene.id}:`, error);
                  // Continue with other scenes
                }
              } else {
                console.warn(`Scene with address ${sceneAddress} not found in created scenes`);
              }
            }

            createdMultiScenes.push(createdMultiScene);
            console.log(`Created multi-scene: ${createdMultiScene.name} (ID: ${createdMultiScene.id}) with ${networkMultiScene.sceneAddresses.length} scenes`);

            // Add delay between multi-scene reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Failed to process multi-scene ${networkMultiScene.multiSceneIndex}:`, error);
            // Continue with other multi-scenes
          }
        }
      }

      console.log(`Successfully created ${createdMultiScenes.length} multi-scenes`);
      return { createdMultiScenes, multiSceneAddressMap };
    } catch (error) {
      console.error("Failed to read Multi-Scene configurations:", error);
      return { createdMultiScenes, multiSceneAddressMap };
    }
  };

  // Helper function to read Sequence configurations from network unit
  const readSequenceConfigurations = async (networkUnit, projectId, multiSceneAddressMap) => {
    const createdSequences = [];

    try {
      console.log("Reading Sequence configurations...");

      const result = await window.electronAPI.rcuController.getAllSequencesInformation({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      if (result?.sequences && result.sequences.length > 0) {
        console.log(`Found ${result.sequences.length} sequences on network unit`);

        for (const networkSequence of result.sequences) {
          try {
            // Only process sequences with multi-scenes
            if (!networkSequence.multiSceneAddresses || networkSequence.multiSceneAddresses.length === 0) {
              console.log(`Skipping sequence ${networkSequence.index}: no multi-scenes`);
              continue;
            }

            // Create sequence in database
            const sequenceData = {
              name: `Sequence ${networkSequence.index}`,
              address: networkSequence.address.toString(),
              description: `Transferred from network unit ${networkUnit.ip_address}`,
            };

            const createdSequence = await window.electronAPI.sequences.create(
              projectId,
              sequenceData
            );

            // Add multi-scenes to sequence
            for (let i = 0; i < networkSequence.multiSceneAddresses.length; i++) {
              const multiSceneAddress = networkSequence.multiSceneAddresses[i];
              const multiSceneId = multiSceneAddressMap.get(multiSceneAddress);
              if (multiSceneId) {
                try {
                  await window.electronAPI.sequences.addMultiScene(
                    createdSequence.id,
                    multiSceneId,
                    i // multi_scene_order
                  );
                } catch (error) {
                  console.error(`Failed to add multi-scene ${multiSceneId} to sequence ${createdSequence.id}:`, error);
                  // Continue with other multi-scenes
                }
              } else {
                console.warn(`Multi-scene with address ${multiSceneAddress} not found in created multi-scenes`);
              }
            }

            createdSequences.push(createdSequence);
            console.log(`Created sequence: ${createdSequence.name} (ID: ${createdSequence.id}) with ${networkSequence.multiSceneAddresses.length} multi-scenes`);

            // Add delay between sequence reads
            await new Promise((resolve) => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Failed to process sequence ${networkSequence.index}:`, error);
            // Continue with other sequences
          }
        }
      }

      console.log(`Successfully created ${createdSequences.length} sequences`);
      return createdSequences;
    } catch (error) {
      console.error("Failed to read Sequence configurations:", error);
      return createdSequences;
    }
  };

  // Helper function to get object type from object value
  const getObjectTypeFromValue = (objectValue) => {
    switch (objectValue) {
      case 1:
        return "OBJ_LIGHTING";
      case 2:
        return "OBJ_CURTAIN";
      case 3:
        return "OBJ_AC_POWER";
      case 4:
        return "OBJ_AC_MODE";
      case 5:
        return "OBJ_AC_FAN_SPEED";
      case 6:
        return "OBJ_AC_TEMPERATURE";
      case 7:
        return "OBJ_AC_SWING";
      default:
        return null;
    }
  };

  const handleExport = async () => {
    try {
      await exportItems(category);
    } catch (error) {
      console.error("Failed to export unit items:", error);
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
        console.log("Loading aircon data for comparison...");
        toast.info("Loading aircon data...");

        try {
          await loadTabData(selectedProject.id, "aircon");
          console.log("Aircon data loaded successfully");
        } catch (loadError) {
          console.error("Failed to load aircon data:", loadError);
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
            aircon: freshAirconItems
          };
          console.log("Fresh aircon data loaded:", {
            airconCount: freshAirconItems.length
          });
        } catch (error) {
          console.error("Failed to get fresh aircon data:", error);
          // Continue with existing projectItems
        }
      }

      console.log("Starting comparison with projectItems:", {
        airconCount: freshProjectItems.aircon?.length || 0,
        lightingCount: freshProjectItems.lighting?.length || 0
      });

      // Pass fresh projectItems for device_id to address lookup
      await compareConfigurations(units, networkUnits, freshProjectItems);
    } catch (error) {
      console.error("Failed to compare configurations:", error);
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
                        <Button
                          onClick={() => setDifferencesDialogOpen(true)}
                          className="flex items-center gap-2"
                          variant="secondary"
                        >
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
            onNetworkUnitsChange={setNetworkUnits}
            getRowClassName={(unit) => getUnitRowClass(`net_${unit.ip_address}_${unit.id_can}`)}
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

      <ComparisonDifferencesDialog
        open={differencesDialogOpen}
        onOpenChange={setDifferencesDialogOpen}
        comparisonSummary={comparisonSummary}
      />
    </>
  );
}
