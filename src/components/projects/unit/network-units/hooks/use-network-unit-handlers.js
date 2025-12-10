import { useCallback } from "react";
import { toast } from "sonner";
import { udpScanner } from "@/services/udp";
import { sortByIpAddress } from "@/utils/ip-utils";
import { readNetworkUnitConfigurations } from "../utils/config-reader";
import { DIALOG_TYPES } from "./use-dialog-state";

export function useNetworkUnitHandlers({
  state,
  onTransferToDatabase,
  existingUnits,
  selectedProject,
  projectItems,
  createItem,
}) {
  const {
    setNetworkUnits,
    setSelectedNetworkUnits,
    setScanLoading,
    networkTable,
    dialogState,
    createdItemsCache,
  } = state;

  // Network scanning
  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");

      const discoveredUnits = await udpScanner.getNetworkUnits(true); // Always force scan when button is clicked

      // Sort by IP address before setting
      const sortedUnits = sortByIpAddress(discoveredUnits);
      setNetworkUnits(sortedUnits);
      setSelectedNetworkUnits([]);

      if (sortedUnits.length > 0) {
        toast.success(
          `Found ${sortedUnits.length} unit(s) on network (sorted by IP)`
        );
      } else {
        toast.warning("No units found on network");
      }
    } catch (error) {
      console.error("Failed to scan network:", error);
      toast.error("Failed to scan network: " + error.message);
    } finally {
      setScanLoading(false);
    }
  };

  // Transfer handlers
  const handleTransferSelectedToDatabase = async () => {
    if (state.selectedNetworkUnits.length === 0) {
      toast.warning("Please select units to transfer to database");
      return;
    }

    const loadingToast = toast.loading(
      `Reading configurations from ${state.selectedNetworkUnits.length} selected unit(s)...`
    );

    try {
      const unitsToTransfer = [];

      // Process units sequentially to avoid UDP conflicts
      for (let i = 0; i < state.selectedNetworkUnits.length; i++) {
        const networkUnit = state.selectedNetworkUnits[i];

        // Check if unit already exists in database
        const existingUnit = existingUnits.find(
          (unit) =>
            unit.ip_address === networkUnit.ip_address ||
            unit.serial_no === networkUnit.serial_no
        );

        if (existingUnit) {
          toast.warning(
            `Unit ${networkUnit.type} (${networkUnit.ip_address}) already exists in database`
          );
          continue;
        }

        // Update progress
        toast.loading(
          `Reading configurations from unit ${i + 1}/${
            state.selectedNetworkUnits.length
          }: ${networkUnit.type} (${networkUnit.ip_address})...`,
          { id: loadingToast }
        );

        // Read configurations from network unit and create new unit with configs
        const newUnit = await readNetworkUnitConfigurations(
          networkUnit,
          selectedProject,
          projectItems,
          createItem,
          createdItemsCache
        );
        unitsToTransfer.push(newUnit);

        // Add delay between units to prevent UDP conflicts
        if (i < state.selectedNetworkUnits.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (unitsToTransfer.length > 0) {
        toast.loading("Saving units to database...", { id: loadingToast });
        await onTransferToDatabase(unitsToTransfer);

        // Clear selection after successful transfer
        setSelectedNetworkUnits([]);
        if (networkTable) {
          networkTable.resetRowSelection();
        }

        toast.success(
          `Successfully transferred ${unitsToTransfer.length} unit(s) with configurations to database`,
          { id: loadingToast }
        );
      } else {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error(
        "Failed to transfer selected network units to database:",
        error
      );
      toast.error(
        "Failed to transfer selected units to database: " + error.message,
        { id: loadingToast }
      );
    }
  };

  const handleTransferAllToDatabase = async () => {
    if (state.networkUnits.length === 0) {
      toast.warning("No network units to transfer");
      return;
    }

    const loadingToast = toast.loading(
      `Reading configurations from all ${state.networkUnits.length} unit(s)...`
    );

    try {
      const unitsToTransfer = [];

      // Process units sequentially to avoid UDP conflicts
      for (let i = 0; i < state.networkUnits.length; i++) {
        const networkUnit = state.networkUnits[i];

        // Check if unit already exists in database
        const existingUnit = existingUnits.find(
          (unit) =>
            unit.ip_address === networkUnit.ip_address ||
            unit.serial_no === networkUnit.serial_no
        );

        if (existingUnit) {
          toast.warning(
            `Unit ${networkUnit.type} (${networkUnit.ip_address}) already exists in database`
          );
          continue;
        }

        // Update progress
        toast.loading(
          `Reading configurations from unit ${i + 1}/${state.networkUnits.length}: ${
            networkUnit.type
          } (${networkUnit.ip_address})...`,
          { id: loadingToast }
        );

        // Read configurations from network unit and create new unit with configs
        const newUnit = await readNetworkUnitConfigurations(
          networkUnit,
          selectedProject,
          projectItems,
          createItem,
          createdItemsCache
        );
        unitsToTransfer.push(newUnit);

        // Add delay between units to prevent UDP conflicts
        if (i < state.networkUnits.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (unitsToTransfer.length > 0) {
        toast.loading("Saving units to database...", { id: loadingToast });
        await onTransferToDatabase(unitsToTransfer);

        // Clear selection after successful transfer
        setSelectedNetworkUnits([]);
        if (networkTable) {
          networkTable.resetRowSelection();
        }

        toast.success(
          `Successfully transferred all ${unitsToTransfer.length} unit(s) with configurations to database`,
          { id: loadingToast }
        );
      } else {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error("Failed to transfer all network units to database:", error);
      toast.error(
        "Failed to transfer all units to database: " + error.message,
        { id: loadingToast }
      );
    }
  };

  const handleTransferSingleToDatabase = useCallback(
    async (unit) => {
      // Check if unit already exists in database
      const existingUnit = existingUnits.find(
        (existingUnit) =>
          existingUnit.ip_address === unit.ip_address ||
          existingUnit.serial_no === unit.serial_no
      );

      if (existingUnit) {
        toast.warning(
          `Unit ${unit.type} (${unit.ip_address}) already exists in database`
        );
        return;
      }

      const loadingToast = toast.loading(
        `Reading configuration from unit ${unit.ip_address}...`
      );

      try {
        // Read configurations from network unit and create new unit with configs
        const unitToTransfer = await readNetworkUnitConfigurations(
          unit,
          selectedProject,
          projectItems,
          createItem,
          createdItemsCache
        );

        if (unitToTransfer) {
          toast.loading("Saving unit to database...", { id: loadingToast });
          await onTransferToDatabase([unitToTransfer]);

          toast.success(
            `Successfully transferred unit ${unit.ip_address} to database`,
            { id: loadingToast }
          );
        } else {
          toast.dismiss(loadingToast);
        }
      } catch (error) {
        console.error("Failed to transfer unit to database:", error);
        toast.error(
          `Failed to transfer unit ${unit.ip_address} to database: ${error.message}`,
          { id: loadingToast }
        );
      }
    },
    [onTransferToDatabase, existingUnits, selectedProject, projectItems, createItem, createdItemsCache]
  );

  // Factory function to create dialog handlers - reduces code duplication
  const createDialogHandler = useCallback(
    (dialogType) => (unit) => {
      dialogState.openDialog(dialogType, unit);
    },
    [dialogState]
  );

  // Control dialog handlers using factory pattern
  const handleGroupControl = createDialogHandler(DIALOG_TYPES.GROUP_CONTROL);
  const handleAirconControl = createDialogHandler(DIALOG_TYPES.AIRCON_CONTROL);
  const handleRgbControl = createDialogHandler(DIALOG_TYPES.RGB_CONTROL);
  const handleTriggerScene = createDialogHandler(DIALOG_TYPES.TRIGGER_SCENE);
  const handleTriggerSchedule = createDialogHandler(DIALOG_TYPES.TRIGGER_SCHEDULE);
  const handleClockControl = createDialogHandler(DIALOG_TYPES.CLOCK_CONTROL);
  const handleTriggerCurtain = createDialogHandler(DIALOG_TYPES.TRIGGER_CURTAIN);
  const handleTriggerKnx = createDialogHandler(DIALOG_TYPES.TRIGGER_KNX);
  const handleRoomConfigControl = createDialogHandler(DIALOG_TYPES.ROOM_CONFIG_CONTROL);
  const handleTriggerMultiScene = createDialogHandler(DIALOG_TYPES.TRIGGER_MULTI_SCENE);
  const handleTriggerSequence = createDialogHandler(DIALOG_TYPES.TRIGGER_SEQUENCE);

  // Handlers without unit parameter
  const handleBulkClockSync = useCallback(() => {
    dialogState.openDialog(DIALOG_TYPES.BULK_CLOCK_SYNC);
  }, [dialogState]);

  const handleSendAllConfig = useCallback(() => {
    dialogState.openDialog(DIALOG_TYPES.SEND_ALL_CONFIG);
  }, [dialogState]);

  const handleGroupControlSubmit = async (params) => {
    try {
      if (
        typeof window !== "undefined" &&
        window.electronAPI &&
        window.electronAPI.ioController
      ) {
        await window.electronAPI.ioController.setGroupState(params);
      } else {
        // Fallback for development/testing
        console.log("Group control command:", params);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      }
    } catch (error) {
      console.error("Group control failed:", error);
      throw error;
    }
  };

  // Firmware update handlers
  const handleFirmwareUpdate = useCallback(() => {
    dialogState.openDialog(DIALOG_TYPES.FIRMWARE_UPDATE, null); // No specific unit
  }, [dialogState]);

  const handleFirmwareUpdateForUnit = useCallback((unit) => {
    dialogState.openDialog(DIALOG_TYPES.FIRMWARE_UPDATE, unit);
  }, [dialogState]);

  const handleFirmwareUpdateComplete = (results) => {
    // Optionally refresh network scan after firmware update
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(
        `Firmware update completed for ${successCount} unit${
          successCount !== 1 ? "s" : ""
        }`
      );
      // Refresh network scan after a delay to allow units to restart
      setTimeout(() => {
        handleScanNetwork();
      }, 5000);
    }
  };

  // Row selection handler
  const handleNetworkRowSelectionChange = useCallback(
    (_, rowSelection) => {
      if (networkTable && rowSelection && typeof rowSelection === "object") {
        // Get selected rows from the table using rowSelection object
        const selectedRowIds = Object.keys(rowSelection).filter(
          (id) => rowSelection[id]
        );
        const selectedRows = selectedRowIds
          .map((id) => {
            try {
              return networkTable.getRow(id);
            } catch (error) {
              console.warn(`Could not get row with id ${id}:`, error);
              return null;
            }
          })
          .filter((row) => row && row.original); // Filter out any undefined rows

        setSelectedNetworkUnits(selectedRows.map((row) => row.original));
      } else {
        setSelectedNetworkUnits([]);
      }
    },
    [networkTable, setSelectedNetworkUnits]
  );

  // I/O Config handler
  const handleIOConfig = useCallback((unit) => {
    dialogState.openDialog(DIALOG_TYPES.IO_CONFIG, unit);
  }, [dialogState]);

  // Edit unit handler
  const handleEditUnit = useCallback((unit) => {
    dialogState.openDialog(DIALOG_TYPES.EDIT, unit);
  }, [dialogState]);

  return {
    handleScanNetwork,
    handleTransferSelectedToDatabase,
    handleTransferAllToDatabase,
    handleTransferSingleToDatabase,
    handleGroupControl,
    handleAirconControl,
    handleRgbControl,
    handleTriggerScene,
    handleTriggerSchedule,
    handleClockControl,
    handleBulkClockSync,
    handleTriggerCurtain,
    handleTriggerKnx,
    handleRoomConfigControl,
    handleTriggerMultiScene,
    handleTriggerSequence,
    handleSendAllConfig,
    handleGroupControlSubmit,
    handleFirmwareUpdate,
    handleFirmwareUpdateForUnit,
    handleFirmwareUpdateComplete,
    handleNetworkRowSelectionChange,
    handleIOConfig,
    handleEditUnit,
  };
}
