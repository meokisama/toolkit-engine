import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DeleteScheduleDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const [scheduleIndices, setScheduleIndices] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScheduleIndicesChange = useCallback((e) => {
    const value = e.target.value;
    // Allow numbers, commas, spaces, and hyphens for ranges
    if (value === "" || /^[\d,\s-]+$/.test(value)) {
      setScheduleIndices(value);
    }
  }, []);

  const parseScheduleIndices = useCallback((input) => {
    if (!input.trim()) return [];

    const indices = new Set();
    const parts = input.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes("-")) {
        // Handle range like "1-5"
        const [start, end] = trimmed.split("-").map((s) => parseInt(s.trim()));
        if (
          !isNaN(start) &&
          !isNaN(end) &&
          start >= 1 &&
          end <= 32 &&
          start <= end
        ) {
          for (let i = start; i <= end; i++) {
            indices.add(i);
          }
        }
      } else {
        // Handle single number
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= 32) {
          indices.add(num);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }, []);

  const handleDeleteSchedules = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    if (!scheduleIndices.trim()) {
      toast.error("Please enter schedule indices to delete");
      return;
    }

    const indicesToDelete = parseScheduleIndices(scheduleIndices);

    if (indicesToDelete.length === 0) {
      toast.error("Please enter valid schedule indices (1-32)");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      console.log("Deleting schedules:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        scheduleIndices: indicesToDelete,
      });

      for (const scheduleIndex of indicesToDelete) {
        try {
          await window.electronAPI.rcuController.deleteSchedule({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            scheduleIndex,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to delete schedule ${scheduleIndex}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully deleted ${successCount} schedule${
            successCount > 1 ? "s" : ""
          }`
        );
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to delete ${errorCount} schedule${errorCount > 1 ? "s" : ""}`
        );
      }

      // Clear the input and close dialog on success
      if (successCount > 0) {
        setScheduleIndices("");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to delete schedules:", error);
      toast.error(`Failed to delete schedules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [unit, scheduleIndices, parseScheduleIndices, onOpenChange]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && scheduleIndices.trim() && !loading) {
        handleDeleteSchedules();
      }
    },
    [scheduleIndices, loading, handleDeleteSchedules]
  );

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scheduleIndices">Schedule Indices</Label>
        <Input
          id="scheduleIndices"
          type="text"
          value={scheduleIndices}
          onChange={handleScheduleIndicesChange}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 1,3,5-10,15"
          disabled={loading}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Enter schedule indices (1-32) separated by commas. Use hyphens for
          ranges (e.g., 1-5).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Examples:</Label>
        <Textarea
          readOnly
          value={`Single: 1
Multiple: 1,3,5,7
Range: 1-10
Mixed: 1,3,5-10,15,20-25`}
          className="h-20 text-xs font-mono"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeleteSchedules}
          disabled={loading || !scheduleIndices.trim()}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Schedules
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (asPopover && trigger) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-96" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Delete Schedules</h4>
              <p className="text-sm text-muted-foreground">
                Delete multiple schedules from unit {unit?.ip_address} (CAN ID:{" "}
                {unit?.id_can}).
              </p>
            </div>
            {content}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Schedules
          </DialogTitle>
          <DialogDescription>
            Delete multiple schedules from unit {unit?.ip_address} (CAN ID:{" "}
            {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
