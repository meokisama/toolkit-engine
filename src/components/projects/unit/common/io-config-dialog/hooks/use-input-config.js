import { useState, useCallback } from "react";
import { getInputFunctionByValue } from "@/constants";
import { toast } from "sonner";

// Helper function to determine if unit is a network unit
const isNetworkUnit = (unit) => {
  return !!(unit?.ip_address || unit?.ip) && !!(unit?.id_can || unit?.canId);
};

// Note: Network unit logic has been moved to use-network-input-config.js

export const useInputConfig = (item, setInputConfigs = null) => {
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});
  const [rlcConfigs, setRlcConfigs] = useState({});
  const [multiGroupDialogOpen, setMultiGroupDialogOpen] = useState(false);
  const [currentMultiGroupInput, setCurrentMultiGroupInput] = useState(null);
  const [loadingInputConfig, setLoadingInputConfig] = useState(false);

  // Function to reload input config from database
  const reloadInputConfig = useCallback(
    async (inputIndex) => {
      if (!item?.id || isNetworkUnit(item)) return;

      try {
        const actualConfig = await window.electronAPI.unit.getInputConfig(
          item.id,
          inputIndex
        );

        if (actualConfig && setInputConfigs) {
          setInputConfigs((prev) =>
            prev.map((config) =>
              config.index === inputIndex
                ? {
                    ...config,
                    functionValue: actualConfig.function_value || 0,
                    lightingId: actualConfig.lighting_id,
                  }
                : config
            )
          );
        }
      } catch (error) {
        console.error("Failed to reload input config:", error);
      }
    },
    [item?.id, setInputConfigs]
  );

  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId, inputConfigs) => {
      try {
        const inputConfig = inputConfigs.find(
          (config) => config.index === inputIndex
        );
        const multiGroupConfig = multiGroupConfigs[inputIndex] || [];
        const rlcConfig = rlcConfigs[inputIndex] || {};

        // Only save to database for database units
        if (!isNetworkUnit(item)) {
          await window.electronAPI.unit.saveInputConfig(
            item.id,
            inputIndex,
            inputConfig?.functionValue || 0,
            lightingId,
            multiGroupConfig,
            rlcConfig
          );

          // Reload input config to update UI
          await reloadInputConfig(inputIndex);

          toast.success("Input lighting configuration saved");
        } else {
          toast.info("Network unit - use multi-group config to send to unit");
        }
      } catch (error) {
        console.error("Failed to save input lighting change:", error);
        toast.error("Failed to save input lighting configuration");
      }
    },
    [multiGroupConfigs, rlcConfigs, item, reloadInputConfig]
  );

  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue, inputConfigs) => {
      try {
        const inputConfig = inputConfigs.find(
          (config) => config.index === inputIndex
        );
        const multiGroupConfig = multiGroupConfigs[inputIndex] || [];
        const rlcConfig = rlcConfigs[inputIndex] || {};

        // Only save to database for database units
        if (!isNetworkUnit(item)) {
          await window.electronAPI.unit.saveInputConfig(
            item.id,
            inputIndex,
            functionValue,
            inputConfig?.lightingId || null,
            multiGroupConfig,
            rlcConfig
          );

          // Reload input config to update UI
          await reloadInputConfig(inputIndex);

          toast.success("Input function configuration saved");
        } else {
          toast.info("Network unit - use multi-group config to send to unit");
        }
      } catch (error) {
        console.error("Failed to save input function change:", error);
        toast.error("Failed to save input function configuration");
      }
    },
    [multiGroupConfigs, rlcConfigs, item, reloadInputConfig]
  );

  const handleOpenMultiGroupConfig = useCallback(
    async (inputIndex, functionValue) => {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (!inputFunction) return;

      setCurrentMultiGroupInput({
        index: inputIndex,
        name: `Input ${inputIndex + 1}`,
        functionName: inputFunction.label,
        functionValue: functionValue,
        isLoading: true,
      });

      setMultiGroupDialogOpen(true);

      try {
        let multiGroupConfig = multiGroupConfigs[inputIndex];
        let rlcConfig = rlcConfigs[inputIndex];

        if (!multiGroupConfig && !rlcConfig) {
          const result = await window.electronAPI.unit.getInputConfig(
            item.id,
            inputIndex
          );

          if (result) {
            multiGroupConfig = result.multi_group_config || [];
            rlcConfig = result.rlc_config || {};

            setMultiGroupConfigs((prev) => ({
              ...prev,
              [inputIndex]: multiGroupConfig,
            }));
            setRlcConfigs((prev) => ({
              ...prev,
              [inputIndex]: rlcConfig,
            }));
          }
        }

        setCurrentMultiGroupInput((prev) => ({
          ...prev,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to load input config:", error);
        setCurrentMultiGroupInput((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [multiGroupConfigs, rlcConfigs, item?.id]
  );

  const handleSaveMultiGroupConfig = useCallback(
    async (data, inputConfigs, setInputConfigs) => {
      setLoadingInputConfig(true);
      if (!currentMultiGroupInput) {
        setLoadingInputConfig(false);
        return;
      }

      try {
        const groups = data.groups || data;
        const rlcOptions = data.rlcOptions || {};
        const inputType = data.inputType;

        const inputConfig = inputConfigs.find(
          (config) => config.index === currentMultiGroupInput.index
        );

        // Check if this is a network unit or database unit
        const isNetworkUnitFlag = isNetworkUnit(item);

        if (isNetworkUnitFlag) {
          toast.info(
            "Network unit - use network-specific configuration dialog"
          );
          return false;
        } else {
          await window.electronAPI.unit.saveInputConfig(
            item.id,
            currentMultiGroupInput.index,
            inputType !== undefined
              ? inputType
              : inputConfig?.functionValue || 0,
            inputConfig?.lightingId || null,
            groups, // Raw groups array
            rlcOptions // Raw RLC options object
          );

          // Reload input config to update UI
          await reloadInputConfig(currentMultiGroupInput.index);

          toast.success(
            `Input ${
              currentMultiGroupInput.index + 1
            } configuration saved to database`
          );
        }

        // Update input configs if input type changed
        if (inputType !== undefined && setInputConfigs) {
          setInputConfigs((prev) =>
            prev.map((config) =>
              config.index === currentMultiGroupInput.index
                ? { ...config, functionValue: inputType }
                : config
            )
          );
        }

        setMultiGroupConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: groups,
        }));

        setRlcConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: rlcOptions,
        }));

        setLoadingInputConfig(false);
      } catch (error) {
        console.error("❌ Failed to save input config:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          currentMultiGroupInput,
          item,
        });

        // Show error toast if not already shown
        if (!error.message.includes("Failed to send input configuration")) {
          toast.error(`Failed to save input configuration: ${error.message}`);
        }

        setLoadingInputConfig(false);

        // Re-throw error to show user notification
        throw error;
      } finally {
        setLoadingInputConfig(false);
      }
    },
    [currentMultiGroupInput, item, reloadInputConfig, setLoadingInputConfig]
  );

  return {
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
    reloadInputConfig,
  };
};
