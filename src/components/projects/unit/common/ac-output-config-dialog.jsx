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

  // Initialize config from props
  useEffect(() => {
    if (
      open &&
      !isLoading &&
      initialConfig !== null &&
      initialConfig !== undefined
    ) {
      setConfig({
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
        // Basic configuration
        address: parseInt(config.address) || 0,
        enable: config.enable || false,
        windowMode: parseInt(config.windowMode) || 0,
        fanType: parseInt(config.fanType) || 0,
        tempType: parseInt(config.tempType) || 0,
        tempUnit: parseInt(config.tempUnit) || 0,
        valveContact: parseInt(config.valveContact) || 0,
        valveType: parseInt(config.valveType) || 0,
        deadband: parseInt(config.deadband) || 0,
        windowBypass: parseInt(config.windowBypass) || 0,

        // Group assignments
        lowFCU_Group: parseInt(config.lowFCU_Group) || 0,
        medFCU_Group: parseInt(config.medFCU_Group) || 0,
        highFCU_Group: parseInt(config.highFCU_Group) || 0,
        fanAnalogGroup: parseInt(config.fanAnalogGroup) || 0,
        analogCoolGroup: parseInt(config.analogCoolGroup) || 0,
        analogHeatGroup: parseInt(config.analogHeatGroup) || 0,
        valveCoolOpenGroup: parseInt(config.valveCoolOpenGroup) || 0,
        valveCoolCloseGroup: parseInt(config.valveCoolCloseGroup) || 0,
        valveHeatOpenGroup: parseInt(config.valveHeatOpenGroup) || 0,
        valveHeatCloseGroup: parseInt(config.valveHeatCloseGroup) || 0,

        // Power and mode settings
        unoccupyPower: parseInt(config.unoccupyPower) || 0,
        occupyPower: parseInt(config.occupyPower) || 0,
        standbyPower: parseInt(config.standbyPower) || 0,
        unoccupyMode: parseInt(config.unoccupyMode) || 0,
        occupyMode: parseInt(config.occupyMode) || 0,
        standbyMode: parseInt(config.standbyMode) || 0,
        unoccupyFanSpeed: parseInt(config.unoccupyFanSpeed) || 0,
        occupyFanSpeed: parseInt(config.occupyFanSpeed) || 0,
        standbyFanSpeed: parseInt(config.standbyFanSpeed) || 0,

        // Set point values
        unoccupyCoolSetPoint: parseInt(config.unoccupyCoolSetPoint) || 0,
        occupyCoolSetPoint: parseInt(config.occupyCoolSetPoint) || 0,
        standbyCoolSetPoint: parseInt(config.standbyCoolSetPoint) || 0,
        unoccupyHeatSetPoint: parseInt(config.unoccupyHeatSetPoint) || 0,
        occupyHeatSetPoint: parseInt(config.occupyHeatSetPoint) || 0,
        standbyHeatSetPoint: parseInt(config.standbyHeatSetPoint) || 0,
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
