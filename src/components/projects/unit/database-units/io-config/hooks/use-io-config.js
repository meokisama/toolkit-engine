import { useState, useEffect, useMemo, useCallback } from "react";
import { getUnitIOSpec, getOutputTypes, getInputDisplayName } from "@/constants";
import { cloneIOConfig } from "@/utils/io-config-utils";
import log from "electron-log/renderer";

export const useIOConfig = (item, open) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [originalIOConfig, setOriginalIOConfig] = useState(null);
  const [originalInputConfigs, setOriginalInputConfigs] = useState([]);
  const [originalOutputConfigs, setOriginalOutputConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Get I/O specifications for the unit - memoized
  const ioSpec = useMemo(() => {
    return item?.type ? getUnitIOSpec(item.type) : null;
  }, [item?.type]);

  const outputTypes = useMemo(() => {
    return item?.type ? getOutputTypes(item.type) : [];
  }, [item?.type]);

  // Helper function to get output label - memoized
  const getOutputLabel = useCallback((type) => {
    switch (type) {
      case "relay":
        return "Relay";
      case "dimmer":
        return "Dimmer";
      case "ao":
        return "Analog";
      case "ac":
        return "Aircon";
      default:
        return type;
    }
  }, []);

  // Memoize input/output configurations initialization
  const initialInputConfigs = useMemo(() => {
    if (!ioSpec || !item?.type) return [];

    const inputs = [];
    for (let i = 0; i < ioSpec.inputs; i++) {
      inputs.push({
        index: i,
        name: getInputDisplayName(item.type, i),
        lightingId: null,
        functionValue: 0, // Default to "Unused"
      });
    }
    return inputs;
  }, [ioSpec, item?.type]);

  const initialOutputConfigs = useMemo(() => {
    if (!ioSpec || !outputTypes.length) return [];

    const outputs = [];
    let outputIndex = 0;

    outputTypes.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        outputs.push({
          index: outputIndex++,
          name: `${getOutputLabel(type)} ${i + 1}`,
          type: type,
          deviceId: null,
        });
      }
    });
    return outputs;
  }, [ioSpec, outputTypes, getOutputLabel]);

  // Reset original configs when dialog closes
  useEffect(() => {
    if (!open) {
      setOriginalInputConfigs([]);
      setOriginalOutputConfigs([]);
      setOriginalIOConfig(null);
    }
  }, [open]);

  // Initialize configurations from database or defaults
  useEffect(() => {
    if (!open || !item) {
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);

    const initializeAsync = async () => {
      try {
        // Load input and output configs from new JSON structure
        const inputConfigs = item.input_configs || { inputs: [] };
        const outputConfigs = item.output_configs || { outputs: [] };

        // Create original config for comparison
        const originalConfig = {
          inputs: (inputConfigs.inputs || []).map((input) => ({
            index: input.index,
            function: input.function_value || 0,
            lightingId: input.lighting_id || null,
          })),
          outputs: (outputConfigs.outputs || []).map((output) => ({
            index: output.index,
            name: output.name,
            type: output.type,
            deviceId: output.device_id || null,
            deviceType: output.device_type,
          })),
        };

        setOriginalIOConfig(cloneIOConfig(originalConfig));

        // Initialize input configs from JSON structure
        const mergedInputConfigs = initialInputConfigs.map((defaultConfig) => {
          const savedConfig = inputConfigs.inputs?.find((input) => input.index === defaultConfig.index);

          if (savedConfig) {
            return {
              ...defaultConfig,
              functionValue: savedConfig.function_value || 0,
              lightingId: savedConfig.lighting_id || null,
            };
          }

          return defaultConfig;
        });
        setInputConfigs(mergedInputConfigs);

        // Store original input configs for change detection with database data
        const originalConfigs = mergedInputConfigs.map((config) => {
          const savedConfig = inputConfigs.inputs?.find((input) => input.index === config.index);

          return {
            index: config.index,
            functionValue: config.functionValue,
            lightingId: config.lightingId,
            multiGroupConfig: savedConfig?.multi_group_config || [],
            rlcConfig: {
              ramp: savedConfig?.rlc_config?.ramp || 0,
              preset: savedConfig?.rlc_config?.preset || 255,
              ledDisplay: savedConfig?.rlc_config?.ledDisplay || 0,
              nightlight: savedConfig?.rlc_config?.nightlight || false,
              backlight: savedConfig?.rlc_config?.backlight || false,
              autoMode: savedConfig?.rlc_config?.autoMode || false,
              delayOff: savedConfig?.rlc_config?.delayOff || 0,
            },
          };
        });

        setOriginalInputConfigs(originalConfigs);

        // Initialize output configs from JSON structure
        const mergedOutputConfigs = initialOutputConfigs.map((defaultConfig) => {
          const savedConfig = outputConfigs.outputs?.find((output) => output.index === defaultConfig.index);

          if (savedConfig) {
            return {
              ...defaultConfig,
              deviceId: savedConfig.device_id || null,
            };
          }

          return defaultConfig;
        });
        setOutputConfigs(mergedOutputConfigs);

        // Store original output configs for change detection with full config data
        const originalOutputs = mergedOutputConfigs.map((config) => {
          const savedConfig = outputConfigs.outputs?.find((output) => output.index === config.index);

          return {
            index: config.index,
            name: config.name,
            type: config.type,
            deviceId: config.deviceId,
            // Include all config fields from saved data
            ...(savedConfig?.config || {}),
          };
        });
        setOriginalOutputConfigs(originalOutputs);
      } catch (error) {
        log.error("Failed to initialize I/O config:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    setTimeout(initializeAsync, 50);
  }, [open, item, initialInputConfigs, initialOutputConfigs]);

  // Function to reload all input configs from database
  const reloadAllInputConfigs = useCallback(async () => {
    if (!item?.id || !ioSpec) return;

    try {
      // Reload the unit data to get fresh input configs
      const updatedUnit = await window.electronAPI.unit.getById(item.id);
      if (!updatedUnit || !updatedUnit.input_configs) return;

      const inputConfigs = updatedUnit.input_configs;

      setInputConfigs((prevInputConfigs) => {
        const updatedInputConfigs = prevInputConfigs.map((config) => {
          const savedConfig = inputConfigs.inputs?.find((input) => input.index === config.index);

          if (savedConfig) {
            return {
              ...config,
              functionValue: savedConfig.function_value || 0,
              lightingId: savedConfig.lighting_id || null,
            };
          }
          return config;
        });

        return updatedInputConfigs;
      });
    } catch (error) {
      log.error("Failed to reload input configs:", error);
    }
  }, [item?.id, ioSpec]);

  const saveConfig = useCallback(
    async (updateItem, multiGroupConfigs = {}, rlcConfigs = {}, outputConfigurations = {}) => {
      if (!item) return false;

      setLoading(true);
      try {
        // Create new input configs structure
        const newInputConfigs = { inputs: [] };
        const newOutputConfigs = { outputs: [] };

        // Build input configs with all data
        for (const inputConfig of inputConfigs) {
          const inputIndex = inputConfig.index;
          const multiGroupConfig = multiGroupConfigs[inputIndex] || {};
          const rlcConfig = rlcConfigs[inputIndex] || {};

          newInputConfigs.inputs.push({
            index: inputIndex,
            function_value: inputConfig.functionValue || 0,
            lighting_id: inputConfig.lightingId || null,
            multi_group_config: multiGroupConfig.multiGroupConfig || [],
            rlc_config: {
              ramp: multiGroupConfig.ramp || rlcConfig.ramp || 0,
              preset: multiGroupConfig.preset || rlcConfig.preset || 255,
              ledDisplay: multiGroupConfig.ledDisplay || rlcConfig.ledDisplay || 0,
              nightlight: multiGroupConfig.nightlight || rlcConfig.nightlight || false,
              backlight: multiGroupConfig.backlight || rlcConfig.backlight || false,
              autoMode: multiGroupConfig.autoMode || rlcConfig.autoMode || false,
              delayOff: multiGroupConfig.delayOff || rlcConfig.delayOff || 0,
            },
          });
        }

        // Build output configs with all data
        for (const outputConfig of outputConfigs) {
          const detailedConfig = outputConfigurations[outputConfig.index] || {};

          newOutputConfigs.outputs.push({
            index: outputConfig.index,
            type: outputConfig.type,
            device_id: outputConfig.deviceId || null,
            device_type: outputConfig.type === "ac" ? "aircon" : "lighting",
            name: outputConfig.name,
            config: {
              name: outputConfig.name,
              ...detailedConfig, // Include detailed settings like delays, dimming, etc.
            },
          });
        }

        // Save both input and output configs to unit table
        await updateItem("unit", item.id, {
          ...item,
          input_configs: newInputConfigs,
          output_configs: newOutputConfigs,
        });

        // All data is now saved in the JSON columns, no need for separate table operations

        return true;
      } catch (error) {
        log.error("Failed to save I/O configuration:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [item, inputConfigs, outputConfigs, originalIOConfig]
  );

  return {
    inputConfigs,
    outputConfigs,
    setInputConfigs,
    setOutputConfigs,
    originalInputConfigs,
    originalOutputConfigs,
    ioSpec,
    outputTypes,
    loading,
    isInitialLoading,
    saveConfig,
    getOutputLabel,
    reloadAllInputConfigs,
  };
};
