import { useState, useEffect, useMemo, useCallback } from "react";
import { getUnitIOSpec, getOutputTypes } from "@/constants";
import {
  createDefaultIOConfig,
  cloneIOConfig,
  hasIOConfigChanges,
} from "@/utils/io-config-utils";

export const useIOConfig = (item, open) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [originalIOConfig, setOriginalIOConfig] = useState(null);
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
    if (!ioSpec) return [];

    const inputs = [];
    for (let i = 0; i < ioSpec.inputs; i++) {
      inputs.push({
        index: i,
        name: `Input ${i + 1}`,
        lightingId: null,
        functionValue: 0, // Default to "Unused"
      });
    }
    return inputs;
  }, [ioSpec]);

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

  // Initialize configurations from database or defaults
  useEffect(() => {
    if (!open || !item) {
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);

    const initializeAsync = async () => {
      try {
        // Load I/O config from database or create default
        let ioConfig = item.io_config || createDefaultIOConfig(item.type);

        // Migrate old format if needed
        if (ioConfig.outputConfigs && Array.isArray(ioConfig.outputConfigs)) {
          const migratedOutputs = (ioConfig.outputs || []).map((output) => {
            const outputConfig = ioConfig.outputConfigs.find(
              (config) => config.index === output.index
            );
            if (outputConfig) {
              const { index, ...config } = outputConfig;
              return { ...output, config };
            }
            return output;
          });

          ioConfig = {
            inputs: ioConfig.inputs || [],
            outputs: migratedOutputs,
          };
        }

        setOriginalIOConfig(cloneIOConfig(ioConfig));

        // Load actual input configs from database
        const actualInputConfigs =
          await window.electronAPI.unit.getAllInputConfigs(item.id);

        // Initialize input configs
        const inputConfigsFromDB = ioConfig.inputs || [];
        const mergedInputConfigs = initialInputConfigs.map((defaultConfig) => {
          const actualConfig = actualInputConfigs.find(
            (config) => config.input_index === defaultConfig.index
          );

          if (actualConfig) {
            return {
              ...defaultConfig,
              lightingId: actualConfig.lighting_id,
              functionValue: actualConfig.function_value || 0,
            };
          }

          const savedConfig = inputConfigsFromDB.find(
            (saved) => saved.index === defaultConfig.index
          );
          return savedConfig
            ? {
                ...defaultConfig,
                lightingId: savedConfig.lightingId,
                functionValue: savedConfig.function || 0,
              }
            : defaultConfig;
        });
        setInputConfigs(mergedInputConfigs);

        // Initialize output configs
        const outputConfigsFromDB = ioConfig.outputs || [];
        const mergedOutputConfigs = initialOutputConfigs.map(
          (defaultConfig) => {
            const savedConfig = outputConfigsFromDB.find(
              (saved) => saved.index === defaultConfig.index
            );
            return savedConfig
              ? {
                  ...defaultConfig,
                  deviceId: savedConfig.deviceId,
                }
              : defaultConfig;
          }
        );
        setOutputConfigs(mergedOutputConfigs);
      } catch (error) {
        console.error("Failed to initialize I/O config:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    setTimeout(initializeAsync, 50);
  }, [open, item, initialInputConfigs, initialOutputConfigs]);

  const saveConfig = useCallback(async (updateItem) => {
    if (!item) return false;

    setLoading(true);
    try {
      const ioConfig = {
        inputs: inputConfigs.map((config) => ({
          index: config.index,
          function: config.functionValue,
          lightingId: config.lightingId,
        })),
        outputs: outputConfigs.map((config) => ({
          index: config.index,
          name: config.name,
          deviceId: config.deviceId,
          deviceType: config.type === "ac" ? "aircon" : "lighting",
        })),
      };

      if (!hasIOConfigChanges(originalIOConfig, ioConfig)) {
        return true; // No changes
      }

      await updateItem("unit", item.id, {
        ...item,
        io_config: ioConfig,
      });

      return true;
    } catch (error) {
      console.error("Failed to save I/O configuration:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [item, inputConfigs, outputConfigs, originalIOConfig]);

  return {
    inputConfigs,
    outputConfigs,
    setInputConfigs,
    setOutputConfigs,
    ioSpec,
    outputTypes,
    loading,
    isInitialLoading,
    saveConfig,
    getOutputLabel,
  };
};
