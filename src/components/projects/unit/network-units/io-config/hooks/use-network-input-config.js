import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getInputFunctionByValue } from "@/constants";

export const useNetworkInputConfig = (item, projectItems, refreshInputConfigs = null, setInputConfigs = null) => {
  const [multiGroupConfigs, setInputDetailConfigs] = useState({});
  const [multiGroupDialogOpen, setInputDetailDialogOpen] = useState(false);
  const [currentInputDetailInput, setCurrentInputDetailInput] = useState(null);
  const [inputConfigsFromUnit, setInputConfigsFromUnit] = useState({});
  const [loadingInputConfigs, setLoadingInputConfigs] = useState(false);

  // Reset cache and state when item changes (switching between different network units)
  useEffect(() => {
    // Clear all cached data when switching to a different unit
    setInputDetailConfigs({});
    setInputConfigsFromUnit({});
    setCurrentInputDetailInput(null);

    // Close any open dialogs when switching units
    setInputDetailDialogOpen(false);
  }, [item?.ip_address, item?.id_can]); // Reset when unit IP or CAN ID changes

  // Read input configuration from unit using GET_INPUT_CONFIG command
  const readInputConfigFromUnit = useCallback(
    async (inputIndex = null) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return null;
      }

      setLoadingInputConfigs(true);
      try {
        const response = await window.electronAPI.ioController.getAllInputConfigs({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

        if (response?.configs) {
          // Convert array to object indexed by input number for easier access
          const configsMap = {};
          response.configs.forEach((config) => {
            configsMap[config.inputNumber] = config;
          });

          setInputConfigsFromUnit(configsMap);

          // If specific input requested, return that config
          if (inputIndex !== null && configsMap[inputIndex]) {
            return configsMap[inputIndex];
          }

          return configsMap;
        } else {
          throw new Error("No input configurations received from unit");
        }
      } catch (error) {
        console.error("Failed to read input config from unit:", error);
        toast.error(`Failed to read input configuration: ${error.message}`);
        return null;
      } finally {
        setLoadingInputConfigs(false);
      }
    },
    [item?.ip_address, item?.id_can]
  );

  // Handle input function change - LOCAL STATE ONLY (no send to unit)
  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue) => {
      try {
        // Update local state only - changes will be sent when user clicks Save button
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
      } catch (error) {
        console.error(`Failed to update input ${inputIndex} function:`, error);
        toast.error(`Failed to update input function: ${error.message}`);
      }
    },
    [setInputConfigs]
  );

  // Handle opening multi-group configuration - READ FROM LOCAL STATE
  const handleOpenInputDetailConfig = useCallback(async (inputIndex, functionValue, currentInputConfig) => {
    // Get function name from constants
    const functionInfo = getInputFunctionByValue(parseInt(functionValue));
    const functionName = functionInfo?.name || "UNKNOWN";

    // Use config from local state (passed from parent)
    const localConfig = currentInputConfig || {
      ramp: 0,
      preset: 100,
      led_status: 0,
      auto_mode: 0,
      auto_time: 0,
      delay_off: 0,
      delay_on: 0,
      multiGroupConfig: [],
    };

    // Convert local config to dialog format
    const convertedConfig = {
      ramp: localConfig.rlcConfig?.ramp ?? localConfig.ramp ?? 0,
      preset: localConfig.rlcConfig?.preset ?? localConfig.preset ?? 100,
      led_status: localConfig.rlcConfig?.ledStatus ?? localConfig.led_status ?? 0,
      auto_mode: localConfig.rlcConfig?.autoMode ?? localConfig.auto_mode ?? 0,
      auto_time: 0,
      delay_off: localConfig.rlcConfig?.delayOff ?? localConfig.delay_off ?? 0,
      delay_on: localConfig.rlcConfig?.delayOn ?? localConfig.delay_on ?? 0,
      multiGroupConfig: localConfig.multiGroupConfig || [],
    };

    // Set state immediately from local config (no loading needed)
    setCurrentInputDetailInput({
      index: inputIndex,
      name: `Input ${inputIndex + 1}`,
      functionName: functionName,
      functionValue: functionValue,
      isLoading: false,
      config: convertedConfig,
    });

    setInputDetailDialogOpen(true);

    // Cache the config
    setInputDetailConfigs((prev) => ({
      ...prev,
      [inputIndex]: convertedConfig,
    }));
  }, []);

  // Handle saving multi-group configuration - LOCAL STATE ONLY (no send to unit)
  const handleSaveInputDetailConfig = useCallback(
    async (data) => {
      if (!currentInputDetailInput) {
        return false;
      }

      try {
        const groups = data.groups || data;
        const rlcOptions = data.rlcOptions || {};
        const inputType = data.inputType;

        // Calculate delayOff in seconds
        let delayOffSeconds = 0;
        if (rlcOptions.delayOff && typeof rlcOptions.delayOff === "object") {
          delayOffSeconds = (rlcOptions.delayOff.hours || 0) * 3600 + (rlcOptions.delayOff.minutes || 0) * 60 + (rlcOptions.delayOff.seconds || 0);
        } else if (typeof rlcOptions.delayOff === "number") {
          delayOffSeconds = rlcOptions.delayOff;
        }

        // Calculate LED status byte from individual flags
        let ledStatus = 0;
        if (rlcOptions.ledStatus !== undefined) {
          ledStatus = rlcOptions.ledStatus;
        } else {
          // Calculate from individual components
          const displayMode = rlcOptions.ledDisplay || 0;
          const nightlight = rlcOptions.nightlight ? 1 : 0;
          const backlight = rlcOptions.backlight ? 1 : 0;

          // LED Status byte format: [7:4] Display Mode, [3] Reserved, [2] Nightlight, [1] Backlight, [0] Reserved
          ledStatus = (displayMode << 4) | (nightlight << 2) | (backlight << 1);
        }

        const currentInputType = inputType !== undefined ? inputType : currentInputDetailInput.functionValue || 0;

        // Update local state only - changes will be sent when user clicks Save button
        if (setInputConfigs) {
          setInputConfigs((prevConfigs) =>
            prevConfigs.map((config) =>
              config.index === currentInputDetailInput.index
                ? {
                    ...config,
                    functionValue: currentInputType,
                    multiGroupConfig: groups.map((group) => ({
                      groupId: parseInt(group.groupId) || 0,
                      presetBrightness: parseInt(group.presetBrightness) ?? 255,
                    })),
                    rlcConfig: {
                      ramp: rlcOptions.ramp ?? 0,
                      preset: rlcOptions.preset ?? 255,
                      ledStatus: ledStatus,
                      autoMode: rlcOptions.autoMode || false,
                      delayOff: delayOffSeconds,
                      delayOn: rlcOptions.delayOn ?? 0,
                    },
                  }
                : config
            )
          );
        }

        // Update cached config
        setInputDetailConfigs((prev) => ({
          ...prev,
          [currentInputDetailInput.index]: data,
        }));

        return true;
      } catch (error) {
        console.error("❌ Failed to save multi-group configuration:", error);
        toast.error(`Failed to save configuration: ${error.message}`);
        return false;
      }
    },
    [currentInputDetailInput, setInputConfigs]
  );

  // Handle input lighting change (for lighting selection in multi-group)
  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return;
      }

      try {
        // Get current input configuration to preserve existing settings
        const currentConfig = inputConfigsFromUnit[inputIndex] || {};

        // Prepare input configuration with lighting association
        const inputConfigData = {
          inputNumber: inputIndex,
          inputType: currentConfig.inputType || 0,
          ramp: currentConfig.ramp ?? 0,
          preset: currentConfig.preset ?? 255,
          ledStatus: currentConfig.ledStatus || 0,
          autoMode: currentConfig.autoMode || false,
          delayOff: currentConfig.delayOff ?? 0,
          groups: lightingId ? [{ groupId: lightingId, presetBrightness: 255 }] : [],
        };

        toast.info(`Updating input ${inputIndex + 1} lighting association...`);

        await window.electronAPI.ioController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(`Input ${inputIndex + 1} lighting association updated successfully`);

        // Refresh input configurations in the main dialog
        if (refreshInputConfigs) {
          try {
            await refreshInputConfigs();
          } catch (refreshError) {
            console.warn("⚠️ Failed to refresh input configurations:", refreshError);
          }
        }
      } catch (error) {
        console.error(`Failed to update input ${inputIndex} lighting association:`, error);
        toast.error(`Failed to update lighting association: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, inputConfigsFromUnit, refreshInputConfigs]
  );

  // Handle input state toggle
  const handleToggleInputState = useCallback(
    async (inputIndex, currentState) => {
      if (!item?.ip_address || !item?.id_can) {
        return;
      }

      try {
        // Toggle state: if currently on (true), send 0 to turn off; if off (false), send 255 to turn on
        const newValue = currentState ? 0 : 255;
        const newActiveState = newValue > 0;

        const response = await window.electronAPI.ioController.setInputState({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputIndex: inputIndex,
          value: newValue,
        });

        if (response) {
          // Update local state immediately after successful command
          if (setInputConfigs) {
            setInputConfigs((prevConfigs) =>
              prevConfigs.map((config) => (config.index === inputIndex ? { ...config, isActive: newActiveState } : config))
            );
          }

          toast.success(`Input ${inputIndex + 1} turned ${newValue === 255 ? "on" : "off"}`);
        }
      } catch (error) {
        console.error(`Failed to toggle input ${inputIndex} state:`, error);
        toast.error(`Failed to toggle input state: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, setInputConfigs]
  );

  return {
    multiGroupConfigs,
    multiGroupDialogOpen,
    setInputDetailDialogOpen,
    currentInputDetailInput,
    inputConfigsFromUnit,
    loadingInputConfigs,
    readInputConfigFromUnit,
    handleInputLightingChange,
    handleInputFunctionChange,
    handleOpenInputDetailConfig,
    handleSaveInputDetailConfig,
    handleToggleInputState,
  };
};
