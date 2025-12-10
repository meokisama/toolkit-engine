import { useState, useCallback } from "react";
import { toast } from "sonner";

// Helper function to determine if unit is a network unit
// Network units don't have database ID, database units have ID
const isNetworkUnit = (unit) => {
  return !unit?.id; // Network units don't have database ID
};

export const useOutputConfig = (item, setOutputConfigs) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [outputConfigurations, setOutputConfigurations] = useState({});
  const [loadingOutputConfig, setLoadingOutputConfig] = useState(false);

  const handleOutputDeviceChange = useCallback((outputIndex, deviceId, setOutputConfigs) => {
    setOutputConfigs((prev) =>
      prev.map((config) =>
        config.index === outputIndex ? { ...config, deviceId } : config
      )
    );
  }, []);

  const handleOpenOutputConfig = useCallback(
    async (outputIndex, outputType, outputConfigs) => {
      const outputConfig = outputConfigs.find(
        (config) => config.index === outputIndex
      );
      if (!outputConfig) return;

      setCurrentOutputConfig({
        index: outputIndex,
        name: outputConfig.name,
        type: outputType,
        config: null,
        isLoading: true,
      });

      if (outputType === "ac") {
        setACOutputDialogOpen(true);
      } else {
        setLightingOutputDialogOpen(true);
      }

      try {
        let configData = outputConfigurations[outputIndex];

        if (!configData) {
          const result = await window.electronAPI.unit.getOutputConfig(
            item.id,
            outputIndex
          );
          configData = result?.config_data || {};

          setOutputConfigurations((prev) => ({
            ...prev,
            [outputIndex]: configData,
          }));
        }

        // For AC outputs, include deviceId and address from outputConfig for sync
        // These are needed by AC output config dialog but are stored at output level
        const finalConfigData = outputType === "ac" ? {
          ...configData,
          deviceId: outputConfig.deviceId || null,
          address: outputConfig.deviceId || 0 // address is equivalent to deviceId for AC outputs
        } : configData;

        setCurrentOutputConfig((prev) => ({
          ...prev,
          config: finalConfigData,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to load output config:", error);
        setCurrentOutputConfig((prev) => ({
          ...prev,
          config: {},
          isLoading: false,
        }));
      }
    },
    [outputConfigurations, item?.id]
  );

  const handleSaveOutputConfig = useCallback(
    async (configData) => {
      if (!currentOutputConfig) return;

      try {
        await window.electronAPI.unit.saveOutputConfig(
          item.id,
          currentOutputConfig.index,
          currentOutputConfig.type,
          configData
        );

        setOutputConfigurations((prev) => ({
          ...prev,
          [currentOutputConfig.index]: configData,
        }));

        // For AC outputs, update outputConfigs with deviceId for sync
        if (currentOutputConfig.type === "ac" && configData.deviceId && setOutputConfigs) {
          setOutputConfigs((prev) =>
            prev.map((config) =>
              config.index === currentOutputConfig.index
                ? { ...config, deviceId: configData.deviceId }
                : config
            )
          );
        }

        toast.success(`Output ${currentOutputConfig.index + 1} configuration saved successfully`);
      } catch (error) {
        console.error("Failed to save output config:", error);
        toast.error("Failed to save output configuration");
      }
    },
    [currentOutputConfig, item?.id, setOutputConfigs]
  );

  // Function to load all output configurations from database
  const loadAllOutputConfigs = useCallback(
    async () => {
      if (!item?.id || isNetworkUnit(item)) return;

      try {
        // Load from JSON structure instead of separate table
        const unit = await window.electronAPI.unit.getById(item.id);
        if (!unit || !unit.output_configs) return;

        const outputConfigs = unit.output_configs;
        const newOutputConfigurations = {};

        (outputConfigs.outputs || []).forEach((config) => {
          if (config.config) {
            newOutputConfigurations[config.index] = config.config;
          }
        });
        setOutputConfigurations(newOutputConfigurations);
      } catch (error) {
        console.error("Failed to load all output configs:", error);
      }
    },
    [item?.id]
  );

  return {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    outputConfigurations,
    loadingOutputConfig,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    loadAllOutputConfigs,
  };
};
