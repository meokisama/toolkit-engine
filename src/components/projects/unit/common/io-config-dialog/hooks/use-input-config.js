import { useState, useCallback } from "react";
import { getInputFunctionByValue } from "@/constants";

export const useInputConfig = (item) => {
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});
  const [rlcConfigs, setRlcConfigs] = useState({});
  const [multiGroupDialogOpen, setMultiGroupDialogOpen] = useState(false);
  const [currentMultiGroupInput, setCurrentMultiGroupInput] = useState(null);
  const [loadingInputConfig, setLoadingInputConfig] = useState(false);

  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId, inputConfigs) => {
      try {
        const inputConfig = inputConfigs.find(
          (config) => config.index === inputIndex
        );
        const multiGroupConfig = multiGroupConfigs[inputIndex] || [];
        const rlcConfig = rlcConfigs[inputIndex] || {};

        await window.electronAPI.unit.saveInputConfig(
          item.id,
          inputIndex,
          inputConfig?.functionValue || 0,
          lightingId,
          multiGroupConfig,
          rlcConfig
        );
      } catch (error) {
        console.error("Failed to save input lighting change:", error);
      }
    },
    [multiGroupConfigs, rlcConfigs, item?.id]
  );

  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue, inputConfigs) => {
      try {
        const inputConfig = inputConfigs.find(
          (config) => config.index === inputIndex
        );
        const multiGroupConfig = multiGroupConfigs[inputIndex] || [];
        const rlcConfig = rlcConfigs[inputIndex] || {};

        await window.electronAPI.unit.saveInputConfig(
          item.id,
          inputIndex,
          functionValue,
          inputConfig?.lightingId || null,
          multiGroupConfig,
          rlcConfig
        );
      } catch (error) {
        console.error("Failed to save input function change:", error);
      }
    },
    [multiGroupConfigs, rlcConfigs, item?.id]
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
    async (data, inputConfigs) => {
      if (!currentMultiGroupInput) return;

      try {
        const groups = data.groups || data;
        const rlcOptions = data.rlcOptions || {};

        const inputConfig = inputConfigs.find(
          (config) => config.index === currentMultiGroupInput.index
        );

        await window.electronAPI.unit.saveInputConfig(
          item.id,
          currentMultiGroupInput.index,
          inputConfig?.functionValue || 0,
          inputConfig?.lightingId || null,
          groups,
          rlcOptions
        );

        setMultiGroupConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: groups,
        }));

        setRlcConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: rlcOptions,
        }));
      } catch (error) {
        console.error("Failed to save input config:", error);
      }
    },
    [currentMultiGroupInput, item?.id]
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
  };
};
