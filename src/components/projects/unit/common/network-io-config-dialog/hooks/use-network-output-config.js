import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useNetworkOutputConfig = (item, outputConfigs = [], setOutputConfigs = null, lightingItems = []) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [allOutputConfigs, setAllOutputConfigs] = useState(null); // Cache for all output configs

  // Handle output device change
  const handleOutputDeviceChange = useCallback(async (outputIndex, deviceId) => {
    if (!item?.ip_address || !item?.id_can) {
      toast.error("Network unit information not available");
      return;
    }

    try {
      console.log(`Output ${outputIndex} device changed to ${deviceId}`);

      // Get lighting address from deviceId (lighting item)
      let lightingAddress = 0; // Default for unassigned

      if (deviceId) {
        // Find the lighting item by ID to get its address
        const lightingItem = lightingItems?.find(item => item.id === parseInt(deviceId));
        if (lightingItem) {
          lightingAddress = parseInt(lightingItem.address) || 0;
          console.log(`Found lighting item ID ${deviceId} with address ${lightingAddress}`);
        } else {
          console.warn(`Lighting item with ID ${deviceId} not found`);
        }
      }

      // Get current delay values from existing output config or use defaults
      const currentOutput = outputConfigs.find(oc => oc.index === outputIndex);
      const delayOff = currentOutput?.delayOff || 0;
      const delayOn = currentOutput?.delayOn || 0;

      // Send setOutputAssign command to network unit
      await window.electronAPI.rcuController.setOutputAssign(
        item.ip_address,
        item.id_can,
        outputIndex,
        lightingAddress,
        delayOff,
        delayOn
      );

      // Update local state to reflect the change if setOutputConfigs is provided
      if (setOutputConfigs) {
        setOutputConfigs(prev =>
          prev.map(config =>
            config.index === outputIndex
              ? { ...config, lightingAddress, isAssigned: lightingAddress > 0 }
              : config
          )
        );
      }

      toast.success(`Output ${outputIndex + 1} device association updated`);
    } catch (error) {
      console.error("Failed to update output device association:", error);
      toast.error(`Failed to update output ${outputIndex + 1} device association: ${error.message}`);
    }
  }, [item?.ip_address, item?.id_can, outputConfigs, setOutputConfigs, lightingItems]);

  // Load all output configs from unit (always fresh data)
  const loadAllOutputConfigs = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return null;
    }

    try {
      console.log(`Loading fresh output configs from unit ${item.ip_address}`);

      const configResponse = await window.electronAPI.rcuController.getOutputConfig(
        item.ip_address,
        item.id_can
      );

      if (configResponse?.success && configResponse.outputConfigs) {
        setAllOutputConfigs(configResponse.outputConfigs);
        console.log(`Loaded ${configResponse.configCount} fresh output configs from unit`);
        return configResponse.outputConfigs;
      }
    } catch (error) {
      console.warn(`Failed to load output configs from unit:`, error.message);
      toast.error(`Failed to load output configurations from unit`);
    }

    return null;
  }, [item?.ip_address, item?.id_can, setAllOutputConfigs]);

  // Handle opening output configuration
  const handleOpenOutputConfig = useCallback(async (outputIndex, outputType) => {
    // Find the output config from the array
    const outputConfig = outputConfigs.find(config => config.index === outputIndex);

    // Set initial state with loading
    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: null,
      isLoading: true
    });

    // Open dialog first to show loading state
    if (outputType === "ac") {
      setACOutputDialogOpen(true);
    } else {
      setLightingOutputDialogOpen(true);
    }

    // Load fresh data from network unit every time dialog opens
    console.log(`Loading fresh configuration data for output ${outputIndex}`);

    // Load fresh output configs from unit
    const allConfigs = await loadAllOutputConfigs();

    // Find the specific config for this output
    let unitConfig = null;
    if (allConfigs) {
      unitConfig = allConfigs.find(config => config.outputIndex === outputIndex);
      console.log(`Output config found for output ${outputIndex}:`, unitConfig);
    }

    // Also load fresh output assign data to get latest delay values
    let freshOutputConfig = null;
    if (item?.ip_address && item?.id_can) {
      try {
        console.log(`Loading fresh output assign data for output ${outputIndex}`);

        const assignResponse = await window.electronAPI.rcuController.getOutputAssign({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

        if (assignResponse?.success && assignResponse.outputAssignments) {
          const assignment = assignResponse.outputAssignments.find(
            (assign) => assign.outputIndex === outputIndex
          );
          if (assignment) {
            freshOutputConfig = {
              ...outputConfig,
              lightingAddress: assignment.lightingAddress,
              delayOff: assignment.delayOff,
              delayOn: assignment.delayOn,
              isAssigned: assignment.isAssigned,
            };
            console.log(`Fresh output assign data loaded for output ${outputIndex}:`, assignment);
          }
        }
      } catch (error) {
        console.warn(`Failed to load fresh output assign data for output ${outputIndex}:`, error.message);
      }
    }

    // Use fresh data if available, otherwise fall back to existing data
    const configToUse = freshOutputConfig || outputConfig;

    // Format config for lighting-output-config-dialog
    let formattedConfig = {};

    if (configToUse) {
      // Convert delay values from network unit format (seconds) to dialog format
      const delayOffTotalSeconds = configToUse.delayOff || 0;
      const delayOnTotalSeconds = configToUse.delayOn || 0;

      formattedConfig = {
        // Delay settings from getOutputAssign (already loaded)
        delayOffHours: Math.floor(delayOffTotalSeconds / 3600),
        delayOffMinutes: Math.floor((delayOffTotalSeconds % 3600) / 60),
        delayOffSeconds: delayOffTotalSeconds % 60,
        delayOnHours: Math.floor(delayOnTotalSeconds / 3600),
        delayOnMinutes: Math.floor((delayOnTotalSeconds % 3600) / 60),
        delayOnSeconds: delayOnTotalSeconds % 60,

        // Config settings from getOutputConfig (loaded on-demand)
        minDim: unitConfig?.minDimmingLevel || 1,
        maxDim: unitConfig?.maxDimmingLevel || 100,
        autoTrigger: unitConfig?.isAutoTriggerEnabled || false,
        scheduleOnHour: unitConfig?.scheduleOnHour || 0,
        scheduleOnMinute: unitConfig?.scheduleOnMinute || 0,
        scheduleOffHour: unitConfig?.scheduleOffHour || 0,
        scheduleOffMinute: unitConfig?.scheduleOffMinute || 0,
      };
    }

    // Update with loaded config
    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: formattedConfig,
      isLoading: false
    });
  }, [outputConfigs, item?.ip_address, item?.id_can, loadAllOutputConfigs]);

  // Handle saving output configuration
  const handleSaveOutputConfig = useCallback(async (config) => {
    if (!currentOutputConfig || !item?.ip_address || !item?.id_can) return false;

    try {
      // Clear cached configs to force reload next time
      setAllOutputConfigs(null);

      // Convert dialog config format to network unit format (in seconds, not milliseconds)
      const delayOffSeconds = config.delayOffHours * 3600 + config.delayOffMinutes * 60 + config.delayOffSeconds;
      const delayOnSeconds = config.delayOnHours * 3600 + config.delayOnMinutes * 60 + config.delayOnSeconds;

      // Send setOutputConfig for dimming levels, auto trigger, and schedule
      await window.electronAPI.rcuController.setOutputConfig(
        item.ip_address,
        item.id_can,
        currentOutputConfig.index,
        {
          minDimmingLevel: config.minDim || 1,
          maxDimmingLevel: config.maxDim || 100,
          autoTriggerFlag: config.autoTrigger ? 1 : 0,
          scheduleOnHour: config.scheduleOnHour || 0,
          scheduleOnMinute: config.scheduleOnMinute || 0,
          scheduleOffHour: config.scheduleOffHour || 0,
          scheduleOffMinute: config.scheduleOffMinute || 0,
        }
      );

      // Send setOutputAssign for delay settings (if lighting address is available)
      const outputConfig = outputConfigs.find(oc => oc.index === currentOutputConfig.index);
      if (outputConfig?.lightingAddress) {
        await window.electronAPI.rcuController.setOutputAssign(
          item.ip_address,
          item.id_can,
          currentOutputConfig.index,
          outputConfig.lightingAddress,
          delayOffSeconds,
          delayOnSeconds
        );
      }

      const outputType = currentOutputConfig.type === "ac" ? "AC" : "Lighting";
      toast.success(`${outputType} output ${currentOutputConfig.index + 1} configuration saved`);
      return true;
    } catch (error) {
      console.error("Failed to save output configuration:", error);
      toast.error("Failed to save output configuration");
      return false;
    }
  }, [currentOutputConfig, item?.ip_address, item?.id_can, outputConfigs]);

  // Handle output state toggle
  const handleToggleOutputState = useCallback(async (outputIndex, currentState) => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      // Toggle state: if currently on (true), send 0 to turn off; if off (false), send 255 to turn on
      const newValue = currentState ? 0 : 255;

      const response = await window.electronAPI.rcuController.setOutputState({
        unitIp: item.ip_address,
        canId: item.id_can,
        outputIndex: outputIndex,
        value: newValue,
      });

      if (response) {
        toast.success(
          `Output ${outputIndex + 1} ${currentState ? "turned off" : "turned on"}`
        );
        return true;
      }
    } catch (error) {
      console.error("Failed to toggle output state:", error);
      toast.error(
        `Failed to toggle output ${outputIndex + 1}: ${error.message}`
      );
      return false;
    }
  }, [item?.ip_address, item?.id_can]);

  return {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    handleToggleOutputState,
  };
};
