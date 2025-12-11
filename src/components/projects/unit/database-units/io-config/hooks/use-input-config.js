import { useState, useCallback, useEffect } from "react";
import { getInputFunctionByValue } from "@/constants";
import { toast } from "sonner";

// Helper function to determine if unit is a network unit
// Network units don't have database ID, database units have ID
const isNetworkUnit = (unit) => {
  return !unit?.id; // Network units don't have database ID
};

// Note: Network unit logic has been moved to use-network-input-config.js

export const useInputConfig = (item, setInputConfigs = null, open = true) => {
  const [multiGroupConfigs, setInputDetailConfigs] = useState({});
  const [rlcConfigs, setRlcConfigs] = useState({});
  const [multiGroupDialogOpen, setInputDetailDialogOpen] = useState(false);
  const [currentInputDetailInput, setCurrentInputDetailInput] = useState(null);
  const [loadingInputConfig, setLoadingInputConfig] = useState(false);

  // Reset state when dialog closes to clear any unsaved changes
  useEffect(() => {
    if (!open) {
      setInputDetailConfigs({});
      setRlcConfigs({});
      setInputDetailDialogOpen(false);
      setCurrentInputDetailInput(null);
      setLoadingInputConfig(false);
    }
  }, [open]);

  // Function to reload input config from database
  const reloadInputConfig = useCallback(
    async (inputIndex) => {
      if (!item?.id || isNetworkUnit(item)) return;

      try {
        const actualConfig = await window.electronAPI.unit.getInputConfig(item.id, inputIndex);

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
  const loadAllInputDetailConfigs = useCallback(async () => {
    if (!item?.id || isNetworkUnit(item)) return;

    try {
      // Load from JSON structure instead of separate table
      const unit = await window.electronAPI.unit.getById(item.id);
      if (!unit || !unit.input_configs) return;

      const inputConfigs = unit.input_configs;
      const newInputDetailConfigs = {};
      const newRlcConfigs = {};

      (inputConfigs.inputs || []).forEach((config) => {
        // Load all configs, not just those with multi-group data
        if (config.rlc_config || (config.multi_group_config && config.multi_group_config.length > 0)) {
          // Convert database format to internal format
          newInputDetailConfigs[config.index] = {
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
      setInputDetailConfigs(newInputDetailConfigs);
      setRlcConfigs(newRlcConfigs);
    } catch (error) {
      console.error("Failed to load all Multiple Group & RLC configs:", error);
    }
  }, [item?.id]);

  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId) => {
      try {
        // For database units, only update local state - don't save to database yet
        // The save will happen when user clicks the Save button
        if (!isNetworkUnit(item)) {
          // Update local state immediately to reflect the change in UI
          if (setInputConfigs) {
            setInputConfigs((prevConfigs) =>
              prevConfigs.map((config) =>
                config.index === inputIndex
                  ? {
                      ...config,
                      lightingId: lightingId,
                    }
                  : config
              )
            );
          }
          // No toast message for local state changes - save confirmation will come when Save button is clicked
        } else {
          toast.info("Network unit - use multi-group config to send to unit");
        }
      } catch (error) {
        console.error("Failed to update input lighting:", error);
        toast.error("Failed to update input lighting: " + error.message);
      }
    },
    [item, setInputConfigs]
  );

  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue) => {
      try {
        // For database units, only update local state - don't save to database yet
        // The save will happen when user clicks the Save button
        if (!isNetworkUnit(item)) {
          // Update local state immediately to reflect the change in UI
          if (setInputConfigs) {
            setInputConfigs((prevConfigs) =>
              prevConfigs.map((config) =>
                config.index === inputIndex
                  ? {
                      ...config,
                      functionValue: parseInt(functionValue) || 0,
                    }
                  : config
              )
            );
          }
          // No toast message for local state changes - save confirmation will come when Save button is clicked
        } else {
          toast.info("Network unit - use multi-group config to send to unit");
        }
      } catch (error) {
        console.error("Failed to update input function:", error);
        toast.error("Failed to update input function: " + error.message);
      }
    },
    [item, setInputConfigs]
  );

  const handleOpenInputDetailConfig = useCallback(
    async (inputIndex, functionValue) => {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (!inputFunction) return;

      // Set initial state with loading
      setCurrentInputDetailInput({
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

      setInputDetailDialogOpen(true);

      try {
        let cachedConfig = multiGroupConfigs[inputIndex];

        if (!cachedConfig) {
          // Load fresh config from database
          const result = await window.electronAPI.unit.getInputConfig(item.id, inputIndex);

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
            setInputDetailConfigs((prev) => ({
              ...prev,
              [inputIndex]: convertedConfig,
            }));

            // Update current input with actual config from database
            setCurrentInputDetailInput((prev) => ({
              ...prev,
              isLoading: false,
              config: convertedConfig,
            }));
          } else {
            // No config found, use defaults
            setCurrentInputDetailInput((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        } else {
          // Use cached config
          setCurrentInputDetailInput((prev) => ({
            ...prev,
            isLoading: false,
            config: cachedConfig,
          }));
        }
      } catch (error) {
        console.error("Failed to load input config:", error);
        setCurrentInputDetailInput((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [multiGroupConfigs, item?.id]
  );

  const handleSaveInputDetailConfig = useCallback(
    async (data) => {
      if (!currentInputDetailInput) {
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
            presetBrightness: parseInt(group.presetBrightness) ?? 255,
          })),
        };

        setInputDetailConfigs((prev) => ({
          ...prev,
          [currentInputDetailInput.index]: updatedConfig,
        }));

        // Check if this is a network unit or database unit
        const isNetworkUnitFlag = isNetworkUnit(item);

        if (isNetworkUnitFlag) {
          toast.info("Network unit - use network-specific configuration dialog");
          return false;
        } else {
          // For database units, only update local state - don't save to database yet
          // The save will happen when user clicks the main Save button

          // Update the input config in local state if function type changed
          if (inputType !== undefined && setInputConfigs) {
            setInputConfigs((prevConfigs) =>
              prevConfigs.map((config) =>
                config.index === currentInputDetailInput.index
                  ? {
                      ...config,
                      functionValue: parseInt(inputType) || 0,
                    }
                  : config
              )
            );
          }

          // Note: Multi-group config is already stored in multiGroupConfigs state
          // and will be saved when main Save button is clicked

          toast.success(`Input ${currentInputDetailInput.index + 1} configuration updated (will be saved when you click Save)`);
        }

        return true;
      } catch (error) {
        console.error("❌ Failed to save input config:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          currentInputDetailInput,
          item,
        });

        toast.error(`Failed to save input configuration: ${error.message}`);
        return false;
      }
    },
    [currentInputDetailInput, item, reloadInputConfig]
  );

  return {
    multiGroupConfigs,
    rlcConfigs,
    multiGroupDialogOpen,
    setInputDetailDialogOpen,
    currentInputDetailInput,
    loadingInputConfig,
    handleInputLightingChange,
    handleInputFunctionChange,
    handleOpenInputDetailConfig,
    handleSaveInputDetailConfig,
    reloadInputConfig,
    loadAllInputDetailConfigs,
  };
};
