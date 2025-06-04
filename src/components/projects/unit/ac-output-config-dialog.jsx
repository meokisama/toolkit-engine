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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Settings, Wind, Gauge } from "lucide-react";

// Configuration options based on WinForms implementation
const WINDOWS_MODE_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "1", label: "Save energy" },
];

const FAN_TYPE_OPTIONS = [
  { value: "0", label: "On/Off" },
  { value: "1", label: "Analog" },
];

const TEMP_TYPE_OPTIONS = [
  { value: "0", label: "Thermostat" },
  { value: "1", label: "RCU" },
];

const TEMP_UNIT_OPTIONS = [
  { value: "0", label: "°C" },
  { value: "1", label: "°F" },
];

const VALVE_CONTACT_OPTIONS = [
  { value: "0", label: "NO" },
  { value: "1", label: "NC" },
];

const VALVE_TYPE_OPTIONS = [
  { value: "0", label: "On/Off" },
  { value: "1", label: "Analog" },
  { value: "2", label: "On and Off" },
];

const DEAD_BAND_OPTIONS = [
  { value: "1.0", label: "1.0" },
  { value: "1.5", label: "1.5" },
  { value: "2.0", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3.0", label: "3.0" },
  { value: "3.5", label: "3.5" },
  { value: "4.0", label: "4.0" },
  { value: "4.5", label: "4.5" },
  { value: "5.0", label: "5.0" },
  { value: "5.5", label: "5.5" },
  { value: "6.0", label: "6.0" },
  { value: "6.5", label: "6.5" },
  { value: "7.0", label: "7.0" },
  { value: "7.5", label: "7.5" },
  { value: "8.0", label: "8.0" },
  { value: "8.5", label: "8.5" },
  { value: "9.0", label: "9.0" },
  { value: "9.5", label: "9.5" },
  { value: "10", label: "10" },
];

const WINDOWS_OPTIONS = [
  { value: "0", label: "Normal" },
  { value: "1", label: "Bypass" },
];

const ACOutputConfigDialogComponent = ({
  open,
  onOpenChange,
  outputName = "",
  initialConfig = {},
  lightingOptions = [],
  isLoading = false,
  onSave,
}) => {
  // State for all AC configuration options
  const [config, setConfig] = useState({
    enable: false,
    windowsMode: "0",
    fanType: "0",
    tempType: "0",
    tempUnit: "0",
    valveContact: "0",
    valveType: "0",
    deadBand: "1.0",
    windows: "0",
    lowFan: null,
    medFan: null,
    highFan: null,
    analogFan: null,
    analogCool: null,
    analogHeat: null,
    coolOpen: null,
    coolClose: null,
    heatOpen: null,
    heatClose: null,
  });

  const [loading, setLoading] = useState(false);

  // Initialize config from props
  useEffect(() => {
    if (
      open &&
      !isLoading &&
      initialConfig !== null &&
      initialConfig !== undefined
    ) {
      setConfig({
        enable: initialConfig.enable || false,
        windowsMode: initialConfig.windowsMode?.toString() || "0",
        fanType: initialConfig.fanType?.toString() || "0",
        tempType: initialConfig.tempType?.toString() || "0",
        tempUnit: initialConfig.tempUnit?.toString() || "0",
        valveContact: initialConfig.valveContact?.toString() || "0",
        valveType: initialConfig.valveType?.toString() || "0",
        deadBand: initialConfig.deadBand?.toString() || "1.0",
        windows: initialConfig.windows?.toString() || "0",
        lowFan: initialConfig.lowFan || null,
        medFan: initialConfig.medFan || null,
        highFan: initialConfig.highFan || null,
        analogFan: initialConfig.analogFan || null,
        analogCool: initialConfig.analogCool || null,
        analogHeat: initialConfig.analogHeat || null,
        coolOpen: initialConfig.coolOpen || null,
        coolClose: initialConfig.coolClose || null,
        heatOpen: initialConfig.heatOpen || null,
        heatClose: initialConfig.heatClose || null,
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
      // Convert string values back to appropriate types
      const configToSave = {
        ...config,
        windowsMode: parseInt(config.windowsMode),
        fanType: parseInt(config.fanType),
        tempType: parseInt(config.tempType),
        tempUnit: parseInt(config.tempUnit),
        valveContact: parseInt(config.valveContact),
        valveType: parseInt(config.valveType),
        deadBand: parseFloat(config.deadBand),
        windows: parseInt(config.windows),
      };

      await onSave(configToSave);
      handleClose();
    } catch (error) {
      console.error("Failed to save AC output configuration:", error);
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            AC Output Configuration
          </DialogTitle>
          <DialogDescription>
            Configure air conditioning settings for {outputName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            // Loading skeleton
            <>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Enable Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable"
                  checked={config.enable}
                  onCheckedChange={(checked) => updateConfig("enable", checked)}
                />
                <Label htmlFor="enable" className="text-sm font-medium">
                  Enable
                </Label>
              </div>

              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    Basic Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Windows mode
                      </Label>
                      <Select
                        value={config.windowsMode}
                        onValueChange={(value) =>
                          updateConfig("windowsMode", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WINDOWS_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fan type</Label>
                      <Select
                        value={config.fanType}
                        onValueChange={(value) =>
                          updateConfig("fanType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FAN_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Temp type</Label>
                      <Select
                        value={config.tempType}
                        onValueChange={(value) =>
                          updateConfig("tempType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMP_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Temp Unit</Label>
                      <Select
                        value={config.tempUnit}
                        onValueChange={(value) =>
                          updateConfig("tempUnit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMP_UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Valve contact
                      </Label>
                      <Select
                        value={config.valveContact}
                        onValueChange={(value) =>
                          updateConfig("valveContact", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALVE_CONTACT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Valve type</Label>
                      <Select
                        value={config.valveType}
                        onValueChange={(value) =>
                          updateConfig("valveType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALVE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dead band</Label>
                      <Select
                        value={config.deadBand}
                        onValueChange={(value) =>
                          updateConfig("deadBand", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAD_BAND_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Windows</Label>
                      <Select
                        value={config.windows}
                        onValueChange={(value) =>
                          updateConfig("windows", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WINDOWS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fan Groups Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wind className="h-4 w-4" />
                    Fan Groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Low fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.lowFan?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig("lowFan", value ? parseInt(value) : null)
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Med fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.medFan?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig("medFan", value ? parseInt(value) : null)
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">High fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.highFan?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "highFan",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Analog fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.analogFan?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "analogFan",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Analog cool</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.analogCool?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "analogCool",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Analog heat</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.analogHeat?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "analogHeat",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valve Groups Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="h-4 w-4" />
                    Valve Groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cool open</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.coolOpen?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "coolOpen",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cool close</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.coolClose?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "coolClose",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Heat open</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.heatOpen?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "heatOpen",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Heat close</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.heatClose?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "heatClose",
                            value ? parseInt(value) : null
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
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

// Export memoized component for optimal performance
export const ACOutputConfigDialog = memo(
  ACOutputConfigDialogComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better memoization
    return (
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.outputName === nextProps.outputName &&
      JSON.stringify(prevProps.initialConfig) ===
        JSON.stringify(nextProps.initialConfig) &&
      JSON.stringify(prevProps.lightingOptions) ===
        JSON.stringify(nextProps.lightingOptions)
    );
  }
);
