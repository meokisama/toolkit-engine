"use client";

import { useState, useCallback } from "react";
import { Network, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createNetworkUnitColumns } from "@/components/projects/unit/unit-columns";
import { udpScanner } from "@/services/udp";
import { toast } from "sonner";

export function NetworkUnitTable({ onTransferToDatabase, existingUnits = [] }) {
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedNetworkUnits, setSelectedNetworkUnits] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkTable, setNetworkTable] = useState(null);

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network for units...");
      const discoveredUnits = await udpScanner.scanNetwork();

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

  const handleTransferToDatabase = async () => {
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
          `Transferred ${unitsToTransfer.length} unit(s) to database`
        );
      }
    } catch (error) {
      console.error("Failed to transfer network units to database:", error);
      toast.error("Failed to transfer units to database: " + error.message);
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Units ({networkUnits.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedNetworkUnits.length > 0 && (
              <Button
                onClick={handleTransferToDatabase}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Transfer to Database ({selectedNetworkUnits.length})
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
            {!scanLoading && (
              <Button
                onClick={handleScanNetwork}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Scan Network
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-4">
              {networkTable && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedNetworkUnits.length > 0
                      ? `${selectedNetworkUnits.length} of ${networkUnits.length} units selected`
                      : `${networkUnits.length} units discovered`}
                  </div>
                  {selectedNetworkUnits.length > 0 && (
                    <Button
                      onClick={handleTransferToDatabase}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Transfer Selected to Database
                    </Button>
                  )}
                </div>
              )}
              <DataTable
                key="network-unit"
                columns={networkColumns}
                data={networkUnits}
                onTableReady={setNetworkTable}
                onRowSelectionChange={handleNetworkRowSelectionChange}
                enableRowSelection={true}
              />
            </div>
            {networkTable && <DataTablePagination table={networkTable} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
