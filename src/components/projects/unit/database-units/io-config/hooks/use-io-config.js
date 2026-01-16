import { useState, useEffect, useMemo, useCallback } from "react";
import { getUnitIOSpec, getOutputTypes, getInputDisplayName } from "@/constants";
import { cloneIOConfig } from "@/utils/io-config-utils";
import log from "electron-log/renderer";

// Constants
const OUTPUT_LABELS = { relay: "Relay", dimmer: "Dimmer", ao: "Analog", ac: "Aircon" };

const DEFAULT_RLC_CONFIG = {
  ramp: 0,
  preset: 255,
  ledDisplay: 0,
  nightlight: false,
  backlight: false,
  autoMode: false,
  delayOff: 0,
};

// Helper to merge RLC config with defaults
const mergeRlcConfig = (config) => ({ ...DEFAULT_RLC_CONFIG, ...config });

export const useIOConfig = (item, open) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [originalIOConfig, setOriginalIOConfig] = useState(null);
  const [originalInputConfigs, setOriginalInputConfigs] = useState([]);
  const [originalOutputConfigs, setOriginalOutputConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const ioSpec = useMemo(() => (item?.type ? getUnitIOSpec(item.type) : null), [item?.type]);
  const outputTypes = useMemo(() => (item?.type ? getOutputTypes(item.type) : []), [item?.type]);
  const getOutputLabel = useCallback((type) => OUTPUT_LABELS[type] || type, []);

  // Generate default input configs
  const initialInputConfigs = useMemo(() => {
    if (!ioSpec || !item?.type) return [];
    return Array.from({ length: ioSpec.inputs }, (_, i) => ({
      index: i,
      name: getInputDisplayName(item.type, i),
      lightingId: null,
      functionValue: 0,
    }));
  }, [ioSpec, item?.type]);

  // Generate default output configs
  const initialOutputConfigs = useMemo(() => {
    if (!ioSpec || !outputTypes.length) return [];
    let idx = 0;
    return outputTypes.flatMap(({ type, count }) =>
      Array.from({ length: count }, (_, i) => ({
        index: idx++,
        name: `${getOutputLabel(type)} ${i + 1}`,
        type,
        deviceId: null,
      }))
    );
  }, [ioSpec, outputTypes, getOutputLabel]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setOriginalInputConfigs([]);
      setOriginalOutputConfigs([]);
      setOriginalIOConfig(null);
    }
  }, [open]);

  // Initialize configurations
  useEffect(() => {
    if (!open || !item) {
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);

    const initializeAsync = async () => {
      try {
        const savedInputs = item.input_configs?.inputs || [];
        const savedOutputs = item.output_configs?.outputs || [];

        // Create lookup maps for faster access
        const inputMap = new Map(savedInputs.map((i) => [i.index, i]));
        const outputMap = new Map(savedOutputs.map((o) => [o.index, o]));

        // Original config for comparison
        setOriginalIOConfig(
          cloneIOConfig({
            inputs: savedInputs.map((i) => ({ index: i.index, function: i.function_value || 0, lightingId: i.lighting_id || null })),
            outputs: savedOutputs.map((o) => ({ index: o.index, name: o.name, type: o.type, deviceId: o.device_id || null, deviceType: o.device_type })),
          })
        );

        // Merge input configs
        const mergedInputs = initialInputConfigs.map((def) => {
          const saved = inputMap.get(def.index);
          return saved ? { ...def, functionValue: saved.function_value || 0, lightingId: saved.lighting_id || null } : def;
        });
        setInputConfigs(mergedInputs);

        // Original input configs for change detection
        setOriginalInputConfigs(
          mergedInputs.map((cfg) => {
            const saved = inputMap.get(cfg.index);
            return {
              index: cfg.index,
              functionValue: cfg.functionValue,
              lightingId: cfg.lightingId,
              multiGroupConfig: saved?.multi_group_config || [],
              rlcConfig: mergeRlcConfig(saved?.rlc_config),
            };
          })
        );

        // Merge output configs
        const mergedOutputs = initialOutputConfigs.map((def) => {
          const saved = outputMap.get(def.index);
          return saved ? { ...def, deviceId: saved.device_id || null } : def;
        });
        setOutputConfigs(mergedOutputs);

        // Original output configs for change detection
        setOriginalOutputConfigs(
          mergedOutputs.map((cfg) => {
            const saved = outputMap.get(cfg.index);
            return { index: cfg.index, name: cfg.name, type: cfg.type, deviceId: cfg.deviceId, ...(saved?.config || {}) };
          })
        );
      } catch (error) {
        log.error("Failed to initialize I/O config:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    setTimeout(initializeAsync, 50);
  }, [open, item, initialInputConfigs, initialOutputConfigs]);

  // Reload input configs from database
  const reloadAllInputConfigs = useCallback(async () => {
    if (!item?.id || !ioSpec) return;

    try {
      const updatedUnit = await window.electronAPI.unit.getById(item.id);
      const savedInputs = updatedUnit?.input_configs?.inputs;
      if (!savedInputs) return;

      const inputMap = new Map(savedInputs.map((i) => [i.index, i]));

      setInputConfigs((prev) =>
        prev.map((cfg) => {
          const saved = inputMap.get(cfg.index);
          return saved ? { ...cfg, functionValue: saved.function_value || 0, lightingId: saved.lighting_id || null } : cfg;
        })
      );
    } catch (error) {
      log.error("Failed to reload input configs:", error);
    }
  }, [item?.id, ioSpec]);

  // Save configuration
  // rlcConfigs: { [index]: { ramp, preset, ... } }
  // multiGroupConfigs: { [index]: [{ groupId, presetBrightness }] }
  const saveConfig = useCallback(
    async (updateItem, rlcConfigs = {}, multiGroupConfigs = {}, outputConfigurations = {}) => {
      if (!item) return false;

      setLoading(true);
      try {
        const newInputConfigs = {
          inputs: inputConfigs.map((cfg) => ({
            index: cfg.index,
            function_value: cfg.functionValue ?? 0,
            lighting_id: cfg.lightingId ?? null,
            multi_group_config: multiGroupConfigs[cfg.index] || [],
            rlc_config: { ...DEFAULT_RLC_CONFIG, ...rlcConfigs[cfg.index] },
          })),
        };

        const newOutputConfigs = {
          outputs: outputConfigs.map((cfg) => ({
            index: cfg.index,
            type: cfg.type,
            device_id: cfg.deviceId || null,
            device_type: cfg.type === "ac" ? "aircon" : "lighting",
            name: cfg.name,
            config: { name: cfg.name, ...(outputConfigurations[cfg.index] || {}) },
          })),
        };

        await updateItem("unit", item.id, { ...item, input_configs: newInputConfigs, output_configs: newOutputConfigs });
        return true;
      } catch (error) {
        log.error("Failed to save I/O configuration:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [item, inputConfigs, outputConfigs]
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
