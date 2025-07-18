"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePicker } from "@/components/custom/time-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Monitor,
  Edit3,
  CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  NetworkUnitSelector,
  useNetworkUnitSelector,
} from "@/components/shared/network-unit-selector";

export function BulkClockSyncDialog({ open, onOpenChange }) {
  const { selectedUnitIds, handleSelectionChange, clearSelection } =
    useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [syncMode, setSyncMode] = useState("computer");
  const [manualDate, setManualDate] = useState(new Date());
  const [manualTime, setManualTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncResults, setSyncResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      clearSelection();
      syncToComputerTime();
      setShowResults(false);
      setSyncResults([]);
      setProgress(0);
    }
  }, [open, clearSelection]);

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

  // Get clock data based on sync mode
  const getClockData = useCallback(() => {
    if (syncMode === "computer") {
      return getCurrentComputerTime();
    } else {
      // Manual mode
      const year = manualDate.getFullYear() - 2000;
      const month = manualDate.getMonth() + 1;
      const day = manualDate.getDate();
      const dayOfWeek = manualDate.getDay() === 0 ? 1 : manualDate.getDay() + 1;
      const hour = manualTime.getHours();
      const minute = manualTime.getMinutes();
      const second = manualTime.getSeconds();

      return { year, month, day, dayOfWeek, hour, minute, second };
    }
  }, [syncMode, manualDate, manualTime, getCurrentComputerTime]);

  // Get selected units for sync
  const getSelectedUnitsForSync = useCallback(() => {
    return networkUnitSelectorRef.current?.getSelectedUnits() || [];
  }, []);

  // Handle bulk clock sync
  const handleBulkSync = useCallback(async () => {
    const unitsToSync = getSelectedUnitsForSync();

    if (unitsToSync.length === 0) {
      toast.error("Please select at least one unit to sync");
      return;
    }

    setLoading(true);
    setProgress(0);
    setSyncResults([]);
    setShowResults(true);

    const clockData = getClockData();
    const results = [];

    try {
      for (let i = 0; i < unitsToSync.length; i++) {
        const unit = unitsToSync[i];
        const currentProgress = ((i + 1) / unitsToSync.length) * 100;

        try {
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

          results.push({
            unit,
            status: "success",
            message: "Clock synced successfully",
          });
        } catch (error) {
          console.error(
            `Failed to sync clock for unit ${unit.ip_address}:`,
            error
          );
          results.push({
            unit,
            status: "error",
            message: error.message || "Failed to sync clock",
          });
        }

        setProgress(currentProgress);
        setSyncResults([...results]);

        // Small delay between requests to avoid overwhelming the network
        if (i < unitsToSync.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const successCount = results.filter((r) => r.status === "success").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      if (errorCount === 0) {
        toast.success(`Clock synced successfully to all ${successCount} units`);
      } else if (successCount === 0) {
        toast.error(`Failed to sync clock to all ${errorCount} units`);
      } else {
        toast.warning(
          `Clock synced to ${successCount} units, ${errorCount} failed`
        );
      }
    } catch (error) {
      console.error("Bulk clock sync failed:", error);
      toast.error(`Bulk clock sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [getSelectedUnitsForSync, getClockData, syncMode]);

  const selectedCount = selectedUnitIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bulk Clock Synchronization
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {!showResults ? (
            <>
              {/* Sync Mode Selection */}
              <Card>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Sync Mode</Label>
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

                  {/* Manual Time Selection */}
                  {syncMode === "manual" && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
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
                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                </CardContent>
              </Card>

              {/* Unit Selection */}
              <NetworkUnitSelector
                selectedUnitIds={selectedUnitIds}
                onSelectionChange={handleSelectionChange}
                disabled={loading}
                ref={networkUnitSelectorRef}
                height="h-48"
              />

              {/* Sync Button */}
              <Button
                onClick={handleBulkSync}
                disabled={loading || selectedCount === 0}
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Sync Clock to {selectedCount} Unit
                {selectedCount !== 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            /* Results Display */
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sync Results</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    Back to Sync
                  </Button>
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <ScrollArea className="h-64 border rounded-md p-4">
                  <div className="space-y-2">
                    {syncResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 rounded border"
                      >
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {result.unit.type} - {result.unit.ip_address} (CAN:{" "}
                            {result.unit.id_can})
                          </div>
                          <div
                            className={`text-xs ${
                              result.status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
