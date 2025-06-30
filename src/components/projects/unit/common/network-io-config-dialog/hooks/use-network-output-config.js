import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useNetworkOutputConfig = (item, outputConfigs = []) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [localOutputConfigs, setLocalOutputConfigs] = useState({});

  // Handle output device change
  const handleOutputDeviceChange = useCallback((outputIndex, deviceId) => {
    // For network units, we don't save to database immediately
    // This will be handled by the parent component's state management
    console.log(`Output ${outputIndex} device changed to ${deviceId}`);

    // TODO: Send command to network unit to update output device association
    // This will be implemented when data handling is added
    toast.info(`Output ${outputIndex + 1} device association updated (network mode)`);
  }, []);

  // Handle opening output configuration
  const handleOpenOutputConfig = useCallback((outputIndex, outputType) => {
    // Find the output config from the array
    const outputConfig = outputConfigs.find(config => config.index === outputIndex);

    // Format config for lighting-output-config-dialog
    let formattedConfig = {};

    if (outputConfig) {
      // Convert delay values from network unit format (seconds) to dialog format
      const delayOffTotalSeconds = outputConfig.delayOff || 0;
      const delayOnTotalSeconds = outputConfig.delayOn || 0;

      formattedConfig = {
        // Delay settings from getOutputAssign
        delayOffHours: Math.floor(delayOffTotalSeconds / 3600),
        delayOffMinutes: Math.floor((delayOffTotalSeconds % 3600) / 60),
        delayOffSeconds: delayOffTotalSeconds % 60,
        delayOnHours: Math.floor(delayOnTotalSeconds / 3600),
        delayOnMinutes: Math.floor((delayOnTotalSeconds % 3600) / 60),
        delayOnSeconds: delayOnTotalSeconds % 60,

        // Config settings from getOutputConfig
        minDim: outputConfig.unitConfig?.minDimmingLevel || 1,
        maxDim: outputConfig.unitConfig?.maxDimmingLevel || 100,
        autoTrigger: outputConfig.unitConfig?.isAutoTriggerEnabled || false,
        scheduleOnHour: outputConfig.unitConfig?.scheduleOnHour || 0,
        scheduleOnMinute: outputConfig.unitConfig?.scheduleOnMinute || 0,
        scheduleOffHour: outputConfig.unitConfig?.scheduleOffHour || 0,
        scheduleOffMinute: outputConfig.unitConfig?.scheduleOffMinute || 0,
      };
    }

    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: formattedConfig,
      isLoading: false
    });

    if (outputType === "ac") {
      setACOutputDialogOpen(true);
    } else {
      setLightingOutputDialogOpen(true);
    }
  }, [outputConfigs]);

  // Handle saving output configuration
  const handleSaveOutputConfig = useCallback(async (config) => {
    if (!currentOutputConfig || !item?.ip_address || !item?.id_can) return false;

    try {
      // Update local state
      setLocalOutputConfigs(prev => ({
        ...prev,
        [currentOutputConfig.index]: config
      }));

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
