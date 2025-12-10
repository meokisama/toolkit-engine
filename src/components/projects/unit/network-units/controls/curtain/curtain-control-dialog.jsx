"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitCompare,
  List,
  Square,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";
import { DeleteCurtainDialog } from "./delete-curtain-popover";
import { useProjectDetail } from "@/contexts/project-detail-context";

// Initial state for better state management
const initialState = {
  curtainIndex: "",
  curtains: [],
  showCurtains: false,
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllCurtains: false,
};

// Memoized CurtainCard component to prevent unnecessary re-renders
const CurtainCard = memo(
  ({ curtain, onControl, onDelete, loading, formatCurtainName }) => (
    <Card className="relative">
      <CardContent>
        <div className="flex items-center justify-between">
          <CardTitle className="flex flex-col gap-2">
            <span className="text-lg font-bold">
              {formatCurtainName
                ? formatCurtainName(curtain)
                : `Curtain #${curtain.index}`}
            </span>
            <div className="text-sm text-muted-foreground font-light space-y-2">
              <p>
                <span className="font-bold">Groups:</span> Open:
                {curtain.openGroup}, Close:{curtain.closeGroup}, Stop:
                {curtain.stopGroup}
              </p>
              <p>
                <span className="font-bold">Type:</span>{" "}
                {CONSTANTS.CURTAIN.TYPES.find(
                  (t) => t.value === curtain.curtainType
                )?.label || `Unknown (${curtain.curtainType})`}
                <span className="mx-1"> | </span>
                <span className="font-bold">Address:</span> {curtain.address}
              </p>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Delete Curtain Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(curtain.index)}
              disabled={loading}
              className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            {/* Stop Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onControl(curtain.address, 0)}
              disabled={loading}
              className="flex items-center gap-1 shadow"
              title="Stop"
            >
              <Square className="h-3 w-3" />
            </Button>

            {/* Open Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onControl(curtain.address, 1)}
              disabled={loading}
              className="flex items-center gap-1 shadow"
              title="Open"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>

            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onControl(curtain.address, 2)}
              disabled={loading}
              className="flex items-center gap-1 shadow"
              title="Close"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
);

CurtainCard.displayName = "CurtainCard";

export function CurtainControlDialog({ open, onOpenChange, unit }) {
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Access project context to get database curtains
  const { selectedProject, projectItems, loadTabData, loadedTabs } =
    useProjectDetail();

  // Load curtain data when dialog opens if not already loaded
  useEffect(() => {
    if (open && selectedProject && !loadedTabs.has("curtain")) {
      loadTabData(selectedProject.id, "curtain");
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Helper function to get database curtain name by address
  const getDatabaseCurtainName = useCallback(
    (address) => {
      if (!selectedProject || !projectItems.curtain) return null;

      const databaseCurtain = projectItems.curtain.find(
        (curtain) => parseInt(curtain.address) === parseInt(address)
      );

      return databaseCurtain ? databaseCurtain.name : null;
    },
    [selectedProject, projectItems.curtain]
  );

  // Helper function to format curtain display name
  const formatCurtainName = useCallback(
    (networkCurtain) => {
      const defaultName = `Curtain ${networkCurtain.index}`;
      const networkName = networkCurtain.name || defaultName;
      const databaseName = getDatabaseCurtainName(networkCurtain.address);

      if (databaseName && networkName !== databaseName) {
        return `${networkName} - ${databaseName}`;
      }

      return networkName;
    },
    [getDatabaseCurtainName]
  );

  // Reset state when dialog opens/closes or unit changes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open, unit?.ip_address, unit?.id_can]);

  const handleLoadCurtainInfo = useCallback(async () => {
    if (!unit || !state.curtainIndex) {
      toast.error("Please enter a curtain index to load");
      return;
    }

    const index = parseInt(state.curtainIndex, 10);
    if (isNaN(index) || index < 0 || index > 31) {
      toast.error("Curtain index must be between 0 and 31");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      console.log("Loading curtain information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        curtainIndex: index,
      });

      const result =
        await window.electronAPI.curtainController.getCurtainConfig({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          curtainIndex: index,
        });

      // Convert single curtain result to card format
      if (result) {
        const curtainCard = {
          address: result.address || 0,
          index: result.index || index,
          curtainType: result.curtainType || 0,
          pausePeriod: result.pausePeriod || 0,
          transitionPeriod: result.transitionPeriod || 0,
          openGroup: result.openGroup || 0,
          closeGroup: result.closeGroup || 0,
          stopGroup: result.stopGroup || 0,
        };

        setState((prev) => ({
          ...prev,
          curtains: [curtainCard],
          showCurtains: true,
        }));
        toast.success(`Curtain index ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load curtain information:", error);
      toast.error(`Failed to load curtain information: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.curtainIndex]);

  const handleLoadAllCurtains = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllCurtains: true }));
    try {
      console.log("Loading all curtains information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result =
        await window.electronAPI.curtainController.getCurtainConfig({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          curtainIndex: null,
        });

      if (result && result.curtains && result.curtains.length > 0) {
        // Filter out curtains with type = 0 (invalid/unused curtains)
        const validCurtains = result.curtains.filter(
          (curtain) => curtain.curtainType !== 0
        );

        const curtainCards = validCurtains.map((curtain) => ({
          address: curtain.address,
          index: curtain.index,
          curtainType: curtain.curtainType,
          pausePeriod: curtain.pausePeriod,
          transitionPeriod: curtain.transitionPeriod,
          openGroup: curtain.openGroup,
          closeGroup: curtain.closeGroup,
          stopGroup: curtain.stopGroup,
        }));

        setState((prev) => ({
          ...prev,
          curtains: curtainCards,
          showCurtains: true,
        }));

        if (curtainCards.length > 0) {
          toast.success(
            `Loaded ${curtainCards.length} valid curtain(s) successfully`
          );
        } else {
          toast.info(
            "No valid curtains found on this unit (all curtains have type = 0)"
          );
        }
      } else {
        setState((prev) => ({
          ...prev,
          curtains: [],
          showCurtains: true,
        }));
        toast.info("No curtains found on this unit");
      }
    } catch (error) {
      console.error("Failed to load all curtains:", error);
      toast.error(`Failed to load all curtains: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllCurtains: false }));
    }
  }, [unit]);

  const handleCurtainControl = useCallback(
    async (curtainAddress, value) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        const valueLabel =
          CONSTANTS.CURTAIN.VALUES.find((v) => v.value === value)?.label ||
          value;
        console.log("Controlling curtain:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          curtainAddress,
          value,
          valueLabel,
        });

        const success = await window.electronAPI.curtainController.setCurtain({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          curtainAddress,
          value,
        });

        if (success) {
          toast.success(
            `Curtain ${curtainAddress} ${valueLabel.toLowerCase()} command sent successfully`
          );
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        console.error("Failed to control curtain:", error);
        toast.error(`Failed to control curtain: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit]
  );

  const handleDeleteCurtainFromCard = useCallback(
    async (curtainIndex) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        console.log("Deleting curtain from card:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          curtainIndex,
        });

        const success =
          await window.electronAPI.curtainController.deleteCurtain({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            curtainIndex,
          });

        if (success) {
          toast.success(`Curtain ${curtainIndex} deleted successfully`);
          // Remove the deleted curtain from the list
          setState((prev) => ({
            ...prev,
            curtains: prev.curtains.filter(
              (curtain) => curtain.index !== curtainIndex
            ),
          }));
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        console.error("Failed to delete curtain:", error);
        toast.error(`Failed to delete curtain: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Curtain Control</DialogTitle>
          <DialogDescription>
            Load information and control curtains on unit {unit?.ip_address}{" "}
            (CAN ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Load Single Curtain Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Input
                  id="curtainIndex"
                  type="text"
                  value={state.curtainIndex}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      curtainIndex: e.target.value,
                    }))
                  }
                  placeholder="Curtain (0-31)"
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadCurtainInfo}
                  disabled={
                    loadingState.loadingInfo || loadingState.loadingAllCurtains
                  }
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load Curtain"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteCurtainDialog
                  open={state.deletePopoverOpen}
                  onOpenChange={(open) =>
                    setState((prev) => ({ ...prev, deletePopoverOpen: open }))
                  }
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Curtains
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllCurtains}
                  size="lg"
                  disabled={
                    loadingState.loadingAllCurtains || loadingState.loadingInfo
                  }
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllCurtains
                    ? "Loading..."
                    : "Load All Curtains"}
                </Button>
              </div>
            </div>
          </div>

          {/* Curtains Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {state.showCurtains && state.curtains.length > 0 ? (
                <div className="grid gap-3">
                  {state.curtains.map((curtain, index) => (
                    <CurtainCard
                      key={`curtain-${curtain.index}-${curtain.address}-${index}`}
                      curtain={curtain}
                      onControl={handleCurtainControl}
                      onDelete={handleDeleteCurtainFromCard}
                      loading={loadingState.loading}
                      formatCurtainName={formatCurtainName}
                    />
                  ))}
                </div>
              ) : state.showCurtains ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No curtains found.</p>
                  <p className="text-sm">
                    Try loading a specific curtain index or all curtains.
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Load curtain information to see available curtains.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CurtainControlDialog as TriggerCurtainDialog };
