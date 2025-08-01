import { useState, useCallback } from "react";
import { getInputFunctionByValue } from "@/constants";
import { toast } from "sonner";

// Helper function to determine if unit is a network unit
// Network units don't have database ID, database units have ID
const isNetworkUnit = (unit) => {
  return !unit?.id; // Network units don't have database ID
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

  // Function to load all Multiple Group & RLC configurations from database
  const loadAllMultiGroupConfigs = useCallback(
    async () => {
      if (!item?.id || isNetworkUnit(item)) return;

      try {
        // Load from JSON structure instead of separate table
        const unit = await window.electronAPI.unit.getById(item.id);
        if (!unit || !unit.input_configs) return;

        const inputConfigs = unit.input_configs;
        const newMultiGroupConfigs = {};
        const newRlcConfigs = {};

        (inputConfigs.inputs || []).forEach((config) => {
          // Load all configs, not just those with multi-group data
          if (config.rlc_config || (config.multi_group_config && config.multi_group_config.length > 0)) {
            // Convert database format to internal format
            newMultiGroupConfigs[config.index] = {
              ramp: config.rlc_config?.ramp || 0,
              preset: config.rlc_config?.preset || 100,
              led_status: config.rlc_config?.ledStatus || 0,
              auto_mode: config.rlc_config?.autoMode || 0,
              auto_time: 0,
              delay_off: config.rlc_config?.delayOff || 0,
              delay_on: config.rlc_config?.delayOn || 0,
              multiGroupConfig: config.multi_group_config || [],
            };

            newRlcConfigs[config.index] = config.rlc_config || {};
          }
        });
        setMultiGroupConfigs(newMultiGroupConfigs);
        setRlcConfigs(newRlcConfigs);
      } catch (error) {
        console.error("Failed to load all Multiple Group & RLC configs:", error);
      }
    },
    [item?.id]
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

      // Set initial state with loading
      setCurrentMultiGroupInput({
        index: inputIndex,
        name: `Input ${inputIndex + 1}`,
        functionName: inputFunction.label,
        functionValue: functionValue,
        isLoading: true,
        config: multiGroupConfigs[inputIndex] || {
          ramp: 0,
          preset: 100,
          led_status: 0,
          auto_mode: 0,
          auto_time: 0,
          delay_off: 0,
          delay_on: 0,
          multiGroupConfig: [],
        },
      });

      setMultiGroupDialogOpen(true);

      try {
        let cachedConfig = multiGroupConfigs[inputIndex];

        if (!cachedConfig) {
          // Load fresh config from database
          const result = await window.electronAPI.unit.getInputConfig(
            item.id,
            inputIndex
          );

          if (result) {
            // Convert database format to network unit format for consistency
            const convertedConfig = {
              ramp: result.rlc_config?.ramp || 0,
              preset: result.rlc_config?.preset || 100,
              led_status: result.rlc_config?.ledStatus || 0,
              auto_mode: result.rlc_config?.autoMode || 0,
              auto_time: 0, // Auto time not supported yet
              delay_off: result.rlc_config?.delayOff || 0,
              delay_on: result.rlc_config?.delayOn || 0,
              multiGroupConfig: result.multi_group_config || [],
            };

            // Cache the converted config
            setMultiGroupConfigs((prev) => ({
              ...prev,
              [inputIndex]: convertedConfig,
            }));

            // Update current input with actual config from database
            setCurrentMultiGroupInput((prev) => ({
              ...prev,
              isLoading: false,
              config: convertedConfig,
            }));
          } else {
            // No config found, use defaults
            setCurrentMultiGroupInput((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        } else {
          // Use cached config
          setCurrentMultiGroupInput((prev) => ({
            ...prev,
            isLoading: false,
            config: cachedConfig,
          }));
        }
      } catch (error) {
        console.error("Failed to load input config:", error);
        setCurrentMultiGroupInput((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [multiGroupConfigs, item?.id]
  );

  const handleSaveMultiGroupConfig = useCallback(
    async (data) => {
      if (!currentMultiGroupInput) {
        return false;
      }

      try {
        const groups = data.groups || [];
        const rlcOptions = data.rlcOptions || {};
        const inputType = data.inputType;

        // Update local state with the same format as network units
        const updatedConfig = {
          ramp: rlcOptions.ramp || 0,
          preset: rlcOptions.preset || 100,
          led_status: rlcOptions.ledStatus || 0,
          auto_mode: rlcOptions.autoMode || 0,
          auto_time: 0, // Auto time not supported yet
          delay_off: rlcOptions.delayOff || 0,
          delay_on: rlcOptions.delayOn || 0,
          multiGroupConfig: groups.map((group) => ({
            groupId: parseInt(group.groupId) || 0,
            presetBrightness: parseInt(group.presetBrightness) || 255,
          })),
        };

        setMultiGroupConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: updatedConfig,
        }));

        // Check if this is a network unit or database unit
        const isNetworkUnitFlag = isNetworkUnit(item);

        if (isNetworkUnitFlag) {
          toast.info(
            "Network unit - use network-specific configuration dialog"
          );
          return false;
        } else {
          // Save to database with consistent structure
          await window.electronAPI.unit.saveInputConfig(
            item.id,
            currentMultiGroupInput.index,
            inputType !== undefined
              ? inputType
              : currentMultiGroupInput.functionValue || 0,
            null, // No single lighting ID for multi-group
            updatedConfig.multiGroupConfig, // Multi-group config array
            {
              ramp: updatedConfig.ramp,
              preset: updatedConfig.preset,
              ledStatus: updatedConfig.led_status,
              autoMode: updatedConfig.auto_mode,
              delayOff: updatedConfig.delay_off,
              delayOn: updatedConfig.delay_on,
            } // RLC options object
          );

          // Note: UI update is handled by parent component to avoid race conditions

          toast.success(
            `Input ${currentMultiGroupInput.index + 1
            } configuration saved to database`
          );
        }

        return true;
      } catch (error) {
        console.error("❌ Failed to save input config:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          currentMultiGroupInput,
          item,
        });

        toast.error(`Failed to save input configuration: ${error.message}`);
        return false;
      }
    },
    [currentMultiGroupInput, item, reloadInputConfig]
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
    loadAllMultiGroupConfigs,
  };
};
