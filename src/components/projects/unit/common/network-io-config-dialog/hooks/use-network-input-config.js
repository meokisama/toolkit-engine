import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getInputFunctionByValue, INPUT_TYPES } from "@/constants";

export const useNetworkInputConfig = (item, projectItems, refreshInputConfigs = null) => {
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});
  const [multiGroupDialogOpen, setMultiGroupDialogOpen] = useState(false);
  const [currentMultiGroupInput, setCurrentMultiGroupInput] = useState(null);
  const [inputConfigsFromUnit, setInputConfigsFromUnit] = useState({});
  const [loadingInputConfigs, setLoadingInputConfigs] = useState(false);

  // Reset cache and state when item changes (switching between different network units)
  useEffect(() => {
    // Clear all cached data when switching to a different unit
    setMultiGroupConfigs({});
    setInputConfigsFromUnit({});
    setCurrentMultiGroupInput(null);

    // Close any open dialogs when switching units
    setMultiGroupDialogOpen(false);
  }, [item?.ip_address, item?.id_can]); // Reset when unit IP or CAN ID changes

  // Helper function to determine group type based on input function using INPUT_TYPES
  const getGroupTypeFromFunction = useCallback((functionValue) => {
    if (!functionValue) return "lighting";

    // Search through INPUT_TYPES to find which category the function belongs to
    for (const [categoryKey, functions] of Object.entries(INPUT_TYPES)) {
      const hasFunction = functions.some(
        (func) => func.value === functionValue
      );
      if (hasFunction) {
        // Map category keys to project item types
        switch (categoryKey) {
          case "AIR_CONDITIONER":
            return "aircon";
          case "SCENE":
            return "scene";
          case "MULTI_SCENES":
            return "multi-scene";
          case "SEQUENCE":
            return "sequence";
          case "CURTAIN":
            return "curtain";
          case "ROOM":
          case "LIGHTING":
          default:
            return "lighting";
        }
      }
    }

    // Default to lighting if function not found in any category
    return "lighting";
  }, []);

  // Read input configuration from unit using GET_INPUT_CONFIG command
  const readInputConfigFromUnit = useCallback(
    async (inputIndex = null) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return null;
      }

      setLoadingInputConfigs(true);
      try {
        const response =
          await window.electronAPI.rcuController.getAllInputConfigs({
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

  // Handle input function change
  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return;
      }

      try {
        // Prepare basic input configuration with the new function value
        const inputConfigData = {
          inputNumber: inputIndex,
          inputType: parseInt(functionValue) || 0,
          ramp: 0,
          preset: 255,
          ledStatus: 0,
          autoMode: false,
          delayOff: 0,
          groups: [], // Empty groups for function-only update
        };

        toast.info(`Updating input ${inputIndex + 1} function...`);

        await window.electronAPI.rcuController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(`Input ${inputIndex + 1} function updated successfully`);

        // Refresh input configurations in the main dialog
        if (refreshInputConfigs) {
          try {
            await refreshInputConfigs();
          } catch (refreshError) {
            console.warn("⚠️ Failed to refresh input configurations:", refreshError);
          }
        }
      } catch (error) {
        console.error(`Failed to update input ${inputIndex} function:`, error);
        toast.error(`Failed to update input function: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, refreshInputConfigs]
  );

  // Handle opening multi-group configuration
  const handleOpenMultiGroupConfig = useCallback(
    async (inputIndex, functionValue) => {
      // Get function name from constants
      const functionInfo = getInputFunctionByValue(parseInt(functionValue));
      const functionName = functionInfo?.name || "UNKNOWN";

      // Set initial state with loading
      setCurrentMultiGroupInput({
        index: inputIndex,
        name: `Input ${inputIndex + 1}`,
        functionName: functionName,
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
        // Always read fresh config from unit to get latest state
        let unitConfig = await readInputConfigFromUnit(inputIndex);

        if (unitConfig) {
          // Convert unit config to multi-group config format
          const convertedConfig = {
            ramp: unitConfig.ramp || 0,
            preset: unitConfig.preset || 100,
            led_status: unitConfig.ledStatus?.raw || 0,
            auto_mode: unitConfig.autoMode || 0,
            auto_time: 0, // Auto time not supported yet
            delay_off: unitConfig.delayOff || 0,
            delay_on: unitConfig.delayOn || 0,
            multiGroupConfig:
              unitConfig.groups?.map((group) => ({
                groupId: group.groupId,
                presetBrightness: group.presetBrightness,
              })) || [],
          };

          // Update current input with actual config from unit
          setCurrentMultiGroupInput((prev) => ({
            ...prev,
            isLoading: false,
            config: convertedConfig,
          }));

          // Cache the converted config
          setMultiGroupConfigs((prev) => ({
            ...prev,
            [inputIndex]: convertedConfig,
          }));

        } else {
          // Fallback to default config if reading from unit fails
          setCurrentMultiGroupInput((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error(`Failed to load input ${inputIndex} config:`, error);
        setCurrentMultiGroupInput((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [multiGroupConfigs, inputConfigsFromUnit, readInputConfigFromUnit]
  );

  // Handle saving multi-group configuration
  const handleSaveMultiGroupConfig = useCallback(
    async (data) => {
      if (!currentMultiGroupInput) {
        return false;
      }

      try {
        const groups = data.groups || data;
        const rlcOptions = data.rlcOptions || {};
        const inputType = data.inputType;

        // Update local state
        setMultiGroupConfigs((prev) => ({
          ...prev,
          [currentMultiGroupInput.index]: data,
        }));

        // Send SETUP_INPUT configuration to network unit
        if (!item?.ip_address || !item?.id_can) {
          throw new Error("Unit IP address or CAN ID not available");
        }

        // Calculate delayOff in seconds
        let delayOffSeconds = 0;
        if (rlcOptions.delayOff && typeof rlcOptions.delayOff === "object") {
          delayOffSeconds =
            (rlcOptions.delayOff.hours || 0) * 3600 +
            (rlcOptions.delayOff.minutes || 0) * 60 +
            (rlcOptions.delayOff.seconds || 0);
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

        // Get available items based on input type
        const currentInputType =
          inputType !== undefined
            ? inputType
            : currentMultiGroupInput.functionValue || 0;
        const groupType = getGroupTypeFromFunction(currentInputType);

        let availableItems = [];
        switch (groupType) {
          case "aircon":
            availableItems = projectItems?.aircon || [];
            break;
          case "scene":
            availableItems = projectItems?.scene || [];
            break;
          case "multi-scene":
            availableItems = projectItems?.multi_scenes || [];
            break;
          case "sequence":
            availableItems = projectItems?.sequences || [];
            break;
          case "curtain":
            availableItems = projectItems?.curtain || [];
            break;
          case "lighting":
          default:
            availableItems = projectItems?.lighting || [];
            break;
        }

        // Prepare input configuration data for SETUP_INPUT command
        const inputConfigData = {
          inputNumber: currentMultiGroupInput.index,
          inputType: currentInputType,
          ramp: rlcOptions.ramp || 0,
          preset: rlcOptions.preset || 255,
          ledStatus: ledStatus,
          autoMode: rlcOptions.autoMode || false,
          delayOff: delayOffSeconds,
          groups: groups.map((group) => {
            // Data from MultiGroupConfigDialog is already in the correct format:
            // { groupId: address, presetBrightness: value }
            return {
              groupId: parseInt(group.groupId) || 0,
              presetBrightness: parseInt(group.presetBrightness) || 255,
            };
          }),
        };

        toast.info("Sending input configuration to network unit...");

        await window.electronAPI.rcuController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(
          `Input ${currentMultiGroupInput.index + 1
          } configuration sent successfully`
        );

        // Refresh input configurations in the main dialog
        if (refreshInputConfigs) {
          try {
            await refreshInputConfigs();
          } catch (refreshError) {
            console.warn("⚠️ Failed to refresh input configurations:", refreshError);
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Failed to save multi-group configuration:", error);
        toast.error(`Failed to save configuration: ${error.message}`);
        return false;
      }
    },
    [currentMultiGroupInput, item?.ip_address, item?.id_can, projectItems, refreshInputConfigs]
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
          ramp: currentConfig.ramp || 0,
          preset: currentConfig.preset || 255,
          ledStatus: currentConfig.ledStatus || 0,
          autoMode: currentConfig.autoMode || false,
          delayOff: currentConfig.delayOff || 0,
          groups: lightingId
            ? [{ groupId: lightingId, presetBrightness: 255 }]
            : [],
        };

        toast.info(`Updating input ${inputIndex + 1} lighting association...`);

        await window.electronAPI.rcuController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(
          `Input ${inputIndex + 1} lighting association updated successfully`
        );

        // Refresh input configurations in the main dialog
        if (refreshInputConfigs) {
          try {
            await refreshInputConfigs();
          } catch (refreshError) {
            console.warn("⚠️ Failed to refresh input configurations:", refreshError);
          }
        }
      } catch (error) {
        console.error(
          `Failed to update input ${inputIndex} lighting association:`,
          error
        );
        toast.error(`Failed to update lighting association: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, inputConfigsFromUnit, refreshInputConfigs]
  );

  return {
    multiGroupConfigs,
    multiGroupDialogOpen,
    setMultiGroupDialogOpen,
    currentMultiGroupInput,
    inputConfigsFromUnit,
    loadingInputConfigs,
    readInputConfigFromUnit,
    handleInputLightingChange,
    handleInputFunctionChange,
    handleOpenMultiGroupConfig,
    handleSaveMultiGroupConfig,
  };
};
