import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Settings,
  X,
  Copy,
  Clock,
  Lightbulb,
  Zap,
} from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  RAMP_OPTIONS,
  LED_DISPLAY_MODES,
  calculateDelaySeconds,
  parseDelaySeconds,
  calculateLedStatus,
  parseLedStatus,
  getRlcOptionsConfig,
  getInputFunctionByValue,
} from "@/constants";

// Performance optimization constants
const PERFORMANCE_THRESHOLD = 20; // Show warning for large group lists

// Memoized group item component for better performance
const GroupItem = memo(
  ({
    group,
    index,
    lightingItem,
    lightingOptions,
    usePercentage,
    onGroupChange,
    onValueChange,
    onRemoveGroup,
  }) => {
    const handleGroupChange = useCallback(
      (value) => {
        onGroupChange(index, value ? parseInt(value) : null);
      },
      [index, onGroupChange]
    );

    const handleValueChange = useCallback(
      (e) => {
        onValueChange(index, e.target.value);
      },
      [index, onValueChange]
    );

    const handleRemove = useCallback(() => {
      onRemoveGroup(index);
    }, [index, onRemoveGroup]);

    return (
      <div
        key={index}
        className="flex items-center gap-3 p-3 border rounded-lg"
      >
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">
            {lightingItem
              ? `${lightingItem.name || "Unnamed"} (${lightingItem.address})`
              : `Group ${index + 1}`}
          </Label>
          <Combobox
            options={lightingOptions}
            value={group.lightingId?.toString() || ""}
            onValueChange={handleGroupChange}
            placeholder="Select lighting group..."
            emptyText="No lighting found"
          />
        </div>
        <div className="w-24 space-y-2">
          <Label className="text-sm text-muted-foreground">
            {usePercentage ? "Percent" : "Raw Value"}
          </Label>
          <input
            type="number"
            min={usePercentage ? 0 : 0}
            max={usePercentage ? 100 : 255}
            value={usePercentage ? group.presetPercent : group.preset}
            onChange={handleValueChange}
            className="w-full px-2 py-1 text-sm border rounded"
            placeholder={usePercentage ? "0-100" : "0-255"}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

GroupItem.displayName = "GroupItem";

// Memoized available group item component
const AvailableGroupItem = memo(({ item, onAddFromAvailable }) => {
  const handleAdd = useCallback(() => {
    onAddFromAvailable(item);
  }, [item, onAddFromAvailable]);

  return (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 border rounded-lg"
    >
      <div>
        <div className="font-medium text-sm">
          {item.name || `Group ${item.address}`}
        </div>
        <div className="text-xs text-muted-foreground">
          Address: {item.address}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
      </div>
      <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
});

AvailableGroupItem.displayName = "AvailableGroupItem";

export function MultiGroupConfigDialog({
  open,
  onOpenChange,
  inputName = "",
  functionName = "",
  functionValue = null,
  unitType = null,
  initialGroups = [],
  initialRlcOptions = {},
  isLoading = false,
  onSave = () => {},
}) {
  const { projectItems } = useProjectDetail();
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [usePercentage, setUsePercentage] = useState(false);

  // RLC Options state
  const [rlcOptions, setRlcOptions] = useState({
    ramp: 0,
    preset: 255,
    ledDisplay: 0,
    nightlight: false,
    backlight: false,
    autoMode: false,
    delayOff: {
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  });

  // Load lighting items from projectItems
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems]);

  // Determine which RLC options should be enabled based on function
  const rlcOptionsConfig = useMemo(() => {
    if (functionValue !== null) {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (inputFunction) {
        return getRlcOptionsConfig(inputFunction.name, unitType);
      }
    }
    // Default configuration if no function is specified
    return getRlcOptionsConfig(null, unitType);
  }, [functionValue, unitType]);

  // Check if current function is a multiple group function
  const isMultipleGroupFunction = useMemo(() => {
    if (functionValue !== null) {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (inputFunction) {
        return rlcOptionsConfig.multiGroupEnabled;
      }
    }
    return false;
  }, [functionValue, rlcOptionsConfig.multiGroupEnabled]);

  // Prepare combobox options
  const lightingOptions = useMemo(() => {
    return lightingItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [lightingItems]);

  // Initialize selected groups and RLC options
  useEffect(() => {
    if (
      open &&
      !isLoading &&
      initialGroups !== null &&
      initialGroups !== undefined &&
      initialRlcOptions !== null &&
      initialRlcOptions !== undefined
    ) {
      // Initialize with enhanced data structure including preset values
      const enhancedGroups = (initialGroups || []).map((group) => ({
        lightingId: group.lightingId,
        value: group.value || "100",
        preset: group.preset || 255, // Raw value (0-255)
        presetPercent: group.presetPercent || 100, // Percentage value (0-100%)
      }));
      setSelectedGroups(enhancedGroups);
      setUsePercentage(false); // Default to raw values

      // Initialize RLC options from initialRlcOptions
      const delaySeconds = initialRlcOptions.delayOff || 0;
      const delayTime = parseDelaySeconds(delaySeconds);
      const ledStatusParsed = parseLedStatus(initialRlcOptions.ledStatus || 0);

      setRlcOptions({
        ramp: initialRlcOptions.ramp || 0,
        preset: initialRlcOptions.preset || 255,
        ledDisplay: ledStatusParsed.displayMode,
        nightlight: ledStatusParsed.nightlight,
        backlight: ledStatusParsed.backlight,
        autoMode: initialRlcOptions.autoMode || false,
        delayOff: delayTime,
      });
    }
  }, [open, initialGroups, initialRlcOptions, isLoading]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    // Calculate LED status from display mode and flags
    const ledStatus = calculateLedStatus(
      rlcOptions.ledDisplay,
      rlcOptions.nightlight,
      rlcOptions.backlight
    );

    // Calculate delay off in seconds
    const delayOffSeconds = calculateDelaySeconds(
      rlcOptions.delayOff.hours,
      rlcOptions.delayOff.minutes,
      rlcOptions.delayOff.seconds
    );

    // Prepare data to save
    const saveData = {
      // Only include groups if this is a multiple group function
      groups: isMultipleGroupFunction ? selectedGroups : [],
      rlcOptions: {
        ramp: rlcOptions.ramp,
        preset: rlcOptions.preset,
        ledStatus: ledStatus,
        autoMode: rlcOptions.autoMode,
        delayOff: delayOffSeconds,
      },
    };

    onSave(saveData);
    handleClose();
  }, [
    selectedGroups,
    rlcOptions,
    isMultipleGroupFunction,
    onSave,
    handleClose,
  ]);

  const handleRemoveGroup = useCallback((index) => {
    setSelectedGroups((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGroupChange = useCallback((index, lightingId) => {
    setSelectedGroups((prev) =>
      prev.map((group, i) => (i === index ? { ...group, lightingId } : group))
    );
  }, []);

  const handleValueChange = useCallback(
    (index, value) => {
      setSelectedGroups((prev) =>
        prev.map((group, i) => {
          if (i === index) {
            const numValue = parseInt(value) || 0;
            if (usePercentage) {
              // Update percentage and calculate raw value
              const clampedPercent = Math.max(0, Math.min(100, numValue));
              const rawValue = Math.round((clampedPercent * 255) / 100);
              return {
                ...group,
                value: value,
                presetPercent: clampedPercent,
                preset: rawValue,
              };
            } else {
              // Update raw value and calculate percentage
              const clampedRaw = Math.max(0, Math.min(255, numValue));
              const percentValue = Math.round((clampedRaw * 100) / 255);
              return {
                ...group,
                value: value,
                preset: clampedRaw,
                presetPercent: percentValue,
              };
            }
          }
          return group;
        })
      );
    },
    [usePercentage]
  );

  // Get available lighting groups (not yet selected)
  const availableLightingGroups = useMemo(() => {
    const selectedIds = new Set(
      selectedGroups.map((group) => group.lightingId).filter(Boolean)
    );
    return lightingItems.filter((item) => !selectedIds.has(item.id));
  }, [lightingItems, selectedGroups]);

  // Add group from available list
  const handleAddFromAvailable = useCallback(
    (lightingItem) => {
      const newGroup = {
        lightingId: lightingItem.id,
        value: usePercentage ? "100%" : "255",
        preset: 255, // Default to max brightness
        presetPercent: 100,
      };
      setSelectedGroups((prev) => [...prev, newGroup]);
    },
    [usePercentage]
  );

  // Add all available groups
  const handleAddAllGroups = useCallback(() => {
    const newGroups = availableLightingGroups.map((item) => ({
      lightingId: item.id,
      value: usePercentage ? "100%" : "255",
      preset: 255,
      presetPercent: 100,
    }));
    setSelectedGroups((prev) => [...prev, ...newGroups]);
  }, [availableLightingGroups, usePercentage]);

  // Clear all groups
  const handleClearAllGroups = useCallback(() => {
    setSelectedGroups([]);
  }, []);

  // Toggle percentage display
  const handleTogglePercentage = useCallback((checked) => {
    setUsePercentage(checked);
    // Update display values for all groups
    setSelectedGroups((prev) =>
      prev.map((group) => ({
        ...group,
        value: checked ? `${group.presetPercent}%` : group.preset.toString(),
      }))
    );
  }, []);

  // RLC Options handlers
  const handleRlcOptionChange = useCallback((field, value) => {
    setRlcOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDelayOffChange = useCallback(
    (field, value) => {
      let validatedValue = parseInt(value) || 0;

      // Validate based on field type
      if (field === "hours") {
        validatedValue = Math.max(0, Math.min(18, validatedValue));
      } else if (field === "minutes") {
        const maxMinutes = rlcOptions.delayOff.hours === 18 ? 11 : 59;
        validatedValue = Math.max(0, Math.min(maxMinutes, validatedValue));
      } else if (field === "seconds") {
        validatedValue = Math.max(0, Math.min(59, validatedValue));
      }

      setRlcOptions((prev) => ({
        ...prev,
        delayOff: {
          ...prev.delayOff,
          [field]: validatedValue,
        },
      }));
    },
    [rlcOptions.delayOff.hours]
  );

  // Performance monitoring
  const performanceWarning = useMemo(() => {
    const totalGroups = selectedGroups.length + availableLightingGroups.length;
    return totalGroups > PERFORMANCE_THRESHOLD;
  }, [selectedGroups.length, availableLightingGroups.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-6xl max-h-[95vh] overflow-y-auto"
        aria-describedby="multi-group-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isMultipleGroupFunction
              ? "Multiple Group & RLC Configuration"
              : "RLC Configuration"}
          </DialogTitle>
          <DialogDescription id="multi-group-description">
            {isMultipleGroupFunction
              ? `Configure multiple lighting groups and RLC options for ${inputName} - ${functionName}`
              : `Configure RLC options for ${inputName} - ${functionName}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          // Loading skeleton
          <>
            {isMultipleGroupFunction && (
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-80" />
              </div>
            )}

            <Card>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isMultipleGroupFunction && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                          <div className="w-24 space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Percentage Toggle - Only show for multiple group functions */}
            {isMultipleGroupFunction && (
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="percentage-toggle"
                  checked={usePercentage}
                  onCheckedChange={handleTogglePercentage}
                />
                <Label
                  htmlFor="percentage-toggle"
                  className="text-sm font-medium"
                >
                  Show values as percentage (0-100%) instead of raw values
                  (0-255)
                </Label>
              </div>
            )}

            {/* RLC Options Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ramp */}
              <Card>
                <CardContent className="space-y-2">
                  <Label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      !rlcOptionsConfig.rampEnabled
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    1. Ramp Time
                  </Label>
                  <Select
                    value={rlcOptions.ramp.toString()}
                    onValueChange={(value) =>
                      handleRlcOptionChange("ramp", parseInt(value))
                    }
                    disabled={!rlcOptionsConfig.rampEnabled}
                  >
                    <SelectTrigger
                      className={
                        !rlcOptionsConfig.rampEnabled
                          ? "opacity-50 w-full"
                          : "w-full"
                      }
                    >
                      <SelectValue placeholder="Select ramp time..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RAMP_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-4">
                  {/* LED Display Mode */}
                  <div className="space-y-2">
                    <Label
                      className={`text-sm font-medium ${
                        !rlcOptionsConfig.ledDisplayEnabled
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      2. LED Display
                    </Label>
                    <Select
                      value={rlcOptions.ledDisplay.toString()}
                      onValueChange={(value) =>
                        handleRlcOptionChange("ledDisplay", parseInt(value))
                      }
                      disabled={!rlcOptionsConfig.ledDisplayEnabled}
                    >
                      <SelectTrigger
                        className={
                          !rlcOptionsConfig.ledDisplayEnabled
                            ? "opacity-50 w-full"
                            : "w-full"
                        }
                      >
                        <SelectValue placeholder="Select LED display mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LED_DISPLAY_MODES.map((mode) => (
                          <SelectItem
                            key={mode.value}
                            value={mode.value.toString()}
                          >
                            {mode.label} - {mode.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* LED Options */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nightlight"
                        checked={rlcOptions.nightlight}
                        onCheckedChange={(checked) =>
                          handleRlcOptionChange("nightlight", checked)
                        }
                        disabled={!rlcOptionsConfig.nightlightEnabled}
                      />
                      <Label
                        htmlFor="nightlight"
                        className={`text-sm ${
                          !rlcOptionsConfig.nightlightEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        NightLight
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="backlight"
                        checked={rlcOptions.backlight}
                        onCheckedChange={(checked) =>
                          handleRlcOptionChange("backlight", checked)
                        }
                        disabled={!rlcOptionsConfig.backlightEnabled}
                      />
                      <Label
                        htmlFor="backlight"
                        className={`text-sm ${
                          !rlcOptionsConfig.backlightEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        BackLight
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-mode"
                        checked={rlcOptions.autoMode}
                        onCheckedChange={(checked) =>
                          handleRlcOptionChange("autoMode", checked)
                        }
                        disabled={!rlcOptionsConfig.autoModeEnabled}
                      />
                      <Label
                        htmlFor="auto-mode"
                        className={`text-sm ${
                          !rlcOptionsConfig.autoModeEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        Auto Mode
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Preset */}
              <Card>
                <CardContent className="space-y-2">
                  <Label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      !rlcOptionsConfig.presetEnabled
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    3. Preset
                  </Label>
                  <div className="flex gap-6">
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={rlcOptions.preset}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const clampedValue = Math.max(0, Math.min(255, value));
                        handleRlcOptionChange("preset", clampedValue);
                      }}
                      placeholder="0-255"
                      className="text-center w-1/2"
                      disabled={!rlcOptionsConfig.presetEnabled}
                    />
                    <Label className="text-sm">or</Label>
                    <div className="relative w-1/2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round((rlcOptions.preset * 100) / 255)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clampedValue = Math.max(
                            0,
                            Math.min(100, value)
                          );
                          const rawValue = Math.round(
                            (clampedValue * 255) / 100
                          );
                          handleRlcOptionChange("preset", rawValue);
                        }}
                        placeholder="0-100"
                        className="text-center pl-8"
                        disabled={!rlcOptionsConfig.presetEnabled}
                      />
                      <Label className="text-sm absolute left-2 top-1/2 transform -translate-y-1/2">
                        %
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Delay Off Section */}
              <Card>
                <CardContent className="space-y-2">
                  <Label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      !rlcOptionsConfig.delayOffEnabled
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    4. Delay Off
                  </Label>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="18"
                        value={rlcOptions.delayOff.hours}
                        onChange={(e) =>
                          handleDelayOffChange("hours", e.target.value)
                        }
                        placeholder="0"
                        className="text-center"
                        disabled={!rlcOptionsConfig.delayOffEnabled}
                      />
                      <Label className="text-sm">hours</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={rlcOptions.delayOff.hours === 18 ? "11" : "59"}
                        value={rlcOptions.delayOff.minutes}
                        onChange={(e) =>
                          handleDelayOffChange("minutes", e.target.value)
                        }
                        placeholder="0"
                        className="text-center"
                        disabled={!rlcOptionsConfig.delayOffEnabled}
                      />
                      <Label className="text-sm">mins</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={rlcOptions.delayOff.seconds}
                        onChange={(e) =>
                          handleDelayOffChange("seconds", e.target.value)
                        }
                        placeholder="0"
                        className="text-center"
                        disabled={!rlcOptionsConfig.delayOffEnabled}
                      />
                      <Label className="text-sm">secs</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Separator className="my-4" />
            {/* Multiple Groups Configuration - Only show for multiple group functions */}
            {isMultipleGroupFunction && (
              <div className="grid grid-cols-2 gap-4">
                {/* Selected Groups - Left Side */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">
                      Selected Groups
                      <Badge variant="secondary" className="ml-2">
                        {selectedGroups.length} Groups
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddAllGroups}
                        disabled={availableLightingGroups.length === 0}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Add All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllGroups}
                        disabled={selectedGroups.length === 0}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedGroups.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {selectedGroups.map((group, index) => {
                            const lightingItem = lightingItems.find(
                              (item) => item.id === group.lightingId
                            );
                            return (
                              <GroupItem
                                key={index}
                                group={group}
                                index={index}
                                lightingItem={lightingItem}
                                lightingOptions={lightingOptions}
                                usePercentage={usePercentage}
                                onGroupChange={handleGroupChange}
                                onValueChange={handleValueChange}
                                onRemoveGroup={handleRemoveGroup}
                              />
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          No Groups Selected
                        </p>
                        <p className="text-sm mb-4">
                          Select lighting groups from the available list on the
                          right.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Groups - Right Side */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Available Groups
                      <Badge variant="outline" className="ml-2">
                        {availableLightingGroups.length} Available
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-4">
                        {availableLightingGroups.length > 0 ? (
                          availableLightingGroups.map((item) => (
                            <AvailableGroupItem
                              key={item.id}
                              item={item}
                              onAddFromAvailable={handleAddFromAvailable}
                            />
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <p className="text-sm">No available groups</p>
                            <p className="text-xs">
                              All lighting groups have been selected
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
