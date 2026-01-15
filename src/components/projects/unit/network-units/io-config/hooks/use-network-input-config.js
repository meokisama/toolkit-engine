import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getInputFunctionByValue, getInputDisplayName } from "@/constants";
import log from "electron-log/renderer";

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
        log.error("Failed to read input config from unit:", error);
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
                    // Clear multiGroupConfig and rlcConfig when function type changes
                    multiGroupConfig: [],
                    rlcConfig: {
                      ramp: 0,
                      preset: 255,
                      ledDisplay: 0,
                      nightlight: false,
                      backlight: false,
                      autoMode: false,
                      delayOff: 0,
                    },
                  }
                : config
            )
          );
        }

        // Clear multiGroupConfigs for this input when function type changes
        // Set to empty config instead of deleting to prevent loading old data
        setInputDetailConfigs((prev) => ({
          ...prev,
          [inputIndex]: {
            ramp: 0,
            preset: 255,
            ledDisplay: 0,
            nightlight: false,
            backlight: false,
            autoMode: false,
            delayOff: 0,
            multiGroupConfig: [],
          },
        }));
      } catch (error) {
        log.error(`Failed to update input ${inputIndex} function:`, error);
        toast.error(`Failed to update input function: ${error.message}`);
      }
    },
    [setInputConfigs]
  );

  // Handle opening multi-group configuration - READ FROM LOCAL STATE
  const handleOpenInputDetailConfig = useCallback(
    async (inputIndex, functionValue, currentInputConfig) => {
      // Get function name from constants
      const functionInfo = getInputFunctionByValue(parseInt(functionValue));
      const functionName = functionInfo?.name || "UNKNOWN";

      // Use config from local state (passed from parent) or cached config
      const cachedConfig = multiGroupConfigs[inputIndex];
      const localConfig = currentInputConfig ||
        cachedConfig || {
          ramp: 0,
          preset: 255,
          ledDisplay: 0,
          nightlight: false,
          backlight: false,
          autoMode: false,
          delayOff: 0,
          multiGroupConfig: [],
        };

      // Convert local config to dialog format - read fields directly (backend already parsed)
      const convertedConfig = {
        ramp: localConfig.rlcConfig?.ramp ?? localConfig.ramp ?? 0,
        preset: localConfig.rlcConfig?.preset ?? localConfig.preset ?? 255,
        ledDisplay: localConfig.rlcConfig?.ledDisplay ?? localConfig.ledDisplay ?? 0,
        nightlight: localConfig.rlcConfig?.nightlight ?? localConfig.nightlight ?? false,
        backlight: localConfig.rlcConfig?.backlight ?? localConfig.backlight ?? false,
        autoMode: localConfig.rlcConfig?.autoMode ?? localConfig.autoMode ?? false,
        delayOff: localConfig.rlcConfig?.delayOff ?? localConfig.delayOff ?? 0,
        multiGroupConfig: localConfig.multiGroupConfig || [],
      };

      // Set state immediately from local config (no loading needed)
      setCurrentInputDetailInput({
        index: inputIndex,
        name: getInputDisplayName(item?.type, inputIndex),
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
    },
    [multiGroupConfigs, item?.type]
  );

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

        // Get delayOff - already in seconds from getFinalRlcOptions
        const delayOffSeconds = typeof rlcOptions.delayOff === "number" ? rlcOptions.delayOff : 0;

        const currentInputType = inputType !== undefined ? inputType : currentInputDetailInput.functionValue || 0;

        // Update local state only - changes will be sent when user clicks Save button
        // Store individual LED fields - backend will handle byte calculation
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
                      ledDisplay: rlcOptions.ledDisplay ?? 0,
                      nightlight: rlcOptions.nightlight ?? false,
                      backlight: rlcOptions.backlight ?? false,
                      autoMode: rlcOptions.autoMode ?? false,
                      delayOff: delayOffSeconds,
                    },
                  }
                : config
            )
          );
        }

        // Update cached config
        setInputDetailConfigs((prev) => ({
          ...prev,
          [currentInputDetailInput.index]: {
            ramp: rlcOptions.ramp ?? 0,
            preset: rlcOptions.preset ?? 255,
            ledDisplay: rlcOptions.ledDisplay ?? 0,
            nightlight: rlcOptions.nightlight ?? false,
            backlight: rlcOptions.backlight ?? false,
            autoMode: rlcOptions.autoMode ?? false,
            delayOff: delayOffSeconds,
            multiGroupConfig: groups.map((group) => ({
              groupId: parseInt(group.groupId) || 0,
              presetBrightness: parseInt(group.presetBrightness) ?? 255,
            })),
          },
        }));

        return true;
      } catch (error) {
        log.error(" Failed to save multi-group configuration:", error);
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
          ledDisplay: currentConfig.ledDisplay ?? 0,
          nightlight: currentConfig.nightlight ?? false,
          backlight: currentConfig.backlight ?? false,
          autoMode: currentConfig.autoMode ?? false,
          delayOff: currentConfig.delayOff ?? 0,
          groups: lightingId ? [{ groupId: lightingId, presetBrightness: 255 }] : [],
        };

        toast.info(`Updating input ${inputIndex + 1} lighting association...`);

        await window.electronAPI.ioController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(`${getInputDisplayName(item?.type, inputIndex)} lighting association updated successfully`);

        // Refresh input configurations in the main dialog
        if (refreshInputConfigs) {
          try {
            await refreshInputConfigs();
          } catch (refreshError) {
            log.warn("Failed to refresh input configurations:", refreshError);
          }
        }
      } catch (error) {
        log.error(`Failed to update input ${inputIndex} lighting association:`, error);
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

          toast.success(`${getInputDisplayName(item?.type, inputIndex)} turned ${newValue === 255 ? "on" : "off"}`);
        }
      } catch (error) {
        log.error(`Failed to toggle input ${inputIndex} state:`, error);
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
