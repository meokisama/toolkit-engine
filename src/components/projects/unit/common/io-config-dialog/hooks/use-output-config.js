import { useState, useCallback } from "react";

export const useOutputConfig = (item) => {
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

        setCurrentOutputConfig((prev) => ({
          ...prev,
          config: configData,
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
      } catch (error) {
        console.error("Failed to save output config:", error);
      }
    },
    [currentOutputConfig, item?.id]
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
  };
};
