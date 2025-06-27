import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useNetworkOutputConfig = (item) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [outputConfigs, setOutputConfigs] = useState({});

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
    const existingConfig = outputConfigs[outputIndex] || {};

    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: existingConfig,
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
    if (!currentOutputConfig) return false;

    try {
      // Update local state
      setOutputConfigs(prev => ({
        ...prev,
        [currentOutputConfig.index]: config
      }));

      // TODO: Send configuration to network unit
      // This will be implemented when data handling is added
      console.log(`Output config saved for output ${currentOutputConfig.index}:`, config);

      const outputType = currentOutputConfig.type === "ac" ? "AC" : "Lighting";
      toast.success(`${outputType} output ${currentOutputConfig.index + 1} configuration saved (network mode)`);
      return true;
    } catch (error) {
      console.error("Failed to save output configuration:", error);
      toast.error("Failed to save output configuration");
      return false;
    }
  }, [currentOutputConfig]);

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
    outputConfigs,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    handleToggleOutputState,
  };
};
