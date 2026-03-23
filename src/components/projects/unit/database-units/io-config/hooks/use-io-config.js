import { useState, useEffect, useMemo, useCallback } from "react";
import { getUnitIOSpec, getOutputTypes } from "@/constants/unit";
import { getInputDisplayName } from "@/constants/input";
import { cloneIOConfig } from "@/utils/io-config-utils";
import { generateSwitchInputConfigs, SWITCH_INPUT_COUNTS } from "../../../shared/com-switch";
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
  const [switchConfigs, setSwitchConfigs] = useState([]);
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
      })),
    );
  }, [ioSpec, outputTypes, getOutputLabel]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setOriginalInputConfigs([]);
      setOriginalOutputConfigs([]);
      setOriginalIOConfig(null);
      setSwitchConfigs([]);
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
        const savedSwitches = item.switch_configs || [];

        // Create lookup maps for faster access
        const inputMap = new Map(savedInputs.map((i) => [i.index, i]));
        const outputMap = new Map(savedOutputs.map((o) => [o.index, o]));

        // Original config for comparison
        setOriginalIOConfig(
          cloneIOConfig({
            inputs: savedInputs.map((i) => ({ index: i.index, function: i.function_value || 0, lightingId: i.lighting_id || null })),
            outputs: savedOutputs.map((o) => ({
              index: o.index,
              name: o.name,
              type: o.type,
              deviceId: o.device_id || null,
              deviceType: o.device_type,
            })),
          }),
        );

        // Merge fixed input configs
        const mergedFixedInputs = initialInputConfigs.map((def) => {
          const saved = inputMap.get(def.index);
          return saved ? { ...def, functionValue: saved.function_value || 0, lightingId: saved.lighting_id || null } : def;
        });

        // Restore saved switch configs and generate their inputs
        setSwitchConfigs(savedSwitches);
        const baseCount = initialInputConfigs.length;
        const switchInputs = generateSwitchInputConfigs(savedSwitches, baseCount).map((si) => {
          const saved = inputMap.get(si.index);
          return saved ? { ...si, functionValue: saved.function_value || 0, lightingId: saved.lighting_id || null } : si;
        });

        const allInputs = [...mergedFixedInputs, ...switchInputs];
        setInputConfigs(allInputs);

        // Original input configs for change detection
        setOriginalInputConfigs(
          allInputs.map((cfg) => {
            const saved = inputMap.get(cfg.index);
            return {
              index: cfg.index,
              functionValue: cfg.functionValue,
              lightingId: cfg.lightingId,
              multiGroupConfig: saved?.multi_group_config || [],
              rlcConfig: mergeRlcConfig(saved?.rlc_config),
            };
          }),
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
          }),
        );
      } catch (error) {
        log.error("Failed to initialize I/O config:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    setTimeout(initializeAsync, 50);
  }, [open, item, initialInputConfigs, initialOutputConfigs]);

  // Add a new switch and append its generated inputs
  const handleAddSwitch = useCallback((newSwitch) => {
    setSwitchConfigs((prev) => [...prev, newSwitch]);
    setInputConfigs((prevInputs) => {
      const startIndex = prevInputs.length; // indices are 0-based sequential
      const count = SWITCH_INPUT_COUNTS[newSwitch.type] || 1;
      let idx = startIndex;
      const newInputs = Array.from({ length: count }, (_, i) => ({
        index: idx++,
        name: `${newSwitch.name} (${i + 1})`,
        functionValue: 0,
        lightingId: null,
        isSwitchInput: true,
        switchLocalId: newSwitch.localId,
      }));
      return [...prevInputs, ...newInputs];
    });
  }, []);

  // Remove a switch and its generated inputs, re-index remaining switch inputs
  const handleRemoveSwitch = useCallback((localId) => {
    setSwitchConfigs((prev) => prev.filter((sw) => sw.localId !== localId));
    setInputConfigs((prevInputs) => {
      const fixedInputs = prevInputs.filter((c) => !c.isSwitchInput);
      const remainingSwitchInputs = prevInputs.filter((c) => c.isSwitchInput && c.switchLocalId !== localId);
      let nextIndex = fixedInputs.length;
      return [...fixedInputs, ...remainingSwitchInputs.map((c) => ({ ...c, index: nextIndex++ }))];
    });
  }, []);

  // Update a switch's metadata and rebuild its inputs (handles type/name changes)
  const handleUpdateSwitch = useCallback((updatedSwitch) => {
    setSwitchConfigs((prevSwitches) => {
      const newSwitches = prevSwitches.map((sw) => (sw.localId === updatedSwitch.localId ? updatedSwitch : sw));
      setInputConfigs((prevInputs) => {
        const fixedInputs = prevInputs.filter((c) => !c.isSwitchInput);
        let nextIndex = fixedInputs.length;
        const switchInputs = newSwitches.flatMap((sw) => {
          const count = SWITCH_INPUT_COUNTS[sw.type] || 1;
          const oldForThis = prevInputs.filter((c) => c.isSwitchInput && c.switchLocalId === sw.localId);
          return Array.from({ length: count }, (_, i) => ({
            index: nextIndex++,
            name: `${sw.name} (${i + 1})`,
            functionValue: oldForThis[i]?.functionValue || 0,
            lightingId: oldForThis[i]?.lightingId || null,
            isSwitchInput: true,
            switchLocalId: sw.localId,
          }));
        });
        return [...fixedInputs, ...switchInputs];
      });
      return newSwitches;
    });
  }, []);

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
        }),
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

        await updateItem("unit", item.id, {
          ...item,
          switch_configs: switchConfigs,
          input_configs: newInputConfigs,
          output_configs: newOutputConfigs,
        });
        return true;
      } catch (error) {
        log.error("Failed to save I/O configuration:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [item, inputConfigs, outputConfigs, switchConfigs],
  );

  return {
    inputConfigs,
    outputConfigs,
    setInputConfigs,
    setOutputConfigs,
    originalInputConfigs,
    originalOutputConfigs,
    switchConfigs,
    handleAddSwitch,
    handleRemoveSwitch,
    handleUpdateSwitch,
    ioSpec,
    outputTypes,
    loading,
    isInitialLoading,
    saveConfig,
    getOutputLabel,
    reloadAllInputConfigs,
  };
};
