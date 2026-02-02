import { useEffect, memo } from "react";
import { Network, Search, Layers2, Layers, Upload, Clock, MoreHorizontal, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/projects/data-table/data-table";
import { DataTablePagination } from "@/components/projects/data-table/data-table-pagination";
import { createNetworkUnitColumns } from "./network-unit-columns";
import { udpScanner } from "@/services/udp";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { sortByIpAddress } from "@/utils/ip-utils";
import { useNetworkUnitState } from "./hooks/use-network-unit-state";
import { useNetworkUnitHandlers } from "./hooks/use-network-unit-handlers";
import { LazyDialogRenderer } from "./lazy-dialog-renderer";

function NetworkUnitTableComponent({ onTransferToDatabase, existingUnits = [], onNetworkUnitsChange, getRowClassName }) {
  const { selectedProject, projectItems, createItem } = useProjectDetail();

  // Use custom hooks for state management
  const state = useNetworkUnitState();

  // Use custom hooks for event handlers
  const handlers = useNetworkUnitHandlers({
    state,
    onTransferToDatabase,
    existingUnits,
    selectedProject,
    projectItems,
    createItem,
  });

  // Auto-load cached network units when component mounts
  useEffect(() => {
    const cachedUnits = udpScanner.getLastScanResults();
    if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
      // Sort by IP address before setting
      const sortedUnits = sortByIpAddress(cachedUnits);
      state.setNetworkUnits(sortedUnits);
    }
  }, []);

  // Notify parent component when network units change
  useEffect(() => {
    if (onNetworkUnitsChange) {
      onNetworkUnitsChange(state.networkUnits);
    }
  }, [state.networkUnits, onNetworkUnitsChange]);

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
              Network Units ({state.networkUnits.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Actions Dropdown Menu */}
              {state.networkUnits.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="hidden lg:inline">Actions</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* Transfer Actions */}
                    <DropdownMenuItem onClick={handlers.handleTransferAllToDatabase}>
                      <Layers className="h-4 w-4 mr-2" />
                      Transfer All to Database
                    </DropdownMenuItem>

                    {state.selectedNetworkUnits.length > 0 && (
                      <DropdownMenuItem onClick={handlers.handleTransferSelectedToDatabase}>
                        <Layers2 className="h-4 w-4 mr-2" />
                        Transfer Selected ({state.selectedNetworkUnits.length})
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Send All Configurations */}
                    <DropdownMenuItem onClick={handlers.handleSendAllConfig}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Configurations
                    </DropdownMenuItem>

                    {/* Clock Sync */}
                    <DropdownMenuItem onClick={handlers.handleBulkClockSync}>
                      <Clock className="h-4 w-4 mr-2" />
                      Clock Sync
                    </DropdownMenuItem>

                    {/* Firmware Update */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlers.handleFirmwareUpdate}>
                      <Upload className="h-4 w-4 mr-2" />
                      Update Firmware
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Scan Network Button - Always visible */}
              <Button onClick={handlers.handleScanNetwork} disabled={state.scanLoading} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {state.scanLoading ? "Scanning..." : "Scan Network"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          {state.networkUnits.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 flex flex-col justify-center items-center h-full -mt-8">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No network units found.</p>
              <p className="text-sm mb-4">Click "Scan Network" to discover units on your network.</p>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <DataTable
                key="network-unit"
                columns={networkColumns}
                data={state.networkUnits}
                initialSorting={[{ id: "ip_address", desc: false }]}
                onTableReady={state.setNetworkTable}
                onRowSelectionChange={handlers.handleNetworkRowSelectionChange}
                onGroupControl={handlers.handleGroupControl}
                onAirconControl={handlers.handleAirconControl}
                onRgbControl={handlers.handleRgbControl}
                onSceneControl={{
                  onTriggerScene: handlers.handleTriggerScene,
                }}
                onScheduleControl={{
                  onTriggerSchedule: handlers.handleTriggerSchedule,
                }}
                onClockControl={handlers.handleClockControl}
                onCurtainControl={{
                  onTriggerCurtain: handlers.handleTriggerCurtain,
                }}
                onKnxControl={{
                  onTriggerKnx: handlers.handleTriggerKnx,
                }}
                onDmxControl={{
                  onDmxControl: handlers.handleDmxControl,
                }}
                onLedSpiControl={{
                  onLedSpiControl: handlers.handleLedSpiControl,
                }}
                onRoomConfigControl={{
                  onRoomConfigControl: handlers.handleRoomConfigControl,
                }}
                onMultiSceneControl={{
                  onTriggerMultiScene: handlers.handleTriggerMultiScene,
                }}
                onSequenceControl={{
                  onTriggerSequence: handlers.handleTriggerSequence,
                }}
                onFirmwareUpdate={handlers.handleFirmwareUpdateForUnit}
                onIOConfig={handlers.handleIOConfig}
                onEdit={handlers.handleEditUnit}
                onTransferToDatabase={handlers.handleTransferSingleToDatabase}
                enableRowSelection={true}
                getRowClassName={getRowClassName}
              />
              {state.networkTable && <DataTablePagination table={state.networkTable} />}
            </div>
          )}
        </CardContent>

        {/* Lazy load dialogs - only renders the active dialog, reducing memory and initial render cost */}
        <LazyDialogRenderer
          activeDialog={state.dialogState.activeDialog}
          dialogData={state.dialogState.dialogData}
          dialogState={state.dialogState}
          handlers={handlers}
          onUnitUpdated={(updatedUnit) => {
            // Update the unit in the network units list
            state.setNetworkUnits((prev) => prev.map((unit) => (unit.id === updatedUnit.id ? { ...unit, ...updatedUnit } : unit)));
          }}
        />
      </Card>
    </div>
  );
}

// Improved memoization with comprehensive prop comparison
export const NetworkUnitTable = memo(NetworkUnitTableComponent, (prevProps, nextProps) => {
  // Compare all props for accurate memoization
  return (
    prevProps.existingUnits === nextProps.existingUnits && // Shallow compare (ref equality)
    prevProps.onTransferToDatabase === nextProps.onTransferToDatabase &&
    prevProps.onNetworkUnitsChange === nextProps.onNetworkUnitsChange &&
    prevProps.getRowClassName === nextProps.getRowClassName
  );
});
