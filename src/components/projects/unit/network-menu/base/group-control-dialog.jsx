"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { Settings2, Loader2, Power, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSTANTS } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";

const GroupCard = memo(({ state, onSwitchToggle, onSliderChange, loading }) => {
  return (
    <Card key={state.group} className="p-4">
      <CardContent className="space-y-4 flex gap-4 w-full justify-between !px-0">
        <div className="flex-shrink-0 flex items-center justify-center h-full">
          <img
            src={state.value > 0 ? lightOn : lightOff}
            alt="Lighting State"
            className="w-[50px] h-auto rounded-lg"
          />
        </div>
        <div className="flex-1">
          <div className="pb-3">
            <div className="text-base flex items-center justify-between">
              <Label className="font-bold text-md">{state.name}</Label>
              <Switch
                checked={state.value > 0}
                onCheckedChange={(checked) =>
                  onSwitchToggle(state.group, checked)
                }
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2 pb-3">
            <Label className="text-xs font-normal italic text-muted-foreground">
              Value: {state.value} ({Math.round((state.value * 100) / 255)}%)
            </Label>
            <Slider
              value={[state.value]}
              onValueChange={(value) => onSliderChange(state.group, value)}
              max={255}
              min={0}
              step={1}
              className="w-full"
              disabled={loading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GroupCard.displayName = "GroupCard";

export function GroupControlDialog({ open, onOpenChange, unit }) {
  const [fromGroup, setFromGroup] = useState(1);
  const [toGroup, setToGroup] = useState(10);
  const [groupStates, setGroupStates] = useState([]);
  const [getStateLoading, setGetStateLoading] = useState(false);

  // Debounce refs for slider changes
  const debounceRefs = useRef({});
  const autoRefreshInterval = useRef(null);

  // Get all group states for the specified range
  const handleGetStates = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    if (fromGroup < 1 || fromGroup > 255 || toGroup < 1 || toGroup > 255) {
      toast.error("Group numbers must be between 1 and 255");
      return;
    }

    if (fromGroup > toGroup) {
      toast.error("From Group must be less than or equal to To Group");
      return;
    }

    setGetStateLoading(true);
    try {
      const response = await window.electronAPI.rcuController.getAllGroupStates(
        {
          canId: unit.id_can,
          unitIp: unit.ip_address,
        }
      );

      const states = [];
      if (response && response.msg) {
        const data = new Uint8Array(response.msg);

        // Check if response is valid
        if (data.length < 8) {
          throw new Error("Invalid response format");
        }

        // Group states start at position 8 (after header)
        const dataStartPos = 8;
        const dataLength = data[4] + (data[5] << 8); // Length from header
        const actualDataLength = dataLength - 4;

        for (let groupNum = fromGroup; groupNum <= toGroup; groupNum++) {
          const stateIndex = dataStartPos + groupNum;
          let value = 0;

          if (stateIndex < data.length && groupNum < actualDataLength) {
            value = data[stateIndex];
          }

          console.log(`Group ${groupNum}: index=${stateIndex}, value=${value}`);

          states.push({
            group: groupNum,
            value: value,
            name: `Group ${groupNum}`,
          });
        }

        // If no valid data found, try alternative parsing
        if (states.every((s) => s.value === 0) && data.length > 9) {
          console.log("Trying alternative parsing method...");
          for (let groupNum = fromGroup; groupNum <= toGroup; groupNum++) {
            const altIndex = 8 + (groupNum - 1);
            let value = 0;

            if (altIndex < data.length) {
              value = data[altIndex];
            }

            states[groupNum - fromGroup].value = value;
            console.log(
              `Alt Group ${groupNum}: index=${altIndex}, value=${value}`
            );
          }
        }
      }

      setGroupStates(states);
      toast.success(`Retrieved states for groups ${fromGroup}-${toGroup}`);
    } catch (error) {
      console.error("Failed to get group states:", error);
      toast.error("Failed to get group states: " + error.message);
    } finally {
      setGetStateLoading(false);
    }
  }, [unit, fromGroup, toGroup]);

  // Auto refresh function (separate from manual button click)
  const autoRefreshStates = useCallback(async () => {
    if (!unit || groupStates.length === 0) return;

    try {
      const response = await window.electronAPI.rcuController.getAllGroupStates(
        {
          canId: unit.id_can,
          unitIp: unit.ip_address,
        }
      );

      const states = [];
      if (response && response.msg) {
        const data = new Uint8Array(response.msg);

        // Check if response is valid
        if (data.length < 8) {
          return; // Silently fail for auto refresh
        }

        // Group states start at position 8 (after header)
        const dataStartPos = 8;
        const dataLength = data[4] + (data[5] << 8); // Length from header
        const actualDataLength = dataLength - 4;

        // Use current group range from existing states
        const currentFromGroup = Math.min(...groupStates.map((s) => s.group));
        const currentToGroup = Math.max(...groupStates.map((s) => s.group));

        for (
          let groupNum = currentFromGroup;
          groupNum <= currentToGroup;
          groupNum++
        ) {
          const stateIndex = dataStartPos + groupNum;
          let value = 0;

          if (stateIndex < data.length && groupNum < actualDataLength) {
            value = data[stateIndex];
          }

          states.push({
            group: groupNum,
            value: value,
            name: `Group ${groupNum}`,
          });
        }

        // If no valid data found, try alternative parsing
        if (states.every((s) => s.value === 0) && data.length > 9) {
          for (
            let groupNum = currentFromGroup;
            groupNum <= currentToGroup;
            groupNum++
          ) {
            const altIndex = 8 + (groupNum - 1);
            let value = 0;

            if (altIndex < data.length) {
              value = data[altIndex];
            }

            states[groupNum - currentFromGroup].value = value;
          }
        }
      }

      // Only update if we have valid states
      if (states.length > 0) {
        setGroupStates(states);
      }
    } catch (error) {
      // Silently fail for auto refresh to avoid spam
      console.error("Auto refresh failed:", error);
    }
  }, [unit, groupStates]);

  const handleSwitchToggle = useCallback(
    async (groupNum, isOn) => {
      if (!unit) return;

      const value = isOn ? 255 : 0;

      setGroupStates((prev) =>
        prev.map((state) =>
          state.group === groupNum ? { ...state, value } : state
        )
      );

      try {
        await window.electronAPI.rcuController.setGroupState({
          canId: unit.id_can,
          group: groupNum,
          value: value,
          unitIp: unit.ip_address,
        });

        toast.success(`Group ${groupNum} turned ${isOn ? "on" : "off"}`);
      } catch (error) {
        console.error("Failed to toggle group:", error);
        toast.error(`Failed to toggle group ${groupNum}: ${error.message}`);

        // Revert local state on error
        setGroupStates((prev) =>
          prev.map((state) =>
            state.group === groupNum
              ? { ...state, value: isOn ? 0 : 255 }
              : state
          )
        );
      }
    },
    [unit]
  );

  // Handle slider change with debounce
  const handleSliderChange = useCallback(
    (groupNum, newValue) => {
      setGroupStates((prev) =>
        prev.map((state) =>
          state.group === groupNum ? { ...state, value: newValue[0] } : state
        )
      );

      // Clear existing timeout for this group
      if (debounceRefs.current[groupNum]) {
        clearTimeout(debounceRefs.current[groupNum]);
      }

      // Set new timeout for debounced command
      debounceRefs.current[groupNum] = setTimeout(async () => {
        if (!unit) return;

        try {
          await window.electronAPI.rcuController.setGroupState({
            canId: unit.id_can,
            group: groupNum,
            value: newValue[0],
            unitIp: unit.ip_address,
          });

          toast.success(
            `Group ${groupNum} set to ${newValue[0]} (${Math.round(
              (newValue[0] * 100) / 255
            )}%)`
          );
        } catch (error) {
          console.error("Failed to set group value:", error);
          toast.error(`Failed to set group ${groupNum}: ${error.message}`);
        }
      }, 500);
    },
    [unit]
  );

  // Auto refresh effect - automatically start when dialog is open and group states are loaded
  useEffect(() => {
    if (open && groupStates.length > 0) {
      // Start auto refresh interval only when dialog is open
      autoRefreshInterval.current = setInterval(() => {
        autoRefreshStates();
      }, 1000);
    } else {
      // Stop auto refresh interval when dialog is closed or no group states
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [open, groupStates.length, autoRefreshStates]);

  // Listen for global auto refresh control events
  useEffect(() => {
    const handlePauseAutoRefresh = (event) => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };

    const handleResumeAutoRefresh = (event) => {
      if (open && groupStates.length > 0 && !autoRefreshInterval.current) {
        autoRefreshInterval.current = setInterval(() => {
          autoRefreshStates();
        }, 1000);
      }
    };

    window.addEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
    window.addEventListener("resumeAllAutoRefresh", handleResumeAutoRefresh);

    return () => {
      window.removeEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
      window.removeEventListener(
        "resumeAllAutoRefresh",
        handleResumeAutoRefresh
      );
    };
  }, [open, groupStates.length, autoRefreshStates]);

  // Cleanup debounce timers and auto refresh on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Group Control
          </DialogTitle>
          <DialogDescription>
            Control multiple lighting groups for unit {unit?.id_can} at{" "}
            {unit?.ip_address}:{CONSTANTS.UNIT.UDP_CONFIG.UDP_PORT}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Range Input */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fromGroup">From Group</Label>
              <Input
                id="fromGroup"
                type="number"
                min="1"
                max="255"
                value={fromGroup}
                onChange={(e) => setFromGroup(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toGroup">To Group</Label>
              <Input
                id="toGroup"
                type="number"
                min="1"
                max="255"
                value={toGroup}
                onChange={(e) => setToGroup(parseInt(e.target.value) || 1)}
                placeholder="10"
              />
            </div>
            <Button
              onClick={handleGetStates}
              disabled={getStateLoading}
              className="flex items-center gap-2"
            >
              {getStateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Get State
            </Button>
          </div>

          {/* Group States Display */}
          {groupStates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Group States</h3>
                <span className="text-sm text-muted-foreground">
                  {groupStates.length} groups loaded
                </span>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
                  {groupStates.map((state) => (
                    <GroupCard
                      key={state.group}
                      state={state}
                      onSwitchToggle={handleSwitchToggle}
                      onSliderChange={handleSliderChange}
                      loading={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {groupStates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Group States Loaded</p>
              <p className="text-sm">
                Set the group range and click "Get State" to load group states
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
