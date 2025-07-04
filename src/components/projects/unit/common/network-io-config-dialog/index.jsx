import React, { useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LoadingSkeleton } from "../io-config-dialog/loading-skeleton";

// Import dialogs for configuration
import { MultiGroupConfigDialog } from "@/components/projects/unit/common/input-config-dialog";
import { LightingOutputConfigDialog } from "@/components/projects/unit/common/lighting-output-config-dialog";
import { ACOutputConfigDialog } from "@/components/projects/unit/common/ac-output-config-dialog";

// Import hooks for network I/O configuration
import { useNetworkIOConfig } from "./hooks/use-network-io-config";
import { useNetworkInputConfig } from "./hooks/use-network-input-config";
import { useNetworkOutputConfig } from "./hooks/use-network-output-config";
import { useProjectDetail } from "@/contexts/project-detail-context";

const NetworkIOConfigDialog = ({ open, onOpenChange, item = null }) => {
  const { projectItems, selectedProject, loadTabData, loadedTabs } =
    useProjectDetail();

  // Use custom hooks for better organization
  const {
    inputConfigs,
    outputConfigs,
    setOutputConfigs,
    ioSpec,
    loading,
    isInitialLoading,
    configsLoaded,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    readStatesSequentially,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    readAirconConfigsFromUnit,
    pauseAutoRefresh,
    resumeAutoRefresh,
  } = useNetworkIOConfig(item, open, false); // We'll update this after getting multiGroupDialogOpen

  const {
    multiGroupDialogOpen,
    setMultiGroupDialogOpen,
    currentMultiGroupInput,
    loadingInputConfigs,
    handleInputFunctionChange,
    handleOpenMultiGroupConfig,
    handleSaveMultiGroupConfig,
  } = useNetworkInputConfig(item, projectItems, readInputConfigsFromUnit);

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
    loadAndMapAirconConfigs,
  } = useNetworkOutputConfig(
    item,
    outputConfigs,
    setOutputConfigs,
    lightingItems,
    airconItems,
    readAirconConfigsFromUnit
  );

  // Check if any child dialog is open
  const anyChildDialogOpen =
    multiGroupDialogOpen || lightingOutputDialogOpen || acOutputDialogOpen;

  // Handle auto refresh pause/resume when output dialogs open/close
  useEffect(() => {
    if (lightingOutputDialogOpen || acOutputDialogOpen) {
      pauseAutoRefresh();
    } else if (open && !multiGroupDialogOpen && autoRefreshEnabled) {
      // Add delay before resuming auto refresh to allow unit to process any pending commands
      setTimeout(() => {
        resumeAutoRefresh();
      }, 1000);
    }
  }, [
    lightingOutputDialogOpen,
    acOutputDialogOpen,
    open,
    multiGroupDialogOpen,
    autoRefreshEnabled,
    pauseAutoRefresh,
    resumeAutoRefresh,
  ]);

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

  // Load and map aircon configs after initial loading is complete
  useEffect(() => {
    if (!isInitialLoading && configsLoaded && loadAndMapAirconConfigs) {
      // Add a small delay to ensure all initial configs are loaded
      const timer = setTimeout(() => {
        loadAndMapAirconConfigs();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoading, configsLoaded, loadAndMapAirconConfigs]);

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

  // Enhanced toggle handler that updates state immediately
  const handleToggleOutput = useCallback(
    async (outputIndex, currentState) => {
      const success = await handleToggleOutputState(outputIndex, currentState);
      if (success) {
        // Immediately read states to update UI
        await readStatesSequentially();
      }
    },
    [handleToggleOutputState, readStatesSequentially]
  );

  // Handle reading all input configurations from unit
  const handleReadInputConfigs = useCallback(async () => {
    try {
      await readInputConfigsFromUnit();
    } catch (error) {
      console.error("Failed to read input configurations:", error);
    }
  }, [readInputConfigsFromUnit]);

  // Handle adding missing address to database (aircon or lighting)
  const handleAddMissingAddress = useCallback(
    async (address, outputIndex, type = "lighting") => {
      try {
        if (type === "aircon") {
          // Create new aircon item with the missing address
          const newAirconItem = {
            name: `Group ${address}`,
            address: address.toString(),
            description: `Auto-added from network unit output ${
              outputIndex + 1
            }`,
          };

          // Add to database via electronAPI with projectId
          const result = await window.electronAPI.aircon.create(
            selectedProject.id,
            newAirconItem
          );

          if (result) {
            // Refresh aircon items to update the options
            await loadTabData(selectedProject.id, "aircon");

            // Refresh aircon configurations to update the mapping
            await readAirconConfigsFromUnit();

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
            description: `Auto-added from network unit output ${
              outputIndex + 1
            }`,
            object_type: "OBJ_LIGHTING",
            object_value: 1,
          };

          // Add to database via electronAPI with projectId
          const result = await window.electronAPI.lighting.create(
            selectedProject.id,
            newLightingItem
          );

          if (result) {
            // Refresh lighting items to update the options
            await loadTabData(selectedProject.id, "lighting");

            // Refresh output configurations to update the mapping
            await readOutputConfigsFromUnit();

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
    [
      selectedProject?.id,
      loadTabData,
      readOutputConfigsFromUnit,
      readAirconConfigsFromUnit,
    ]
  );

  if (!item || !ioSpec) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[90vh] flex flex-col overflow-y-auto">
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
                <CardHeader className="flex-shrink-0">
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
                        {inputConfigs.map((config) => (
                          <NetworkInputConfigItem
                            key={config.index}
                            config={config}
                            unitType={item?.type}
                            onInputFunctionChange={handleInputFunctionChange}
                            onOpenMultiGroupConfig={handleOpenMultiGroupConfig}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No input configurations available
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
                      {outputConfigs.length} Outputs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {outputConfigs.length > 0 ? (
                      <div className="space-y-3 pr-4">
                        {outputConfigs.map((config) => (
                          <NetworkOutputConfigItem
                            key={config.index}
                            config={config}
                            deviceOptions={
                              outputDeviceOptionsMap.get(config.index) || []
                            }
                            onOutputDeviceChange={handleOutputDeviceChange}
                            onOpenOutputConfig={handleOpenOutputConfig}
                            onToggleState={handleToggleOutput}
                            onAddMissingAddress={handleAddMissingAddress}
                            isLoadingConfig={loading}
                            allOutputConfigs={outputConfigs}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No output configurations available
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto Refresh</span>
            <Switch
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
            />
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Multi-Group Configuration Dialog */}
      <MultiGroupConfigDialog
        open={multiGroupDialogOpen}
        onOpenChange={setMultiGroupDialogOpen}
        inputName={currentMultiGroupInput?.name || ""}
        functionName={currentMultiGroupInput?.functionName || ""}
        functionValue={currentMultiGroupInput?.functionValue || null}
        unitType={item?.type || null}
        inputIndex={currentMultiGroupInput?.index || 0}
        initialGroups={currentMultiGroupInput?.config?.multiGroupConfig || []}
        initialRlcOptions={{
          ramp: currentMultiGroupInput?.config?.ramp || 0,
          preset: currentMultiGroupInput?.config?.preset || 255,
          led_status: currentMultiGroupInput?.config?.led_status || 0,
          auto_mode: currentMultiGroupInput?.config?.auto_mode || 0,
          delay_off: currentMultiGroupInput?.config?.delay_off || 0,
          delay_on: currentMultiGroupInput?.config?.delay_on || 0,
        }}
        isLoading={currentMultiGroupInput?.isLoading || false}
        onSave={handleSaveMultiGroupConfig}
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
        airconOptions={airconItems.map((item) => ({
          value: item.id.toString(),
          label: `${item.name} (${item.address || "No Address"})`,
          address: item.address,
          name: item.name,
        }))}
        isLoading={currentOutputConfig?.isLoading || false}
        onSave={handleSaveOutputConfig}
      />
    </Dialog>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(NetworkIOConfigDialog);
