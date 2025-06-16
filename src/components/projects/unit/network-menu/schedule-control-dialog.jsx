import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, GitCompare, List, Trash2, Loader2 } from "lucide-react";
import { DeleteScheduleDialog } from "./delete-schedule-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const formatTime = (hour, minute) => {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const formatDays = (weekDays) => {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (!weekDays || weekDays.length !== 7) return "No days";

  const activeDays = weekDays
    .map((enabled, index) => (enabled ? dayNames[index] : null))
    .filter(Boolean);

  if (activeDays.length === 7) return "Every day";
  if (activeDays.length === 0) return "No days";
  return activeDays.join(", ");
};

const initialDeleteDialogState = {
  open: false,
  scheduleIndex: null,
  scheduleName: "",
};

export function TriggerScheduleDialog({ open, onOpenChange, unit }) {
  const [scheduleIndex, setScheduleIndex] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingAllSchedules, setLoadingAllSchedules] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [showSchedules, setShowSchedules] = useState(false);
  const [loadingScheduleDetails, setLoadingScheduleDetails] = useState({});
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(
    initialDeleteDialogState
  );
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setScheduleIndex("");
      setSchedules([]);
      setShowSchedules(false);
      setLoadingScheduleDetails({});
      setDeleteConfirmDialog(initialDeleteDialogState);
    }
  }, [open]);

  const handleScheduleIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Allow only numbers and limit to 0-31
    if (
      value === "" ||
      (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 31)
    ) {
      setScheduleIndex(value);
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && scheduleIndex) {
        handleLoadScheduleInfo();
      }
    },
    [scheduleIndex]
  );

  const handleLoadScheduleInfo = useCallback(async () => {
    if (!unit || !scheduleIndex) {
      toast.error("Please enter a schedule index");
      return;
    }

    const index = parseInt(scheduleIndex);
    if (index < 0 || index > 31) {
      toast.error("Schedule index must be between 0 and 31");
      return;
    }

    setLoadingInfo(true);
    try {
      console.log("Loading schedule information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: index,
      });

      const result =
        await window.electronAPI.rcuController.getScheduleInformation({
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
          weekDays: scheduleData.weekDays || [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ],
          sceneCount: scheduleData.sceneAddresses
            ? scheduleData.sceneAddresses.length
            : 0,
          sceneAddresses: scheduleData.sceneAddresses || [],
        };

        setSchedules([scheduleCard]);
        setShowSchedules(true);
        toast.success(`Schedule ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load schedule information:", error);
      toast.error(`Failed to load schedule information: ${error.message}`);
      setSchedules([]);
      setShowSchedules(false);
    } finally {
      setLoadingInfo(false);
    }
  }, [unit, scheduleIndex]);

  const handleLoadAllSchedules = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingAllSchedules(true);
    try {
      console.log("Loading all schedules information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result =
        await window.electronAPI.rcuController.getAllSchedulesInformation({
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
          weekDays: schedule.weekDays || [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ],
          sceneCount: schedule.sceneAddresses
            ? schedule.sceneAddresses.length
            : 0,
          sceneAddresses: schedule.sceneAddresses || [],
        }));

        setSchedules(scheduleCards);
        setShowSchedules(true);
        toast.success(`Loaded ${scheduleCards.length} schedules successfully`);
      } else {
        setSchedules([]);
        setShowSchedules(false);
        toast.info("No schedules found");
      }
    } catch (error) {
      console.error("Failed to load all schedules:", error);
      toast.error(`Failed to load all schedules: ${error.message}`);
      setSchedules([]);
      setShowSchedules(false);
    } finally {
      setLoadingAllSchedules(false);
    }
  }, [unit]);

  const handleDeleteScheduleFromCard = useCallback((scheduleIndex) => {
    setDeleteConfirmDialog({
      open: true,
      scheduleIndex,
      scheduleName: `Schedule ${scheduleIndex}`,
    });
  }, []);

  const handleConfirmDeleteSchedule = useCallback(async () => {
    if (!unit || deleteConfirmDialog.scheduleIndex === null) {
      toast.error("Invalid schedule or unit");
      return;
    }

    setLoading(true);
    try {
      console.log("Deleting schedule from card:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: deleteConfirmDialog.scheduleIndex, // Keep 0-31 range
      });

      await window.electronAPI.rcuController.deleteSchedule({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndex: deleteConfirmDialog.scheduleIndex, // Keep 0-31 range
      });

      toast.success(
        `Schedule ${deleteConfirmDialog.scheduleIndex} deleted successfully`
      );

      // Close the confirmation dialog
      setDeleteConfirmDialog(initialDeleteDialogState);

      // Optionally refresh the schedules list
      // You could call handleLoadAllSchedules() here if needed
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      toast.error(`Failed to delete schedule: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [unit, deleteConfirmDialog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Control</DialogTitle>
          <DialogDescription>
            Load information and manage schedules on unit {unit?.ip_address}{" "}
            (CAN ID: {unit?.id_can}).
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
                  value={scheduleIndex}
                  onChange={handleScheduleIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Schedule (0-31)"
                  disabled={loading || loadingInfo || loadingAllSchedules}
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadScheduleInfo}
                  disabled={
                    loadingInfo || !scheduleIndex || loadingAllSchedules
                  }
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingInfo ? "Loading..." : "Load Schedule"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteScheduleDialog
                  open={deletePopoverOpen}
                  onOpenChange={setDeletePopoverOpen}
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Schedules
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllSchedules}
                  size="lg"
                  disabled={loadingAllSchedules || loadingInfo}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingAllSchedules ? "Loading..." : "Load All Schedules"}
                </Button>
              </div>
            </div>
          </div>

          {/* Schedules Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {showSchedules && schedules.length > 0 ? (
                <div className="grid gap-3">
                  {schedules.map((schedule) => (
                    <Card key={schedule.index} className="relative">
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex flex-col gap-2">
                            <span className="text-lg font-bold">
                              Schedule #{schedule.index}
                            </span>
                            <div className="text-sm text-muted-foreground font-light">
                              <span className="font-bold">Time:</span>{" "}
                              {formatTime(schedule.hour, schedule.minute)}
                              <span className="mx-1"> | </span>
                              <span className="font-bold">Status:</span>{" "}
                              <Badge
                                variant={
                                  schedule.enabled ? "default" : "secondary"
                                }
                              >
                                {schedule.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground font-light">
                              <span className="font-bold">Days:</span>{" "}
                              {formatDays(schedule.weekDays)}
                            </div>
                          </CardTitle>

                          <div className="flex items-center gap-2">
                            {/* Scenes Button with Popover */}
                            <Popover modal={true}>
                              <PopoverTrigger asChild>
                                <Button variant="outline">
                                  <span className="font-light">Scenes:</span>{" "}
                                  {schedule.sceneCount}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-108" align="end">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium text-sm">
                                      Schedule #{schedule.index}
                                    </h4>
                                    <div className="text-xs text-muted-foreground">
                                      <strong>Time:</strong>{" "}
                                      {formatTime(
                                        schedule.hour,
                                        schedule.minute
                                      )}{" "}
                                      | <strong>Total Scenes:</strong>{" "}
                                      {schedule.sceneCount}
                                    </div>
                                  </div>

                                  {schedule.sceneAddresses &&
                                  schedule.sceneAddresses.length > 0 ? (
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Scene Addresses
                                      </h5>
                                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                        {schedule.sceneAddresses.map(
                                          (address, index) => (
                                            <Badge
                                              key={index}
                                              variant="outline"
                                              className="text-xs justify-center"
                                            >
                                              {address}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                      <p className="text-sm">
                                        No scenes configured
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Delete Schedule Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleDeleteScheduleFromCard(schedule.index)
                              }
                              disabled={loading}
                              className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full mt-10">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">
                      No schedules loaded
                    </p>
                    <p className="text-sm">
                      Use "Load Schedule" or "Load All Schedules" to display
                      schedule information
                    </p>
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
            disabled={loading || loadingInfo || loadingAllSchedules}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirmDialog(initialDeleteDialogState)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirmDialog.scheduleName}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSchedule}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
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
