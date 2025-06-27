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
    async (data, inputConfigs, setInputConfigs) => {
      if (!currentMultiGroupInput) return;

      try {
        const groups = data.groups || data;
        const rlcOptions = data.rlcOptions || {};
        const inputType = data.inputType;

        const inputConfig = inputConfigs.find(
          (config) => config.index === currentMultiGroupInput.index
        );

        // Check if this is a network unit (has ip/ip_address and canId/id_can)
        const isNetworkUnit = (item.ip && item.canId) || (item.ip_address && item.id_can);

        if (isNetworkUnit) {
          // For network units, send SETUP_INPUT command via UDP
          const { setupInputConfig } = await import("@/services/rcu-controller.js");

          // Get IP and CAN ID (support both formats)
          const unitIp = item.ip || item.ip_address;
          const unitCanId = item.canId || item.id_can;

          // Prepare input configuration data for SETUP_INPUT command
          const inputConfigData = {
            inputNumber: currentMultiGroupInput.index,
            inputType: inputType !== undefined ? inputType : (inputConfig?.functionValue || 0),
            ramp: rlcOptions.ramp || 0,
            preset: rlcOptions.preset || 255,
            ledStatus: rlcOptions.ledStatus || 0,
            autoMode: rlcOptions.autoMode || false,
            delayOff: rlcOptions.delayOff || 0,
            groups: groups.map(group => ({
              groupId: group.lightingId || 0,
              presetBrightness: group.value || 0
            }))
          };

          await setupInputConfig(unitIp, unitCanId, inputConfigData);
          console.log(`Input ${currentMultiGroupInput.index} configuration sent to network unit ${unitIp}`);
        } else {
          // For database units, save to database
          await window.electronAPI.unit.saveInputConfig(
            item.id,
            currentMultiGroupInput.index,
            inputType !== undefined ? inputType : (inputConfig?.functionValue || 0),
            inputConfig?.lightingId || null,
            groups,
            rlcOptions
          );
        }

        // Update input configs if input type changed
        if (inputType !== undefined && setInputConfigs) {
          setInputConfigs(prev => prev.map(config =>
            config.index === currentMultiGroupInput.index
              ? { ...config, functionValue: inputType }
              : config
          ));
        }

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
    [currentMultiGroupInput, item?.id, item?.ip, item?.canId, item?.ip_address, item?.id_can]
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
