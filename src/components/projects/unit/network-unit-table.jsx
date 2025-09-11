"use client";

import { useState, useCallback, useEffect, memo, useRef } from "react";
import {
  Network,
  Search,
  Layers2,
  Layers,
  Upload,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Send,
  Database,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createNetworkUnitColumns } from "@/components/projects/unit/unit-columns";
import { GroupControlDialog } from "@/components/projects/unit/network-menu/base/group-control-dialog";
import { RoomControlDialog } from "@/components/projects/unit/network-menu/base/ac-control-dialog";
import RGBControlDialog from "@/components/projects/unit/network-menu/base/rgb-control-dialog";
import { TriggerSceneDialog } from "@/components/projects/unit/network-menu/scene-control/scene-control-dialog";
import { TriggerScheduleDialog } from "@/components/projects/unit/network-menu/schedule-control/schedule-control-dialog";
import { ClockControlDialog } from "@/components/projects/unit/network-menu/clock-control/clock-control-dialog";
import { BulkClockSyncDialog } from "@/components/projects/unit/network-menu/clock-control/bulk-clock-sync-dialog";
import { TriggerCurtainDialog } from "@/components/projects/unit/network-menu/curtain-control/curtain-control-dialog";
import { TriggerKnxDialog } from "@/components/projects/unit/network-menu/knx-control/knx-control-dialog";
import { TriggerMultiSceneDialog } from "@/components/projects/unit/network-menu/multi-scene-control/multi-scene-control-dialog";
import { TriggerSequenceDialog } from "@/components/projects/unit/network-menu/sequence-control/sequence-control-dialog";
import { FirmwareUpdateDialog } from "@/components/projects/unit/network-menu/base/firmware-update-dialog";
import { SendAllConfigDialog } from "@/components/projects/unit/network-menu/base/send-all-config-dialog";
import { NetworkUnitEditDialog } from "@/components/projects/unit/network-menu/base/network-unit-edit-dialog";
import NetworkIOConfigDialog from "@/components/projects/unit/common/network-io-config-dialog";

import { udpScanner } from "@/services/udp";
import { toast } from "sonner";
import { getUnitIOSpec } from "@/utils/io-config-utils";
import { useProjectDetail } from "@/contexts/project-detail-context";

