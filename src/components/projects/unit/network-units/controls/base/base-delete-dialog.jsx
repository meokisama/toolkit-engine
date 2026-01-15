import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import log from "electron-log/renderer";

/**
 * Parse indices string that supports:
 * - Single numbers: "1", "5", "10"
 * - Comma-separated: "1,5,10"
 * - Ranges with hyphens: "1-5", "10-15"
 * - Mixed: "1,3-5,8,10-12"
 */
const parseIndices = (indicesStr, maxIndex) => {
  if (!indicesStr.trim()) return [];

  const indices = new Set();
  const parts = indicesStr.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      // Handle range like "1-5"
      const [start, end] = part.split("-").map((s) => parseInt(s.trim(), 10));
      if (isNaN(start) || isNaN(end) || start < 0 || end > maxIndex || start > end) {
        throw new Error(`Invalid range: ${part}. Must be between 0-${maxIndex} and start <= end`);
      }
      for (let i = start; i <= end; i++) {
        indices.add(i);
      }
    } else {
      // Handle single number
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > maxIndex) {
        throw new Error(`Invalid index: ${part}. Must be between 0-${maxIndex}`);
      }
      indices.add(num);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
};

/**
 * Base Delete Dialog Component
 * Provides unified structure and behavior for all delete operations
 */
export function BaseDeleteDialog({ open, onOpenChange, unit, asPopover = false, trigger = null, config }) {
  const [deleteMode, setDeleteMode] = useState(config.modes[0]?.id || "specific");
  const [specificIndices, setSpecificIndices] = useState("");
  const [loading, setLoading] = useState(false);

  const { entityName, entityNameSingular, indexRange, modes, apiMethods } = config;
  const [minIndex, maxIndex] = indexRange;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDeleteMode(config.modes[0]?.id || "specific");
      setSpecificIndices("");
    }
  }, [open, config.modes]);

  const handleSpecificIndicesChange = useCallback((e) => {
    const value = e.target.value;
    // Allow numbers, commas, spaces, and hyphens for ranges
    if (value === "" || /^[\d,\s-]+$/.test(value)) {
      setSpecificIndices(value);
    }
  }, []);

  const getIndicesToDelete = useCallback(() => {
    switch (deleteMode) {
      case "specific":
        return parseIndices(specificIndices, maxIndex);

      case "all":
        return [];

      default:
        return [];
    }
  }, [deleteMode, specificIndices, maxIndex]);

  const handleDelete = useCallback(async () => {
    if (!unit) {
      toast.error("No network unit selected");
      return;
    }

    setLoading(true);
    try {
      if (deleteMode === "all") {
        log.info(`Deleting all ${entityName.toLowerCase()} from unit:`, {
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

        const response = await apiMethods.deleteAll(unit.ip_address, unit.id_can);

        log.info(`All ${entityName.toLowerCase()} deleted successfully:`, {
          responseLength: response?.msg?.length,
          success: response?.result?.success,
        });

        toast.success(`Successfully deleted all ${entityName.toLowerCase()} from unit ${unit.ip_address}`);
        onOpenChange(false);
      } else {
        // Handle specific deletions
        const indicesToDelete = getIndicesToDelete();

        if (indicesToDelete.length === 0) {
          toast.error(`Please enter ${entityName.toLowerCase()} indices to delete`);
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        log.info(`Deleting ${entityName.toLowerCase()}:`, {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          indices: indicesToDelete,
        });

        for (const index of indicesToDelete) {
          try {
            await apiMethods.deleteOne({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              index: index,
            });
            successCount++;
          } catch (error) {
            log.error(`Failed to delete ${entityNameSingular.toLowerCase()} ${index}:`, error);
            errorCount++;
          }
        }

        // Show results
        if (successCount === indicesToDelete.length) {
          toast.success(`Successfully deleted ${successCount} ${entityName.toLowerCase()} from unit ${unit.ip_address}`);
          onOpenChange(false);
        } else if (successCount > 0) {
          toast.warning(`Partially successful: ${successCount}/${indicesToDelete.length} ${entityName.toLowerCase()} deleted`);
        } else {
          toast.error(`Failed to delete ${entityName.toLowerCase()} from unit`);
        }
      }
    } catch (error) {
      log.error(`Failed to delete ${entityName.toLowerCase()}:`, error);
      toast.error(`Failed to delete ${entityName.toLowerCase()}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [deleteMode, specificIndices, unit, onOpenChange, getIndicesToDelete, apiMethods, entityName, entityNameSingular]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !loading) {
        const canSubmit = deleteMode === "all" || (deleteMode === "specific" && specificIndices.trim());

        if (canSubmit) {
          handleDelete();
        }
      }
    },
    [deleteMode, specificIndices, loading, handleDelete]
  );

  const content = (
    <div className="space-y-4">
      {/* Delete Mode Selection */}
      <div className="space-y-3">
        <Label>Delete Mode</Label>
        <RadioGroup value={deleteMode} onValueChange={setDeleteMode}>
          {modes.map((mode) => (
            <div key={mode.id} className="flex items-center space-x-2">
              <RadioGroupItem value={mode.id} id={mode.id} />
              <Label htmlFor={mode.id}>{mode.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Input Fields Based on Mode */}
      {deleteMode === "specific" && (
        <div className="space-y-2">
          <Label htmlFor="specific-indices">{entityName} Indices</Label>
          <Input
            id="specific-indices"
            type="text"
            value={specificIndices}
            onChange={handleSpecificIndicesChange}
            onKeyPress={handleKeyPress}
            placeholder={`e.g., 0,5,10-15,...`}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Use commas to separate indices and hyphens for ranges (e.g., 1-5)</p>
        </div>
      )}

      {deleteMode === "all" && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            This will delete all {entityName.toLowerCase()} (index {minIndex}-{maxIndex}) from the network unit.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading || (deleteMode === "specific" && !specificIndices.trim())}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete {entityName}
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
              <h4 className="font-medium text-sm">Delete {entityName}</h4>
              <p className="text-sm text-muted-foreground">
                Delete {entityName.toLowerCase()} from unit {unit?.ip_address}.
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
            Delete {entityName}
          </DialogTitle>
          <DialogDescription>
            Delete {entityName.toLowerCase()} from unit {unit?.ip_address} (CAN ID: {unit?.id_can}). Use indices {minIndex}-{maxIndex}.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
