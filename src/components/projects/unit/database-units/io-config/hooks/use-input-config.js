import { useState, useCallback, useEffect } from "react";
import { getInputFunctionByValue, getInputDisplayName } from "@/constants";
import { toast } from "sonner";
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
const isNetworkUnit = (unit) => !unit?.id;
const updateConfigAtIndex = (prev, index, updates) => prev.map((cfg) => (cfg.index === index ? { ...cfg, ...updates } : cfg));

export const useInputConfig = (item, setInputConfigs = null, open = true) => {
  // State 1: RLC options only (ramp, preset, ledDisplay, etc.)
  const [rlcConfigs, setRlcConfigs] = useState({});

  // State 2: Multi-group configs only (array of { groupId, presetBrightness })
  const [multiGroupConfigs, setMultiGroupConfigs] = useState({});

  // Dialog state
  const [multiGroupDialogOpen, setInputDetailDialogOpen] = useState(false);
  const [currentInputDetailInput, setCurrentInputDetailInput] = useState(null);
  const [loadingInputConfig, setLoadingInputConfig] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setRlcConfigs({});
      setMultiGroupConfigs({});
      setInputDetailDialogOpen(false);
      setCurrentInputDetailInput(null);
      setLoadingInputConfig(false);
    }
  }, [open]);

  // Reload input config from database
  const reloadInputConfig = useCallback(
    async (inputIndex) => {
      if (!item?.id || isNetworkUnit(item)) return;

      try {
        const actualConfig = await window.electronAPI.unit.getInputConfig(item.id, inputIndex);
        if (actualConfig && setInputConfigs) {
          setInputConfigs((prev) => updateConfigAtIndex(prev, inputIndex, { functionValue: actualConfig.function_value || 0, lightingId: actualConfig.lighting_id }));
        }
      } catch (error) {
        log.error("Failed to reload input config:", error);
      }
    },
    [item?.id, setInputConfigs]
  );

  // Load all configs from database
  const loadAllInputDetailConfigs = useCallback(async () => {
    if (!item?.id || isNetworkUnit(item)) return;

    try {
      const unit = await window.electronAPI.unit.getById(item.id);
      if (!unit?.input_configs?.inputs) return;

      const newRlcConfigs = {};
      const newMultiGroupConfigs = {};

      unit.input_configs.inputs.forEach((cfg) => {
        // Always load if there's any config data
        if (cfg.rlc_config || cfg.multi_group_config?.length > 0) {
          // RLC config - merge with defaults
          newRlcConfigs[cfg.index] = { ...DEFAULT_RLC, ...cfg.rlc_config };

          // Multi-group config - just the array
          newMultiGroupConfigs[cfg.index] = cfg.multi_group_config || [];
        }
      });

      setRlcConfigs(newRlcConfigs);
      setMultiGroupConfigs(newMultiGroupConfigs);
    } catch (error) {
      log.error("Failed to load all configs:", error);
    }
  }, [item?.id]);

  // Handle lighting change
  const handleInputLightingChange = useCallback(
    async (inputIndex, lightingId) => {
      if (isNetworkUnit(item)) {
        toast.info("Network unit - use multi-group config to send to unit");
        return;
      }

      try {
        setInputConfigs?.((prev) => updateConfigAtIndex(prev, inputIndex, { lightingId }));
      } catch (error) {
        log.error("Failed to update input lighting:", error);
        toast.error("Failed to update input lighting: " + error.message);
      }
    },
    [item, setInputConfigs]
  );

  // Handle function change
  const handleInputFunctionChange = useCallback(
    async (inputIndex, functionValue) => {
      if (isNetworkUnit(item)) {
        toast.info("Network unit - use multi-group config to send to unit");
        return;
      }

      try {
        setInputConfigs?.((prev) => updateConfigAtIndex(prev, inputIndex, { functionValue: parseInt(functionValue) || 0 }));

        // Clear configs for this input
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: { ...DEFAULT_RLC } }));
        setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: [] }));
      } catch (error) {
        log.error("Failed to update input function:", error);
        toast.error("Failed to update input function: " + error.message);
      }
    },
    [item, setInputConfigs]
  );

  // Open input detail config dialog
  const handleOpenInputDetailConfig = useCallback(
    async (inputIndex, functionValue) => {
      const inputFunction = getInputFunctionByValue(functionValue);
      if (!inputFunction) return;

      // Get cached configs or defaults
      const cachedRlc = rlcConfigs[inputIndex] || DEFAULT_RLC;
      const cachedGroups = multiGroupConfigs[inputIndex] || [];

      setCurrentInputDetailInput({
        index: inputIndex,
        name: getInputDisplayName(item?.type, inputIndex),
        functionName: inputFunction.label,
        functionValue,
        isLoading: true,
        rlcOptions: cachedRlc,
        groups: cachedGroups,
      });
      setInputDetailDialogOpen(true);

      try {
        let rlc = rlcConfigs[inputIndex];
        let groups = multiGroupConfigs[inputIndex];

        // Load from database if not cached
        if (!rlc && !groups) {
          const result = await window.electronAPI.unit.getInputConfig(item.id, inputIndex);
          if (result) {
            rlc = { ...DEFAULT_RLC, ...result.rlc_config };
            groups = result.multi_group_config || [];

            setRlcConfigs((prev) => ({ ...prev, [inputIndex]: rlc }));
            setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: groups }));
          }
        }

        setCurrentInputDetailInput((prev) => ({
          ...prev,
          isLoading: false,
          rlcOptions: rlc || DEFAULT_RLC,
          groups: groups || [],
        }));
      } catch (error) {
        log.error("Failed to load input config:", error);
        setCurrentInputDetailInput((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [rlcConfigs, multiGroupConfigs, item?.id, item?.type]
  );

  // Save input detail config
  const handleSaveInputDetailConfig = useCallback(
    async (data) => {
      if (!currentInputDetailInput) return false;

      try {
        const { groups = [], rlcOptions = {}, inputType } = data;
        const inputIndex = currentInputDetailInput.index;

        // Format groups
        const formattedGroups = groups.map((g) => ({
          groupId: parseInt(g.groupId) || 0,
          presetBrightness: parseInt(g.presetBrightness) ?? 255,
        }));

        // Update separate states
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: { ...DEFAULT_RLC, ...rlcOptions } }));
        setMultiGroupConfigs((prev) => ({ ...prev, [inputIndex]: formattedGroups }));

        if (isNetworkUnit(item)) {
          toast.info("Network unit - use network-specific configuration dialog");
          return false;
        }

        // Update function type if changed
        if (inputType !== undefined && setInputConfigs) {
          setInputConfigs((prev) => updateConfigAtIndex(prev, inputIndex, { functionValue: parseInt(inputType) || 0 }));
        }

        toast.success(`${currentInputDetailInput.name} configuration updated`);
        return true;
      } catch (error) {
        log.error("Failed to save input config:", error);
        toast.error(`Failed to save input configuration: ${error.message}`);
        return false;
      }
    },
    [currentInputDetailInput, item, setInputConfigs]
  );

  return {
    rlcConfigs,
    multiGroupConfigs,
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
