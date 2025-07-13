import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
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
import { Combobox } from "@/components/custom/combobox";
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
  { value: "10", label: "1.0" },
  { value: "15", label: "1.5" },
  { value: "20", label: "2.0" },
  { value: "25", label: "2.5" },
  { value: "30", label: "3.0" },
  { value: "35", label: "3.5" },
  { value: "40", label: "4.0" },
  { value: "45", label: "4.5" },
  { value: "50", label: "5.0" },
  { value: "55", label: "5.5" },
  { value: "60", label: "6.0" },
  { value: "65", label: "6.5" },
  { value: "70", label: "7.0" },
  { value: "75", label: "7.5" },
  { value: "80", label: "8.0" },
  { value: "85", label: "8.5" },
  { value: "90", label: "9.0" },
  { value: "95", label: "9.5" },
  { value: "100", label: "10" },
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
  airconOptions = [],
  isLoading = false,
  onSave,
}) => {
  // State for all AC configuration options (64-byte structure)
  const [config, setConfig] = useState({
    // Basic configuration
    address: 0,
    enable: false,
    windowMode: "0",
    fanType: "0",
    tempType: "0",
    tempUnit: "0",
    valveContact: "0",
    valveType: "0",
    deadband: 0,
    windowBypass: "0",
    setPointOffset: 0,

    // Group assignments
    lowFCU_Group: 0,
    medFCU_Group: 0,
    highFCU_Group: 0,
    fanAnalogGroup: 0,
    analogCoolGroup: 0,
    analogHeatGroup: 0,
    valveCoolOpenGroup: 0,
    valveCoolCloseGroup: 0,
    valveHeatOpenGroup: 0,
    valveHeatCloseGroup: 0,

    // Power and mode settings
    unoccupyPower: 0,
    occupyPower: 0,
    standbyPower: 0,
    unoccupyMode: 0,
    occupyMode: 0,
    standbyMode: 0,
    unoccupyFanSpeed: 0,
    occupyFanSpeed: 0,
    standbyFanSpeed: 0,

    // Set point values
    unoccupyCoolSetPoint: 0,
    occupyCoolSetPoint: 0,
    standbyCoolSetPoint: 0,
    unoccupyHeatSetPoint: 0,
    occupyHeatSetPoint: 0,
    standbyHeatSetPoint: 0,
  });

  const [loading, setLoading] = useState(false);

  // Memoize config processing to avoid expensive recreation
  const processedConfig = useMemo(() => {
    if (!initialConfig) return null;
    
    return {
      // Basic configuration
      address: initialConfig.address || 0,
      enable: initialConfig.enable || false,
      windowMode: initialConfig.windowMode?.toString() || "0",
      fanType: initialConfig.fanType?.toString() || "0",
      tempType: initialConfig.tempType?.toString() || "0",
      tempUnit: initialConfig.tempUnit?.toString() || "0",
      valveContact: initialConfig.valveContact?.toString() || "0",
      valveType: initialConfig.valveType?.toString() || "0",
      deadband: initialConfig.deadband || 0,
      windowBypass: initialConfig.windowBypass?.toString() || "0",
      setPointOffset: initialConfig.setPointOffset || 0,

      // Group assignments
      lowFCU_Group: initialConfig.lowFCU_Group || 0,
      medFCU_Group: initialConfig.medFCU_Group || 0,
      highFCU_Group: initialConfig.highFCU_Group || 0,
      fanAnalogGroup: initialConfig.fanAnalogGroup || 0,
      analogCoolGroup: initialConfig.analogCoolGroup || 0,
      analogHeatGroup: initialConfig.analogHeatGroup || 0,
      valveCoolOpenGroup: initialConfig.valveCoolOpenGroup || 0,
      valveCoolCloseGroup: initialConfig.valveCoolCloseGroup || 0,
      valveHeatOpenGroup: initialConfig.valveHeatOpenGroup || 0,
      valveHeatCloseGroup: initialConfig.valveHeatCloseGroup || 0,

      // Power and mode settings
      unoccupyPower: initialConfig.unoccupyPower || 0,
      occupyPower: initialConfig.occupyPower || 0,
      standbyPower: initialConfig.standbyPower || 0,
      unoccupyMode: initialConfig.unoccupyMode || 0,
      occupyMode: initialConfig.occupyMode || 0,
      standbyMode: initialConfig.standbyMode || 0,
      unoccupyFanSpeed: initialConfig.unoccupyFanSpeed || 0,
      occupyFanSpeed: initialConfig.occupyFanSpeed || 0,
      standbyFanSpeed: initialConfig.standbyFanSpeed || 0,

      // Set point values
      unoccupyCoolSetPoint: initialConfig.unoccupyCoolSetPoint || 0,
      occupyCoolSetPoint: initialConfig.occupyCoolSetPoint || 0,
      standbyCoolSetPoint: initialConfig.standbyCoolSetPoint || 0,
      unoccupyHeatSetPoint: initialConfig.unoccupyHeatSetPoint || 0,
      occupyHeatSetPoint: initialConfig.occupyHeatSetPoint || 0,
      standbyHeatSetPoint: initialConfig.standbyHeatSetPoint || 0,
    };
  }, [initialConfig]);

  // Initialize config from memoized processed config
  useEffect(() => {
    if (open && !isLoading && processedConfig) {
      setConfig(processedConfig);
    }
  }, [open, processedConfig, isLoading]);

  // Handlers
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Memoize config transformation for better performance
  const configToSave = useMemo(() => {
    const stringFields = [
      'windowMode', 'fanType', 'tempType', 'tempUnit', 'valveContact',
      'valveType', 'windowBypass'
    ];
    
    const result = { ...config };
    
    // Convert string values to integers
    Object.keys(result).forEach(key => {
      if (stringFields.includes(key)) {
        result[key] = parseInt(result[key]) || 0;
      } else if (typeof result[key] === 'string' && !isNaN(result[key])) {
        result[key] = parseInt(result[key]) || 0;
      }
    });
    
    return result;
  }, [config]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      await onSave(configToSave);
      handleClose();
    } catch (error) {
      console.error("Failed to save AC output configuration:", error);
    } finally {
      setLoading(false);
    }
  }, [configToSave, onSave, handleClose]);

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

              {/* Address Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aircon Address</Label>
                <Combobox
                  value={config.address?.toString() || ""}
                  onValueChange={(value) => updateConfig("address", parseInt(value) || 0)}
                  options={airconOptions.map(item => ({
                    value: item.address.toString(),
                    label: `${item.name} (${item.address})`
                  }))}
                  placeholder="Select aircon address..."
                  searchPlaceholder="Search aircon..."
                  emptyText="No aircon found"
                />
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
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Windows mode
                      </Label>
                      <Select
                        value={config.windowMode}
                        onValueChange={(value) =>
                          updateConfig("windowMode", value)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                        <SelectTrigger className="w-full">
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
                        value={config.deadband?.toString() || "0"}
                        onValueChange={(value) =>
                          updateConfig("deadband", parseInt(value) || 0)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                      <Label className="text-sm font-medium">Window Bypass</Label>
                      <Select
                        value={config.windowBypass}
                        onValueChange={(value) =>
                          updateConfig("windowBypass", value)
                        }
                      >
                        <SelectTrigger className="w-full">
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Low fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.lowFCU_Group?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig("lowFCU_Group", value ? parseInt(value) : 0)
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Med fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.medFCU_Group?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig("medFCU_Group", value ? parseInt(value) : 0)
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">High fan</Label>
                      <Combobox
                        options={lightingOptions}
                        value={config.highFCU_Group?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "highFCU_Group",
                            value ? parseInt(value) : 0
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
                        value={config.fanAnalogGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "fanAnalogGroup",
                            value ? parseInt(value) : 0
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
                        value={config.analogCoolGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "analogCoolGroup",
                            value ? parseInt(value) : 0
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
                        value={config.analogHeatGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "analogHeatGroup",
                            value ? parseInt(value) : 0
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
                        value={config.valveCoolOpenGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "valveCoolOpenGroup",
                            value ? parseInt(value) : 0
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
                        value={config.valveCoolCloseGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "valveCoolCloseGroup",
                            value ? parseInt(value) : 0
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
                        value={config.valveHeatOpenGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "valveHeatOpenGroup",
                            value ? parseInt(value) : 0
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
                        value={config.valveHeatCloseGroup?.toString() || ""}
                        onValueChange={(value) =>
                          updateConfig(
                            "valveHeatCloseGroup",
                            value ? parseInt(value) : 0
                          )
                        }
                        placeholder="Select lighting group..."
                        emptyText="No lighting groups found"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    Additional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Set Point Offset</Label>
                      <Select
                        value={config.setPointOffset?.toString() || "0"}
                        onValueChange={(value) =>
                          updateConfig("setPointOffset", parseInt(value) || 0)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 21 }, (_, i) => i - 10).map((offset) => (
                            <SelectItem key={offset} value={offset.toString()}>
                              {offset > 0 ? `+${offset}` : offset.toString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

// Shallow comparison for objects - much faster than JSON.stringify
const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => obj1[key] === obj2[key]);
};

// Export memoized component for optimal performance
export const ACOutputConfigDialog = memo(
  ACOutputConfigDialogComponent,
  (prevProps, nextProps) => {
    // Optimized comparison function without expensive JSON.stringify
    return (
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.outputName === nextProps.outputName &&
      shallowEqual(prevProps.initialConfig, nextProps.initialConfig) &&
      prevProps.lightingOptions.length === nextProps.lightingOptions.length
    );
  }
);
