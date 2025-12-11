import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Download } from "lucide-react";
import { toast } from "sonner";

// Import network-specific components
import { NetworkInputConfigItem } from "./network-input-config-item";
import { NetworkOutputConfigItem } from "./network-output-config-item";
import { LoadingSkeleton } from "../../shared/loading-skeleton";

// Import dialogs for configuration
import { InputDetailConfigDialog } from "../../shared/input-config";
import { LightingOutputConfigDialog } from "../../shared/output-configs/lighting-output-config-dialog";
import { ACOutputConfigDialog } from "../../shared/output-configs/ac-output-config-dialog";
import { ProjectItemDialog } from "@/components/projects/lighting/lighting-dialog";
import { AirconCardDialog } from "@/components/projects/aircon/aircon-card-dialog";

// Import hooks for network I/O configuration
import { useNetworkIOConfig } from "./hooks/use-network-io-config";
import { useNetworkInputConfig } from "./hooks/use-network-input-config";
import { useNetworkOutputConfig } from "./hooks/use-network-output-config";
import { useProjectDetail } from "@/contexts/project-detail-context";

// Import utility functions
import { hasOutputConfigChanged } from "../utils/io-config-utils";
import { hasInputConfigChanged } from "@/utils/io-config-utils";

const NetworkIOConfigDialog = ({ open, onOpenChange, item = null }) => {
  const { projectItems, selectedProject, loadTabData, loadedTabs } = useProjectDetail();

  // Use custom hooks for better organization
  const {
    inputConfigs,
    outputConfigs,
    originalInputConfigs,
    originalOutputConfigs,
    setInputConfigs,
    setOutputConfigs,
    ioSpec,
    loading,
    isInitialLoading,
    configsLoaded,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    readAirconConfigsFromUnit,
    saveAllInputConfigs,
    saveAllOutputConfigs,
    pauseAutoRefresh,
    resumeAutoRefresh,
    readStatesInitial,
  } = useNetworkIOConfig(item, open, false); // We'll update this after getting multiGroupDialogOpen

  const {
    multiGroupDialogOpen,
    setInputDetailDialogOpen,
    currentInputDetailInput,
    loadingInputConfigs,
    handleInputFunctionChange,
    handleOpenInputDetailConfig,
    handleSaveInputDetailConfig,
    handleToggleInputState,
  } = useNetworkInputConfig(item, projectItems, readInputConfigsFromUnit, setInputConfigs);

  // Track if there are pending INPUT changes
  const hasPendingInputChanges = useMemo(() => {
    if (!configsLoaded || inputConfigs.length === 0 || originalInputConfigs.length === 0) {
      return false;
    }

    return inputConfigs.some((config) => {
      const original = originalInputConfigs.find((orig) => orig.index === config.index);
      return hasInputConfigChanged(original, config);
    });
  }, [inputConfigs, originalInputConfigs, configsLoaded]);

  // Track if there are pending OUTPUT changes
  const hasPendingOutputChanges = useMemo(() => {
    if (!configsLoaded || outputConfigs.length === 0 || originalOutputConfigs.length === 0) {
      return false;
    }

    return outputConfigs.some((config) => {
      const original = originalOutputConfigs.find((orig) => orig.index === config.index);
      return hasOutputConfigChanged(config, original);
    });
  }, [outputConfigs, originalOutputConfigs, configsLoaded]);

  // Memoize lighting and aircon items to prevent unnecessary re-renders
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems?.lighting]);

  const airconItems = useMemo(() => {
    return projectItems?.aircon || [];
  }, [projectItems?.aircon]);

  const {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    handleToggleOutputState,
  } = useNetworkOutputConfig(item, outputConfigs, setOutputConfigs, lightingItems, airconItems, readAirconConfigsFromUnit);

  // State for create/edit device dialogs
  const [createEditDialog, setCreateEditDialog] = useState({
    open: false,
    type: null, // 'lighting' or 'aircon'
    mode: "create", // 'create' or 'edit'
    outputIndex: null,
    deviceId: null,
    item: null,
  });

  // Handle auto refresh pause/resume when output dialogs open/close
  useEffect(() => {
    if (lightingOutputDialogOpen || acOutputDialogOpen) {
      pauseAutoRefresh();
    } else if (open && !multiGroupDialogOpen && autoRefreshEnabled) {
      // Only resume if auto refresh is actually enabled
      resumeAutoRefresh();
    }
  }, [lightingOutputDialogOpen, acOutputDialogOpen, open, multiGroupDialogOpen, autoRefreshEnabled, pauseAutoRefresh, resumeAutoRefresh]);

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

  // Create device options for outputs
  const outputDeviceOptionsMap = useMemo(() => {
    const map = new Map();

    outputConfigs.forEach((config) => {
      const isAircon = config.type === "ac";
      const items = isAircon ? airconItems : lightingItems;

      const options = items.map((item) => ({
        value: item.id.toString(),
        label: `${item.name} (${item.address || "No Address"})`,
      }));

      map.set(config.index, options);
    });

    return map;
  }, [outputConfigs, lightingItems, airconItems]);

  // Optimistic toggle handler that updates UI first for better UX
  const handleToggleOutput = useCallback(
    async (outputIndex, currentState) => {
      // Store original config for potential revert
      const originalConfig = outputConfigs.find((config) => config.index === outputIndex);
      if (!originalConfig) return;

      // Step 1: Optimistically update UI immediately
      const newState = !currentState;
      const newBrightness = newState ? originalConfig.brightness || 255 : 0;

      setOutputConfigs((prevConfigs) =>
        prevConfigs.map((config) => (config.index === outputIndex ? { ...config, state: newState, brightness: newBrightness } : config))
      );

      try {
        // Step 2: Send command to network unit
        const success = await handleToggleOutputState(outputIndex, currentState);

        if (success) {
          // Command succeeded - UI is already updated optimistically
          // Read actual state to ensure consistency
          await readStatesInitial();
        } else {
          // Command failed - revert UI to original state
          setOutputConfigs((prevConfigs) =>
            prevConfigs.map((config) =>
              config.index === outputIndex
                ? {
                    ...config,
                    state: originalConfig.state,
                    brightness: originalConfig.brightness,
                  }
                : config
            )
          );
        }
      } catch (error) {
        // Command failed with error - revert UI to original state
        console.error("Toggle output failed:", error);
        setOutputConfigs((prevConfigs) =>
          prevConfigs.map((config) =>
            config.index === outputIndex
              ? {
                  ...config,
                  state: originalConfig.state,
                  brightness: originalConfig.brightness,
                }
              : config
          )
        );
      }
    },
    [handleToggleOutputState, readStatesInitial, setOutputConfigs, outputConfigs]
  );

  // Handle reading all input configurations from unit
  const handleReadInputConfigs = useCallback(async () => {
    try {
      await readInputConfigsFromUnit();
    } catch (error) {
      console.error("Failed to read input configurations:", error);
    }
  }, [readInputConfigsFromUnit]);

  // Handle saving ALL configurations (both input and output)
  const handleSaveAllConfigs = useCallback(async () => {
    try {
      let totalSuccess = 0;
      let totalFail = 0;
      const errors = [];

      // Save input configs if there are pending changes
      if (hasPendingInputChanges) {
        const inputResult = await saveAllInputConfigs();
        if (inputResult.success) {
          totalSuccess += inputResult.successCount;
        } else if (inputResult.successCount > 0) {
          totalSuccess += inputResult.successCount;
          totalFail += inputResult.failCount;
        } else {
          totalFail += inputConfigs.length;
          errors.push(`Input configs: ${inputResult.error}`);
        }
      }

      // Save output configs if there are pending changes
      if (hasPendingOutputChanges) {
        const outputResult = await saveAllOutputConfigs();
        if (outputResult.success) {
          totalSuccess += outputResult.successCount;
        } else if (outputResult.successCount > 0) {
          totalSuccess += outputResult.successCount;
          totalFail += outputResult.failCount;
        } else {
          totalFail += outputConfigs.length;
          errors.push(`Output configs: ${outputResult.error}`);
        }
      }

      // Show appropriate toast based on results
      if (totalFail === 0 && totalSuccess > 0) {
        toast.success(`All configurations saved successfully (${totalSuccess} total)`);
      } else if (totalSuccess > 0) {
        toast.warning(`Partially saved: ${totalSuccess} succeeded, ${totalFail} failed`);
      } else if (errors.length > 0) {
        toast.error(`Failed to save configurations: ${errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Failed to save configurations:", error);
      toast.error(`Failed to save: ${error.message}`);
    }
  }, [hasPendingInputChanges, hasPendingOutputChanges, saveAllInputConfigs, saveAllOutputConfigs, inputConfigs.length, outputConfigs.length]);

  // Handle adding missing address to database (aircon or lighting)
  const handleAddMissingAddress = useCallback(
    async (address, outputIndex, type = "lighting") => {
      try {
        if (type === "aircon") {
          // Create new aircon item with the missing address
          const newAirconItem = {
            name: `Group ${address}`,
            address: address.toString(),
            description: `Auto-added from network unit output ${outputIndex + 1}`,
          };

          // Add to database via electronAPI with projectId
          const result = await window.electronAPI.aircon.create(selectedProject.id, newAirconItem);

          if (result) {
            // Refresh aircon items to update the options
            await loadTabData(selectedProject.id, "aircon");

            // Show success message
            toast.success(`Aircon address ${address} added to database`);
          } else {
            throw new Error("Failed to create aircon item");
          }
        } else {
          // Create new lighting item with the missing address
          const newLightingItem = {
            name: `Group ${address}`,
            address: address.toString(),
            description: `Auto-added from network unit output ${outputIndex + 1}`,
            object_type: "OBJ_LIGHTING",
            object_value: 1,
          };

          // Add to database via electronAPI with projectId
          const result = await window.electronAPI.lighting.create(selectedProject.id, newLightingItem);

          if (result) {
            // Refresh lighting items to update the options
            await loadTabData(selectedProject.id, "lighting");

            // Show success message
            toast.success(`Lighting address ${address} added to database`);
          } else {
            throw new Error("Failed to create lighting item");
          }
        }
      } catch (error) {
        console.error(`Error adding missing ${type} address:`, error);
        toast.error(`Error adding ${type} address: ${error.message}`);
      }
    },
    [selectedProject?.id, loadTabData]
  );

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

  if (!item || !ioSpec) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl! max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Network I/O Configuration - {item.type}
            <Badge variant="outline" className="ml-2">
              {item.ip_address}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isInitialLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Input Configuration - Left Side */}
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Input Configuration
                      <Badge variant="secondary" className="ml-2">
                        {ioSpec.inputs} Inputs
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReadInputConfigs}
                      disabled={loadingInputConfigs}
                      className="flex items-center gap-2"
                    >
                      {loadingInputConfigs ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Read Configs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {inputConfigs.length > 0 ? (
                      <div className="space-y-3 pr-4">
                        {inputConfigs.map((config) => {
                          // Find original config for this input
                          const originalConfig = originalInputConfigs.find((original) => original.index === config.index);

                          return (
                            <NetworkInputConfigItem
                              key={config.index}
                              config={config}
                              unitType={item?.type}
                              originalConfig={originalConfig}
                              onInputFunctionChange={handleInputFunctionChange}
                              onOpenInputDetailConfig={(inputIndex, functionValue) => {
                                // Pass current config to avoid re-reading from unit
                                handleOpenInputDetailConfig(inputIndex, functionValue, config);
                              }}
                              onToggleInputState={handleToggleInputState}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No input configurations available</div>
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
                      {outputConfigs.length} Outputs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {outputConfigs.length > 0 ? (
                      <div className="space-y-3 pr-4">
                        {outputConfigs.map((config) => {
                          // Find original config for this output
                          const originalConfig = originalOutputConfigs.find((original) => original.index === config.index);

                          return (
                            <NetworkOutputConfigItem
                              key={config.index}
                              config={config}
                              originalConfig={originalConfig}
                              deviceOptions={outputDeviceOptionsMap.get(config.index) || []}
                              onOutputDeviceChange={handleOutputDeviceChange}
                              onOpenOutputConfig={(outputIndex, outputType) => {
                                // Pass current config to avoid re-reading from unit
                                handleOpenOutputConfig(outputIndex, outputType, config);
                              }}
                              onToggleState={handleToggleOutput}
                              onAddMissingAddress={handleAddMissingAddress}
                              onCreateEditDevice={handleCreateEditDevice}
                              isLoadingConfig={loading}
                              allOutputConfigs={outputConfigs}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No output configurations available</div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto Refresh</span>
            <Switch checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
            {(hasPendingInputChanges || hasPendingOutputChanges) && (
              <Badge variant="destructive" className="ml-2">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveAllConfigs} disabled={(!hasPendingInputChanges && !hasPendingOutputChanges) || loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Multi-Group Configuration Dialog */}
      <InputDetailConfigDialog
        open={multiGroupDialogOpen}
        onOpenChange={setInputDetailDialogOpen}
        inputName={currentInputDetailInput?.name || ""}
        functionName={currentInputDetailInput?.functionName || ""}
        functionValue={currentInputDetailInput?.functionValue || null}
        unitType={item?.type || null}
        inputIndex={currentInputDetailInput?.index || 0}
        initialGroups={currentInputDetailInput?.config?.multiGroupConfig || []}
        initialRlcOptions={{
          ramp: currentInputDetailInput?.config?.ramp ?? 0,
          preset: currentInputDetailInput?.config?.preset ?? 255,
          led_status: currentInputDetailInput?.config?.led_status || 0,
          auto_mode: currentInputDetailInput?.config?.auto_mode || 0,
          delay_off: currentInputDetailInput?.config?.delay_off ?? 0,
          delay_on: currentInputDetailInput?.config?.delay_on ?? 0,
        }}
        isLoading={currentInputDetailInput?.isLoading || false}
        onSave={handleSaveInputDetailConfig}
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
        lightingOptions={lightingItems.map((item) => ({
          value: item.id.toString(),
          label: `${item.name} (${item.address || "No Address"})`,
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
    </Dialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(NetworkIOConfigDialog);
