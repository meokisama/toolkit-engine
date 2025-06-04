import React, { useState, useEffect, useCallback, memo } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Clock, Timer, Zap } from "lucide-react";

// Validation ranges for different input types
const VALIDATION_RANGES = {
  HOUR: { min: 0, max: 18 },
  MINUTE: { min: 0, max: 59 },
  SECOND: { min: 0, max: 59 },
  SCHEDULE_HOUR: { min: 0, max: 23 },
  MIN_DIM: { min: 1, max: 30 },
  MAX_DIM: { min: 70, max: 100 },
};

// Memoized Input component with validation
const ValidatedInput = memo(
  ({
    value,
    onChange,
    validationRange,
    className = "w-20",
    placeholder = "0",
  }) => {
    const [localValue, setLocalValue] = useState(value.toString());
    const [isValid, setIsValid] = useState(true);

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value.toString());
    }, [value]);

    const handleChange = useCallback(
      (e) => {
        const inputValue = e.target.value;
        setLocalValue(inputValue);

        // Skip validation for empty string (allow user to clear field)
        if (inputValue === "") {
          setIsValid(true);
          return;
        }

        // Validate input
        const numValue = parseInt(inputValue);
        const isValidNumber =
          !isNaN(numValue) &&
          numValue >= validationRange.min &&
          numValue <= validationRange.max;

        setIsValid(isValidNumber);

        // Only call onChange if valid
        if (isValidNumber) {
          onChange(numValue);
        }
      },
      [onChange, validationRange]
    );

    const handleBlur = useCallback(() => {
      // Reset to valid value on blur if invalid
      if (!isValid) {
        const clampedValue = Math.max(
          validationRange.min,
          Math.min(
            validationRange.max,
            parseInt(localValue) || validationRange.min
          )
        );
        setLocalValue(clampedValue.toString());
        setIsValid(true);
        onChange(clampedValue);
      }
    }, [isValid, localValue, onChange, validationRange]);

    return (
      <Input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${className} ${!isValid ? "border-red-500" : ""}`}
        placeholder={placeholder}
        min={validationRange.min}
        max={validationRange.max}
      />
    );
  }
);

const LightingOutputConfigDialogComponent = ({
  open,
  onOpenChange,
  outputName = "",
  outputType = "",
  initialConfig = {},
  isLoading = false,
  onSave,
}) => {
  // State for all configuration options
  const [config, setConfig] = useState({
    delayOffHours: 0,
    delayOffMinutes: 0,
    delayOffSeconds: 0,
    delayOnHours: 0,
    delayOnMinutes: 0,
    delayOnSeconds: 0,
    minDim: 1,
    maxDim: 100,
    autoTrigger: false,
    scheduleOnHour: 0,
    scheduleOnMinute: 0,
    scheduleOffHour: 0,
    scheduleOffMinute: 0,
  });

  const [loading, setLoading] = useState(false);

  // Check if this is a dimmer output (shows min/max dim options)
  const isDimmerOutput = outputType === "dimmer";

  // Initialize config from props
  useEffect(() => {
    if (
      open &&
      !isLoading &&
      initialConfig !== null &&
      initialConfig !== undefined
    ) {
      setConfig({
        delayOffHours: initialConfig.delayOffHours || 0,
        delayOffMinutes: initialConfig.delayOffMinutes || 0,
        delayOffSeconds: initialConfig.delayOffSeconds || 0,
        delayOnHours: initialConfig.delayOnHours || 0,
        delayOnMinutes: initialConfig.delayOnMinutes || 0,
        delayOnSeconds: initialConfig.delayOnSeconds || 0,
        minDim: initialConfig.minDim || 1,
        maxDim: initialConfig.maxDim || 100,
        autoTrigger: initialConfig.autoTrigger || false,
        scheduleOnHour: initialConfig.scheduleOnHour || 0,
        scheduleOnMinute: initialConfig.scheduleOnMinute || 0,
        scheduleOffHour: initialConfig.scheduleOffHour || 0,
        scheduleOffMinute: initialConfig.scheduleOffMinute || 0,
      });
    }
  }, [open, initialConfig, isLoading]);

  // Handlers
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      await onSave(config);
      handleClose();
    } catch (error) {
      console.error("Failed to save lighting output configuration:", error);
    } finally {
      setLoading(false);
    }
  }, [config, onSave, handleClose]);

  // Generic update handler to replace 12 individual handlers
  const updateConfig = useCallback((field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Lighting Output Configuration
          </DialogTitle>
          <DialogDescription>
            Configure timing and dimming settings for {outputName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            // Loading skeleton
            <>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {isDimmerOutput && (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Delay Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Timer className="h-4 w-4" />
                    Delay Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delay Off Output */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Delay off output:
                    </Label>
                    <div className="flex items-center gap-2">
                      <ValidatedInput
                        value={config.delayOffHours}
                        onChange={(value) =>
                          updateConfig("delayOffHours", value)
                        }
                        validationRange={VALIDATION_RANGES.HOUR}
                        className="w-20"
                      />
                      <Label className="text-sm">hours</Label>

                      <ValidatedInput
                        value={config.delayOffMinutes}
                        onChange={(value) =>
                          updateConfig("delayOffMinutes", value)
                        }
                        validationRange={VALIDATION_RANGES.MINUTE}
                        className="w-20"
                      />
                      <Label className="text-sm">mins</Label>

                      <ValidatedInput
                        value={config.delayOffSeconds}
                        onChange={(value) =>
                          updateConfig("delayOffSeconds", value)
                        }
                        validationRange={VALIDATION_RANGES.SECOND}
                        className="w-20"
                      />
                      <Label className="text-sm">secs</Label>
                    </div>
                  </div>

                  {/* Delay On Output */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Delay on output:
                    </Label>
                    <div className="flex items-center gap-2">
                      <ValidatedInput
                        value={config.delayOnHours}
                        onChange={(value) =>
                          updateConfig("delayOnHours", value)
                        }
                        validationRange={VALIDATION_RANGES.HOUR}
                        className="w-20"
                      />
                      <Label className="text-sm">hours</Label>

                      <ValidatedInput
                        value={config.delayOnMinutes}
                        onChange={(value) =>
                          updateConfig("delayOnMinutes", value)
                        }
                        validationRange={VALIDATION_RANGES.MINUTE}
                        className="w-20"
                      />
                      <Label className="text-sm">mins</Label>

                      <ValidatedInput
                        value={config.delayOnSeconds}
                        onChange={(value) =>
                          updateConfig("delayOnSeconds", value)
                        }
                        validationRange={VALIDATION_RANGES.SECOND}
                        className="w-20"
                      />
                      <Label className="text-sm">secs</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dimming Configuration - Only for dimmer outputs */}
              {isDimmerOutput && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4" />
                      Dimming Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Min Dim (%)
                        </Label>
                        <ValidatedInput
                          value={config.minDim}
                          onChange={(value) => updateConfig("minDim", value)}
                          validationRange={VALIDATION_RANGES.MIN_DIM}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Max Dim (%)
                        </Label>
                        <ValidatedInput
                          value={config.maxDim}
                          onChange={(value) => updateConfig("maxDim", value)}
                          validationRange={VALIDATION_RANGES.MAX_DIM}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoTrigger"
                        checked={config.autoTrigger}
                        onCheckedChange={(checked) =>
                          updateConfig("autoTrigger", checked)
                        }
                      />
                      <Label
                        htmlFor="autoTrigger"
                        className="text-sm font-medium"
                      >
                        Auto trigger
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Schedule Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    Schedule Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Schedule On */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Schedule on at:
                    </Label>
                    <div className="flex items-center gap-2">
                      <ValidatedInput
                        value={config.scheduleOnHour}
                        onChange={(value) =>
                          updateConfig("scheduleOnHour", value)
                        }
                        validationRange={VALIDATION_RANGES.SCHEDULE_HOUR}
                        className="w-20"
                      />
                      <Label className="text-sm">hour</Label>

                      <ValidatedInput
                        value={config.scheduleOnMinute}
                        onChange={(value) =>
                          updateConfig("scheduleOnMinute", value)
                        }
                        validationRange={VALIDATION_RANGES.MINUTE}
                        className="w-20"
                      />
                      <Label className="text-sm">min</Label>
                    </div>
                  </div>

                  {/* Schedule Off */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Schedule off at:
                    </Label>
                    <div className="flex items-center gap-2">
                      <ValidatedInput
                        value={config.scheduleOffHour}
                        onChange={(value) =>
                          updateConfig("scheduleOffHour", value)
                        }
                        validationRange={VALIDATION_RANGES.SCHEDULE_HOUR}
                        className="w-20"
                      />
                      <Label className="text-sm">hour</Label>

                      <ValidatedInput
                        value={config.scheduleOffMinute}
                        onChange={(value) =>
                          updateConfig("scheduleOffMinute", value)
                        }
                        validationRange={VALIDATION_RANGES.MINUTE}
                        className="w-20"
                      />
                      <Label className="text-sm">min</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading || isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || isLoading}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Shallow comparison for initialConfig object
const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
};

// Export memoized component for optimal performance
export const LightingOutputConfigDialog = memo(
  LightingOutputConfigDialogComponent,
  (prevProps, nextProps) => {
    // Optimized comparison function without expensive JSON.stringify
    return (
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.outputName === nextProps.outputName &&
      prevProps.outputType === nextProps.outputType &&
      shallowEqual(prevProps.initialConfig, nextProps.initialConfig)
    );
  }
);
