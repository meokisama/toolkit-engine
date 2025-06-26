"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Trash2,
  Network,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";
import { DeleteKnxDialog } from "./delete-knx-popover";

// Initial state for better state management
const initialState = {
  knxAddress: "",
  knxConfigs: [],
  showKnxConfigs: false,
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllConfigs: false,
};

// Helper function to get KNX type label
const getKnxTypeLabel = (type) => {
  const knxType = CONSTANTS.KNX.KNX_OUTPUT_TYPES.find(t => t.value === type);
  return knxType ? knxType.label : `Type ${type}`;
};

// Helper function to get KNX feedback label
const getKnxFeedbackLabel = (feedback) => {
  const knxFeedback = CONSTANTS.KNX.KNX_FEEDBACK_TYPES.find(f => f.value === feedback);
  return knxFeedback ? knxFeedback.label : `Feedback ${feedback}`;
};

// Memoized KnxConfigCard component to prevent unnecessary re-renders
const KnxConfigCard = memo(({ knxConfig, onDelete, onTrigger, loading }) => (
  <Card className="relative">
    <CardContent>
      <div className="flex items-center justify-between">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-bold">KNX Address: {knxConfig.address}</span>
          <div className="text-sm text-muted-foreground font-light space-y-2">
            <p>
              <span className="font-bold">Type:</span> {getKnxTypeLabel(knxConfig.type)}
              <span className="mx-1"> | </span>
              <span className="font-bold">Factor:</span> {knxConfig.factor}
            </p>
            <p>
              <span className="font-bold">Feedback:</span> {getKnxFeedbackLabel(knxConfig.feedback)}
              <span className="mx-1"> | </span>
              <span className="font-bold">RCU Group:</span> {knxConfig.rcuGroup}
            </p>
            <div className="space-y-1">
              {knxConfig.knxSwitchGroup && (
                <p>
                  <span className="font-bold">Switch Group:</span> {knxConfig.knxSwitchGroup}
                </p>
              )}
              {knxConfig.knxDimmingGroup && (
                <p>
                  <span className="font-bold">Dimming Group:</span> {knxConfig.knxDimmingGroup}
                </p>
              )}
              {knxConfig.knxValueGroup && (
                <p>
                  <span className="font-bold">Value Group:</span> {knxConfig.knxValueGroup}
                </p>
              )}
            </div>
          </div>
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Trigger KNX Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTrigger(knxConfig.address)}
            disabled={loading}
            className="flex items-center gap-1 shadow text-green-600 hover:text-green-700"
            title="Trigger KNX"
          >
            <Play className="h-3 w-3" />
          </Button>
          {/* Delete KNX Config Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(knxConfig.address)}
            disabled={loading}
            className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

KnxConfigCard.displayName = "KnxConfigCard";

export function KnxControlDialog({ open, onOpenChange, unit }) {
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Reset state when dialog opens/closes or unit changes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open, unit?.ip_address, unit?.id_can]);

  const handleLoadKnxInfo = useCallback(async () => {
    if (!unit || !state.knxAddress) {
      toast.error("Please enter a KNX address to load");
      return;
    }

    const address = parseInt(state.knxAddress, 10);
    if (isNaN(address) || address < 0 || address > 511) {
      toast.error("KNX address must be between 0 and 511");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      console.log("Loading KNX configuration:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        knxAddress: address,
      });

      const result = await window.electronAPI.rcuController.getKnxConfig({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        knxAddress: address,
      });

      // Convert single KNX result to card format
      if (result) {
        const knxConfigCard = {
          address: result.address || address,
          type: result.type || 0,
          factor: result.factor || 1,
          feedback: result.feedback || 0,
          rcuGroup: result.rcuGroup || 0,
          knxSwitchGroup: result.knxSwitchGroup || "",
          knxDimmingGroup: result.knxDimmingGroup || "",
          knxValueGroup: result.knxValueGroup || "",
        };

        setState((prev) => ({
          ...prev,
          knxConfigs: [knxConfigCard],
          showKnxConfigs: true,
        }));
        toast.success(`KNX address ${address} configuration loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load KNX configuration:", error);
      toast.error(`Failed to load KNX configuration: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.knxAddress]);

  const handleLoadAllKnxConfigs = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllConfigs: true }));
    try {
      console.log("Loading all KNX configurations:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result = await window.electronAPI.rcuController.getKnxConfig({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        knxAddress: null,
      });

      if (result && result.knxConfigs && result.knxConfigs.length > 0) {
        // Filter out invalid KNX configs (only type = 0)
        const validKnxConfigs = result.knxConfigs.filter(
          (config) => config.type !== 0
        );

        const knxConfigCards = validKnxConfigs.map((config) => ({
          address: config.address,
          type: config.type,
          factor: config.factor,
          feedback: config.feedback,
          rcuGroup: config.rcuGroup,
          knxSwitchGroup: config.knxSwitchGroup || "",
          knxDimmingGroup: config.knxDimmingGroup || "",
          knxValueGroup: config.knxValueGroup || "",
        }));

        setState((prev) => ({
          ...prev,
          knxConfigs: knxConfigCards,
          showKnxConfigs: true,
        }));

        if (knxConfigCards.length > 0) {
          toast.success(
            `Loaded ${knxConfigCards.length} valid KNX configuration(s) successfully`
          );
        } else {
          toast.info(
            "No valid KNX configurations found on this unit"
          );
        }
      } else {
        setState((prev) => ({
          ...prev,
          knxConfigs: [],
          showKnxConfigs: true,
        }));
        toast.info("No KNX configurations found on this unit");
      }
    } catch (error) {
      console.error("Failed to load all KNX configurations:", error);
      toast.error(`Failed to load all KNX configurations: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllConfigs: false }));
    }
  }, [unit]);

  const handleDeleteKnxConfigFromCard = useCallback(
    async (knxAddress) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        console.log("Deleting KNX configuration from card:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          knxAddress,
        });

        const success = await window.electronAPI.rcuController.deleteKnxConfig({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          knxAddress,
        });

        if (success) {
          toast.success(`KNX address ${knxAddress} deleted successfully`);
          // Remove the deleted KNX config from the list
          setState((prev) => ({
            ...prev,
            knxConfigs: prev.knxConfigs.filter(
              (config) => config.address !== knxAddress
            ),
          }));
        } else {
          throw new Error("Unit returned failure response");
        }
      } catch (error) {
        console.error("Failed to delete KNX configuration:", error);
        toast.error(`Failed to delete KNX configuration: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit]
  );

  const handleTriggerKnxFromCard = useCallback(
    async (knxAddress) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        console.log("Triggering KNX from card:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          knxAddress,
        });

        await window.electronAPI.rcuController.triggerKnx({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          knxAddress,
        });

        toast.success(`KNX address ${knxAddress} triggered successfully`);
      } catch (error) {
        console.error("Failed to trigger KNX:", error);
        toast.error(`Failed to trigger KNX: ${error.message}`);
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
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            KNX Control
          </DialogTitle>
          <DialogDescription>
            Load and manage KNX configurations on unit {unit?.ip_address}{" "}
            (CAN ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Load Single KNX Config Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Input
                  id="knxAddress"
                  type="text"
                  value={state.knxAddress}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      knxAddress: e.target.value,
                    }))
                  }
                  placeholder="KNX Address (0-511)"
                  className="max-w-[180px]"
                />
                <Button
                  onClick={handleLoadKnxInfo}
                  disabled={
                    loadingState.loadingInfo || loadingState.loadingAllConfigs
                  }
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load KNX Config"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteKnxDialog
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
                      Delete KNX Configs
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllKnxConfigs}
                  size="lg"
                  disabled={
                    loadingState.loadingAllConfigs || loadingState.loadingInfo
                  }
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllConfigs
                    ? "Loading..."
                    : "Load All KNX Configs"}
                </Button>
              </div>
            </div>
          </div>

          {/* KNX Configs Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {state.showKnxConfigs && state.knxConfigs.length > 0 ? (
                <div className="grid gap-3">
                  {state.knxConfigs.map((config, index) => (
                    <KnxConfigCard
                      key={`knx-${config.address}-${index}`}
                      knxConfig={config}
                      onDelete={handleDeleteKnxConfigFromCard}
                      onTrigger={handleTriggerKnxFromCard}
                      loading={loadingState.loading}
                    />
                  ))}
                </div>
              ) : state.showKnxConfigs ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No KNX configurations found.</p>
                  <p className="text-sm">
                    Try loading a specific KNX address or all configurations.
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Load KNX configuration information to see available configs.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { KnxControlDialog as TriggerKnxDialog };
