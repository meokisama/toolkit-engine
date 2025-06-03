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
import { Settings, Zap, Lightbulb, Fan, Thermometer } from "lucide-react";
import {
  getUnitIOSpec,
  getOutputTypes,
  getInputFunctions,
  getInputFunctionByValue,
  isMultipleGroupFunction,
} from "@/constants";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { MultiGroupConfigDialog } from "./multi-group-config-dialog";
import { LightingOutputConfigDialog } from "./lighting-output-config-dialog";
import { ACOutputConfigDialog } from "./ac-output-config-dialog";
import {
  createDefaultIOConfig,
  cloneIOConfig,
  hasIOConfigChanges,
} from "@/utils/io-config-utils";

// Performance optimization constants
const PERFORMANCE_THRESHOLD = 50; // Show warning for large lists

// Memoized input configuration component for better performance
const InputConfigItem = memo(
  ({
    config,
    unitType,
    lightingOptions,
    multiGroupConfigs,
    onInputLightingChange,
    onInputFunctionChange,
    onOpenMultiGroupConfig,
  }) => {
    // Memoize available functions to prevent recalculation on every render
    const availableFunctions = useMemo(() => {
      return getInputFunctions(unitType, config.index);
    }, [unitType, config.index]);

    const functionOptions = useMemo(() => {
      return availableFunctions.map((func) => ({
        value: func.value.toString(),
        label: func.label,
      }));
    }, [availableFunctions]);

    // Check current function for configuration
    const currentFunction = useMemo(() => {
      return getInputFunctionByValue(config.functionValue);
    }, [config.functionValue]);

    const isMultiGroup = useMemo(() => {
      return currentFunction && isMultipleGroupFunction(currentFunction.name);
    }, [currentFunction]);

    const hasMultiGroupConfig = useMemo(() => {
      return multiGroupConfigs[config.index]?.length > 0;
    }, [multiGroupConfigs, config.index]);

    // Always show config button for all functions (except unused)
    const showConfigButton = useMemo(() => {
      return currentFunction && currentFunction.name !== "IP_UNUSED";
    }, [currentFunction]);

    // Memoized handlers to prevent unnecessary re-renders
    const handleFunctionChange = useCallback(
      (value) => {
        onInputFunctionChange(config.index, parseInt(value));
      },
      [config.index, onInputFunctionChange]
    );

    const handleLightingChange = useCallback(
      (value) => {
        onInputLightingChange(config.index, value ? parseInt(value) : null);
      },
      [config.index, onInputLightingChange]
    );

    const handleMultiGroupClick = useCallback(() => {
      onOpenMultiGroupConfig(config.index, config.functionValue);
    }, [config.index, config.functionValue, onOpenMultiGroupConfig]);

    return (
      <div className="p-4 border rounded-lg flex gap-4 items-center justify-between shadow">
        <Label className="text-sm font-medium">{config.name}</Label>
        <div className="flex items-center gap-2">
          <Combobox
            options={functionOptions}
            value={config.functionValue.toString()}
            onValueChange={handleFunctionChange}
            placeholder="Select function..."
            emptyText="No functions available"
            className="w-56"
          />
          <Button
            variant="outline"
            onClick={handleMultiGroupClick}
            size="icon"
            disabled={showConfigButton ? false : true}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

InputConfigItem.displayName = "InputConfigItem";

// Memoized output configuration component
const OutputConfigItem = memo(
  ({ config, deviceOptions, onOutputDeviceChange, onOpenOutputConfig }) => {
    const isAircon = config.type === "ac";

    const getOutputIcon = useCallback((type) => {
      switch (type) {
        case "relay":
          return <Zap className="h-4 w-4" />;
        case "dimmer":
          return <Lightbulb className="h-4 w-4" />;
        case "ao":
          return <Fan className="h-4 w-4" />;
        case "ac":
          return <Thermometer className="h-4 w-4" />;
        default:
          return <Settings className="h-4 w-4" />;
      }
    }, []);

    const handleDeviceChange = useCallback(
      (value) => {
        onOutputDeviceChange(config.index, value ? parseInt(value) : null);
      },
      [config.index, onOutputDeviceChange]
    );

    const handleConfigClick = useCallback(() => {
      onOpenOutputConfig(config.index, config.type);
    }, [config.index, config.type, onOpenOutputConfig]);

    return (
      <div className="p-4 border rounded-lg flex gap-4 justify-between items-center w-full shadow">
        <Label className="text-sm font-medium">
          {getOutputIcon(config.type)}
          {config.name}
        </Label>
        <div className="flex items-center gap-2">
          <Combobox
            className="w-56"
            options={deviceOptions}
            value={config.deviceId?.toString() || ""}
            onValueChange={handleDeviceChange}
            placeholder={`Select ${isAircon ? "aircon" : "lighting"}...`}
            emptyText={`No ${isAircon ? "aircon" : "lighting"} found`}
          />
          <Button variant="outline" size="icon" onClick={handleConfigClick}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

OutputConfigItem.displayName = "OutputConfigItem";

const IOConfigDialogComponent = ({ open, onOpenChange, item = null }) => {
  const { projectItems, updateItem } = useProjectDetail();

  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [originalIOConfig, setOriginalIOConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Multi-group configuration state
  const [multiGroupDialogOpen, setMultiGroupDialogOpen] = useState(false);
  const [currentMultiGroupInput, setCurrentMultiGroupInput] = useState(null);
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});
  const [rlcConfigs, setRlcConfigs] = useState({}); // Store RLC options for each input

  // Output configuration dialog state
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] =
    useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [outputConfigurations, setOutputConfigurations] = useState({}); // Store output configs

  // Get I/O specifications for the unit - memoized to prevent recalculation
  const ioSpec = useMemo(() => {
    return item?.type ? getUnitIOSpec(item.type) : null;
  }, [item?.type]);

  const outputTypes = useMemo(() => {
    return item?.type ? getOutputTypes(item.type) : [];
  }, [item?.type]);

  // Memoize lighting and aircon items to prevent unnecessary re-renders
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems?.lighting]);

  const airconItems = useMemo(() => {
    return projectItems?.aircon || [];
  }, [projectItems?.aircon]);

  // Helper function to get output label - memoized
  const getOutputLabel = useCallback((type) => {
    switch (type) {
      case "relay":
        return "Relay";
      case "dimmer":
        return "Dimmer";
      case "ao":
        return "Analog";
      case "ac":
        return "Aircon";
      default:
        return type;
    }
  }, []);

  // Memoize input/output configurations initialization to prevent unnecessary recalculations
  const initialInputConfigs = useMemo(() => {
    if (!ioSpec) return [];

    const inputs = [];
    for (let i = 0; i < ioSpec.inputs; i++) {
      inputs.push({
        index: i,
        name: `Input ${i + 1}`,
        lightingId: null,
        functionValue: 0, // Default to "Unused"
      });
    }
    return inputs;
  }, [ioSpec]);

  const initialOutputConfigs = useMemo(() => {
    if (!ioSpec || !outputTypes.length) return [];

    const outputs = [];
    let outputIndex = 0;

    outputTypes.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        outputs.push({
          index: outputIndex++,
          name: `${getOutputLabel(type)} ${i + 1}`,
          type: type,
          deviceId: null,
        });
      }
    });
    return outputs;
  }, [ioSpec, outputTypes, getOutputLabel]);

  // Initialize configurations from database or defaults
  useEffect(() => {
    if (!open || !item) return;

    // Load I/O config from database or create default
    let ioConfig = item.io_config || createDefaultIOConfig(item.type);

    // Migrate old format (outputConfigs separate) to new format (config nested in outputs)
    if (ioConfig.outputConfigs && Array.isArray(ioConfig.outputConfigs)) {
      const migratedOutputs = (ioConfig.outputs || []).map((output) => {
        const outputConfig = ioConfig.outputConfigs.find(
          (config) => config.index === output.index
        );
        if (outputConfig) {
          const { index, ...config } = outputConfig; // Remove index from config
          return { ...output, config };
        }
        return output;
      });

      // Create new config without separate outputConfigs
      ioConfig = {
        inputs: ioConfig.inputs || [],
        outputs: migratedOutputs,
      };
    }

    setOriginalIOConfig(cloneIOConfig(ioConfig));

    // Initialize input configs from database or defaults
    const inputConfigsFromDB = ioConfig.inputs || [];
    const mergedInputConfigs = initialInputConfigs.map((defaultConfig) => {
      const savedConfig = inputConfigsFromDB.find(
        (saved) => saved.index === defaultConfig.index
      );
      return savedConfig
        ? {
            ...defaultConfig,
            lightingId: savedConfig.lightingId,
            functionValue: savedConfig.function || 0,
          }
        : defaultConfig;
    });
    setInputConfigs(mergedInputConfigs);

    // Initialize output configs from database or defaults
    const outputConfigsFromDB = ioConfig.outputs || [];
    const mergedOutputConfigs = initialOutputConfigs.map((defaultConfig) => {
      const savedConfig = outputConfigsFromDB.find(
        (saved) => saved.index === defaultConfig.index
      );
      return savedConfig
        ? {
            ...defaultConfig,
            deviceId: savedConfig.deviceId,
          }
        : defaultConfig;
    });
    setOutputConfigs(mergedOutputConfigs);

    // Initialize multi-group configs and RLC configs
    const multiGroupData = {};
    const rlcData = {};
    inputConfigsFromDB.forEach((input) => {
      if (input.multiGroupConfig && input.multiGroupConfig.length > 0) {
        multiGroupData[input.index] = input.multiGroupConfig;
      }

      // Initialize RLC options for each input
      rlcData[input.index] = {
        ramp: input.ramp || 0,
        preset: input.preset || 255,
        ledStatus: input.led_status || 0,
        autoMode: input.auto_mode || false,
        delayOff: input.delay_off || 0,
      };
    });
    setMultiGroupConfigs(multiGroupData);
    setRlcConfigs(rlcData);

    // Initialize output configurations (now nested in outputs)
    const outputConfigData = {};
    outputConfigsFromDB.forEach((output) => {
      if (output.config) {
        outputConfigData[output.index] = output.config;
      }
    });
    setOutputConfigurations(outputConfigData);
  }, [open, item, initialInputConfigs, initialOutputConfigs]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!item) return;

    setLoading(true);
    try {
      // Build I/O configuration object
      const ioConfig = {
        inputs: inputConfigs.map((config) => {
          const rlcConfig = rlcConfigs[config.index] || {};
          return {
            index: config.index,
            function: config.functionValue,
            lightingId: config.lightingId,
            ramp: rlcConfig.ramp || 0,
            preset: rlcConfig.preset || 255,
            led_status: rlcConfig.ledStatus || 0,
            auto_mode: rlcConfig.autoMode || false,
            auto_time: 0, // Not used in current implementation
            delay_off: rlcConfig.delayOff || 0,
            delay_on: 0, // Not used in current implementation
            multiGroupConfig: multiGroupConfigs[config.index] || [],
          };
        }),
        outputs: outputConfigs.map((config) => ({
          index: config.index,
          name: config.name,
          deviceId: config.deviceId,
          deviceType: config.type === "ac" ? "aircon" : "lighting",
          config: outputConfigurations[config.index] || null,
        })),
      };

      // Check if there are changes
      if (!hasIOConfigChanges(originalIOConfig, ioConfig)) {
        handleClose();
        return;
      }

      // Update unit with new I/O configuration
      await updateItem("unit", item.id, {
        ...item,
        io_config: ioConfig,
      });

      handleClose();
    } catch (error) {
      console.error("Failed to save I/O configuration:", error);
    } finally {
      setLoading(false);
    }
  }, [
    item,
    inputConfigs,
    outputConfigs,
    multiGroupConfigs,
    rlcConfigs,
    outputConfigurations,
    originalIOConfig,
    updateItem,
    handleClose,
  ]);

  // Optimized handlers with useCallback to prevent child re-renders
  const handleInputLightingChange = useCallback((inputIndex, lightingId) => {
    setInputConfigs((prev) =>
      prev.map((config) =>
        config.index === inputIndex ? { ...config, lightingId } : config
      )
    );
  }, []);

  const handleInputFunctionChange = useCallback((inputIndex, functionValue) => {
    setInputConfigs((prev) =>
      prev.map((config) =>
        config.index === inputIndex ? { ...config, functionValue } : config
      )
    );
  }, []);

  const handleOutputDeviceChange = useCallback((outputIndex, deviceId) => {
    setOutputConfigs((prev) =>
      prev.map((config) =>
        config.index === outputIndex ? { ...config, deviceId } : config
      )
    );
  }, []);

  // Output configuration handlers
  const handleOpenOutputConfig = useCallback(
    (outputIndex, outputType) => {
      const outputConfig = outputConfigs.find(
        (config) => config.index === outputIndex
      );
      if (!outputConfig) return;

      setCurrentOutputConfig({
        index: outputIndex,
        name: outputConfig.name,
        type: outputType,
        config: outputConfigurations[outputIndex] || {},
      });

      if (outputType === "ac") {
        setACOutputDialogOpen(true);
      } else {
        setLightingOutputDialogOpen(true);
      }
    },
    [outputConfigs, outputConfigurations]
  );

  const handleSaveOutputConfig = useCallback(
    (configData) => {
      if (!currentOutputConfig) return;

      setOutputConfigurations((prev) => ({
        ...prev,
        [currentOutputConfig.index]: configData,
      }));
    },
    [currentOutputConfig]
  );

  // Multi-group configuration handlers - memoized
  const handleOpenMultiGroupConfig = useCallback(
    (inputIndex, functionValue) => {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (!inputFunction) return;

      setCurrentMultiGroupInput({
        index: inputIndex,
        name: `Input ${inputIndex + 1}`,
        functionName: inputFunction.label,
        functionValue: functionValue,
      });
      setMultiGroupDialogOpen(true);
    },
    []
  );

  const handleSaveMultiGroupConfig = useCallback(
    (data) => {
      if (!currentMultiGroupInput) return;

      // Handle both old format (just groups) and new format (groups + rlcOptions)
      const groups = data.groups || data; // Support backward compatibility
      const rlcOptions = data.rlcOptions || {};

      setMultiGroupConfigs((prev) => ({
        ...prev,
        [currentMultiGroupInput.index]: groups,
      }));

      // Update RLC configs if provided
      if (data.rlcOptions) {
        setRlcConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: rlcOptions,
        }));
      }
    },
    [currentMultiGroupInput]
  );

  // Prepare combobox options - memoized to prevent recalculation
  const lightingOptions = useMemo(() => {
    return lightingItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [lightingItems]);

  const airconOptions = useMemo(() => {
    return airconItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [airconItems]);

  // Memoize device options mapping for outputs to prevent recalculation
  const outputDeviceOptionsMap = useMemo(() => {
    const map = new Map();
    outputConfigs.forEach((config) => {
      const isAircon = config.type === "ac";
      const deviceOptions = isAircon ? airconOptions : lightingOptions;
      map.set(config.index, deviceOptions);
    });
    return map;
  }, [outputConfigs, airconOptions, lightingOptions]);

  // Performance monitoring: Log warning for large lists
  const hasLargeInputList = inputConfigs.length > PERFORMANCE_THRESHOLD;
  const hasLargeOutputList = outputConfigs.length > PERFORMANCE_THRESHOLD;

  // Log performance warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (hasLargeInputList) {
        console.warn(
          `IOConfigDialog: Large input list detected (${inputConfigs.length} items). Consider pagination.`
        );
      }
      if (hasLargeOutputList) {
        console.warn(
          `IOConfigDialog: Large output list detected (${outputConfigs.length} items). Consider pagination.`
        );
      }
    }
  }, [
    hasLargeInputList,
    hasLargeOutputList,
    inputConfigs.length,
    outputConfigs.length,
  ]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[70%] max-h-[90vh] overflow-y-auto"
          aria-describedby="io-config-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              I/O Configuration
            </DialogTitle>
            <DialogDescription id="io-config-description">
              Configure input/output settings for {item?.type || "unit"}:{" "}
              {item?.serial_no || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {ioSpec ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Input Configuration - Left Side */}
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Input Configuration
                      <Badge variant="secondary" className="ml-auto">
                        {ioSpec.inputs} Inputs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      {inputConfigs.length > 0 ? (
                        <div className="space-y-3 pr-4">
                          {inputConfigs.map((config) => (
                            <InputConfigItem
                              key={config.index}
                              config={config}
                              unitType={item?.type}
                              lightingOptions={lightingOptions}
                              multiGroupConfigs={multiGroupConfigs}
                              onInputLightingChange={handleInputLightingChange}
                              onInputFunctionChange={handleInputFunctionChange}
                              onOpenMultiGroupConfig={
                                handleOpenMultiGroupConfig
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <p>No inputs available for this unit type.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Output Configuration - Right Side */}
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Output Configuration
                      <Badge variant="secondary" className="ml-auto">
                        {ioSpec.totalOutputs} Outputs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      {outputConfigs.length > 0 ? (
                        <div className="space-y-3 pr-4">
                          {outputConfigs.map((config) => (
                            <OutputConfigItem
                              key={config.index}
                              config={config}
                              deviceOptions={
                                outputDeviceOptionsMap.get(config.index) || []
                              }
                              onOutputDeviceChange={handleOutputDeviceChange}
                              onOpenOutputConfig={handleOpenOutputConfig}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <p>No outputs available for this unit type.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  No I/O Specifications
                </p>
                <p className="text-sm">
                  Unable to load I/O specifications for this unit type.
                </p>
              </div>
            )}
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

      {/* Multi-Group Configuration Dialog - Rendered outside main dialog to avoid nesting issues */}
      <MultiGroupConfigDialog
        open={multiGroupDialogOpen}
        onOpenChange={setMultiGroupDialogOpen}
        inputName={currentMultiGroupInput?.name || ""}
        functionName={currentMultiGroupInput?.functionName || ""}
        functionValue={currentMultiGroupInput?.functionValue || null}
        unitType={item?.name || null}
        initialGroups={
          currentMultiGroupInput
            ? multiGroupConfigs[currentMultiGroupInput.index] || []
            : []
        }
        initialRlcOptions={
          currentMultiGroupInput
            ? rlcConfigs[currentMultiGroupInput.index] || {}
            : {}
        }
        onSave={handleSaveMultiGroupConfig}
      />

      {/* Lighting Output Configuration Dialog */}
      <LightingOutputConfigDialog
        open={lightingOutputDialogOpen}
        onOpenChange={setLightingOutputDialogOpen}
        outputName={currentOutputConfig?.name || ""}
        outputType={currentOutputConfig?.type || ""}
        initialConfig={currentOutputConfig?.config || {}}
        onSave={handleSaveOutputConfig}
      />

      {/* AC Output Configuration Dialog */}
      <ACOutputConfigDialog
        open={acOutputDialogOpen}
        onOpenChange={setACOutputDialogOpen}
        outputName={currentOutputConfig?.name || ""}
        initialConfig={currentOutputConfig?.config || {}}
        lightingOptions={lightingOptions}
        onSave={handleSaveOutputConfig}
      />
    </>
  );
};

// Export memoized component for optimal performance
export const IOConfigDialog = memo(
  IOConfigDialogComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better memoization
    return (
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.item?.type === nextProps.item?.type &&
      prevProps.item?.serial_no === nextProps.item?.serial_no
    );
  }
);
