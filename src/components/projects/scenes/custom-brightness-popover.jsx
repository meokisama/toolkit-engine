import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function CustomBrightnessPopover({ open, onOpenChange, customBrightnessDialog, setCustomBrightnessDialog, onApply }) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="text-xs">
          Custom
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-90">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brightness-percent">Brightness (%)</Label>
              <Input
                id="brightness-percent"
                type="number"
                min={0}
                max={100}
                value={customBrightnessDialog.brightness}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: "",
                      brightness255: "",
                    }));
                    return;
                  }
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    const clampedValue = Math.min(100, Math.max(0, numValue));
                    const value255 = Math.round((clampedValue * 255) / 100);
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: clampedValue,
                      brightness255: value255,
                    }));
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === "" || isNaN(parseInt(value))) {
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: 50,
                      brightness255: 128,
                    }));
                  }
                }}
                placeholder="0-100"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brightness-255">Brightness (0-255)</Label>
              <Input
                id="brightness-255"
                type="number"
                min={0}
                max={255}
                value={customBrightnessDialog.brightness255}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: "",
                      brightness255: "",
                    }));
                    return;
                  }
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    const clampedValue = Math.min(255, Math.max(0, numValue));
                    const percentValue = Math.round((clampedValue * 100) / 255);
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: percentValue,
                      brightness255: clampedValue,
                    }));
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === "" || isNaN(parseInt(value))) {
                    setCustomBrightnessDialog((prev) => ({
                      ...prev,
                      brightness: 50,
                      brightness255: 128,
                    }));
                  }
                }}
                placeholder="0-255"
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Enter in either format. Values will sync automatically.</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setCustomBrightnessDialog({
                  open: false,
                  brightness: 50,
                  brightness255: 128,
                })
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onApply}
              disabled={
                customBrightnessDialog.brightness255 === "" ||
                isNaN(parseInt(customBrightnessDialog.brightness255)) ||
                parseInt(customBrightnessDialog.brightness255) < 0 ||
                parseInt(customBrightnessDialog.brightness255) > 255
              }
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