function NetworkUnitTableComponent({
  onTransferToDatabase,
  existingUnits = [],
  onNetworkUnitsChange,
  getRowClassName,
}) {
  const { selectedProject, projectItems, createItem } = useProjectDetail();

  // Cache for newly created items during this transfer session
  const createdItemsCache = useRef({
    aircon: new Map(), // address -> item
    lighting: new Map() // address -> item
  });
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedNetworkUnits, setSelectedNetworkUnits] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkTable, setNetworkTable] = useState(null);
  const [groupControlDialogOpen, setGroupControlDialogOpen] = useState(false);
  const [airconControlDialogOpen, setAirconControlDialogOpen] = useState(false);
  const [rgbControlDialogOpen, setRgbControlDialogOpen] = useState(false);
  const [triggerSceneDialogOpen, setTriggerSceneDialogOpen] = useState(false);
  const [triggerScheduleDialogOpen, setTriggerScheduleDialogOpen] =
    useState(false);
  const [clockControlDialogOpen, setClockControlDialogOpen] = useState(false);
  const [bulkClockSyncDialogOpen, setBulkClockSyncDialogOpen] = useState(false);
  const [triggerCurtainDialogOpen, setTriggerCurtainDialogOpen] =
    useState(false);
  const [triggerKnxDialogOpen, setTriggerKnxDialogOpen] = useState(false);
  const [triggerMultiSceneDialogOpen, setTriggerMultiSceneDialogOpen] =
    useState(false);
  const [triggerSequenceDialogOpen, setTriggerSequenceDialogOpen] =
    useState(false);
  const [firmwareUpdateDialogOpen, setFirmwareUpdateDialogOpen] =
    useState(false);
  const [sendAllConfigDialogOpen, setSendAllConfigDialogOpen] = useState(false);
  const [ioConfigDialogOpen, setIOConfigDialogOpen] = useState(false);
  const [selectedUnitForIOConfig, setSelectedUnitForIOConfig] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Auto-load cached network units when component mounts
  useEffect(() => {
    const cachedUnits = udpScanner.getLastScanResults();
    if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
      setNetworkUnits(cachedUnits);
      console.log(`Auto-loaded ${cachedUnits.length} cached network units`);
    }
  }, []);

  // Notify parent component when network units change
  useEffect(() => {
    if (onNetworkUnitsChange) {
      onNetworkUnitsChange(networkUnits);
    }
  }, [networkUnits, onNetworkUnitsChange]);

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");

      const discoveredUnits = await udpScanner.getNetworkUnits(true); // Always force scan when button is clicked

      setNetworkUnits(discoveredUnits);
      setSelectedNetworkUnits([]);

      if (discoveredUnits.length > 0) {
        toast.success(`Found ${discoveredUnits.length} unit(s) on network`);
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

  const handleTransferSelectedToDatabase = async () => {
    if (selectedNetworkUnits.length === 0) {
      toast.warning("Please select units to transfer to database");
      return;
    }

    const loadingToast = toast.loading(
      `Reading configurations from ${selectedNetworkUnits.length} selected unit(s)...`
    );

    try {
      const unitsToTransfer = [];

      // Process units sequentially to avoid UDP conflicts
      for (let i = 0; i < selectedNetworkUnits.length; i++) {
        const networkUnit = selectedNetworkUnits[i];

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
          `Reading configurations from unit ${i + 1}/${selectedNetworkUnits.length
          }: ${networkUnit.type} (${networkUnit.ip_address})...`,
          { id: loadingToast }
        );

        // Read configurations from network unit and create new unit with configs
        const newUnit = await readNetworkUnitConfigurations(networkUnit);
        unitsToTransfer.push(newUnit);

        // Add delay between units to prevent UDP conflicts
        if (i < selectedNetworkUnits.length - 1) {
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
    if (networkUnits.length === 0) {
      toast.warning("No network units to transfer");
      return;
    }

    const loadingToast = toast.loading(
      `Reading configurations from all ${networkUnits.length} unit(s)...`
    );

    try {
      const unitsToTransfer = [];

      // Process units sequentially to avoid UDP conflicts
      for (let i = 0; i < networkUnits.length; i++) {
        const networkUnit = networkUnits[i];

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
          `Reading configurations from unit ${i + 1}/${networkUnits.length}: ${networkUnit.type
          } (${networkUnit.ip_address})...`,
          { id: loadingToast }
        );

        // Read configurations from network unit and create new unit with configs
        const newUnit = await readNetworkUnitConfigurations(networkUnit);
        unitsToTransfer.push(newUnit);

        // Add delay between units to prevent UDP conflicts
        if (i < networkUnits.length - 1) {
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

  // Handle Group Control
  const handleGroupControl = useCallback((unit) => {
    setSelectedUnit(unit);
    setGroupControlDialogOpen(true);
  }, []);

  // Handle Aircon Control
  const handleAirconControl = useCallback((unit) => {
    setSelectedUnit(unit);
    setAirconControlDialogOpen(true);
  }, []);

  // Handle RGB Control
  const handleRgbControl = useCallback((unit) => {
    setSelectedUnit(unit);
    setRgbControlDialogOpen(true);
  }, []);

  // Handle Scene Control
  const handleTriggerScene = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerSceneDialogOpen(true);
  }, []);

  // Handle Schedule Control
  const handleTriggerSchedule = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerScheduleDialogOpen(true);
  }, []);

  // Handle Clock Control
  const handleClockControl = useCallback((unit) => {
    setSelectedUnit(unit);
    setClockControlDialogOpen(true);
  }, []);

  // Handle Bulk Clock Sync
  const handleBulkClockSync = useCallback(() => {
    setBulkClockSyncDialogOpen(true);
  }, []);

  // Handle Curtain Control
  const handleTriggerCurtain = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerCurtainDialogOpen(true);
  }, []);

  // Handle KNX Control
  const handleTriggerKnx = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerKnxDialogOpen(true);
  }, []);

  // Handle Multi-Scene Control
  const handleTriggerMultiScene = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerMultiSceneDialogOpen(true);
  }, []);

  // Handle Sequence Control
  const handleTriggerSequence = useCallback((unit) => {
    setSelectedUnit(unit);
    setTriggerSequenceDialogOpen(true);
  }, []);

  // Handle Send All Config
  const handleSendAllConfig = useCallback(() => {
    setSendAllConfigDialogOpen(true);
  }, []);

  const handleGroupControlSubmit = async (params) => {
    try {
      if (
        typeof window !== "undefined" &&
        window.electronAPI &&
        window.electronAPI.rcuController
      ) {
        await window.electronAPI.rcuController.setGroupState(params);
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

  // Handle firmware update from toolbar (bulk)
  const handleFirmwareUpdate = () => {
    setSelectedUnit(null); // No specific unit selected
    setFirmwareUpdateDialogOpen(true);
  };

  // Handle firmware update from context menu (specific unit)
  const handleFirmwareUpdateForUnit = (unit) => {
    setSelectedUnit(unit);
    setFirmwareUpdateDialogOpen(true);
  };

  const handleFirmwareUpdateComplete = (results) => {
    // Optionally refresh network scan after firmware update
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(
        `Firmware update completed for ${successCount} unit${successCount !== 1 ? "s" : ""
        }`
      );
      // Refresh network scan after a delay to allow units to restart
      setTimeout(() => {
        handleScanNetwork();
      }, 5000);
    }
  };

  // Handle network unit selection changes
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
    [networkTable]
  );

  // Handle I/O Config
  const handleIOConfig = (unit) => {
    setSelectedUnitForIOConfig(unit);
    setIOConfigDialogOpen(true);
  };



  // Handle Edit Unit
  const handleEditUnit = useCallback((unit) => {
    setSelectedUnitForEdit(unit);
    setEditDialogOpen(true);
  }, []);

  // Handle Transfer Single Unit to Database
  const handleTransferSingleToDatabase = useCallback(async (unit) => {
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
      const unitToTransfer = await readNetworkUnitConfigurations(unit);

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
  }, [onTransferToDatabase, existingUnits]);

  // Create columns for network units (read-only)
  const networkColumns = createNetworkUnitColumns();

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Network Units Table */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Units ({networkUnits.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Actions Dropdown Menu */}
              {networkUnits.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="hidden lg:inline">Actions</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* Transfer Actions */}
                    <DropdownMenuItem onClick={handleTransferAllToDatabase}>
                      <Layers className="h-4 w-4 mr-2" />
                      Transfer All to Database
                    </DropdownMenuItem>

                    {selectedNetworkUnits.length > 0 && (
                      <DropdownMenuItem
                        onClick={handleTransferSelectedToDatabase}
                      >
                        <Layers2 className="h-4 w-4 mr-2" />
                        Transfer Selected ({selectedNetworkUnits.length})
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Send All Configurations */}
                    <DropdownMenuItem onClick={handleSendAllConfig}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Configurations
                    </DropdownMenuItem>

                    {/* Clock Sync */}
                    <DropdownMenuItem onClick={handleBulkClockSync}>
                      <Clock className="h-4 w-4 mr-2" />
                      Clock Sync
                    </DropdownMenuItem>

                    {/* Firmware Update */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleFirmwareUpdate}>
                      <Upload className="h-4 w-4 mr-2" />
                      Update Firmware
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Test RGB Control Button - Always visible for testing */}
              {/* <Button
                onClick={() => {
                  // Create a mock unit for testing RGB Control
                  const mockUnit = {
                    id_can: 999,
                    ip_address: "192.168.1.100",
                    name: "Test Unit"
                  };
                  handleRgbControl(mockUnit);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                Test RGB Control
              </Button> */}

              {/* Scan Network Button - Always visible */}
              <Button
                onClick={handleScanNetwork}
                disabled={scanLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {scanLoading ? "Scanning..." : "Scan Network"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          {networkUnits.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 flex flex-col justify-center items-center h-full -mt-8">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No network units found.</p>
              <p className="text-sm mb-4">
                Click "Scan Network" to discover units on your network.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <DataTable
                key="network-unit"
                columns={networkColumns}
                data={networkUnits}
                onTableReady={setNetworkTable}
                onRowSelectionChange={handleNetworkRowSelectionChange}
                onGroupControl={handleGroupControl}
                onAirconControl={handleAirconControl}
                onRgbControl={handleRgbControl}
                onSceneControl={{
                  onTriggerScene: handleTriggerScene,
                }}
                onScheduleControl={{
                  onTriggerSchedule: handleTriggerSchedule,
                }}
                onClockControl={handleClockControl}
                onCurtainControl={{
                  onTriggerCurtain: handleTriggerCurtain,
                }}
                onKnxControl={{
                  onTriggerKnx: handleTriggerKnx,
                }}
                onMultiSceneControl={{
                  onTriggerMultiScene: handleTriggerMultiScene,
                }}
                onSequenceControl={{
                  onTriggerSequence: handleTriggerSequence,
                }}
                onFirmwareUpdate={handleFirmwareUpdateForUnit}
                onIOConfig={handleIOConfig}
                onEdit={handleEditUnit}
                onTransferToDatabase={handleTransferSingleToDatabase}
                enableRowSelection={true}
                getRowClassName={getRowClassName}
              />
              {networkTable && <DataTablePagination table={networkTable} />}
            </div>
          )}
        </CardContent>

        <GroupControlDialog
          open={groupControlDialogOpen}
          onOpenChange={setGroupControlDialogOpen}
          unit={selectedUnit}
          onGroupControl={handleGroupControlSubmit}
        />

        <RoomControlDialog
          room={{
            roomName: selectedUnit?.type || "Network Unit",
            acGroup: 1,
            unit: selectedUnit,
          }}
          open={airconControlDialogOpen}
          onOpenChange={setAirconControlDialogOpen}
        />

        <RGBControlDialog
          open={rgbControlDialogOpen}
          onOpenChange={setRgbControlDialogOpen}
          unit={selectedUnit}
        />

        <TriggerSceneDialog
          open={triggerSceneDialogOpen}
          onOpenChange={setTriggerSceneDialogOpen}
          unit={selectedUnit}
        />

        <TriggerScheduleDialog
          open={triggerScheduleDialogOpen}
          onOpenChange={setTriggerScheduleDialogOpen}
          unit={selectedUnit}
        />

        <ClockControlDialog
          open={clockControlDialogOpen}
          onOpenChange={setClockControlDialogOpen}
          unit={selectedUnit}
        />

        <BulkClockSyncDialog
          open={bulkClockSyncDialogOpen}
          onOpenChange={setBulkClockSyncDialogOpen}
        />

        <TriggerCurtainDialog
          open={triggerCurtainDialogOpen}
          onOpenChange={setTriggerCurtainDialogOpen}
          unit={selectedUnit}
        />

        <TriggerKnxDialog
          open={triggerKnxDialogOpen}
          onOpenChange={setTriggerKnxDialogOpen}
          unit={selectedUnit}
        />

        <TriggerMultiSceneDialog
          open={triggerMultiSceneDialogOpen}
          onOpenChange={setTriggerMultiSceneDialogOpen}
          unit={selectedUnit}
        />

        <TriggerSequenceDialog
          open={triggerSequenceDialogOpen}
          onOpenChange={setTriggerSequenceDialogOpen}
          unit={selectedUnit}
        />

        <FirmwareUpdateDialog
          open={firmwareUpdateDialogOpen}
          onOpenChange={setFirmwareUpdateDialogOpen}
          onFirmwareUpdate={handleFirmwareUpdateComplete}
          targetUnit={selectedUnit}
        />

        <SendAllConfigDialog
          open={sendAllConfigDialogOpen}
          onOpenChange={setSendAllConfigDialogOpen}
        />

        <NetworkIOConfigDialog
          open={ioConfigDialogOpen}
          onOpenChange={setIOConfigDialogOpen}
          item={selectedUnitForIOConfig}
        />



        <NetworkUnitEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          unit={selectedUnitForEdit}
          onUnitUpdated={(updatedUnit) => {
            // Update the unit in the network units list
            setNetworkUnits((prev) =>
              prev.map((unit) =>
                unit.id === updatedUnit.id ? { ...unit, ...updatedUnit } : unit
              )
            );
          }}
        />
      </Card>
    </div>
  );



  // Function to read all configurations from network unit and prepare for database transfer
  async function readNetworkUnitConfigurations(networkUnit) {
    try {
      // Clear cache for this transfer session
      createdItemsCache.current.aircon.clear();
      createdItemsCache.current.lighting.clear();

      console.log(
        `Reading configurations from network unit: ${networkUnit.ip_address}`
      );

      // Start with basic unit data
      const newUnit = {
        ...networkUnit,
        id: undefined, // Let the system generate new ID
        rs485_config: null,
        input_configs: null,
        output_configs: null,
        // Add fields to store advanced configurations
        scenes: [],
        schedules: [],
        curtains: [],
        knxConfigs: [],
        multiScenes: [],
        sequences: [],
      };

      // Read RS485 configurations sequentially to avoid UDP conflicts
      try {
        console.log("Reading RS485 configurations...");

        // Read CH1 configuration first
        console.log("Reading RS485 CH1 configuration...");
        const ch1Config = await window.electronAPI.rcuController.getRS485CH1Config({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        // Add delay between RS485 channel reads
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Read CH2 configuration second
        console.log("Reading RS485 CH2 configuration...");
        const ch2Config = await window.electronAPI.rcuController.getRS485CH2Config({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        // Convert to database format
        newUnit.rs485_config = [
          convertNetworkToDialogFormat(ch1Config),
          convertNetworkToDialogFormat(ch2Config),
        ];

        // Add delay after RS485 config read
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("RS485 configurations read successfully");
      } catch (error) {
        console.error("Failed to read RS485 configurations:", error);
        // Continue without RS485 config
      }

      // Read I/O configurations
      try {
        console.log("Reading I/O configurations...");
        const ioConfigs = await readIOConfigurations(networkUnit);
        newUnit.input_configs = ioConfigs.input_configs;
        newUnit.output_configs = ioConfigs.output_configs;

        // Debug logging for output configs
        console.log("Output configs read from network unit:", {
          unitIp: networkUnit.ip_address,
          outputConfigs: ioConfigs.output_configs,
          outputCount: ioConfigs.output_configs?.outputs?.length || 0
        });

        // Auto-create missing lighting, aircon, curtain items from outputs and input multi-groups
        await autoCreateMissingItems(ioConfigs);
        console.log("I/O configurations read successfully");
      } catch (error) {
        console.error("Failed to read I/O configurations:", error);
        // Continue without I/O configs
      }

      // Store network unit data for advanced configuration reading
      // We'll read advanced configs after the unit is created in database
      newUnit.readAdvancedConfigs = true;

      return newUnit;
    } catch (error) {
      console.error(
        `Failed to read configurations from network unit ${networkUnit.ip_address}:`,
        error
      );
      // Return basic unit data without configurations
      return {
        ...networkUnit,
        id: undefined,
        rs485_config: null,
        input_configs: null,
        output_configs: null,
        scenes: [],
        schedules: [],
        curtains: [],
        knxConfigs: [],
        multiScenes: [],
        sequences: [],
      };
    }
  }

  // Helper function to convert network RS485 format to database format
  function convertNetworkToDialogFormat(networkConfig) {
    if (!networkConfig) return null;

    return {
      baudrate: networkConfig.baudrate || 9600,
      parity: networkConfig.parity || 0,
      stop_bit: networkConfig.stopBit || 0,
      board_id: networkConfig.boardId || 0,
      config_type: networkConfig.rs485Type || 0,
      num_slave_devs: networkConfig.numSlaves || 0,
      reserved: networkConfig.reserved || [0, 0, 0, 0, 0],
      slave_cfg: (networkConfig.slaves || []).map((slave) => ({
        slave_id: slave.slaveId || 0,
        slave_group: slave.slaveGroup || 0,
        num_indoors: slave.numIndoors || 0,
        indoor_group: slave.indoorGroups || Array(16).fill(0),
      })),
    };
  }

  // Helper function to get output type for a given index based on unit spec
  function getOutputTypeForIndex(index, outputSpec) {
    let currentIndex = 0;

    // Follow the order: relay → dimmer → ao → ac (as defined in constants.js)

    // Check relay outputs first
    if (index < currentIndex + outputSpec.relay) {
      return "relay";
    }
    currentIndex += outputSpec.relay;

    // Check dimmer outputs
    if (index < currentIndex + outputSpec.dimmer) {
      return "dimmer";
    }
    currentIndex += outputSpec.dimmer;

    // Check analog outputs
    if (index < currentIndex + outputSpec.ao) {
      return "ao";
    }
    currentIndex += outputSpec.ao;

    // Check AC outputs
    if (index < currentIndex + outputSpec.ac) {
      return "ac";
    }

    // Default to relay if index is out of range
    return "relay";
  }

  // Helper function to get output type name for display
  function getOutputTypeName(type) {
    switch (type) {
      case "relay":
        return "Relay";
      case "dimmer":
        return "Dimmer";
      case "ao":
        return "Analog";
      case "ac":
        return "Aircon";
      default:
        return "Output";
    }
  }

  // Helper function to get the index within the output type
  function getOutputTypeIndex(globalIndex, outputType, outputSpec) {
    let currentIndex = 0;
    let typeIndex = 1;

    // Calculate the index within the specific output type
    if (outputType === "relay") {
      typeIndex = globalIndex + 1;
    } else if (outputType === "dimmer") {
      currentIndex += outputSpec.relay;
      typeIndex = globalIndex - currentIndex + 1;
    } else if (outputType === "ao") {
      currentIndex += outputSpec.relay + outputSpec.dimmer;
      typeIndex = globalIndex - currentIndex + 1;
    } else if (outputType === "ac") {
      currentIndex += outputSpec.relay + outputSpec.dimmer + outputSpec.ao;
      typeIndex = globalIndex - currentIndex + 1;
    }

    return typeIndex;
  }

  // Helper function to find existing device by address or create new one
  async function findOrCreateDeviceByAddress(address, outputType) {
    if (!selectedProject?.id || !address) {
      return null;
    }

    try {
      const addressStr = address.toString();

      if (outputType === "ac") {
        // Check cache first
        if (createdItemsCache.current.aircon.has(addressStr)) {
          return createdItemsCache.current.aircon.get(addressStr).id;
        }

        // Check existing aircon items in project state
        const existingAircon = projectItems.aircon?.find(item => item.address === addressStr);
        if (existingAircon) {
          return existingAircon.id;
        }

        // Check database for existing aircon items with this address
        try {
          const allAirconItems = await window.electronAPI.aircon.getAll(selectedProject.id);
          const existingInDB = allAirconItems.find(item => item.address === addressStr);
          if (existingInDB) {
            console.log(`Found existing aircon in database with address ${addressStr}:`, existingInDB);
            return existingInDB.id;
          }
        } catch (dbError) {
          console.warn("Failed to check database for existing aircon items:", dbError);
        }

        // Create new aircon item
        const newAirconItem = {
          name: `Aircon ${addressStr}`,
          address: addressStr,
          description: `Auto-created from network unit`,
          label: "Aircon",
        };

        const createdItem = await createItem("aircon", newAirconItem);

        // Cache the created item
        createdItemsCache.current.aircon.set(addressStr, createdItem);

        console.log(`Created new aircon item with address ${addressStr}:`, createdItem);
        return createdItem.id;
      } else {
        // Check cache first
        if (createdItemsCache.current.lighting.has(addressStr)) {
          return createdItemsCache.current.lighting.get(addressStr).id;
        }

        // Check existing lighting items in project state
        const existingLighting = projectItems.lighting?.find(item => item.address === addressStr);
        if (existingLighting) {
          return existingLighting.id;
        }

        // Check database for existing lighting items with this address
        try {
          const allLightingItems = await window.electronAPI.lighting.getAll(selectedProject.id);
          const existingInDB = allLightingItems.find(item => item.address === addressStr);
          if (existingInDB) {
            console.log(`Found existing lighting in database with address ${addressStr}:`, existingInDB);
            return existingInDB.id;
          }
        } catch (dbError) {
          console.warn("Failed to check database for existing lighting items:", dbError);
        }

        // Create new lighting item
        const newLightingItem = {
          name: `Lighting ${addressStr}`,
          address: addressStr,
          description: `Auto-created from network unit`,
          object_type: "OBJ_LIGHTING",
          object_value: 1,
        };

        const createdItem = await createItem("lighting", newLightingItem);

        // Cache the created item
        createdItemsCache.current.lighting.set(addressStr, createdItem);

        console.log(`Created new lighting item with address ${addressStr}:`, createdItem);
        return createdItem.id;
      }
    } catch (error) {
      console.error(`Failed to find or create device for address ${address}:`, error);
      return null;
    }
  }

  // Helper function to read I/O configurations from network unit
  async function readIOConfigurations(networkUnit) {
    const ioSpec = getUnitIOSpec(networkUnit.type);
    if (!ioSpec) {
      return { input_configs: null, output_configs: null };
    }

    const inputConfigs = { inputs: [] };
    const outputConfigs = { outputs: [] };

    // Read input configurations
    try {
      const inputResponse =
        await window.electronAPI.rcuController.getAllInputConfigs({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

      if (inputResponse?.configs) {
        for (let i = 0; i < ioSpec.inputs; i++) {
          const unitConfig = inputResponse.configs.find(
            (config) => config.inputNumber === i
          );
          if (unitConfig) {
            inputConfigs.inputs.push({
              index: i,
              function_value: unitConfig.inputType || 0,
              lighting_id: null, // Will be resolved when needed
              multi_group_config: unitConfig.groups || [],
              rlc_config: {
                ramp: unitConfig.ramp || 0,
                preset: unitConfig.preset || 255,
                ledStatus: unitConfig.ledStatus?.raw || 0,
                autoMode: unitConfig.autoMode || 0,
                delayOff: unitConfig.delayOff || 0,
                delayOn: unitConfig.delayOn || 0,
              },
            });
          } else {
            // Create default config for missing inputs
            inputConfigs.inputs.push({
              index: i,
              function_value: 0,
              lighting_id: null,
              multi_group_config: [],
              rlc_config: {
                ramp: 0,
                preset: 255,
                ledStatus: 0,
                autoMode: 0,
                delayOff: 0,
                delayOn: 0,
              },
            });
          }
        }
      }

      // Add delay after input config read
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to read input configurations:", error);
    }

    // Read output configurations and assignments sequentially to avoid UDP conflicts
    try {
      // Read output assignments first
      console.log("Reading output assignments...");
      const assignResponse = await window.electronAPI.rcuController.getOutputAssign({
        unitIp: networkUnit.ip_address,
        canId: networkUnit.id_can,
      });

      // Add delay between output reads
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Read output configurations second
      console.log("Reading output configurations...");
      const configResponse = await window.electronAPI.rcuController.getOutputConfig(
        networkUnit.ip_address,
        networkUnit.id_can
      );

      // Add delay between output reads
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Read AC configurations third for aircon address mapping
      console.log("Reading AC configurations...");
      const acConfigResponse = await window.electronAPI.rcuController.getLocalACConfig(
        networkUnit.ip_address,
        networkUnit.id_can
      );

      // Create output configs for all outputs, whether we have network data or not
      for (let i = 0; i < ioSpec.totalOutputs; i++) {
        const assignment = assignResponse?.outputAssignments?.find(
          (a) => a.outputIndex === i
        );
        const config = configResponse?.outputConfigs?.find(
          (c) => c.outputIndex === i
        );

        // Determine output type from assignment or default based on unit spec
        const outputType = assignment?.outputType || getOutputTypeForIndex(i, ioSpec.outputs);

        // Handle device_id mapping and assignment data first
        let finalDeviceId = null;
        let assignmentAddress = null;
        let acConfig = null;

        if (outputType === "ac") {
          // For aircon outputs, get address from AC config
          if (acConfigResponse && Array.isArray(acConfigResponse)) {
            // Calculate AC config index: find position of this output in AC outputs list
            const acOutputs = [];
            for (let j = 0; j < ioSpec.totalOutputs; j++) {
              const acOutputType = getOutputTypeForIndex(j, ioSpec.outputs);
              if (acOutputType === "ac") {
                acOutputs.push(j);
              }
            }

            const acConfigIndex = acOutputs.indexOf(i);
            if (acConfigIndex >= 0 && acConfigIndex < acConfigResponse.length) {
              acConfig = acConfigResponse[acConfigIndex];
              assignmentAddress = acConfig.address;

              if (assignmentAddress && assignmentAddress > 0) {
                finalDeviceId = await findOrCreateDeviceByAddress(assignmentAddress, outputType);
              }
            }
          }
        } else {
          // For lighting outputs, get address from assignment
          if (assignment) {
            assignmentAddress = assignment.lightingAddress || assignment.address;

            // If assignment has an address, try to map it to existing device or create new one
            if (assignmentAddress && assignmentAddress > 0) {
              finalDeviceId = await findOrCreateDeviceByAddress(assignmentAddress, outputType);
            }
          }
        }

        // Build config data that matches database structure
        const outputTypeName = getOutputTypeName(outputType);
        const typeIndex = getOutputTypeIndex(i, outputType, ioSpec.outputs);
        const outputName = `${outputTypeName} ${typeIndex}`;

        let configData;

        if (outputType === "ac") {
          // Aircon config structure - populate from AC config if available
          // Note: address and deviceId are handled separately at output level, not in config
          configData = {
            name: outputName,
            enable: acConfig?.enable || false,
            windowMode: acConfig?.windowMode || 0,
            fanType: acConfig?.fanType || 0,
            tempType: acConfig?.tempType || 0,
            tempUnit: acConfig?.tempUnit || 0,
            valveContact: acConfig?.valveContact || 0,
            valveType: acConfig?.valveType || 0,
            deadband: acConfig?.deadband || 20,
            lowFCU_Group: acConfig?.lowFCU_Group || 0,
            medFCU_Group: acConfig?.medFCU_Group || 0,
            highFCU_Group: acConfig?.highFCU_Group || 0,
            fanAnalogGroup: acConfig?.fanAnalogGroup || 0,
            analogCoolGroup: acConfig?.analogCoolGroup || 0,
            analogHeatGroup: acConfig?.analogHeatGroup || 0,
            valveCoolOpenGroup: acConfig?.valveCoolOpenGroup || 0,
            valveCoolCloseGroup: acConfig?.valveCoolCloseGroup || 0,
            valveHeatOpenGroup: acConfig?.valveHeatOpenGroup || 0,
            valveHeatCloseGroup: acConfig?.valveHeatCloseGroup || 0,
            windowBypass: acConfig?.windowBypass || 0,
            setPointOffset: acConfig?.setPointOffset || 0,
            unoccupyPower: acConfig?.unoccupyPower || 0,
            occupyPower: acConfig?.occupyPower || 0,
            standbyPower: acConfig?.standbyPower || 0,
            unoccupyMode: acConfig?.unoccupyMode || 0,
            occupyMode: acConfig?.occupyMode || 0,
            standbyMode: acConfig?.standbyMode || 0,
            unoccupyFanSpeed: acConfig?.unoccupyFanSpeed || 0,
            occupyFanSpeed: acConfig?.occupyFanSpeed || 0,
            standbyFanSpeed: acConfig?.standbyFanSpeed || 0,
            unoccupyCoolSetPoint: acConfig?.unoccupyCoolSetPoint || 0,
            occupyCoolSetPoint: acConfig?.occupyCoolSetPoint || 0,
            standbyCoolSetPoint: acConfig?.standbyCoolSetPoint || 0,
            unoccupyHeatSetPoint: acConfig?.unoccupyHeatSetPoint || 0,
            occupyHeatSetPoint: acConfig?.occupyHeatSetPoint || 0,
            standbyHeatSetPoint: acConfig?.standbyHeatSetPoint || 0,
          };
        } else {
          // Lighting/relay/dimmer config structure
          configData = {
            name: outputName,
            // Default values for lighting outputs
            autoTrigger: false,
            delayOffHours: 0,
            delayOffMinutes: 0,
            delayOffSeconds: 0,
            delayOnHours: 0,
            delayOnMinutes: 0,
            delayOnSeconds: 0,
            scheduleOnHour: 0,
            scheduleOnMinute: 0,
            scheduleOffHour: 0,
            scheduleOffMinute: 0,
          };

          // Add dimming settings for dimmer and relay outputs
          if (outputType === "dimmer" || outputType === "relay") {
            configData.minDim = 1;
            configData.maxDim = 100;
          }

          // Handle delay settings from assignment for lighting outputs
          if (assignment) {
            if (assignment.delay || assignment.delayOff) {
              configData.delayOffSeconds = assignment.delay || assignment.delayOff || 0;
            }
            if (assignment.delayOn) {
              configData.delayOnSeconds = assignment.delayOn || 0;
            }
          }
        }

        // Add detailed config data from getOutputConfig
        if (config) {
          // Convert 0-255 range to 0-100% for min/max dim
          if (config.minDimmingLevel !== undefined) {
            configData.minDim = Math.round((config.minDimmingLevel / 255) * 100);
          }
          if (config.maxDimmingLevel !== undefined) {
            configData.maxDim = Math.round((config.maxDimmingLevel / 255) * 100);
          }
          if (config.autoTriggerFlag !== undefined) configData.autoTrigger = config.autoTriggerFlag === 1;
          if (config.scheduleOnHour !== undefined) configData.scheduleOnHour = config.scheduleOnHour;
          if (config.scheduleOnMinute !== undefined) configData.scheduleOnMinute = config.scheduleOnMinute;
          if (config.scheduleOffHour !== undefined) configData.scheduleOffHour = config.scheduleOffHour;
          if (config.scheduleOffMinute !== undefined) configData.scheduleOffMinute = config.scheduleOffMinute;
        }

        const outputConfig = {
          index: i,
          type: outputType,
          device_id: finalDeviceId,
          device_type: outputType === "ac" ? "aircon" : "lighting",
          name: outputName,
          config: configData,
        };

        console.log(`Creating output config for index ${i}:`, {
          index: i,
          type: outputType,
          name: outputConfig.name,
          finalDeviceId: finalDeviceId,
          assignmentAddress: assignmentAddress,
          hasAssignment: !!assignment,
          hasConfig: !!config,
          // AC-specific info
          ...(outputType === "ac" && {
            acConfigIndex: acConfigResponse && Array.isArray(acConfigResponse) ?
              (() => {
                const acOutputs = [];
                for (let j = 0; j < ioSpec.totalOutputs; j++) {
                  if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
                    acOutputs.push(j);
                  }
                }
                return acOutputs.indexOf(i);
              })() : -1,
            acConfigAddress: acConfigResponse && Array.isArray(acConfigResponse) ?
              (() => {
                const acOutputs = [];
                for (let j = 0; j < ioSpec.totalOutputs; j++) {
                  if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
                    acOutputs.push(j);
                  }
                }
                const acConfigIndex = acOutputs.indexOf(i);
                return acConfigIndex >= 0 && acConfigIndex < acConfigResponse.length ?
                  acConfigResponse[acConfigIndex].address : null;
              })() : null
          }),
          // Lighting-specific info
          ...(outputType !== "ac" && {
            assignmentLightingAddress: assignment?.lightingAddress,
            assignmentGenericAddress: assignment?.address,
          })
        });
        outputConfigs.outputs.push(outputConfig);
      }
    } catch (error) {
      console.error("Failed to read output configurations:", error);
    }

    const result = {
      input_configs: inputConfigs.inputs.length > 0 ? inputConfigs : null,
      output_configs: outputConfigs.outputs.length > 0 ? outputConfigs : null,
    };

    console.log("Final I/O configs result:", {
      unitIp: networkUnit.ip_address,
      inputConfigsCount: inputConfigs.inputs.length,
      outputConfigsCount: outputConfigs.outputs.length,
      hasInputConfigs: !!result.input_configs,
      hasOutputConfigs: !!result.output_configs,
      outputConfigs: result.output_configs
    });

    return result;
  }

  // Helper function to auto-create missing lighting, aircon, curtain items
  async function autoCreateMissingItems(ioConfigs) {
    if (!selectedProject?.id) {
      return;
    }

    const existingLighting = projectItems.lighting || [];
    const existingAircon = projectItems.aircon || [];
    const existingCurtain = projectItems.curtain || [];
    const lightingAddressesToCreate = new Set();

    // First, collect lighting addresses from input multi-group configurations
    if (ioConfigs.input_configs) {
      for (const input of ioConfigs.input_configs.inputs) {
        if (
          input.multi_group_config &&
          Array.isArray(input.multi_group_config)
        ) {
          for (const group of input.multi_group_config) {
            if (group.groupId && group.groupId > 0) {
              const address = group.groupId.toString();

              // Check if lighting item with this address already exists
              const exists = existingLighting.some(
                (item) => item.address === address
              );
              if (!exists) {
                lightingAddressesToCreate.add(address);
              }
            }
          }
        }
      }
    }

    // Process output configurations to find missing items
    if (ioConfigs.output_configs) {
      for (const output of ioConfigs.output_configs.outputs) {
        if (!output.address) continue;

        const address = output.address.toString();

        try {
          if (output.type === "lighting") {
            // Check if lighting item exists
            const exists = existingLighting.some(
              (item) => item.address === address
            );
            if (!exists) {
              lightingAddressesToCreate.add(address);
            }
          } else if (output.type === "ac") {
            // Check if aircon item exists
            const exists = existingAircon.some(
              (item) => item.address === address
            );
            if (!exists) {
              console.log(`Auto-creating aircon item for address ${address}`);
              const newAirconItem = {
                name: `Aircon ${address}`,
                address: address,
                description: `Auto-created from network unit output ${output.index + 1
                  }`,
                label: "Aircon",
              };

              await window.electronAPI.aircon.create(
                selectedProject.id,
                newAirconItem
              );
              toast.success(`Auto-created aircon ${address}`);
            }
          } else if (output.type === "curtain") {
            // Check if curtain item exists
            const exists = existingCurtain.some(
              (item) => item.address === address
            );
            if (!exists) {
              console.log(`Auto-creating curtain item for address ${address}`);
              const newCurtainItem = {
                name: `Curtain ${address}`,
                address: address,
                description: `Auto-created from network unit output ${output.index + 1
                  }`,
                object_type: "OBJ_CURTAIN",
                object_value: 2,
                curtain_type: "CURTAIN_PULSE_2P",
                curtain_value: 3,
                open_group_id: null,
                close_group_id: null,
                stop_group_id: null,
                pause_period: 0,
                transition_period: 0,
              };

              await window.electronAPI.curtain.create(
                selectedProject.id,
                newCurtainItem
              );
              toast.success(`Auto-created curtain ${address}`);
            }
          }
        } catch (error) {
          console.error(
            `Failed to auto-create ${output.type} item for address ${address}:`,
            error
          );
          // Continue with other items even if one fails
        }
      }
    }

    // Create all collected lighting items
    for (const address of lightingAddressesToCreate) {
      try {
        console.log(`Auto-creating lighting item for address ${address}`);
        const newLightingItem = {
          name: `Group ${address}`,
          address: address,
          description: `Auto-created from network unit configuration`,
          object_type: "OBJ_LIGHTING",
          object_value: 1,
        };

        await window.electronAPI.lighting.create(
          selectedProject.id,
          newLightingItem
        );
        toast.success(`Auto-created lighting group ${address}`);

        // Add small delay between creations to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to auto-create lighting item for address ${address}:`,
          error
        );
        // Continue with other items even if one fails
      }
    }

    if (lightingAddressesToCreate.size > 0) {
      console.log(
        `Auto-created ${lightingAddressesToCreate.size} lighting items from network unit configurations`
      );
    }
  }
}

// Memoized export for optimal performance
export const NetworkUnitTable = memo(
  NetworkUnitTableComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.existingUnits.length === nextProps.existingUnits.length &&
      prevProps.onTransferToDatabase === nextProps.onTransferToDatabase
    );
  }
);
