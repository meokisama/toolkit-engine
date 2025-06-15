"use client";

import { useState, useCallback, useEffect } from "react";
import { Network, Search, Layers2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createNetworkUnitColumns } from "@/components/projects/unit/unit-columns";
import { GroupControlDialog } from "@/components/projects/unit/network-menu/group-control-dialog";
import { RoomControlDialog } from "@/components/projects/unit/network-menu/ac-control-dialog";
import { TriggerSceneDialog } from "@/components/projects/unit/network-menu/scene-control-dialog";
import { udpScanner } from "@/services/udp";
import { toast } from "sonner";

export function NetworkUnitTable({ onTransferToDatabase, existingUnits = [] }) {
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedNetworkUnits, setSelectedNetworkUnits] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkTable, setNetworkTable] = useState(null);
  const [groupControlDialogOpen, setGroupControlDialogOpen] = useState(false);
  const [airconControlDialogOpen, setAirconControlDialogOpen] = useState(false);
  const [triggerSceneDialogOpen, setTriggerSceneDialogOpen] = useState(false);
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
              {networkUnits.length > 0 && (
                <Button
                  onClick={handleTransferAllToDatabase}
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Transfer all network units to database"
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    Transfer All to Database
                  </span>
                </Button>
              )}
              {selectedNetworkUnits.length > 0 && (
                <Button
                  onClick={handleTransferSelectedToDatabase}
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Transfer selected network units to database"
                >
                  <Layers2 className="h-4 w-4" />
                  <span className="hidden lg:inline">Transfer Selected</span> (
                  {selectedNetworkUnits.length})
                </Button>
              )}
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
      </Card>
    </div>
  );
}
