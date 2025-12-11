import React, { useMemo, useCallback, memo, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { InputDetailConfigDialog } from "../../shared/input-config";
import { LightingOutputConfigDialog } from "../../shared/output-configs/lighting-output-config-dialog";
import { ACOutputConfigDialog } from "../../shared/output-configs/ac-output-config-dialog";
import { ProjectItemDialog } from "@/components/projects/lighting/lighting-dialog";
import { AirconCardDialog } from "@/components/projects/aircon/aircon-card-dialog";

// Import optimized components and hooks
import { InputConfigItem } from "./input-config-item";
import { OutputConfigItem } from "./output-config-item";
import { LoadingSkeleton } from "../../shared/loading-skeleton";
import { useIOConfig } from "./hooks/use-io-config";
import { useInputConfig } from "./hooks/use-input-config";
import { useOutputConfig } from "./hooks/use-output-config";

// Performance optimization constants
const PERFORMANCE_THRESHOLD = 50; // Show warning for large lists

const IOConfigDialogComponent = ({ open, onOpenChange, item = null }) => {
  const { projectItems, updateItem, selectedProject, loadTabData, loadedTabs } = useProjectDetail();

  // Use custom hooks for better organization
  const { inputConfigs, outputConfigs, setInputConfigs, setOutputConfigs, originalInputConfigs, ioSpec, loading, isInitialLoading, saveConfig } =
    useIOConfig(item, open);

  const {
    multiGroupConfigs,
    rlcConfigs,
    multiGroupDialogOpen,
    setInputDetailDialogOpen,
    currentInputDetailInput,
    loadingInputConfig,
    handleInputFunctionChange,
    handleOpenInputDetailConfig,
    handleSaveInputDetailConfig,
    loadAllInputDetailConfigs,
  } = useInputConfig(item, setInputConfigs, open);

  const {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    outputConfigurations,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    loadAllOutputConfigs,
  } = useOutputConfig(item, setOutputConfigs);

  // State for create/edit device dialogs
  const [createEditDialog, setCreateEditDialog] = useState({
    open: false,
    type: null, // 'lighting' or 'aircon'
    mode: "create", // 'create' or 'edit'
    outputIndex: null,
    deviceId: null,
    item: null,
  });

  // Memoize lighting and aircon items to prevent unnecessary re-renders
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems?.lighting]);

  const airconItems = useMemo(() => {
    return projectItems?.aircon || [];
  }, [projectItems?.aircon]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    const success = await saveConfig(updateItem, multiGroupConfigs, rlcConfigs, outputConfigurations);
    if (success) {
      handleClose();
    }
  }, [saveConfig, updateItem, handleClose, multiGroupConfigs, rlcConfigs, outputConfigurations]);

  // Handle create/edit device
  const handleCreateEditDevice = useCallback(
    (outputIndex, outputType, deviceId) => {
      const isAircon = outputType === "ac";
      const deviceType = isAircon ? "aircon" : "lighting";
      const items = isAircon ? airconItems : lightingItems;

      // Find existing item if deviceId is provided
      const existingItem = deviceId ? items.find((item) => item.id === deviceId) : null;

      setCreateEditDialog({
        open: true,
        type: deviceType,
        mode: existingItem ? "edit" : "create",
        outputIndex,
        deviceId,
        item: existingItem,
      });
    },
    [airconItems, lightingItems]
  );

  // Handle dialog close and refresh data
  const handleCreateEditDialogClose = useCallback(
    async (open) => {
      setCreateEditDialog((prev) => ({ ...prev, open }));

      // If dialog is closing and we have a project, refresh the data
      if (!open && selectedProject) {
        const { type } = createEditDialog;
        if (type) {
          await loadTabData(selectedProject.id, type);
        }
      }
    },
    [selectedProject, loadTabData, createEditDialog]
  );

  // Load required data when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      // Load aircon data if not already loaded
      if (!loadedTabs.has("aircon")) {
        loadTabData(selectedProject.id, "aircon");
      }
      // Load lighting data if not already loaded
      if (!loadedTabs.has("lighting")) {
        loadTabData(selectedProject.id, "lighting");
      }
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Load all Multiple Group & RLC configurations and output configurations when dialog opens
  useEffect(() => {
    if (open && item && !isInitialLoading) {
      loadAllInputDetailConfigs();
      loadAllOutputConfigs();
    }
  }, [open, item, isInitialLoading, loadAllInputDetailConfigs, loadAllOutputConfigs]);

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
  const handleInputFunctionChangeWithState = useCallback(
    async (inputIndex, functionValue) => {
      // Call the hook handler which now only updates local state
      await handleInputFunctionChange(inputIndex, functionValue);
    },
    [handleInputFunctionChange]
  );

  const handleOutputDeviceChangeWithState = useCallback(
    (outputIndex, deviceId) => {
      // Update local state immediately for better UX
      setOutputConfigs((prev) => prev.map((config) => (config.index === outputIndex ? { ...config, deviceId } : config)));
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

  const handleSaveInputDetailConfigWithState = useCallback(
    async (data) => {
      try {
        const success = await handleSaveInputDetailConfig(data);
        // Note: Input config state update is already handled in handleSaveInputDetailConfig
        // No need to duplicate the logic here
        return success;
      } catch (error) {
        console.error("❌ IOConfigDialog - Failed to save multi-group configuration:", error);
        console.error("❌ IOConfigDialog - Error stack:", error.stack);
        toast.error("Failed to save configuration: " + error.message);
        return false;
      }
    },
    [handleSaveInputDetailConfig]
  );

  // Performance monitoring: Log warning for large lists
  const hasLargeInputList = inputConfigs.length > PERFORMANCE_THRESHOLD;
  const hasLargeOutputList = outputConfigs.length > PERFORMANCE_THRESHOLD;

  // Log performance warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (hasLargeInputList) {
        console.warn(`IOConfigDialog: Large input list detected (${inputConfigs.length} items). Consider pagination.`);
      }
      if (hasLargeOutputList) {
        console.warn(`IOConfigDialog: Large output list detected (${outputConfigs.length} items). Consider pagination.`);
      }
    }
  }, [hasLargeInputList, hasLargeOutputList, inputConfigs.length, outputConfigs.length]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[70%] max-h-[90vh] overflow-y-auto" aria-describedby="io-config-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              I/O Configuration
            </DialogTitle>
            <DialogDescription id="io-config-description">
              Configure input/output settings for {item?.type || "unit"}: {item?.serial_no || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isInitialLoading ? (
              <LoadingSkeleton />
            ) : ioSpec ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Input Configuration - Left Side */}
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="shrink-0">
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
                          {inputConfigs.map((config) => {
                            // Find the original config for this input
                            const originalConfig = originalInputConfigs.find((orig) => orig.index === config.index);

                            // Create enhanced config with current multi-group and RLC data
                            const currentConfigWithExtras = {
                              ...config,
                              multiGroupConfig: multiGroupConfigs[config.index]?.multiGroupConfig || [],
                              rlcConfig: {
                                ramp: multiGroupConfigs[config.index]?.ramp || rlcConfigs[config.index]?.ramp || 0,
                                preset: multiGroupConfigs[config.index]?.preset || rlcConfigs[config.index]?.preset || 100,
                                ledStatus: multiGroupConfigs[config.index]?.led_status || rlcConfigs[config.index]?.ledStatus || 0,
                                autoMode: multiGroupConfigs[config.index]?.auto_mode || rlcConfigs[config.index]?.autoMode || 0,
                                delayOff: multiGroupConfigs[config.index]?.delay_off || rlcConfigs[config.index]?.delayOff || 0,
                                delayOn: multiGroupConfigs[config.index]?.delay_on || rlcConfigs[config.index]?.delayOn || 0,
                              },
                            };

                            return (
                              <InputConfigItem
                                key={config.index}
                                config={currentConfigWithExtras}
                                unitType={item?.type}
                                originalConfig={originalConfig}
                                onInputFunctionChange={handleInputFunctionChangeWithState}
                                onOpenInputDetailConfig={handleOpenInputDetailConfig}
                              />
                            );
                          })}
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
                  <CardHeader className="shrink-0">
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
                              deviceOptions={outputDeviceOptionsMap.get(config.index) || []}
                              onOutputDeviceChange={handleOutputDeviceChangeWithState}
                              onOpenOutputConfig={handleOpenOutputConfigWithState}
                              onCreateEditDevice={handleCreateEditDevice}
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
                <p className="text-lg font-medium mb-2">No I/O Specifications</p>
                <p className="text-sm">Unable to load I/O specifications for this unit type.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading || isInitialLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || isInitialLoading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Group Configuration Dialog */}
      <InputDetailConfigDialog
        open={multiGroupDialogOpen}
        onOpenChange={setInputDetailDialogOpen}
        inputName={currentInputDetailInput?.name || ""}
        functionName={currentInputDetailInput?.functionName || ""}
        functionValue={currentInputDetailInput?.functionValue || null}
        unitType={item?.type || null}
        inputIndex={currentInputDetailInput?.index || 0}
        initialGroups={currentInputDetailInput?.config?.multiGroupConfig || null}
        initialRlcOptions={
          currentInputDetailInput?.config
            ? {
                ramp: currentInputDetailInput.config.ramp || 0,
                preset: currentInputDetailInput.config.preset || 100,
                ledStatus: currentInputDetailInput.config.led_status || 0,
                autoMode: currentInputDetailInput.config.auto_mode || 0,
                delayOff: currentInputDetailInput.config.delay_off || 0,
                delayOn: currentInputDetailInput.config.delay_on || 0,
              }
            : {}
        }
        isLoading={loadingInputConfig || currentInputDetailInput?.isLoading || false}
        onSave={handleSaveInputDetailConfigWithState}
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
        airconOptions={airconItems.map((item) => ({
          value: item.id.toString(),
          label: `${item.name} (${item.address || "No Address"})`,
          address: item.address,
          name: item.name,
        }))}
        isLoading={currentOutputConfig?.isLoading || false}
        onSave={handleSaveOutputConfig}
      />

      {/* Create/Edit Lighting Dialog */}
      {createEditDialog.type === "lighting" && (
        <ProjectItemDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          category="lighting"
          item={createEditDialog.item}
          mode={createEditDialog.mode}
        />
      )}

      {/* Create/Edit Aircon Dialog */}
      {createEditDialog.type === "aircon" && (
        <AirconCardDialog
          open={createEditDialog.open}
          onOpenChange={handleCreateEditDialogClose}
          mode={createEditDialog.mode}
          card={createEditDialog.item}
        />
      )}
    </>
  );
};

// Export memoized component for optimal performance
export const IOConfigDialog = memo(IOConfigDialogComponent, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.type === nextProps.item?.type &&
    prevProps.item?.serial_no === nextProps.item?.serial_no
  );
});
