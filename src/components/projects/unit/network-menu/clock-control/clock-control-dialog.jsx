import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Clock, RefreshCw, Calendar, Monitor, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePicker } from "@/components/custom/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export function ClockControlDialog({ open, onOpenChange, unit }) {
  const [loading, setLoading] = useState(false);
  const [unitClock, setUnitClock] = useState(null);
  const [syncMode, setSyncMode] = useState("computer"); // "computer" or "manual"
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualDate, setManualDate] = useState(new Date());
  const [manualTime, setManualTime] = useState(new Date());

  // Get current computer time
  const getCurrentComputerTime = useCallback(() => {
    const now = new Date();
    return {
      year: now.getFullYear() - 2000, // Convert to 0-99 range (2025 -> 25)
      month: now.getMonth() + 1,
      day: now.getDate(),
      dayOfWeek: now.getDay() === 0 ? 1 : now.getDay() + 1, // Convert Sunday=0 to Sunday=1, Monday=1 to Monday=2, etc.
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
    };
  }, []);

  // Update manual date/time to current computer time
  const syncToComputerTime = useCallback(() => {
    const now = new Date();
    setManualDate(new Date(now));
    setManualTime(new Date(now));
  }, []);

  // Get clock from unit
  const handleGetClock = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      console.log("Getting clock from unit:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result = await window.electronAPI.rcuController.getClock({
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      setUnitClock(result);
      toast.success("Clock retrieved successfully from unit");
    } catch (error) {
      console.error("Failed to get clock:", error);
      toast.error(`Failed to get clock: ${error.message}`);
      setUnitClock(null);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  // Sync clock to unit based on selected mode
  const handleSyncClock = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      let clockData;

      if (syncMode === "computer") {
        clockData = getCurrentComputerTime();
      } else {
        // Use manual date/time input - combine date and time
        const combinedDateTime = new Date(
          manualDate.getFullYear(),
          manualDate.getMonth(),
          manualDate.getDate(),
          manualTime.getHours(),
          manualTime.getMinutes(),
          manualTime.getSeconds()
        );

        clockData = {
          year: combinedDateTime.getFullYear() - 2000, // Convert to 0-99 range
          month: combinedDateTime.getMonth() + 1,
          day: combinedDateTime.getDate(),
          dayOfWeek:
            combinedDateTime.getDay() === 0 ? 1 : combinedDateTime.getDay() + 1, // Convert Sunday=0 to Sunday=1
          hour: combinedDateTime.getHours(),
          minute: combinedDateTime.getMinutes(),
          second: combinedDateTime.getSeconds(),
        };
      }

      console.log("Syncing clock to unit:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        clockData,
        syncMode,
      });

      await window.electronAPI.rcuController.syncClock({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        clockData,
      });

      toast.success(
        `Clock synced successfully ${
          syncMode === "computer" ? "from computer" : "with manual time"
        }`
      );

      // Refresh unit clock after sync
      setTimeout(() => {
        handleGetClock();
      }, 500);
    } catch (error) {
      console.error("Failed to sync clock:", error);
      toast.error(`Failed to sync clock: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [
    unit,
    syncMode,
    manualDate,
    manualTime,
    getCurrentComputerTime,
    handleGetClock,
  ]);

  // Format date/time for display
  const formatDateTime = useCallback((clockData) => {
    if (!clockData) return "N/A";

    const { fullYear, month, day, hour, minute, second, dayOfWeekString } =
      clockData;
    const date = `${fullYear}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    const time = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:${second.toString().padStart(2, "0")}`;

    return `${dayOfWeekString}, ${date} ${time}`;
  }, []);

  // Auto-load clock when dialog opens
  useEffect(() => {
    if (open && unit) {
      handleGetClock();
      syncToComputerTime(); // Initialize manual time to current computer time
    }
  }, [open, unit, handleGetClock, syncToComputerTime]);

  // Update current time every second for real-time display
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clock Control
          </DialogTitle>
          <DialogDescription>
            Get current clock from unit and sync clock to unit.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Unit Clock Display */}
          <Card>
            <CardContent className="flex justify-between">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Current Unit Time:
                </Label>
                <span className="font-mono text-lg bg-amber-100 px-1">
                  {unitClock ? formatDateTime(unitClock) : "Not loaded"}
                </span>
              </div>
              <Button
                onClick={handleGetClock}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Sync Mode Selection */}
          <Card>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-3">
                <RadioGroup
                  value={syncMode}
                  onValueChange={setSyncMode}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="computer" id="computer" />
                    <Label
                      htmlFor="computer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Monitor className="h-4 w-4" />
                      Computer Time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label
                      htmlFor="manual"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                      Manual Time
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Computer Time Section */}
              {syncMode === "computer" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Current Computer Time:
                        </Label>
                        <div className="text-lg font-mono bg-amber-100 px-1">
                          {currentTime.toLocaleString("en-CA", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            weekday: "long",
                          })}
                        </div>
                      </div>
                      <Monitor className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Time Section */}
              {syncMode === "manual" && (
                <div className="p-4 rounded-lg border flex gap-4">
                  {/* Date Selection */}
                  <div className="space-y-4 w-1/2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Select Date
                    </Label>
                    <div className="flex justify-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {manualDate ? (
                              format(manualDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={manualDate}
                            onSelect={setManualDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Select Time
                    </Label>
                    <div className="flex justify-center">
                      <TimePicker
                        date={manualTime}
                        setDate={setManualTime}
                        showSeconds={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sync Button */}
              <Button
                onClick={handleSyncClock}
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Sync to Unit
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
