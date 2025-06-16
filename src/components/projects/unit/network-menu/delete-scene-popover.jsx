import React, { useState, useCallback, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function DeleteSceneDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const [deleteMode, setDeleteMode] = useState("single"); // single, range, specific, all
  const [singleIndex, setSingleIndex] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [specificIndexes, setSpecificIndexes] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDeleteMode("single");
      setSingleIndex("");
      setRangeStart("");
      setRangeEnd("");
      setSpecificIndexes("");
    }
  }, [open]);

  const validateInputs = () => {
    if (!unit) {
      toast.error("No network unit selected");
      return false;
    }

    if (deleteMode === "single") {
      const index = parseInt(singleIndex, 10);
      if (isNaN(index) || index < 0 || index > 99) {
        toast.error("Scene index must be between 0 and 99");
        return false;
      }
    } else if (deleteMode === "range") {
      const start = parseInt(rangeStart, 10);
      const end = parseInt(rangeEnd, 10);
      if (isNaN(start) || isNaN(end) || start < 0 || end > 99 || start > end) {
        toast.error(
          "Invalid range. Start and end must be between 0-99, and start ≤ end"
        );
        return false;
      }
    } else if (deleteMode === "specific") {
      if (!specificIndexes.trim()) {
        toast.error("Please enter scene indexes");
        return false;
      }

      // Parse and validate specific indexes
      const indexes = specificIndexes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      for (const indexStr of indexes) {
        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 0 || index > 99) {
          toast.error(
            `Invalid scene index: ${indexStr}. All indexes must be between 0-99`
          );
          return false;
        }
      }

      if (indexes.length === 0) {
        toast.error("Please enter at least one scene index");
        return false;
      }
    }

    return true;
  };

  const getSceneIndexesToDelete = () => {
    if (deleteMode === "single") {
      // Use index directly (0-99)
      return [parseInt(singleIndex, 10)];
    } else if (deleteMode === "range") {
      // Use indexes directly (0-99)
      const start = parseInt(rangeStart, 10);
      const end = parseInt(rangeEnd, 10);
      const indexes = [];
      for (let i = start; i <= end; i++) {
        indexes.push(i);
      }
      return indexes;
    } else if (deleteMode === "specific") {
      const indexes = specificIndexes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "")
        .map((s) => parseInt(s, 10)) // Use indexes directly (0-99)
        .filter((index) => !isNaN(index) && index >= 0 && index <= 99);

      // Remove duplicates and sort
      return [...new Set(indexes)].sort((a, b) => a - b);
    } else if (deleteMode === "all") {
      const indexes = [];
      for (let i = 0; i <= 99; i++) {
        indexes.push(i);
      }
      return indexes;
    }
    return [];
  };

  const handleDeleteScene = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    const sceneIndexes = getSceneIndexesToDelete();

    setLoading(true);
    try {
      let successCount = 0;
      let totalOperations = sceneIndexes.length;

      // Delete scenes from the unit
      for (const sceneIndex of sceneIndexes) {
        try {
          console.log("Deleting scene from unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            sceneIndex,
          });

          const response = await window.electronAPI.rcuController.deleteScene(
            unit.ip_address,
            unit.id_can,
            sceneIndex
          );

          console.log(
            `Scene ${sceneIndex} deleted successfully from ${unit.ip_address}:`,
            {
              responseLength: response?.msg?.length,
              success: response?.result?.success,
            }
          );

          successCount++;
        } catch (error) {
          console.error(
            `Failed to delete scene ${sceneIndex} from unit ${unit.ip_address}:`,
            error
          );
        }
      }

      // Show results
      if (successCount === totalOperations) {
        const modeText =
          deleteMode === "single"
            ? `scene ${singleIndex}`
            : deleteMode === "range"
            ? `scenes ${rangeStart}-${rangeEnd}`
            : deleteMode === "specific"
            ? `scenes [${specificIndexes}]`
            : "all scenes (0-99)";
        toast.success(
          `Successfully deleted ${modeText} from unit ${unit.ip_address}`
        );
        onOpenChange(false);
      } else if (successCount > 0) {
        toast.warning(
          `Partially successful: ${successCount}/${totalOperations} scenes deleted`
        );
      } else {
        toast.error("Failed to delete scenes from unit");
      }
    } catch (error) {
      console.error("Failed to delete scenes:", error);
      toast.error(`Failed to delete scenes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [
    deleteMode,
    singleIndex,
    rangeStart,
    rangeEnd,
    specificIndexes,
    unit,
    onOpenChange,
    validateInputs,
    getSceneIndexesToDelete,
  ]);

  const ContentComponent = ({ className = "" }) => (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Delete Scene</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Delete scene(s) from unit {unit?.ip_address}.
        </p>
      </div>

      <div className="space-y-4">
        {/* Delete Mode Selection */}
        <div className="space-y-3">
          <Label>Delete Mode</Label>
          <RadioGroup value={deleteMode} onValueChange={setDeleteMode}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single">Delete Single Scene</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range">Delete Scene Range</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific">Delete Specific Scenes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">Delete All Scenes (0-99)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Scene Configuration */}
        {deleteMode === "single" && (
          <div className="space-y-2">
            <Label htmlFor="single-index">Scene Index (0-99)</Label>
            <Input
              id="single-index"
              type="number"
              min="0"
              max="99"
              value={singleIndex}
              onChange={(e) => setSingleIndex(e.target.value)}
              placeholder="0"
              disabled={loading}
            />
          </div>
        )}

        {deleteMode === "range" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="range-start">Start Index (0-99)</Label>
              <Input
                id="range-start"
                type="number"
                min="0"
                max="99"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-end">End Index (0-99)</Label>
              <Input
                id="range-end"
                type="number"
                min="0"
                max="99"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                placeholder="99"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {deleteMode === "specific" && (
          <div className="space-y-2">
            <Label htmlFor="specific-indexes">
              Scene Indexes (comma-separated)
            </Label>
            <Input
              id="specific-indexes"
              type="text"
              value={specificIndexes}
              onChange={(e) => setSpecificIndexes(e.target.value)}
              placeholder="e.g., 0, 5, 10, 15"
              disabled={loading}
            />
          </div>
        )}

        {deleteMode === "all" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ This will delete all scenes (index 0-99) from the network unit.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeleteScene}
          disabled={loading || !unit}
          variant="destructive"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );

  if (asPopover && trigger) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-96 p-4">
          <ContentComponent />
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
            Delete Scene
          </DialogTitle>
          <DialogDescription>
            Delete scene(s) from unit {unit?.ip_address}.
          </DialogDescription>
        </DialogHeader>
        <ContentComponent />
      </DialogContent>
    </Dialog>
  );
}
