import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Clock, Timer, Zap } from "lucide-react";

// Helper function to generate time options
const generateTimeOptions = (max, step = 1) => {
  const options = [];
  for (let i = 0; i <= max; i += step) {
    options.push({ value: i.toString(), label: i.toString() });
  }
  return options;
};

// Time options
const HOUR_OPTIONS = generateTimeOptions(18);
const MINUTE_OPTIONS = generateTimeOptions(59);
const SECOND_OPTIONS = generateTimeOptions(59);
const SCHEDULE_HOUR_OPTIONS = generateTimeOptions(23);
const MIN_DIM_OPTIONS = generateTimeOptions(30, 1).slice(1); // 1-30
const MAX_DIM_OPTIONS = (() => {
  const options = [];
  for (let i = 70; i <= 100; i++) {
    options.push({ value: i.toString(), label: i.toString() });
  }
  return options;
})();

export const LightingOutputConfigDialog = ({
  open,
  onOpenChange,
  outputName = "",
  outputType = "",
  initialConfig = {},
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
  const isDimmerOutput = useMemo(() => {
    return outputType === "dimmer";
  }, [outputType]);

  // Initialize config from props
  useEffect(() => {
    if (open && initialConfig) {
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
  }, [open, initialConfig]);

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

  const updateConfig = useCallback((field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                <Label className="text-sm font-medium">Delay off output:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={config.delayOffHours.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOffHours", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">hours</Label>

                  <Select
                    value={config.delayOffMinutes.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOffMinutes", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">mins</Label>

                  <Select
                    value={config.delayOffSeconds.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOffSeconds", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECOND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">secs</Label>
                </div>
              </div>

              {/* Delay On Output */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Delay on output:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={config.delayOnHours.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOnHours", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">hours</Label>

                  <Select
                    value={config.delayOnMinutes.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOnMinutes", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">mins</Label>

                  <Select
                    value={config.delayOnSeconds.toString()}
                    onValueChange={(value) =>
                      updateConfig("delayOnSeconds", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECOND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Label className="text-sm font-medium">Min Dim (%)</Label>
                    <Select
                      value={config.minDim.toString()}
                      onValueChange={(value) =>
                        updateConfig("minDim", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MIN_DIM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Dim (%)</Label>
                    <Select
                      value={config.maxDim.toString()}
                      onValueChange={(value) =>
                        updateConfig("maxDim", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAX_DIM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Label htmlFor="autoTrigger" className="text-sm font-medium">
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
                <Label className="text-sm font-medium">Schedule on at:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={config.scheduleOnHour.toString()}
                    onValueChange={(value) =>
                      updateConfig("scheduleOnHour", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_HOUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">hour</Label>

                  <Select
                    value={config.scheduleOnMinute.toString()}
                    onValueChange={(value) =>
                      updateConfig("scheduleOnMinute", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">min</Label>
                </div>
              </div>

              {/* Schedule Off */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Schedule off at:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={config.scheduleOffHour.toString()}
                    onValueChange={(value) =>
                      updateConfig("scheduleOffHour", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_HOUR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">hour</Label>

                  <Select
                    value={config.scheduleOffMinute.toString()}
                    onValueChange={(value) =>
                      updateConfig("scheduleOffMinute", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm">min</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
