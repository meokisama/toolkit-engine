import { useState, useCallback, useEffect } from "react";
import { getInputFunctionByValue, getInputDisplayName } from "@/constants";
import { toast } from "sonner";
import log from "electron-log/renderer";

// Constants
const DEFAULT_RLC_CONFIG = {
  ramp: 0,
  preset: 255,
  ledDisplay: 0,
  nightlight: false,
  backlight: false,
  autoMode: false,
  delayOff: 0,
  multiGroupConfig: [],
};

// Helpers
const isNetworkUnit = (unit) => !unit?.id;
const mergeRlcConfig = (config) => ({ ...DEFAULT_RLC_CONFIG, ...config });
const updateConfigAtIndex = (prev, index, updates) => prev.map((cfg) => (cfg.index === index ? { ...cfg, ...updates } : cfg));

export const useInputConfig = (item, setInputConfigs = null, open = true) => {
  const [multiGroupConfigs, setInputDetailConfigs] = useState({});
  const [rlcConfigs, setRlcConfigs] = useState({});
  const [multiGroupDialogOpen, setInputDetailDialogOpen] = useState(false);
  const [currentInputDetailInput, setCurrentInputDetailInput] = useState(null);
  const [loadingInputConfig, setLoadingInputConfig] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInputDetailConfigs({});
      setRlcConfigs({});
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

      const newDetailConfigs = {};
      const newRlcConfigs = {};

      unit.input_configs.inputs.forEach((cfg) => {
        if (cfg.rlc_config || cfg.multi_group_config?.length > 0) {
          newDetailConfigs[cfg.index] = mergeRlcConfig({ ...cfg.rlc_config, multiGroupConfig: cfg.multi_group_config || [] });
          newRlcConfigs[cfg.index] = cfg.rlc_config || {};
        }
      });

      setInputDetailConfigs(newDetailConfigs);
      setRlcConfigs(newRlcConfigs);
    } catch (error) {
      log.error("Failed to load all Multiple Group & RLC configs:", error);
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
        const emptyConfig = { ...DEFAULT_RLC_CONFIG };
        setInputDetailConfigs((prev) => ({ ...prev, [inputIndex]: emptyConfig }));
        setRlcConfigs((prev) => ({ ...prev, [inputIndex]: emptyConfig }));
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

      const defaultConfig = multiGroupConfigs[inputIndex] || DEFAULT_RLC_CONFIG;

      setCurrentInputDetailInput({
        index: inputIndex,
        name: getInputDisplayName(item?.type, inputIndex),
        functionName: inputFunction.label,
        functionValue,
        isLoading: true,
        config: defaultConfig,
      });
      setInputDetailDialogOpen(true);

      try {
        let config = multiGroupConfigs[inputIndex];

        if (!config) {
          const result = await window.electronAPI.unit.getInputConfig(item.id, inputIndex);
          if (result) {
            config = mergeRlcConfig({ ...result.rlc_config, multiGroupConfig: result.multi_group_config || [] });
            setInputDetailConfigs((prev) => ({ ...prev, [inputIndex]: config }));
          }
        }

        setCurrentInputDetailInput((prev) => ({ ...prev, isLoading: false, config: config || defaultConfig }));
      } catch (error) {
        log.error("Failed to load input config:", error);
        setCurrentInputDetailInput((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [multiGroupConfigs, item?.id, item?.type]
  );

  // Save input detail config
  const handleSaveInputDetailConfig = useCallback(
    async (data) => {
      if (!currentInputDetailInput) return false;

      try {
        const { groups = [], rlcOptions = {}, inputType } = data;

        const updatedConfig = mergeRlcConfig({
          ...rlcOptions,
          multiGroupConfig: groups.map((g) => ({ groupId: parseInt(g.groupId) || 0, presetBrightness: parseInt(g.presetBrightness) ?? 255 })),
        });

        setInputDetailConfigs((prev) => ({ ...prev, [currentInputDetailInput.index]: updatedConfig }));

        if (isNetworkUnit(item)) {
          toast.info("Network unit - use network-specific configuration dialog");
          return false;
        }

        // Update function type if changed
        if (inputType !== undefined && setInputConfigs) {
          setInputConfigs((prev) => updateConfigAtIndex(prev, currentInputDetailInput.index, { functionValue: parseInt(inputType) || 0 }));
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
