import React, { useMemo, useCallback, memo, useEffect, useRef } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { MultiGroupConfigDialog } from "../input-config-dialog";
import { LightingOutputConfigDialog } from "../lighting-output-config-dialog";
import { ACOutputConfigDialog } from "../ac-output-config-dialog";

// Import optimized components and hooks
import { InputConfigItem } from "./input-config-item";
import { OutputConfigItem } from "./output-config-item";
import { LoadingSkeleton } from "./loading-skeleton";
import { useIOConfig } from "./hooks/use-io-config";
import { useInputConfig } from "./hooks/use-input-config";
import { useOutputConfig } from "./hooks/use-output-config";

// Performance optimization constants
const PERFORMANCE_THRESHOLD = 50; // Show warning for large lists

const IOConfigDialogComponent = ({ open, onOpenChange, item = null }) => {
  const { projectItems, updateItem } = useProjectDetail();

  // Use custom hooks for better organization
  const {
    inputConfigs,
    outputConfigs,
    setInputConfigs,
    setOutputConfigs,
    ioSpec,
    loading,
    isInitialLoading,
    saveConfig,
    reloadAllInputConfigs,
  } = useIOConfig(item, open);

  const {
    multiGroupConfigs,
    rlcConfigs,
    multiGroupDialogOpen,
    setMultiGroupDialogOpen,
    currentMultiGroupInput,
    loadingInputConfig,
    handleInputLightingChange,
    handleInputFunctionChange,
    handleOpenMultiGroupConfig,
    handleSaveMultiGroupConfig,
  } = useInputConfig(item, setInputConfigs);

  const {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
  } = useOutputConfig(item);

  // Memoize lighting and aircon items to prevent unnecessary re-renders
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems?.lighting]);

  const airconItems = useMemo(() => {
    return projectItems?.aircon || [];
  }, [projectItems?.aircon]);

  // Track previous multiGroupDialogOpen state to detect when it closes
  const prevMultiGroupDialogOpen = useRef(multiGroupDialogOpen);

  // Effect to reload input configs when multi-group dialog closes
  useEffect(() => {
    if (prevMultiGroupDialogOpen.current && !multiGroupDialogOpen && item?.id) {
      // Dialog was open and now closed - reload input configs for database units
      if (reloadAllInputConfigs) {
        reloadAllInputConfigs();
      }
    }
    prevMultiGroupDialogOpen.current = multiGroupDialogOpen;
  }, [multiGroupDialogOpen, item?.id, reloadAllInputConfigs]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    const success = await saveConfig(updateItem);
    if (success) {
      handleClose();
    }
  }, [saveConfig, updateItem, handleClose]);

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

  // Device options mapping - restored full dependencies to catch content changes
  const outputDeviceOptionsMap = useMemo(() => {
    if (!outputConfigs.length) return new Map();
    
    const map = new Map();
    outputConfigs.forEach((config) => {
      const deviceOptions = config.type === "ac" ? airconOptions : lightingOptions;
      map.set(config.index, deviceOptions);
    });
    return map;
  }, [outputConfigs, airconOptions, lightingOptions]); // Full arrays as dependencies

  // Enhanced handlers that update local state
  const handleInputLightingChangeWithState = useCallback(
    async (inputIndex, lightingId) => {
      // Update local state immediately for better UX
      setInputConfigs((prev) =>
        prev.map((config) =>
          config.index === inputIndex ? { ...config, lightingId } : config
        )
      );
      // Call the hook handler for database update
      await handleInputLightingChange(inputIndex, lightingId, inputConfigs);
    },
    [handleInputLightingChange, inputConfigs, setInputConfigs]
  );

  const handleInputFunctionChangeWithState = useCallback(
    async (inputIndex, functionValue) => {
      // Update local state immediately for better UX
      setInputConfigs((prev) =>
        prev.map((config) =>
          config.index === inputIndex ? { ...config, functionValue } : config
        )
      );
      // Call the hook handler for database update
      await handleInputFunctionChange(inputIndex, functionValue, inputConfigs);
    },
    [handleInputFunctionChange, inputConfigs, setInputConfigs]
  );

  const handleOutputDeviceChangeWithState = useCallback(
    (outputIndex, deviceId) => {
      // Update local state immediately for better UX
      setOutputConfigs((prev) =>
        prev.map((config) =>
          config.index === outputIndex ? { ...config, deviceId } : config
        )
      );
      // Call the hook handler
      handleOutputDeviceChange(outputIndex, deviceId, setOutputConfigs);
    },
    [handleOutputDeviceChange, setOutputConfigs]
  );

  const handleOpenOutputConfigWithState = useCallback(
    async (outputIndex, outputType) => {
      await handleOpenOutputConfig(outputIndex, outputType, outputConfigs);
    },
    [handleOpenOutputConfig, outputConfigs]
  );

  const handleSaveMultiGroupConfigWithState = useCallback(
    async (data) => {
      try {
        await handleSaveMultiGroupConfig(data, inputConfigs, setInputConfigs);
      } catch (error) {
        console.error(
          "❌ IOConfigDialog - Failed to save multi-group configuration:",
          error
        );
        console.error("❌ IOConfigDialog - Error stack:", error.stack);
        toast.error("Failed to save configuration: " + error.message);
      }
    },
    [handleSaveMultiGroupConfig, inputConfigs, setInputConfigs]
  );

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
            {isInitialLoading ? (
              <LoadingSkeleton />
            ) : ioSpec ? (
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
                              onInputFunctionChange={
                                handleInputFunctionChangeWithState
                              }
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
                              onOutputDeviceChange={
                                handleOutputDeviceChangeWithState
                              }
                              onOpenOutputConfig={
                                handleOpenOutputConfigWithState
                              }
                              isLoadingConfig={false}
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
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading || isInitialLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || isInitialLoading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Group Configuration Dialog */}
      <MultiGroupConfigDialog
        open={multiGroupDialogOpen}
        onOpenChange={setMultiGroupDialogOpen}
        inputName={currentMultiGroupInput?.name || ""}
        functionName={currentMultiGroupInput?.functionName || ""}
        functionValue={currentMultiGroupInput?.functionValue || null}
        unitType={item?.name || null}
        inputIndex={currentMultiGroupInput?.index || 0}
        initialGroups={
          currentMultiGroupInput
            ? multiGroupConfigs[currentMultiGroupInput.index]
            : null
        }
        initialRlcOptions={
          currentMultiGroupInput
            ? rlcConfigs[currentMultiGroupInput.index] || {}
            : {}
        }
        isLoading={
          loadingInputConfig || currentMultiGroupInput?.isLoading || false
        }
        onSave={handleSaveMultiGroupConfigWithState}
      />

      {/* Lighting Output Configuration Dialog */}
      <LightingOutputConfigDialog
        open={lightingOutputDialogOpen}
        onOpenChange={setLightingOutputDialogOpen}
        outputName={currentOutputConfig?.name || ""}
        outputType={currentOutputConfig?.type || ""}
        initialConfig={currentOutputConfig?.config}
        isLoading={currentOutputConfig?.isLoading || false}
        onSave={handleSaveOutputConfig}
      />

      {/* AC Output Configuration Dialog */}
      <ACOutputConfigDialog
        open={acOutputDialogOpen}
        onOpenChange={setACOutputDialogOpen}
        outputName={currentOutputConfig?.name || ""}
        initialConfig={currentOutputConfig?.config}
        lightingOptions={lightingOptions}
        isLoading={currentOutputConfig?.isLoading || false}
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
