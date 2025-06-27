import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useNetworkInputConfig = (item) => {
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});
  const [multiGroupDialogOpen, setMultiGroupDialogOpen] = useState(false);
  const [currentMultiGroupInput, setCurrentMultiGroupInput] = useState(null);
  const [inputConfigsFromUnit, setInputConfigsFromUnit] = useState({});
  const [loadingInputConfigs, setLoadingInputConfigs] = useState(false);

  // Read input configuration from unit using GET_INPUT_CONFIG command
  const readInputConfigFromUnit = useCallback(async (inputIndex = null) => {
    if (!item?.ip_address || !item?.id_can) {
      toast.error("Unit IP address or CAN ID not available");
      return null;
    }

    setLoadingInputConfigs(true);
    try {
      console.log(`Reading input config from unit ${item.ip_address} (CAN ID: ${item.id_can})`);

      const response = await window.electronAPI.rcuController.getAllInputConfigs({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      if (response?.configs) {
        console.log(`Received ${response.configs.length} input configurations from unit`);

        // Convert array to object indexed by input number for easier access
        const configsMap = {};
        response.configs.forEach(config => {
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
  }, [item?.ip_address, item?.id_can]);

  // Handle input function change
  const handleInputFunctionChange = useCallback((inputIndex, functionValue) => {
    // For network units, we don't save to database immediately
    // This will be handled by the parent component's state management
    console.log(`Input ${inputIndex} function changed to ${functionValue}`);

    // TODO: Send command to network unit to update input function
    // This will be implemented when data handling is added
    toast.info(`Input ${inputIndex + 1} function updated (network mode)`);
  }, []);

  // Handle opening multi-group configuration
  const handleOpenMultiGroupConfig = useCallback(async (inputIndex, functionValue) => {
    // Get function name from constants
    const functionName = ""; // TODO: Get from constants based on functionValue

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
        multiGroupConfig: []
      }
    });
    setMultiGroupDialogOpen(true);

    try {
      // Check if we have cached config first
      let unitConfig = inputConfigsFromUnit[inputIndex];

      if (!unitConfig) {
        // If not cached, try to read from unit
        console.log(`No cached config for input ${inputIndex}, attempting to read from unit...`);
        unitConfig = await readInputConfigFromUnit(inputIndex);
      }

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
          multiGroupConfig: unitConfig.groups?.map(group => ({
            groupId: group.groupId,
            presetBrightness: group.presetBrightness
          })) || []
        };

        // Update current input with actual config from unit
        setCurrentMultiGroupInput(prev => ({
          ...prev,
          isLoading: false,
          config: convertedConfig
        }));

        // Cache the converted config
        setMultiGroupConfigs(prev => ({
          ...prev,
          [inputIndex]: convertedConfig
        }));

        console.log(`Loaded input ${inputIndex} config:`, convertedConfig);
      } else {
        // Fallback to default config if reading from unit fails
        console.log(`Using default config for input ${inputIndex}`);
        setCurrentMultiGroupInput(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error(`Failed to load input ${inputIndex} config:`, error);
      setCurrentMultiGroupInput(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [multiGroupConfigs, inputConfigsFromUnit, readInputConfigFromUnit]);

  // Handle saving multi-group configuration
  const handleSaveMultiGroupConfig = useCallback(async (data) => {
    if (!currentMultiGroupInput) return false;

    try {
      const groups = data.groups || data;
      const rlcOptions = data.rlcOptions || {};

      // Update local state
      setMultiGroupConfigs(prev => ({
        ...prev,
        [currentMultiGroupInput.index]: data
      }));

      // Send SETUP_INPUT configuration to network unit
      if (item?.ip_address && item?.id_can) {
        const { setupInputConfig } = await import("@/services/rcu-controller.js");

        // Prepare input configuration data for SETUP_INPUT command
        const inputConfigData = {
          inputNumber: currentMultiGroupInput.index,
          inputType: currentMultiGroupInput.functionValue || 0,
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

        await setupInputConfig(item.ip_address, item.id_can, inputConfigData);
        console.log(`Input ${currentMultiGroupInput.index} configuration sent to network unit ${item.ip_address}`);
        toast.success(`Input ${currentMultiGroupInput.index + 1} configuration sent to unit`);
      } else {
        console.log(`Multi-group config saved locally for input ${currentMultiGroupInput.index}:`, data);
        toast.success(`Input ${currentMultiGroupInput.index + 1} configuration saved (network mode)`);
      }

      return true;
    } catch (error) {
      console.error("Failed to save multi-group configuration:", error);
      toast.error("Failed to save configuration");
      return false;
    }
  }, [currentMultiGroupInput, item?.ip_address, item?.id_can]);

  // Handle input lighting change (for lighting selection in multi-group)
  const handleInputLightingChange = useCallback((inputIndex, lightingId) => {
    // For network units, this might not be directly applicable
    // but we keep the interface consistent
    console.log(`Input ${inputIndex} lighting changed to ${lightingId}`);

    // TODO: Handle lighting association for network units
    toast.info(`Input ${inputIndex + 1} lighting association updated (network mode)`);
  }, []);

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
