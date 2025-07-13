"use client";

import { useState, useCallback, useEffect, memo } from "react";
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
import { NetworkRS485ConfigDialog } from "@/components/projects/unit/network-menu/rs485-control/network-rs485-config-dialog";
import { udpScanner } from "@/services/udp";
import { toast } from "sonner";

function NetworkUnitTableComponent({ onTransferToDatabase, existingUnits = [] }) {
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedNetworkUnits, setSelectedNetworkUnits] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkTable, setNetworkTable] = useState(null);
  const [groupControlDialogOpen, setGroupControlDialogOpen] = useState(false);
  const [airconControlDialogOpen, setAirconControlDialogOpen] = useState(false);
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
  const [rs485ConfigDialogOpen, setRS485ConfigDialogOpen] = useState(false);
  const [selectedUnitForRS485Config, setSelectedUnitForRS485Config] = useState(null);
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

    try {
      const transferPromises = selectedNetworkUnits.map(async (networkUnit) => {
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
          return null;
        }

        // Create new unit from network unit
        const newUnit = {
          ...networkUnit,
          id: undefined, // Let the system generate new ID
        };

        return newUnit;
      });

      const unitsToTransfer = (await Promise.all(transferPromises)).filter(
        (unit) => unit !== null
      );

      if (unitsToTransfer.length > 0) {
        await onTransferToDatabase(unitsToTransfer);

        // Clear selection after successful transfer
        setSelectedNetworkUnits([]);
        if (networkTable) {
          networkTable.resetRowSelection();
        }

        toast.success(
          `Transferred ${unitsToTransfer.length} selected unit(s) to database`
        );
      }
    } catch (error) {
      console.error(
        "Failed to transfer selected network units to database:",
        error
      );
      toast.error(
        "Failed to transfer selected units to database: " + error.message
      );
    }
  };

  const handleTransferAllToDatabase = async () => {
    if (networkUnits.length === 0) {
      toast.warning("No network units to transfer");
      return;
    }

    try {
      const transferPromises = networkUnits.map(async (networkUnit) => {
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
          return null;
        }

        // Create new unit from network unit
        const newUnit = {
          ...networkUnit,
          id: undefined, // Let the system generate new ID
        };

        return newUnit;
      });

      const unitsToTransfer = (await Promise.all(transferPromises)).filter(
        (unit) => unit !== null
      );

      if (unitsToTransfer.length > 0) {
        await onTransferToDatabase(unitsToTransfer);

        // Clear selection after successful transfer
        setSelectedNetworkUnits([]);
        if (networkTable) {
          networkTable.resetRowSelection();
        }

        toast.success(
          `Transferred all ${unitsToTransfer.length} unit(s) to database`
        );
      }
    } catch (error) {
      console.error("Failed to transfer all network units to database:", error);
      toast.error("Failed to transfer all units to database: " + error.message);
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

  // Handle RS485 Config
  const handleRS485Config = useCallback((unit) => {
    setSelectedUnitForRS485Config(unit);
    setRS485ConfigDialogOpen(true);
  }, []);

  // Handle Edit Unit
  const handleEditUnit = useCallback((unit) => {
    setSelectedUnitForEdit(unit);
    setEditDialogOpen(true);
  }, []);

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
                      Send All Configurations
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
                onRS485Config={handleRS485Config}
                onEdit={handleEditUnit}
                enableRowSelection={true}
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
          units={networkUnits}
          selectedUnits={selectedNetworkUnits}
        />

        <NetworkIOConfigDialog
          open={ioConfigDialogOpen}
          onOpenChange={setIOConfigDialogOpen}
          item={selectedUnitForIOConfig}
        />

        <NetworkRS485ConfigDialog
          open={rs485ConfigDialogOpen}
          onOpenChange={setRS485ConfigDialogOpen}
          unit={selectedUnitForRS485Config}
        />

        <NetworkUnitEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          unit={selectedUnitForEdit}
          onUnitUpdated={(updatedUnit) => {
            // Update the unit in the network units list
            setNetworkUnits(prev =>
              prev.map(unit =>
                unit.id === updatedUnit.id ? { ...unit, ...updatedUnit } : unit
              )
            );
          }}
        />
      </Card>
    </div>
  );
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
