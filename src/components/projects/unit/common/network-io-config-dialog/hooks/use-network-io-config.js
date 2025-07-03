import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getUnitIOSpec, getOutputTypes } from "@/utils/io-config-utils";
import { createDefaultIOConfig } from "@/utils/io-config-utils";

export const useNetworkIOConfig = (item, open, childDialogOpen = false) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  // Use refs to store current state without triggering re-renders
  const inputStatesRef = useRef([]);
  const outputStatesRef = useRef([]);
  const refreshIntervalRef = useRef(null);
  const isDialogOpenRef = useRef(false);
  const childDialogOpenRef = useRef(false);

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
      console.log(`📥 Getting input states from ${item.ip_address}...`);
      const startTime = Date.now();

      const response = await window.electronAPI.rcuController.getAllInputStates(
        {
          unitIp: item.ip_address,
          canId: item.id_can,
        }
      );

      // Add small delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 200));

      const duration = Date.now() - startTime;
      console.log(`📥 Input states response received in ${duration}ms`);

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
          return (
            current &&
            (current.brightness !== input.brightness ||
              current.isActive !== input.isActive)
          );
        });

        if (hasChanges) {
          inputStatesRef.current = updatedInputs;
          // Use requestAnimationFrame to batch state updates and reduce UI lag
          requestAnimationFrame(() => {
            setInputConfigs(() => [...updatedInputs]);
          });
          console.log(`📥 Input states updated (${updatedInputs.length} inputs)`);
        } else {
          console.log(`📥 No input state changes detected`);
        }
      }
    } catch (error) {
      console.warn("❌ Background input state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read output states from the unit (silent background operation)
  const readOutputStatesBackground = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      console.log(`📤 Getting output states from ${item.ip_address}...`);
      const startTime = Date.now();

      const response =
        await window.electronAPI.rcuController.getAllOutputStates({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

      // Add small delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 200));

      const duration = Date.now() - startTime;
      console.log(`📤 Output states response received in ${duration}ms`);

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
          return (
            current &&
            (current.brightness !== output.brightness ||
              current.state !== output.state)
          );
        });

        if (hasChanges) {
          outputStatesRef.current = updatedOutputs;
          // Use requestAnimationFrame to batch state updates and reduce UI lag
          requestAnimationFrame(() => {
            setOutputConfigs(() => [...updatedOutputs]);
          });
          console.log(`📤 Output states updated (${updatedOutputs.length} outputs)`);
        } else {
          console.log(`📤 No output state changes detected`);
        }
      }
    } catch (error) {
      console.warn("❌ Background output state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read input configurations from unit
  const readInputConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      console.log(
        `Reading input configurations from unit ${item.ip_address} (CAN ID: ${item.id_can})`
      );

      const response =
        await window.electronAPI.rcuController.getAllInputConfigs({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      if (response?.configs) {
        console.log(
          `Received ${response.configs.length} input configurations from unit`
        );

        // Update input configs with actual function values from unit
        const updatedInputs = inputStatesRef.current.map((input, index) => {
          const unitConfig = response.configs.find(
            (config) => config.inputNumber === index
          );
          return unitConfig
            ? {
                ...input,
                functionValue: unitConfig.inputType || 0,
                // Store additional config data for later use
                unitConfig: unitConfig,
              }
            : input;
        });

        inputStatesRef.current = updatedInputs;
        setInputConfigs([...updatedInputs]);

        return true;
      }
    } catch (error) {
      console.warn("Failed to read input configs from unit:", error.message);
    }

    return false;
  }, [item?.ip_address, item?.id_can]);

  // Function to read output assignments from unit (lighting address mapping and delays only)
  const readOutputConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      console.log(
        `Reading output assignments from unit ${item.ip_address} (CAN ID: ${item.id_can})`
      );

      // Debug: Check parameter values
      console.log("Debug - Parameters:", {
        unitIp: item.ip_address,
        canId: item.id_can,
        unitIpType: typeof item.ip_address,
        canIdType: typeof item.id_can
      });

      // Only get output assignments (lighting address mapping, delay off/on)
      // Output config will be loaded on-demand when opening lighting output config dialog
      const assignResponse = await window.electronAPI.rcuController.getOutputAssign({
        unitIp: item.ip_address,
        canId: item.id_can,
      });

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!assignResponse?.outputAssignments) {
        console.warn("No output assignments received from unit");
        return false;
      }

      console.log(
        `Received ${assignResponse.outputAssignments.length} output assignments from unit`
      );

      // Debug: Log all assignments, especially output index 0
      assignResponse.outputAssignments.forEach(assignment => {
        if (assignment.outputIndex === 0) {
          console.log(`🚨 CRITICAL: Unit returned output index 0 with address ${assignment.lightingAddress}`);
        }
        console.log(`📋 Assignment: Output ${assignment.outputIndex} -> Address ${assignment.lightingAddress} (DelayOff: ${assignment.delayOff}s, DelayOn: ${assignment.delayOn}s)`);
      });

      // Update output configs with assignment data only
      const updatedOutputs = outputStatesRef.current.map((output, index) => {
        const unitAssignment = assignResponse.outputAssignments.find(
          (assignment) => assignment.outputIndex === index
        );

        if (unitAssignment) {
          // Special attention to output index 0
          if (index === 0) {
            console.log(`🚨 CRITICAL: Loading output index 0 assignment - Address: ${unitAssignment.lightingAddress}`);
          }

          return {
            ...output,
            // Store lighting address for mapping
            lightingAddress: unitAssignment.lightingAddress,
            // Store delay values for lighting-output-config-dialog
            delayOff: unitAssignment.delayOff,
            delayOn: unitAssignment.delayOn,
            // Mark as assigned if lighting address > 0
            isAssigned: unitAssignment.isAssigned,
            // unitConfig will be loaded on-demand when opening config dialog
            unitConfig: null,
          };
        }

        // Special attention to output index 0 when no assignment found
        if (index === 0) {
          console.log(`🚨 CRITICAL: No assignment found for output index 0 in unit response`);
        }

        return output;
      });

      outputStatesRef.current = updatedOutputs;
      setOutputConfigs([...updatedOutputs]);

      console.log("Output assignments loaded successfully");
      return true;
    } catch (error) {
      console.warn("Failed to read output assignments from unit:", error.message);
    }

    return false;
  }, [item?.ip_address, item?.id_can]);

  // Sequential read function to ensure input completes before output with proper delays
  const readStatesSequentiallyRef = useRef();
  readStatesSequentiallyRef.current = async () => {
    // Check if dialog is still open before proceeding
    if (!isDialogOpenRef.current) {
      return;
    }

    // Additional check for child dialogs
    if (childDialogOpenRef.current) {
      return;
    }

    try {
      console.log("🔄 Starting sequential state read...");

      // Step 1: Read input states first
      console.log("📥 Reading input states...");
      await readInputStatesBackground();

      // Step 2: Wait for input processing to complete
      console.log("⏳ Waiting for input processing to complete...");
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 3: Check if dialog is still open before proceeding to outputs
      if (!isDialogOpenRef.current || childDialogOpenRef.current) {
        console.log("❌ Dialog closed or child dialog opened, stopping sequential read");
        return;
      }

      // Step 4: Read output states
      console.log("📤 Reading output states...");
      await readOutputStatesBackground();

      console.log("✅ Sequential state read completed");
    } catch (error) {
      console.warn("❌ Sequential state read failed:", error.message);
    }
  };

  // Initialize and read configs when dialog opens
  useEffect(() => {
    if (!open || !item || !ioSpec) {
      isDialogOpenRef.current = false;
      setConfigsLoaded(false);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    isDialogOpenRef.current = true;

    const initializeDialog = async () => {
      setIsInitialLoading(true);
      setConfigsLoaded(false);

      // Create default configurations first
      const defaultConfig = createDefaultIOConfig(item.type);

      // Initialize inputs with state tracking
      const inputs = defaultConfig.inputs.map((input, index) => ({
        ...input,
        name: `Input ${index + 1}`,
        brightness: 0,
        isActive: false,
        functionValue: 0, // Default function, will be updated from unit
      }));

      // Initialize outputs with state tracking
      const outputs = defaultConfig.outputs.map((output, index) => ({
        ...output,
        name: `${output.type === "ac" ? "AC" : "Lighting"} ${index + 1}`,
        state: false,
        brightness: 0,
        deviceId: null,
      }));

      setInputConfigs(inputs);
      setOutputConfigs(outputs);
      inputStatesRef.current = inputs;
      outputStatesRef.current = outputs;

      // Load inputs first
      const inputConfigsSuccess = await readInputConfigsFromUnit();

      if (inputConfigsSuccess) {
        console.log("✅ Input configurations loaded successfully");
      } else {
        console.log("⚠️ Failed to load input configurations, using defaults");
      }

      // Load outputs after inputs
      const outputConfigsSuccess = await readOutputConfigsFromUnit();

      if (outputConfigsSuccess) {
        console.log("✅ Output configurations loaded successfully");
      } else {
        console.log("⚠️ Failed to load output configurations, using defaults");
      }

      setConfigsLoaded(true);
      setIsInitialLoading(false);

      // Initial state read
      await readStatesSequentiallyRef.current();

      // Set up auto-refresh every 3 seconds (increased to allow for sequential processing with delays)
      console.log("🔄 Starting auto-refresh with 3-second interval");
      refreshIntervalRef.current = setInterval(() => {
        readStatesSequentiallyRef.current();
      }, 3000);
    };

    initializeDialog();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [open, item, ioSpec, readInputConfigsFromUnit]);

  // Effect to immediately stop auto refresh when dialog closes
  useEffect(() => {
    if (!open) {
      isDialogOpenRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      // Reset states when dialog closes
      setConfigsLoaded(false);
      setIsInitialLoading(false);
    } else {
      isDialogOpenRef.current = true;
    }
  }, [open]);

  // Function to pause auto refresh (when child dialogs are open)
  const pauseAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      console.log("⏸️ Pausing auto-refresh");
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    // Also set flag to prevent any ongoing reads
    isDialogOpenRef.current = false;
  }, []);

  // Function to resume auto refresh (when child dialogs are closed)
  const resumeAutoRefresh = useCallback(() => {
    if (!refreshIntervalRef.current && open && configsLoaded) {
      console.log("🔄 Resuming auto-refresh with 3-second interval");
      isDialogOpenRef.current = true; // Re-enable the flag
      refreshIntervalRef.current = setInterval(() => {
        readStatesSequentiallyRef.current();
      }, 3000);
    } else if (!open) {
      console.log("❌ Auto refresh NOT resumed - dialog is closed");
    }
  }, [open, configsLoaded]);

  // Effect to handle child dialog state changes
  useEffect(() => {
    childDialogOpenRef.current = childDialogOpen;
    if (childDialogOpen) {
      pauseAutoRefresh();
    } else if (open) {
      // Only resume if the main dialog is still open
      resumeAutoRefresh();
    }
  }, [childDialogOpen, open, pauseAutoRefresh, resumeAutoRefresh]);

  // Listen for global auto refresh control events
  useEffect(() => {
    const handlePauseAutoRefresh = (event) => {
      pauseAutoRefresh();
    };

    const handleResumeAutoRefresh = (event) => {
      if (open && !childDialogOpen) {
        resumeAutoRefresh();
      }
    };

    window.addEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
    window.addEventListener("resumeAllAutoRefresh", handleResumeAutoRefresh);

    return () => {
      window.removeEventListener("pauseAllAutoRefresh", handlePauseAutoRefresh);
      window.removeEventListener(
        "resumeAllAutoRefresh",
        handleResumeAutoRefresh
      );
    };
  }, [open, childDialogOpen, pauseAutoRefresh, resumeAutoRefresh]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      isDialogOpenRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  return {
    inputConfigs,
    outputConfigs,
    setInputConfigs,
    setOutputConfigs,
    ioSpec,
    outputTypes,
    loading,
    isInitialLoading,
    configsLoaded,
    readStatesSequentially: readStatesSequentiallyRef.current,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    pauseAutoRefresh,
    resumeAutoRefresh,
  };
};
