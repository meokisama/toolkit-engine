import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getInputFunctionByValue, getInputDisplayName } from "@/constants";
import log from "electron-log/renderer";

// Default RLC config (without multiGroupConfig)
const DEFAULT_RLC = {
  ramp: 0,
  preset: 255,
  ledDisplay: 0,
  nightlight: false,
  backlight: false,
  autoMode: false,
  delayOff: 0,
};

// Helpers
const updateConfigAtIndex = (prev, index, updates) => prev.map((cfg) => (cfg.index === index ? { ...cfg, ...updates } : cfg));
const formatGroups = (groups) => groups.map((g) => ({ groupId: parseInt(g.groupId) || 0, presetBrightness: parseInt(g.presetBrightness) ?? 255 }));

export const useNetworkInputConfig = (item, projectItems, refreshInputConfigs = null, setInputConfigs = null) => {
  // State 1: RLC options only (ramp, preset, ledDisplay, etc.)
  const [rlcConfigs, setRlcConfigs] = useState({});

  // State 2: Multi-group configs only (array of { groupId, presetBrightness })
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});

  // Dialog state
  const [multiGroupDialogOpen, setInputDetailDialogOpen] = useState(false);
  const [currentInputDetailInput, setCurrentInputDetailInput] = useState(null);

  // Configs read from unit
  const [inputConfigsFromUnit, setInputConfigsFromUnit] = useState({});
  const [loadingInputConfigs, setLoadingInputConfigs] = useState(false);

  // Reset cache when unit changes
  useEffect(() => {
    setRlcConfigs({});
    setMultiGroupConfigs({});
    setInputConfigsFromUnit({});
    setCurrentInputDetailInput(null);
    setInputDetailDialogOpen(false);
  }, [item?.ip_address, item?.id_can]);

  // Read all input configs from unit
  const readInputConfigFromUnit = useCallback(
    async (inputIndex = null) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return null;
      }

      setLoadingInputConfigs(true);
      try {
        const response = await window.electronAPI.ioController.getAllInputConfigs({ unitIp: item.ip_address, canId: item.id_can });

        if (!response?.configs) throw new Error("No input configurations received from unit");

        const configsMap = Object.fromEntries(response.configs.map((cfg) => [cfg.inputNumber, cfg]));
        setInputConfigsFromUnit(configsMap);

        return inputIndex !== null ? configsMap[inputIndex] : configsMap;
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

  // Handle input function change - LOCAL STATE ONLY
  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue) => {
      try {
        setInputConfigs?.((prev) =>
          updateConfigAtIndex(prev, inputIndex, {
            functionValue: parseInt(functionValue) || 0,
            multiGroupConfig: [],
            rlcConfig: { ...DEFAULT_RLC },
          })
        );

        // Clear configs for this input
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: { ...DEFAULT_RLC } }));
        setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: [] }));
      } catch (error) {
        log.error(`Failed to update input ${inputIndex} function:`, error);
        toast.error(`Failed to update input function: ${error.message}`);
      }
    },
    [setInputConfigs]
  );

  // Handle opening input detail config dialog
  const handleOpenInputDetailConfig = useCallback(
    async (inputIndex, functionValue, currentInputConfig) => {
      const functionInfo = getInputFunctionByValue(parseInt(functionValue));

      // Get cached configs or extract from currentInputConfig
      let rlc = rlcConfigs[inputIndex];
      let groups = multiGroupConfigs[inputIndex];

      // If not cached, try to extract from currentInputConfig
      if (!rlc && currentInputConfig) {
        const configRlc = currentInputConfig.rlcConfig || currentInputConfig;
        rlc = {
          ramp: configRlc.ramp ?? DEFAULT_RLC.ramp,
          preset: configRlc.preset ?? DEFAULT_RLC.preset,
          ledDisplay: configRlc.ledDisplay ?? DEFAULT_RLC.ledDisplay,
          nightlight: configRlc.nightlight ?? DEFAULT_RLC.nightlight,
          backlight: configRlc.backlight ?? DEFAULT_RLC.backlight,
          autoMode: configRlc.autoMode ?? DEFAULT_RLC.autoMode,
          delayOff: configRlc.delayOff ?? DEFAULT_RLC.delayOff,
        };
        groups = currentInputConfig.multiGroupConfig || [];

        // Cache for future use
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: rlc }));
        setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: groups }));
      }

      setCurrentInputDetailInput({
        index: inputIndex,
        name: getInputDisplayName(item?.type, inputIndex),
        functionName: functionInfo?.name || "UNKNOWN",
        functionValue,
        isLoading: false,
        rlcOptions: rlc || DEFAULT_RLC,
        groups: groups || [],
      });

      setInputDetailDialogOpen(true);
    },
    [rlcConfigs, multiGroupConfigs, item?.type]
  );

  // Handle saving input detail config - LOCAL STATE ONLY
  const handleSaveInputDetailConfig = useCallback(
    async (data) => {
      if (!currentInputDetailInput) return false;

      try {
        const { groups = [], rlcOptions = {}, inputType } = data;
        const inputIndex = currentInputDetailInput.index;
        const delayOffSeconds = typeof rlcOptions.delayOff === "number" ? rlcOptions.delayOff : 0;
        const currentInputType = inputType ?? currentInputDetailInput.functionValue ?? 0;
        const formattedGroups = formatGroups(groups);

        // RLC config (without multiGroupConfig)
        const rlcConfig = { ...DEFAULT_RLC, ...rlcOptions, delayOff: delayOffSeconds };

        // Update separate states
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: rlcConfig }));
        setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: formattedGroups }));

        // Update parent inputConfigs state
        setInputConfigs?.((prev) =>
          updateConfigAtIndex(prev, inputIndex, {
            functionValue: currentInputType,
            multiGroupConfig: formattedGroups,
            rlcConfig: rlcConfig,
          })
        );

        return true;
      } catch (error) {
        log.error("Failed to save multi-group configuration:", error);
        toast.error(`Failed to save configuration: ${error.message}`);
        return false;
      }
    },
    [currentInputDetailInput, setInputConfigs]
  );

  // Handle input lighting change (sends to unit immediately)
  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId) => {
      if (!item?.ip_address || !item?.id_can) {
        toast.error("Unit IP address or CAN ID not available");
        return;
      }

      try {
        const currentConfig = inputConfigsFromUnit[inputIndex] || {};

        const inputConfigData = {
          inputNumber: inputIndex,
          inputType: currentConfig.inputType || 0,
          ramp: currentConfig.ramp ?? DEFAULT_RLC.ramp,
          preset: currentConfig.preset ?? DEFAULT_RLC.preset,
          ledDisplay: currentConfig.ledDisplay ?? DEFAULT_RLC.ledDisplay,
          nightlight: currentConfig.nightlight ?? DEFAULT_RLC.nightlight,
          backlight: currentConfig.backlight ?? DEFAULT_RLC.backlight,
          autoMode: currentConfig.autoMode ?? DEFAULT_RLC.autoMode,
          delayOff: currentConfig.delayOff ?? DEFAULT_RLC.delayOff,
          groups: lightingId ? [{ groupId: lightingId, presetBrightness: 255 }] : [],
        };

        toast.info(`Updating input ${inputIndex + 1} lighting association...`);

        await window.electronAPI.ioController.setupInputConfig({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputConfig: inputConfigData,
        });

        toast.success(`${getInputDisplayName(item?.type, inputIndex)} lighting association updated successfully`);
        await refreshInputConfigs?.();
      } catch (error) {
        log.error(`Failed to update input ${inputIndex} lighting association:`, error);
        toast.error(`Failed to update lighting association: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, item?.type, inputConfigsFromUnit, refreshInputConfigs]
  );

  // Handle input state toggle
  const handleToggleInputState = useCallback(
    async (inputIndex, currentState) => {
      if (!item?.ip_address || !item?.id_can) return;

      try {
        const newValue = currentState ? 0 : 255;

        const response = await window.electronAPI.ioController.setInputState({
          unitIp: item.ip_address,
          canId: item.id_can,
          inputIndex,
          value: newValue,
        });

        if (response) {
          setInputConfigs?.((prev) => updateConfigAtIndex(prev, inputIndex, { isActive: newValue > 0 }));
          toast.success(`${getInputDisplayName(item?.type, inputIndex)} turned ${newValue === 255 ? "on" : "off"}`);
        }
      } catch (error) {
        log.error(`Failed to toggle input ${inputIndex} state:`, error);
        toast.error(`Failed to toggle input state: ${error.message}`);
      }
    },
    [item?.ip_address, item?.id_can, item?.type, setInputConfigs]
  );

  return {
    rlcConfigs,
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
