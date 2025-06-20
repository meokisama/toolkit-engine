"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export function DeleteCurtainDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState("single");
  const [curtainIndex, setCurtainIndex] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedCurtains, setSelectedCurtains] = useState({});

  const getCurtainIndexesToDelete = () => {
    if (deleteMode === "single") {
      const index = parseInt(curtainIndex, 10);
      if (isNaN(index) || index < 0 || index > 31) {
        throw new Error("Curtain index must be between 0 and 31");
      }
      return [index];
    } else if (deleteMode === "range") {
      const start = parseInt(rangeStart, 10);
      const end = parseInt(rangeEnd, 10);
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        start > 31 ||
        end < 0 ||
        end > 31 ||
        start > end
      ) {
        throw new Error(
          "Range values must be between 0 and 31, and start must be <= end"
        );
      }
      const indexes = [];
      for (let i = start; i <= end; i++) {
        indexes.push(i);
      }
      return indexes;
    } else if (deleteMode === "multiple") {
      const indexes = Object.keys(selectedCurtains)
        .filter((key) => selectedCurtains[key])
        .map((key) => parseInt(key, 10));
      if (indexes.length === 0) {
        throw new Error("Please select at least one curtain to delete");
      }
      return indexes;
    }
    return [];
  };

  const handleDelete = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      if (deleteMode === "all") {
        // Use the new deleteAllCurtains function for deleting all curtains
        console.log("Deleting all curtains from unit:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        const response = await window.electronAPI.rcuController.deleteAllCurtains(
          unit.ip_address,
          unit.id_can
        );

        console.log("All curtains deleted successfully:", {
          success: response,
        });

        toast.success(
          `Successfully deleted all curtains from unit ${unit.ip_address}`
        );
        onOpenChange(false);
      } else {
        // Handle individual curtain deletions
        const curtainIndexes = getCurtainIndexesToDelete();
        let successCount = 0;
        let totalOperations = curtainIndexes.length;

        for (const index of curtainIndexes) {
          try {
            console.log("Deleting curtain:", {
              unitIp: unit.ip_address,
              canId: unit.id_can,
              curtainIndex: index,
            });

            const success = await window.electronAPI.rcuController.deleteCurtain({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              curtainIndex: index,
            });

            if (success) {
              successCount++;
              console.log(`Curtain ${index} deleted successfully`);
            } else {
              console.error(`Failed to delete curtain ${index}: Unit returned failure`);
            }
          } catch (error) {
            console.error(`Failed to delete curtain ${index}:`, error);
          }
        }

        if (successCount === totalOperations) {
          toast.success(
            `Successfully deleted ${successCount} curtain(s) from unit ${unit.ip_address}`
          );
        } else if (successCount > 0) {
          toast.warning(
            `Deleted ${successCount} out of ${totalOperations} curtain(s) from unit ${unit.ip_address}`
          );
        } else {
          toast.error(
            `Failed to delete any curtains from unit ${unit.ip_address}`
          );
        }

        onOpenChange(false);
      }
    } catch (error) {
      console.error("Delete curtains operation failed:", error);
      toast.error(`Failed to delete curtains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectedCurtainChange = (index, checked) => {
    setSelectedCurtains((prev) => ({
      ...prev,
      [index]: checked,
    }));
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Delete Mode</Label>
        <RadioGroup value={deleteMode} onValueChange={setDeleteMode}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single">Single Curtain</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="range" id="range" />
            <Label htmlFor="range">Range of Curtains</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiple" id="multiple" />
            <Label htmlFor="multiple">Multiple Curtains</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All Curtains</Label>
          </div>
        </RadioGroup>
      </div>

      {deleteMode === "single" && (
        <div className="space-y-2">
          <Label htmlFor="curtainIndex">Curtain Index (0-31)</Label>
          <Input
            id="curtainIndex"
            type="number"
            min="0"
            max="31"
            value={curtainIndex}
            onChange={(e) => setCurtainIndex(e.target.value)}
            placeholder="Enter curtain index"
          />
        </div>
      )}

      {deleteMode === "range" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rangeStart">Start Index (0-31)</Label>
            <Input
              id="rangeStart"
              type="number"
              min="0"
              max="31"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              placeholder="Start"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rangeEnd">End Index (0-31)</Label>
            <Input
              id="rangeEnd"
              type="number"
              min="0"
              max="31"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              placeholder="End"
            />
          </div>
        </div>
      )}

      {deleteMode === "multiple" && (
        <div className="space-y-2">
          <Label>Select Curtains to Delete (0-31)</Label>
          <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
            {Array.from({ length: 32 }, (_, i) => (
              <div key={i} className="flex items-center space-x-1">
                <Checkbox
                  id={`curtain-${i}`}
                  checked={selectedCurtains[i] || false}
                  onCheckedChange={(checked) =>
                    handleSelectedCurtainChange(i, checked)
                  }
                />
                <Label htmlFor={`curtain-${i}`} className="text-xs">
                  {i}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteMode === "all" && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">
            ⚠️ This will delete ALL curtains (0-31) from the unit.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This action cannot be undone.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
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
              <h4 className="font-medium text-sm">Delete Curtains</h4>
              <p className="text-xs text-muted-foreground">
                Delete curtains from unit {unit?.ip_address} (CAN ID: {unit?.id_can})
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
          <DialogTitle>Delete Curtains</DialogTitle>
          <DialogDescription>
            Delete curtains from unit {unit?.ip_address} (CAN ID: {unit?.id_can})
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
