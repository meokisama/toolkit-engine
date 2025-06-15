import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Wifi, Send, Loader2, CircleCheck, Network } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { udpScanner } from "@/services/udp";

export function SendScheduleDialog({ open, onOpenChange, schedule = null }) {
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [scheduleIndex, setScheduleIndex] = useState(1);
  const [scheduleData, setScheduleData] = useState(null);

  // Load schedule data and cached network units when dialog opens
  useEffect(() => {
    if (open && schedule) {
      loadScheduleData();
      setSelectedUnitIds([]);

      // Auto-load cached network units if available
      const cachedUnits = udpScanner.getLastScanResults();
      if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
        setNetworkUnits(cachedUnits);
        console.log(`Auto-loaded ${cachedUnits.length} cached network units`);
      } else {
        setNetworkUnits([]);
      }
    }
  }, [open, schedule]);

  const loadScheduleData = async () => {
    try {
      const data = await window.electronAPI.schedule.getForSending(schedule.id);
      setScheduleData(data);
      console.log("Loaded schedule data:", data);
    } catch (error) {
      console.error("Failed to load schedule data:", error);
      toast.error("Failed to load schedule data: " + error.message);
    }
  };

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");

      const discoveredUnits = await udpScanner.getNetworkUnits(true); // Always force scan when button is clicked

      setNetworkUnits(discoveredUnits);
      setSelectedUnitIds([]);

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

  const handleUnitToggle = (unitId, checked) => {
    setSelectedUnitIds((prev) =>
      checked ? [...prev, unitId] : prev.filter((id) => id !== unitId)
    );
  };

  const handleSendSchedule = async () => {
    if (!scheduleData) {
      toast.error("No schedule data loaded");
      return;
    }

    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one network unit");
      return;
    }

    if (scheduleIndex < 1 || scheduleIndex > 32) {
      toast.error("Schedule index must be between 1 and 32");
      return;
    }

    if (scheduleData.sceneAddresses.length === 0) {
      toast.error("Schedule has no scenes to send");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const selectedUnits = networkUnits.filter((unit) =>
        selectedUnitIds.includes(unit.id)
      );

      for (const unit of selectedUnits) {
        try {
          console.log("Sending schedule to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex,
            enabled: scheduleData.enabled,
            weekDays: scheduleData.parsedDays,
            hour: scheduleData.hour,
            minute: scheduleData.minute,
            sceneAddresses: scheduleData.sceneAddresses,
          });

          await window.electronAPI.schedule.send({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex,
            enabled: scheduleData.enabled,
            weekDays: scheduleData.parsedDays,
            hour: scheduleData.hour,
            minute: scheduleData.minute,
            sceneAddresses: scheduleData.sceneAddresses,
          });

          successCount++;
          toast.success(
            `Schedule sent successfully to ${unit.unit_type} (${unit.ip_address})`
          );
        } catch (error) {
          errorCount++;
          console.error(
            `Failed to send schedule to ${unit.ip_address}:`,
            error
          );
          toast.error(
            `Failed to send schedule to ${unit.unit_type} (${unit.ip_address}): ${error.message}`
          );
        }
      }

      if (successCount > 0) {
        toast.success(`Schedule sent successfully to ${successCount} unit(s)`);
      }

      if (errorCount === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error sending schedule:", error);
      toast.error("Error sending schedule: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDays = (days) => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days
      .map((enabled, index) => (enabled ? dayNames[index] : null))
      .filter(Boolean)
      .join(", ");
  };

  const handleDialogOpenChange = (newOpen) => {
    if (!loading) {
      onOpenChange(newOpen);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send {schedule.name} to Network Unit
          </DialogTitle>
          <DialogDescription>
            Send schedule "{schedule.name}" configuration to a network unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Schedule Configuration */}
          <div className="space-y-2">
            <Label htmlFor="schedule-index">Schedule Index (1-32)</Label>
            <Input
              id="schedule-index"
              type="number"
              min="1"
              max="32"
              value={scheduleIndex}
              onChange={(e) =>
                setScheduleIndex(
                  Math.max(1, Math.min(32, parseInt(e.target.value) || 1))
                )
              }
              placeholder="1"
            />
          </div>

          {/* Network Units */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Network Units ({selectedUnitIds.length} selected)
                </CardTitle>
                <Button
                  onClick={handleScanNetwork}
                  disabled={scanLoading}
                  size="sm"
                  variant="outline"
                >
                  {scanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Wifi className="h-4 w-4 mr-2" />
                  )}
                  Scan Network
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                {networkUnits.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No network units found.</p>
                    <p className="text-sm">
                      Click "Scan Network" to discover units on your network.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {networkUnits.map((unit) => (
                      <CheckboxPrimitive.Root
                        key={unit.id}
                        checked={selectedUnitIds.includes(unit.id)}
                        onCheckedChange={(checked) =>
                          handleUnitToggle(unit.id, checked)
                        }
                        className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
                      >
                        <Network className="h-6 w-6" />
                        <div className="space-y-1">
                          <span className="font-medium tracking-tight text-sm">
                            {unit.unit_type || "Unknown Unit"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            IP: {unit.ip_address}
                          </p>
                          {unit.id_can && (
                            <p className="text-xs text-muted-foreground">
                              CAN ID: {unit.id_can}
                            </p>
                          )}
                        </div>

                        <CheckboxPrimitive.Indicator className="absolute top-2 right-2">
                          <CircleCheck className="fill-primary text-primary-foreground h-4 w-4" />
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || scanLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendSchedule}
            disabled={loading || scanLoading || selectedUnitIds.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedUnitIds.length === 0
              ? "Send Schedule"
              : `Send Schedule to ${selectedUnitIds.length} Unit${
                  selectedUnitIds.length !== 1 ? "s" : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
