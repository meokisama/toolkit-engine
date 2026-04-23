import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { udpScanner } from "@/services/udp";
import { sortByIpAddress } from "@/utils/ip-utils";
import { DIALOG_TYPES } from "./use-dialog-state";
import { useTransferStore, TRANSFER_STATUS, TRANSFER_STEP } from "@/store/use-transfer-store";
import { TransferItemCache } from "@/services/transfer/item-cache";
import { readRS485Configurations } from "../../transfer/readers/rs485";
import { readIOConfigurations } from "../../transfer/readers/io-config";
import { autoCreateMissingItems } from "../utils/device-management-utils";
import log from "electron-log/renderer";

// Delay between units to prevent UDP conflicts
const UDP_INTER_UNIT_DELAY_MS = 1000;

// Tabs whose items can be created/modified by a network-unit transfer.
// Kept in sync with readIOConfigurations + readAdvancedConfigurations outputs.
// Note: "room" is not a regular tab (excluded from tab-loader); the room settings
// component reloads on its own when the user navigates to it.
const TRANSFER_AFFECTED_TABS = [
  "unit",
  "lighting",
  "aircon",
  "curtain",
  "knx",
  "scene",
  "schedule",
  "multi_scenes",
  "sequences",
  "dmx",
];

export function useNetworkUnitHandlers({ state, onTransferToDatabase, existingUnits, selectedProject, projectItems, createItem, loadTabData }) {
  const { setNetworkUnits, setSelectedNetworkUnits, setScanLoading, networkTable, dialogState, createdItemsCache } = state;
  const transferStore = useTransferStore();
  const isExecutingRef = useRef(false);

  // -------------------------------------------------------------------------
  // Core transfer execution — runs when store transitions to RUNNING
  // -------------------------------------------------------------------------
  const executeTransfer = useCallback(
    async (units) => {
      const silentCreateItem = (category, itemData) => createItem(category, itemData, true);
      const transferToastId = toast.loading(`Transferring ${units.length} unit(s) to database...`);
      try {
        // Step 0: Pre-fetch all DB items once (fixes N+1 query problem)
        transferStore.setProgress(0, TRANSFER_STEP.PREFETCH);
        const itemCache = new TransferItemCache();
        await itemCache.initialize(selectedProject.id);

        const unitsToImport = [];

        for (let i = 0; i < units.length; i++) {
          const unit = units[i];

          // Step 1: Delete existing unit + related items if needed
          transferStore.setProgress(i, TRANSFER_STEP.DELETE_EXISTING);
          const existingUnit = existingUnits.find(
            (e) => e.ip_address === unit.ip_address || e.serial_no === unit.serial_no
          );
          if (existingUnit) {
            await window.electronAPI.unit.deleteWithRelatedItems(existingUnit.id);
            log.info(`Deleted existing unit ${existingUnit.id} and all related items`);
          }

          // Step 2: Read RS485
          transferStore.setProgress(i, TRANSFER_STEP.READ_RS485);
          const rs485Config = await readRS485Configurations(unit);

          // Step 3: Read I/O
          transferStore.setProgress(i, TRANSFER_STEP.READ_IO);
          const ioConfigs = await readIOConfigurations(
            unit,
            selectedProject,
            projectItems,
            silentCreateItem,
            createdItemsCache,
            itemCache
          );

          await autoCreateMissingItems(ioConfigs, selectedProject, projectItems, itemCache);

          unitsToImport.push({
            ...unit,
            id: undefined,
            rs485_config: rs485Config,
            input_configs: ioConfigs.input_configs,
            output_configs: ioConfigs.output_configs,
            switch_configs: ioConfigs.switch_configs || [],
          });

          if (i < units.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, UDP_INTER_UNIT_DELAY_MS));
          }
        }

        // Step 4: Import units to DB and read advanced configs
        // Pass itemCache so database-unit-table can reuse the same cache
        await onTransferToDatabase(unitsToImport, itemCache, (unitIndex, step) =>
          transferStore.setProgress(unitIndex, step)
        );

        transferStore.complete();

        // Clear table selection after successful transfer
        setSelectedNetworkUnits([]);
        if (networkTable) networkTable.resetRowSelection();

        // Refresh all tabs whose items may have been auto-created during transfer
        // (lighting/aircon/curtain from I/O, scene/schedule/knx/multi_scenes/sequences from advanced config).
        // Without this, newly created items stay invisible until the app is reloaded.
        if (loadTabData && selectedProject?.id) {
          await Promise.all(
            TRANSFER_AFFECTED_TABS.map((tab) => loadTabData(selectedProject.id, tab))
          );
        }

        toast.dismiss(transferToastId);
        toast.success(`Successfully transferred ${units.length} unit(s) with configurations to database`);
      } catch (error) {
        log.error("Transfer execution failed:", error);
        transferStore.fail(error.message);
        toast.dismiss(transferToastId);
        toast.error("Transfer failed: " + error.message);
      }
    },
    [existingUnits, selectedProject, projectItems, createItem, createdItemsCache, onTransferToDatabase, networkTable, setSelectedNetworkUnits, loadTabData]
  );

  // Watch store: when status becomes RUNNING, execute the transfer
  useEffect(() => {
    if (transferStore.status === TRANSFER_STATUS.RUNNING && !isExecutingRef.current) {
      isExecutingRef.current = true;
      executeTransfer(transferStore.pendingUnits).finally(() => {
        isExecutingRef.current = false;
      });
    }
  }, [transferStore.status, executeTransfer]);

  // -------------------------------------------------------------------------
  // Unified transfer trigger — replaces 3 near-identical handlers
  // -------------------------------------------------------------------------
  const handleTransfer = useCallback(
    (units) => {
      if (!units || units.length === 0) {
        toast.warning("No units to transfer");
        return;
      }

      // Identify which units already exist in the database
      const conflicting = units.filter((unit) =>
        existingUnits.some((e) => e.ip_address === unit.ip_address || e.serial_no === unit.serial_no)
      );

      // prepare() sets status to 'confirming' if conflicts exist, or 'running' immediately
      transferStore.prepare(units, conflicting);
    },
    [existingUnits, transferStore]
  );

  // Public shortcuts for backward compat with toolbar/context-menu call sites
  const handleTransferSingleToDatabase = useCallback(
    (unit) => handleTransfer([unit]),
    [handleTransfer]
  );

  const handleTransferSelectedToDatabase = useCallback(
    () => handleTransfer(state.selectedNetworkUnits),
    [handleTransfer, state.selectedNetworkUnits]
  );

  const handleTransferAllToDatabase = useCallback(
    () => handleTransfer(state.networkUnits),
    [handleTransfer, state.networkUnits]
  );

  // -------------------------------------------------------------------------
  // Network scanning
  // -------------------------------------------------------------------------
  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");
      const discoveredUnits = await udpScanner.getNetworkUnits(true);
      const sortedUnits = sortByIpAddress(discoveredUnits);
      setNetworkUnits(sortedUnits);
      setSelectedNetworkUnits([]);

      if (sortedUnits.length > 0) {
        toast.success(`Found ${sortedUnits.length} unit(s) on network`);
      } else {
        toast.warning("No units found on network");
      }
    } catch (error) {
      log.error("Failed to scan network:", error);
      toast.error("Failed to scan network: " + error.message);
    } finally {
      setScanLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Dialog factory — reduces per-dialog boilerplate
  // -------------------------------------------------------------------------
  const createDialogHandler = useCallback(
    (dialogType) => (unit) => dialogState.openDialog(dialogType, unit),
    [dialogState]
  );

  const handleGroupControl = createDialogHandler(DIALOG_TYPES.GROUP_CONTROL);
  const handleAirconControl = createDialogHandler(DIALOG_TYPES.AIRCON_CONTROL);
  const handleRgbControl = createDialogHandler(DIALOG_TYPES.RGB_CONTROL);
  const handleTriggerScene = createDialogHandler(DIALOG_TYPES.TRIGGER_SCENE);
  const handleTriggerSchedule = createDialogHandler(DIALOG_TYPES.TRIGGER_SCHEDULE);
  const handleClockControl = createDialogHandler(DIALOG_TYPES.CLOCK_CONTROL);
  const handleTriggerCurtain = createDialogHandler(DIALOG_TYPES.TRIGGER_CURTAIN);
  const handleTriggerKnx = createDialogHandler(DIALOG_TYPES.TRIGGER_KNX);
  const handleDmxControl = createDialogHandler(DIALOG_TYPES.DMX_CONTROL);
  const handleRoomConfigControl = createDialogHandler(DIALOG_TYPES.ROOM_CONFIG_CONTROL);
  const handleTriggerMultiScene = createDialogHandler(DIALOG_TYPES.TRIGGER_MULTI_SCENE);
  const handleTriggerSequence = createDialogHandler(DIALOG_TYPES.TRIGGER_SEQUENCE);
  const handleLedSpiControl = createDialogHandler(DIALOG_TYPES.LED_SPI_CONTROL);
  const handleOnlineStatus = createDialogHandler(DIALOG_TYPES.ONLINE_STATUS);

  const handleBulkClockSync = useCallback(() => dialogState.openDialog(DIALOG_TYPES.BULK_CLOCK_SYNC), [dialogState]);
  const handleSendAllConfig = useCallback(() => dialogState.openDialog(DIALOG_TYPES.SEND_ALL_CONFIG), [dialogState]);

  const handleGroupControlSubmit = async (params) => {
    try {
      if (typeof window !== "undefined" && window.electronAPI?.ioController) {
        await window.electronAPI.ioController.setGroupState(params);
      } else {
        log.info("Group control command:", params);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      log.error("Group control failed:", error);
      throw error;
    }
  };

  const handleFirmwareUpdate = useCallback(() => dialogState.openDialog(DIALOG_TYPES.FIRMWARE_UPDATE, null), [dialogState]);
  const handleFirmwareUpdateForUnit = useCallback((unit) => dialogState.openDialog(DIALOG_TYPES.FIRMWARE_UPDATE, unit), [dialogState]);

  const handleFirmwareUpdateComplete = (results) => {
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`Firmware update completed for ${successCount} unit${successCount !== 1 ? "s" : ""}`);
      setTimeout(() => handleScanNetwork(), 5000);
    }
  };

  const handleNetworkRowSelectionChange = useCallback(
    (_, rowSelection) => {
      if (networkTable && rowSelection && typeof rowSelection === "object") {
        const selectedRowIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
        const selectedRows = selectedRowIds
          .map((id) => {
            try {
              return networkTable.getRow(id);
            } catch {
              return null;
            }
          })
          .filter((row) => row?.original);
        setSelectedNetworkUnits(selectedRows.map((row) => row.original));
      } else {
        setSelectedNetworkUnits([]);
      }
    },
    [networkTable, setSelectedNetworkUnits]
  );

  const handleIOConfig = useCallback((unit) => dialogState.openDialog(DIALOG_TYPES.IO_CONFIG, unit), [dialogState]);
  const handleEditUnit = useCallback((unit) => dialogState.openDialog(DIALOG_TYPES.EDIT, unit), [dialogState]);

  return {
    handleScanNetwork,
    handleTransferSingleToDatabase,
    handleTransferSelectedToDatabase,
    handleTransferAllToDatabase,
    handleGroupControl,
    handleAirconControl,
    handleRgbControl,
    handleTriggerScene,
    handleTriggerSchedule,
    handleClockControl,
    handleBulkClockSync,
    handleTriggerCurtain,
    handleTriggerKnx,
    handleDmxControl,
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
    handleLedSpiControl,
    handleOnlineStatus,
  };
}
