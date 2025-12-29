import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { toast } from "sonner";
import { GitCompare, List, Trash2, Loader2 } from "lucide-react";
import { DeleteScheduleDialog } from "./delete-schedule-popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Memoized utility functions for better performance
const formatTime = (hour, minute) => {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const formatDays = (weekDays) => {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (!weekDays || weekDays.length !== 7) return "No days";

  const activeDays = weekDays.map((enabled, index) => (enabled ? dayNames[index] : null)).filter(Boolean);

  if (activeDays.length === 7) return "Every day";
  if (activeDays.length === 0) return "No days";
  return activeDays.join(", ");
};

const initialDeleteDialogState = {
  open: false,
  scheduleIndex: null,
  scheduleName: "",
};

// Initial state for better state management
const initialState = {
  scheduleIndex: "",
  schedules: [],
  showSchedules: false,
  deleteConfirmDialog: initialDeleteDialogState,
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllSchedules: false,
};

// Memoized ScheduleCard component to prevent unnecessary re-renders
const ScheduleCard = memo(({ schedule, onDelete, loading, formatTime, formatDays }) => (
  <Card key={schedule.index} className="relative">
    <CardContent>
      <div className="flex items-center justify-between">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-bold">Schedule #{schedule.index}</span>
          <div className="text-sm text-muted-foreground font-light">
            <span className="font-bold">Time:</span> {formatTime(schedule.hour, schedule.minute)}
            <span className="mx-1"> | </span>
            <span className="font-bold">Status:</span>{" "}
            <Badge variant={schedule.enabled ? "default" : "secondary"}>{schedule.enabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div className="text-sm text-muted-foreground font-light">
            <span className="font-bold">Days:</span> {formatDays(schedule.weekDays)}
          </div>
          <div className="text-sm text-muted-foreground font-light">
            <span className="font-bold">Mode:</span> {schedule.mode === 1 ? "Interval" : "System Time"}
            {schedule.mode === 1 && (
              <>
                <span className="mx-1"> | </span>
                <span className="font-bold">Interval:</span> {schedule.intervalTime}s
                <span className="mx-1"> | </span>
                <span className="font-bold">DMX Duration:</span> {schedule.dmxDuration}
              </>
            )}
          </div>
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Scenes Button with Popover */}
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <span className="font-light">Scenes:</span> {schedule.sceneCount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-108" align="end">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">Schedule #{schedule.index}</h4>
                  <div className="text-xs text-muted-foreground">
                    <strong>Time:</strong> {formatTime(schedule.hour, schedule.minute)} | <strong>Total Scenes:</strong> {schedule.sceneCount}
                  </div>
                </div>

                {schedule.sceneAddresses && schedule.sceneAddresses.length > 0 ? (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scene Addresses</h5>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {schedule.sceneAddresses.map((address, index) => (
                        <Badge key={index} variant="outline" className="text-xs justify-center">
                          {address}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">No scenes configured</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete Schedule Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(schedule.index)}
            disabled={loading}
            className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

ScheduleCard.displayName = "ScheduleCard";

export function TriggerScheduleDialog({ open, onOpenChange, unit }) {
  // Consolidated state management
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Memoized values for better performance
  const filteredSchedules = useMemo(() => {
    return state.schedules.filter((schedule) => {
      return !(schedule.enabled === false && schedule.sceneCount === 0);
    });
  }, [state.schedules]);

  // Memoized format functions
  const memoizedFormatTime = useCallback(formatTime, []);
  const memoizedFormatDays = useCallback(formatDays, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open]);

  // Optimized event handlers with proper state management
  const handleScheduleIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Allow only numbers and limit to 0-31
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 31)) {
      setState((prev) => ({ ...prev, scheduleIndex: value }));
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && state.scheduleIndex) {
        handleLoadScheduleInfo();
      }
    },
    [state.scheduleIndex]
  );

  const handleLoadScheduleInfo = useCallback(async () => {
    if (!unit || !state.scheduleIndex) {
      toast.error("Please enter a schedule index");
      return;
    }

    const index = parseInt(state.scheduleIndex);
    if (index < 0 || index > 31) {
      toast.error("Schedule index must be between 0 and 31");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      console.log("Loading schedule information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: index,
      });

      const result = await window.electronAPI.scheduleController.getScheduleInformation({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: index,
      });

      // Convert single schedule result to card format
      if (result && result.success && result.data) {
        const scheduleData = result.data;
        const scheduleCard = {
          index: index, // Keep 0-31 range
          enabled: scheduleData.enabled || false,
          hour: scheduleData.hour || 0,
          minute: scheduleData.minute || 0,
          weekDays: scheduleData.weekDays || [false, false, false, false, false, false, false],
          sceneCount: scheduleData.sceneAddresses ? scheduleData.sceneAddresses.length : 0,
          sceneAddresses: scheduleData.sceneAddresses || [],
          mode: scheduleData.mode || 0,
          intervalTime: scheduleData.intervalTime || 0,
          dmxDuration: scheduleData.dmxDuration || 0,
        };

        setState((prev) => ({
          ...prev,
          schedules: [scheduleCard],
          showSchedules: true,
        }));
        toast.success(`Schedule ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load schedule information:", error);
      toast.error(`Failed to load schedule information: ${error.message}`);
      setState((prev) => ({
        ...prev,
        schedules: [],
        showSchedules: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.scheduleIndex]);

  const handleLoadAllSchedules = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllSchedules: true }));
    try {
      console.log("Loading all schedules information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result = await window.electronAPI.scheduleController.getAllSchedulesInformation({
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      if (result.data && result.data.length > 0) {
        // Convert schedule data to card format
        const scheduleCards = result.data.map((schedule) => ({
          index: schedule.scheduleIndex, // Keep 0-31 range
          enabled: schedule.enabled || false,
          hour: schedule.hour || 0,
          minute: schedule.minute || 0,
          weekDays: schedule.weekDays || [false, false, false, false, false, false, false],
          sceneCount: schedule.sceneAddresses ? schedule.sceneAddresses.length : 0,
          sceneAddresses: schedule.sceneAddresses || [],
          mode: schedule.mode || 0,
          intervalTime: schedule.intervalTime || 0,
          dmxDuration: schedule.dmxDuration || 0,
        }));

        // Filter out schedules that are disabled and have 0 scenes
        const filteredSchedules = scheduleCards.filter((schedule) => {
          return !(schedule.enabled === false && schedule.sceneCount === 0);
        });

        if (filteredSchedules.length > 0) {
          setState((prev) => ({
            ...prev,
            schedules: filteredSchedules,
            showSchedules: true,
          }));
          toast.success(`Loaded ${filteredSchedules.length} schedules successfully`);
        } else {
          setState((prev) => ({
            ...prev,
            schedules: [],
            showSchedules: false,
          }));
          toast.info("No valid schedules found (filtered out disabled empty schedules)");
        }
      } else {
        setState((prev) => ({
          ...prev,
          schedules: [],
          showSchedules: false,
        }));
        toast.info("No schedules found");
      }
    } catch (error) {
      console.error("Failed to load all schedules:", error);
      toast.error(`Failed to load all schedules: ${error.message}`);
      setState((prev) => ({
        ...prev,
        schedules: [],
        showSchedules: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllSchedules: false }));
    }
  }, [unit]);

  const handleDeleteScheduleFromCard = useCallback((scheduleIndex) => {
    setState((prev) => ({
      ...prev,
      deleteConfirmDialog: {
        open: true,
        scheduleIndex,
        scheduleName: `Schedule ${scheduleIndex}`,
      },
    }));
  }, []);

  const handleConfirmDeleteSchedule = useCallback(async () => {
    if (!unit || state.deleteConfirmDialog.scheduleIndex === null) {
      toast.error("Invalid schedule or unit");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loading: true }));
    try {
      console.log("Deleting schedule from card:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: state.deleteConfirmDialog.scheduleIndex, // Keep 0-31 range
      });

      await window.electronAPI.scheduleController.deleteSchedule({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: state.deleteConfirmDialog.scheduleIndex, // Keep 0-31 range
      });

      toast.success(`Schedule ${state.deleteConfirmDialog.scheduleIndex} deleted successfully`);

      // Close the confirmation dialog
      setState((prev) => ({
        ...prev,
        deleteConfirmDialog: initialDeleteDialogState,
      }));

      // Optionally refresh the schedules list
      // You could call handleLoadAllSchedules() here if needed
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error(`Failed to delete schedule: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loading: false }));
    }
  }, [unit, state.deleteConfirmDialog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Control</DialogTitle>
          <DialogDescription>
            Load information and manage schedules on unit {unit?.ip_address} (CAN ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Schedule Index Input and Load Button */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="scheduleIndex"
                  type="text"
                  value={state.scheduleIndex}
                  onChange={handleScheduleIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Schedule (0-31)"
                  disabled={loadingState.loading || loadingState.loadingInfo || loadingState.loadingAllSchedules}
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadScheduleInfo}
                  disabled={loadingState.loadingInfo || !state.scheduleIndex || loadingState.loadingAllSchedules}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load Schedule"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteScheduleDialog
                  open={state.deletePopoverOpen}
                  onOpenChange={(open) => setState((prev) => ({ ...prev, deletePopoverOpen: open }))}
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button variant="outline" size="lg" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Schedules
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllSchedules}
                  size="lg"
                  disabled={loadingState.loadingAllSchedules || loadingState.loadingInfo}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllSchedules ? "Loading..." : "Load All Schedules"}
                </Button>
              </div>
            </div>
          </div>

          {/* Schedules Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {state.showSchedules && state.schedules.length > 0 ? (
                <div className="grid gap-3">
                  {state.schedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.index}
                      schedule={schedule}
                      onDelete={handleDeleteScheduleFromCard}
                      loading={loadingState.loading}
                      formatTime={memoizedFormatTime}
                      formatDays={memoizedFormatDays}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full mt-10">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No schedules loaded</p>
                    <p className="text-sm">Use "Load Schedule" or "Load All Schedules" to display schedule information</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loadingState.loading || loadingState.loadingInfo || loadingState.loadingAllSchedules}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={state.deleteConfirmDialog.open}
        onOpenChange={(open) =>
          !open &&
          setState((prev) => ({
            ...prev,
            deleteConfirmDialog: initialDeleteDialogState,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {state.deleteConfirmDialog.scheduleName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingState.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSchedule}
              disabled={loadingState.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loadingState.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Schedule"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// Export the memoized component for better performance
export default memo(TriggerScheduleDialog);
