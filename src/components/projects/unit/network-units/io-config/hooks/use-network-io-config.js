import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { getUnitIOSpec, getOutputTypes, createDefaultInputConfigs, createDefaultOutputConfigs } from "@/utils/io-config-utils";
import { useAutoRefresh } from "./use-auto-refresh";

export const useNetworkIOConfig = (item, open, childDialogOpen = false) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [originalInputConfigs, setOriginalInputConfigs] = useState([]); // Store original configs for change detection
  const [originalOutputConfigs, setOriginalOutputConfigs] = useState([]); // Store original output configs
  const [originalInputConfigsSet, setOriginalInputConfigsSet] = useState(false); // Flag to track if original input configs have been set
  const [originalOutputConfigsSet, setOriginalOutputConfigsSet] = useState(false); // Flag to track if original output configs have been set
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [configsLoaded, setConfigsLoaded] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Default to disabled

  // Use refs to store current state without triggering re-renders
  const inputStatesRef = useRef([]);
  const outputStatesRef = useRef([]);
  const isInitializingRef = useRef(false); // Track if currently initializing to prevent duplicate calls

  // Get I/O specifications for the unit - memoized
  const ioSpec = useMemo(() => {
    return item?.type ? getUnitIOSpec(item.type) : null;
  }, [item?.type]);

  const outputTypes = useMemo(() => {
    return item?.type ? getOutputTypes(item.type) : [];
  }, [item?.type]);

  // Function to read input states from the unit (silent background operation)
  const readInputStatesBackground = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      const response = await window.electronAPI.ioController.getAllInputStates({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      if (response.success && response.inputStates) {
        // Update ref first to avoid re-renders
        const updatedInputs = inputStatesRef.current.map((input, index) => {
          const stateData = response.inputStates[index];
          return stateData
            ? {
                ...input,
                brightness: stateData.brightness,
                isActive: stateData.isActive,
              }
            : input;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedInputs.some((input, index) => {
          const current = inputStatesRef.current[index];
          return current && (current.brightness !== input.brightness || current.isActive !== input.isActive);
        });

        if (hasChanges) {
          inputStatesRef.current = updatedInputs;
          // Use startTransition to batch updates and reduce UI lag (React 18+)
          startTransition(() => {
            setInputConfigs([...updatedInputs]);
          });
        }
      }
    } catch (error) {
      console.error(" Background input state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read aircon configs from unit and map to output configs
  const readAirconConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      const acConfigs = await window.electronAPI.ioController.getLocalACConfig(item.ip_address, item.id_can);

      if (acConfigs && Array.isArray(acConfigs) && acConfigs.length === 10) {
        // Update output configs with FULL AC config data
        const updatedOutputs = outputStatesRef.current.map((config) => {
          if (config.type === "ac") {
            // Find the AC config index for this output
            const acOutputs = outputStatesRef.current.filter((output) => output.type === "ac");
            const acConfigIndex = acOutputs.findIndex((output) => output.index === config.index);

            if (acConfigIndex >= 0 && acConfigIndex < acConfigs.length) {
              const acConfig = acConfigs[acConfigIndex];
              return {
                ...config,
                // Store ALL AC config data with ac prefix
                airconAddress: acConfig.address || 0,
                isAssigned: (acConfig.address || 0) > 0,
                acEnable: acConfig.enable ?? false,
                acWindowMode: acConfig.windowMode ?? 0,
                acFanType: acConfig.fanType ?? 0,
                acTempType: acConfig.tempType ?? 0,
                acTempUnit: acConfig.tempUnit ?? 0,
                acValveContact: acConfig.valveContact ?? 0,
                acValveType: acConfig.valveType ?? 0,
                acDeadband: acConfig.deadband ?? 0,
                acLowFCU_Group: acConfig.lowFCU_Group ?? 0,
                acMedFCU_Group: acConfig.medFCU_Group ?? 0,
                acHighFCU_Group: acConfig.highFCU_Group ?? 0,
                acFanAnalogGroup: acConfig.fanAnalogGroup ?? 0,
                acAnalogCoolGroup: acConfig.analogCoolGroup ?? 0,
                acAnalogHeatGroup: acConfig.analogHeatGroup ?? 0,
                acValveCoolOpenGroup: acConfig.valveCoolOpenGroup ?? 0,
                acValveCoolCloseGroup: acConfig.valveCoolCloseGroup ?? 0,
                acValveHeatOpenGroup: acConfig.valveHeatOpenGroup ?? 0,
                acValveHeatCloseGroup: acConfig.valveHeatCloseGroup ?? 0,
                acWindowBypass: acConfig.windowBypass ?? 0,
                acSetPointOffset: acConfig.setPointOffset ?? 0,
                acWindowOpenAction: acConfig.windowOpenAction ?? 0,
                acWindowOpenCoolSetPoint: acConfig.windowOpenCoolSetPoint ?? 0,
                acWindowOpenHeatSetPoint: acConfig.windowOpenHeatSetPoint ?? 0,
                acWindowDelay: acConfig.windowDelay ?? 0,
                acRoomAddress: acConfig.roomAddress ?? 0,
                acUnoccupyPower: acConfig.unoccupyPower ?? 0,
                acOccupyPower: acConfig.occupyPower ?? 0,
                acStandbyPower: acConfig.standbyPower ?? 0,
                acUnoccupyMode: acConfig.unoccupyMode ?? 0,
                acOccupyMode: acConfig.occupyMode ?? 0,
                acStandbyMode: acConfig.standbyMode ?? 0,
                acUnoccupyFanSpeed: acConfig.unoccupyFanSpeed ?? 0,
                acOccupyFanSpeed: acConfig.occupyFanSpeed ?? 0,
                acStandbyFanSpeed: acConfig.standbyFanSpeed ?? 0,
                acUnoccupyCoolSetPoint: acConfig.unoccupyCoolSetPoint ?? 0,
                acOccupyCoolSetPoint: acConfig.occupyCoolSetPoint ?? 0,
                acStandbyCoolSetPoint: acConfig.standbyCoolSetPoint ?? 0,
                acUnoccupyHeatSetPoint: acConfig.unoccupyHeatSetPoint ?? 0,
                acOccupyHeatSetPoint: acConfig.occupyHeatSetPoint ?? 0,
                acStandbyHeatSetPoint: acConfig.standbyHeatSetPoint ?? 0,
              };
            }
          }
          return config;
        });

        // Update ref first to ensure consistency
        outputStatesRef.current = updatedOutputs;
        // Then update state
        setOutputConfigs([...updatedOutputs]);

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Failed to read aircon configs from unit:", error.message);
      return false;
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read output states from the unit (silent background operation)
  const readOutputStatesBackground = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      const response = await window.electronAPI.ioController.getAllOutputStates({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      if (response.success && response.outputStates) {
        // Update ref first to avoid re-renders
        const updatedOutputs = outputStatesRef.current.map((output, index) => {
          const stateData = response.outputStates[index];
          return stateData
            ? {
                ...output,
                brightness: stateData.brightness,
                state: stateData.isActive,
              }
            : output;
        });

        // Only update state if there are actual changes
        const hasChanges = updatedOutputs.some((output, index) => {
          const current = outputStatesRef.current[index];
          return current && (current.brightness !== output.brightness || current.state !== output.state);
        });

        if (hasChanges) {
          outputStatesRef.current = updatedOutputs;
          // Use startTransition to batch updates and reduce UI lag (React 18+)
          startTransition(() => {
            setOutputConfigs([...updatedOutputs]);
          });
        }
      }
    } catch (error) {
      console.error(" Background output state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read input configurations from unit
  const readInputConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      const response = await window.electronAPI.ioController.getAllInputConfigs({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      if (response?.configs) {
        // Update input configs with actual function values from unit
        const updatedInputs = inputStatesRef.current.map((input, index) => {
          const unitConfig = response.configs.find((config) => config.inputNumber === index);
          return unitConfig
            ? {
                ...input,
                functionValue: unitConfig.inputType || 0,
                // Update rlcConfig with data from unit
                rlcConfig: {
                  ramp: unitConfig.ramp ?? 0,
                  preset: unitConfig.preset ?? 255,
                  ledStatus: unitConfig.ledStatus || 0,
                  autoMode: unitConfig.autoMode || false,
                  delayOff: unitConfig.delayOff ?? 0,
                  delayOn: unitConfig.delayOn ?? 0,
                },
                // Update multiGroupConfig with groups from unit
                multiGroupConfig:
                  unitConfig.groups?.map((group) => ({
                    groupId: group.groupId,
                    presetBrightness: group.presetBrightness,
                  })) || [],
                // Store additional config data for later use
                unitConfig: unitConfig,
              }
            : input;
        });

        inputStatesRef.current = updatedInputs;
        setInputConfigs([...updatedInputs]);

        // Store original input configs for change detection (only on first load)
        if (!originalInputConfigsSet) {
          const originalConfigs = updatedInputs.map((input) => ({
            index: input.index,
            functionValue: input.functionValue,
            lightingId: input.lightingId,
            multiGroupConfig: input.multiGroupConfig || [],
            rlcConfig: input.rlcConfig || {
              ramp: 0,
              preset: 255,
              ledStatus: 0,
              autoMode: 0,
              delayOff: 0,
              delayOn: 0,
            },
          }));
          setOriginalInputConfigs(originalConfigs);
          setOriginalInputConfigsSet(true);
        }

        return true;
      }
    } catch (error) {
      console.error("Failed to read input configs from unit:", error.message);
    }

    return false;
  }, [item?.ip_address, item?.id_can]);

  // Function to read FULL output configurations from unit (assignments + configs)
  const readOutputConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      // 1. Get output assignments (address + delays)
      const assignResponse = await window.electronAPI.ioController.getOutputAssign({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      if (!assignResponse?.outputAssignments) {
        return false;
      }

      // 2. Get full output configs (minDim, maxDim, autoTrigger, schedule)
      const configResponse = await window.electronAPI.ioController.getOutputConfig(item.ip_address, item.id_can);

      // Update output configs with FULL data
      const updatedOutputs = outputStatesRef.current.map((output) => {
        const unitAssignment = assignResponse.outputAssignments.find((assignment) => assignment.outputIndex === output.index);

        const unitConfig = configResponse?.outputConfigs?.find((config) => config.outputIndex === output.index);

        return {
          ...output,
          // Assignment data
          lightingAddress: unitAssignment?.lightingAddress ?? 0,
          delayOff: unitAssignment?.delayOff ?? 0,
          delayOn: unitAssignment?.delayOn ?? 0,
          isAssigned: unitAssignment?.isAssigned ?? false,
          // Config data (for lighting outputs only)
          minDim: unitConfig?.minDimmingLevel ?? 1,
          maxDim: unitConfig?.maxDimmingLevel ?? 100,
          autoTrigger: unitConfig?.isAutoTriggerEnabled ?? false,
          scheduleOnHour: unitConfig?.scheduleOnHour ?? 0,
          scheduleOnMinute: unitConfig?.scheduleOnMinute ?? 0,
          scheduleOffHour: unitConfig?.scheduleOffHour ?? 0,
          scheduleOffMinute: unitConfig?.scheduleOffMinute ?? 0,
        };
      });

      outputStatesRef.current = updatedOutputs;
      setOutputConfigs([...updatedOutputs]);

      return true;
    } catch (error) {
      console.error("Failed to read output configurations from unit:", error.message);
    }

    return false;
  }, [item?.ip_address, item?.id_can]);

  // Sequential read function to ensure input completes before output
  const readStatesSequentially = useCallback(async () => {
    try {
      // Step 1: Read input states first
      await readInputStatesBackground();

      // Step 2: Read output states
      await readOutputStatesBackground();
    } catch (error) {
      console.warn(" Sequential state read failed:", error.message);
    }
  }, [readInputStatesBackground, readOutputStatesBackground]);

  // Use simplified auto refresh hook
  const autoRefresh = useAutoRefresh(readStatesSequentially, {
    interval: 1000,
    enabled: autoRefreshEnabled,
    dialogOpen: open,
    childDialogOpen: childDialogOpen,
  });

  // Initialize and read configs when dialog opens
  useEffect(() => {
    if (!open || !item || !ioSpec) {
      setConfigsLoaded(false);
      return;
    }

    // Prevent duplicate initialization (React Strict Mode calls effects twice)
    if (isInitializingRef.current) {
      return;
    }

    const initializeDialog = async () => {
      isInitializingRef.current = true; // Mark as initializing

      setIsInitialLoading(true);
      setConfigsLoaded(false);

      // Create default configurations first
      const defaultInputConfigs = createDefaultInputConfigs(item.type);
      const defaultOutputConfigs = createDefaultOutputConfigs(item.type);

      // Initialize inputs with state tracking
      const inputs = (defaultInputConfigs.inputs || []).map((input, index) => ({
        index: input.index,
        function: input.function_value || 0,
        lightingId: input.lighting_id,
        name: `Input ${index + 1}`,
        brightness: 0,
        isActive: false,
        functionValue: 0, // Default function, will be updated from unit
        ramp: input.rlc_config?.ramp ?? 0,
        preset: input.rlc_config?.preset ?? 255,
        led_status: input.rlc_config?.ledStatus || 0,
        auto_mode: input.rlc_config?.autoMode || 0,
        auto_time: 0,
        delay_off: input.rlc_config?.delayOff ?? 0,
        delay_on: input.rlc_config?.delayOn ?? 0,
        multiGroupConfig: input.multi_group_config || [],
        // Add rlcConfig object for consistency with change detection
        rlcConfig: {
          ramp: input.rlc_config?.ramp ?? 0,
          preset: input.rlc_config?.preset ?? 255,
          ledStatus: input.rlc_config?.ledStatus || 0,
          autoMode: input.rlc_config?.autoMode || 0,
          delayOff: input.rlc_config?.delayOff ?? 0,
          delayOn: input.rlc_config?.delayOn ?? 0,
        },
      }));

      // Initialize outputs with state tracking
      const outputs = (defaultOutputConfigs.outputs || []).map((output) => ({
        index: output.index,
        name: output.name,
        type: output.type,
        deviceId: output.device_id,
        deviceType: output.device_type,
        config: output.config || {},
        state: false,
        brightness: 0,
      }));

      setInputConfigs(inputs);
      setOutputConfigs(outputs);
      inputStatesRef.current = inputs;
      outputStatesRef.current = outputs;

      // Load inputs first
      await readInputConfigsFromUnit();

      // Load outputs after inputs
      await readOutputConfigsFromUnit();

      // Load aircon configs after outputs
      await readAirconConfigsFromUnit();

      // Set original output configs AFTER all configs are loaded (including aircon)
      // This ensures AC fields are properly populated before creating the snapshot
      if (!originalOutputConfigsSet) {
        console.log("📊 [DEBUG] Creating originalOutputConfigs from outputStatesRef.current:", {
          outputStatesRefLength: outputStatesRef.current.length,
          firstOutput: outputStatesRef.current[0],
          allOutputs: outputStatesRef.current,
        });

        const originalOutputs = outputStatesRef.current.map((output) => ({
          index: output.index,
          type: output.type,
          lightingAddress: output.lightingAddress ?? 0,
          airconAddress: output.airconAddress ?? 0,
          delayOff: output.delayOff ?? 0,
          delayOn: output.delayOn ?? 0,
          minDim: output.minDim ?? 1,
          maxDim: output.maxDim ?? 100,
          autoTrigger: output.autoTrigger ?? false,
          scheduleOnHour: output.scheduleOnHour ?? 0,
          scheduleOnMinute: output.scheduleOnMinute ?? 0,
          scheduleOffHour: output.scheduleOffHour ?? 0,
          scheduleOffMinute: output.scheduleOffMinute ?? 0,
          // AC configs - now properly populated from readAirconConfigsFromUnit
          acEnable: output.acEnable ?? false,
          acWindowMode: output.acWindowMode ?? 0,
          acFanType: output.acFanType ?? 0,
          acTempType: output.acTempType ?? 0,
          acTempUnit: output.acTempUnit ?? 0,
          acValveContact: output.acValveContact ?? 0,
          acValveType: output.acValveType ?? 0,
          acDeadband: output.acDeadband ?? 0,
          acLowFCU_Group: output.acLowFCU_Group ?? 0,
          acMedFCU_Group: output.acMedFCU_Group ?? 0,
          acHighFCU_Group: output.acHighFCU_Group ?? 0,
          acFanAnalogGroup: output.acFanAnalogGroup ?? 0,
          acAnalogCoolGroup: output.acAnalogCoolGroup ?? 0,
          acAnalogHeatGroup: output.acAnalogHeatGroup ?? 0,
          acValveCoolOpenGroup: output.acValveCoolOpenGroup ?? 0,
          acValveCoolCloseGroup: output.acValveCoolCloseGroup ?? 0,
          acValveHeatOpenGroup: output.acValveHeatOpenGroup ?? 0,
          acValveHeatCloseGroup: output.acValveHeatCloseGroup ?? 0,
          acWindowBypass: output.acWindowBypass ?? 0,
          acSetPointOffset: output.acSetPointOffset ?? 0,
          acWindowOpenAction: output.acWindowOpenAction ?? 0,
          acWindowOpenCoolSetPoint: output.acWindowOpenCoolSetPoint ?? 0,
          acWindowOpenHeatSetPoint: output.acWindowOpenHeatSetPoint ?? 0,
          acWindowDelay: output.acWindowDelay ?? 0,
          acRoomAddress: output.acRoomAddress ?? 0,
          acUnoccupyPower: output.acUnoccupyPower ?? 0,
          acOccupyPower: output.acOccupyPower ?? 0,
          acStandbyPower: output.acStandbyPower ?? 0,
          acUnoccupyMode: output.acUnoccupyMode ?? 0,
          acOccupyMode: output.acOccupyMode ?? 0,
          acStandbyMode: output.acStandbyMode ?? 0,
          acUnoccupyFanSpeed: output.acUnoccupyFanSpeed ?? 0,
          acOccupyFanSpeed: output.acOccupyFanSpeed ?? 0,
          acStandbyFanSpeed: output.acStandbyFanSpeed ?? 0,
          acUnoccupyCoolSetPoint: output.acUnoccupyCoolSetPoint ?? 0,
          acOccupyCoolSetPoint: output.acOccupyCoolSetPoint ?? 0,
          acStandbyCoolSetPoint: output.acStandbyCoolSetPoint ?? 0,
          acUnoccupyHeatSetPoint: output.acUnoccupyHeatSetPoint ?? 0,
          acOccupyHeatSetPoint: output.acOccupyHeatSetPoint ?? 0,
          acStandbyHeatSetPoint: output.acStandbyHeatSetPoint ?? 0,
        }));

        console.log("📊 [DEBUG] Created originalOutputConfigs:", {
          length: originalOutputs.length,
          firstOriginal: originalOutputs[0],
          allOriginals: originalOutputs,
        });

        setOriginalOutputConfigs(originalOutputs);
        setOriginalOutputConfigsSet(true);
      }

      setConfigsLoaded(true);
      setIsInitialLoading(false);

      // Initial state read to show current status
      await readStatesSequentially();

      isInitializingRef.current = false; // Mark as complete
    };

    initializeDialog();
  }, [
    open,
    item,
    ioSpec,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    readAirconConfigsFromUnit,
    readStatesSequentially,
    originalOutputConfigsSet,
  ]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setConfigsLoaded(false);
      setIsInitialLoading(false);
      setOriginalInputConfigsSet(false);
      setOriginalOutputConfigsSet(false);
      setOriginalInputConfigs([]);
      setOriginalOutputConfigs([]);
      isInitializingRef.current = false; // Reset initialization flag
    }
  }, [open]);

  // Listen for global auto refresh control events (for compatibility)
  useEffect(() => {
    const handlePauseAutoRefresh = () => autoRefresh.pause();
    const handleResumeAutoRefresh = () => autoRefresh.resume();

    window.addEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
    window.addEventListener("resumeAllAutoRefresh", handleResumeAutoRefresh);

    return () => {
      window.removeEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
      window.removeEventListener("resumeAllAutoRefresh", handleResumeAutoRefresh);
    };
  }, [autoRefresh]);

  // Function to save all output configurations to network unit (batch save - OPTIMIZED)
  const saveAllOutputConfigs = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return {
        success: false,
        error: "Unit IP address or CAN ID not available",
      };
    }

    try {
      setLoading(true);
      let totalSuccessCount = 0;
      let totalFailCount = 0;
      const allErrors = [];

      // Separate AC outputs from lighting outputs
      const acOutputs = outputConfigs.filter((output) => output.type === "ac");
      const lightingOutputs = outputConfigs.filter((output) => output.type !== "ac");

      // 1. Save AC outputs (already optimized - batch mode)
      if (acOutputs.length > 0) {
        try {
          // Prepare all 10 AC configs
          const acConfigs = Array(10)
            .fill(null)
            .map((_, idx) => {
              const acOutput = acOutputs.find((output) => {
                const acOutputIndex = acOutputs.findIndex((o) => o.index === output.index);
                return acOutputIndex === idx;
              });

              if (acOutput && acOutput.airconAddress !== undefined) {
                return {
                  address: acOutput.airconAddress || 0,
                  enable: acOutput.acEnable ?? false,
                  windowMode: acOutput.acWindowMode ?? 0,
                  fanType: acOutput.acFanType ?? 0,
                  tempType: acOutput.acTempType ?? 0,
                  tempUnit: acOutput.acTempUnit ?? 0,
                  valveContact: acOutput.acValveContact ?? 0,
                  valveType: acOutput.acValveType ?? 0,
                  deadband: acOutput.acDeadband ?? 0,
                  lowFCU_Group: acOutput.acLowFCU_Group ?? 0,
                  medFCU_Group: acOutput.acMedFCU_Group ?? 0,
                  highFCU_Group: acOutput.acHighFCU_Group ?? 0,
                  fanAnalogGroup: acOutput.acFanAnalogGroup ?? 0,
                  analogCoolGroup: acOutput.acAnalogCoolGroup ?? 0,
                  analogHeatGroup: acOutput.acAnalogHeatGroup ?? 0,
                  valveCoolOpenGroup: acOutput.acValveCoolOpenGroup ?? 0,
                  valveCoolCloseGroup: acOutput.acValveCoolCloseGroup ?? 0,
                  valveHeatOpenGroup: acOutput.acValveHeatOpenGroup ?? 0,
                  valveHeatCloseGroup: acOutput.acValveHeatCloseGroup ?? 0,
                  windowBypass: acOutput.acWindowBypass ?? 0,
                  setPointOffset: acOutput.acSetPointOffset ?? 0,
                  windowOpenAction: acOutput.acWindowOpenAction ?? 0,
                  windowOpenCoolSetPoint: acOutput.acWindowOpenCoolSetPoint ?? 0,
                  windowOpenHeatSetPoint: acOutput.acWindowOpenHeatSetPoint ?? 0,
                  windowDelay: acOutput.acWindowDelay ?? 0,
                  roomAddress: acOutput.acRoomAddress ?? 0,
                  unoccupyPower: acOutput.acUnoccupyPower ?? 0,
                  occupyPower: acOutput.acOccupyPower ?? 0,
                  standbyPower: acOutput.acStandbyPower ?? 0,
                  unoccupyMode: acOutput.acUnoccupyMode ?? 0,
                  occupyMode: acOutput.acOccupyMode ?? 0,
                  standbyMode: acOutput.acStandbyMode ?? 0,
                  unoccupyFanSpeed: acOutput.acUnoccupyFanSpeed ?? 0,
                  occupyFanSpeed: acOutput.acOccupyFanSpeed ?? 0,
                  standbyFanSpeed: acOutput.acStandbyFanSpeed ?? 0,
                  unoccupyCoolSetPoint: acOutput.acUnoccupyCoolSetPoint ?? 0,
                  occupyCoolSetPoint: acOutput.acOccupyCoolSetPoint ?? 0,
                  standbyCoolSetPoint: acOutput.acStandbyCoolSetPoint ?? 0,
                  unoccupyHeatSetPoint: acOutput.acUnoccupyHeatSetPoint ?? 0,
                  occupyHeatSetPoint: acOutput.acOccupyHeatSetPoint ?? 0,
                  standbyHeatSetPoint: acOutput.acStandbyHeatSetPoint ?? 0,
                };
              }

              // Return default AC config for empty slots
              return {
                address: 0,
                enable: false,
                windowMode: 0,
                fanType: 0,
                tempType: 0,
                tempUnit: 0,
                valveContact: 0,
                valveType: 0,
                deadband: 0,
                lowFCU_Group: 0,
                medFCU_Group: 0,
                highFCU_Group: 0,
                fanAnalogGroup: 0,
                analogCoolGroup: 0,
                analogHeatGroup: 0,
                valveCoolOpenGroup: 0,
                valveCoolCloseGroup: 0,
                valveHeatOpenGroup: 0,
                valveHeatCloseGroup: 0,
                windowBypass: 0,
                setPointOffset: 0,
                windowOpenAction: 0,
                windowOpenCoolSetPoint: 0,
                windowOpenHeatSetPoint: 0,
                windowDelay: 0,
                roomAddress: 0,
                unoccupyPower: 0,
                occupyPower: 0,
                standbyPower: 0,
                unoccupyMode: 0,
                occupyMode: 0,
                standbyMode: 0,
                unoccupyFanSpeed: 0,
                occupyFanSpeed: 0,
                standbyFanSpeed: 0,
                unoccupyCoolSetPoint: 0,
                occupyCoolSetPoint: 0,
                standbyCoolSetPoint: 0,
                unoccupyHeatSetPoint: 0,
                occupyHeatSetPoint: 0,
                standbyHeatSetPoint: 0,
              };
            });

          await window.electronAPI.ioController.setLocalACConfig(item.ip_address, item.id_can, acConfigs);

          totalSuccessCount += acOutputs.length;
          console.log(`✓ Saved ${acOutputs.length} AC outputs`);
        } catch (error) {
          totalFailCount += acOutputs.length;
          allErrors.push({
            type: "AC outputs",
            error: error instanceof Error ? error.message : String(error),
          });
          console.error("Failed to save AC outputs:", error);
        }
      }

      // 2. Save lighting outputs (BATCH MODE - OPTIMIZED)
      if (lightingOutputs.length > 0) {
        try {
          const result = await window.electronAPI.ioController.setupBatchLightingOutputs({
            unitIp: item.ip_address,
            canId: item.id_can,
            lightingOutputs: lightingOutputs,
            maxBytes: 900,
          });

          // Aggregate results from all batch operations
          const lightingSuccess = result.overallSuccess;
          if (lightingSuccess) {
            totalSuccessCount += lightingOutputs.length;
            console.log(`✓ Saved ${lightingOutputs.length} lighting outputs in batch mode`);
          } else {
            // Count partial successes
            const successfulOps = [result.assignments?.success, result.delayOff?.success, result.delayOn?.success, result.configs?.success].filter(
              Boolean
            ).length;

            if (successfulOps > 0) {
              totalSuccessCount += lightingOutputs.length;
              console.warn(`⚠ Partially saved lighting outputs: ${successfulOps}/4 operations succeeded`);
            } else {
              totalFailCount += lightingOutputs.length;
            }

            // Add detailed errors
            if (!result.assignments?.success) {
              allErrors.push({
                type: "Lighting output assignments",
                error: result.assignments?.error,
              });
            }
            if (result.delayOff?.errors?.length > 0) {
              allErrors.push(...result.delayOff.errors);
            }
            if (result.delayOn?.errors?.length > 0) {
              allErrors.push(...result.delayOn.errors);
            }
            if (result.configs?.errors?.length > 0) {
              allErrors.push(...result.configs.errors);
            }
          }
        } catch (error) {
          totalFailCount += lightingOutputs.length;
          allErrors.push({
            type: "Lighting outputs (batch)",
            error: error instanceof Error ? error.message : String(error),
          });
          console.error("Failed to save lighting outputs:", error);
        }
      }

      setLoading(false);

      return {
        success: totalFailCount === 0,
        successCount: totalSuccessCount,
        failCount: totalFailCount,
        errors: allErrors,
      };
    } catch (error) {
      setLoading(false);
      console.error("Failed to save output configurations:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [item?.ip_address, item?.id_can, outputConfigs]);

  // Function to save all input configurations to network unit (batch save - OPTIMIZED)
  const saveAllInputConfigs = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return {
        success: false,
        error: "Unit IP address or CAN ID not available",
      };
    }

    try {
      setLoading(true);

      // Prepare all input configurations
      const inputConfigsData = inputConfigs.map((config) => ({
        inputNumber: config.index,
        inputType: config.functionValue || 0,
        ramp: config.rlcConfig?.ramp ?? 0,
        preset: config.rlcConfig?.preset ?? 255,
        ledStatus: config.rlcConfig?.ledStatus ?? 0,
        autoMode: config.rlcConfig?.autoMode || false,
        delayOff: config.rlcConfig?.delayOff ?? 0,
        groups: (config.multiGroupConfig || []).map((group) => ({
          groupId: parseInt(group.groupId) || 0,
          presetBrightness: parseInt(group.presetBrightness) ?? 255,
        })),
      }));

      // Send all configs in batches (max 900 bytes per batch)
      const result = await window.electronAPI.ioController.setupBatchInputConfigs({
        unitIp: item.ip_address,
        canId: item.id_can,
        inputConfigs: inputConfigsData,
        maxBytes: 900,
      });

      // Update original configs after successful save
      if (result.successCount > 0) {
        const newOriginalConfigs = inputConfigs.map((input) => ({
          index: input.index,
          functionValue: input.functionValue,
          lightingId: input.lightingId,
          multiGroupConfig: input.multiGroupConfig || [],
          rlcConfig: input.rlcConfig || {
            ramp: 0,
            preset: 255,
            ledStatus: 0,
            autoMode: 0,
            delayOff: 0,
            delayOn: 0,
          },
        }));
        setOriginalInputConfigs(newOriginalConfigs);
      }

      setLoading(false);

      return result;
    } catch (error) {
      setLoading(false);
      console.error("Failed to save input configurations:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [item?.ip_address, item?.id_can, inputConfigs]);

  return {
    inputConfigs,
    outputConfigs,
    originalInputConfigs,
    originalOutputConfigs,
    setInputConfigs,
    setOutputConfigs,
    ioSpec,
    outputTypes,
    loading,
    isInitialLoading,
    configsLoaded,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    readAirconConfigsFromUnit,
    saveAllInputConfigs,
    saveAllOutputConfigs,
    // Simplified auto refresh API
    pauseAutoRefresh: autoRefresh.pause,
    resumeAutoRefresh: autoRefresh.resume,
    forceStopAutoRefresh: autoRefresh.stop,
    readStatesInitial: readStatesSequentially,
  };
};
