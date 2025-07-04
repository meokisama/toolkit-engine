import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getUnitIOSpec, getOutputTypes } from "@/utils/io-config-utils";
import { createDefaultIOConfig } from "@/utils/io-config-utils";

export const useNetworkIOConfig = (item, open, childDialogOpen = false) => {
  const [inputConfigs, setInputConfigs] = useState([]);
  const [outputConfigs, setOutputConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [configsLoaded, setConfigsLoaded] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Default to disabled

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
      const response = await window.electronAPI.rcuController.getAllInputStates(
        {
          unitIp: item.ip_address,
          canId: item.id_can,
        }
      );

      // Add small delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 200));

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
        }
      }
    } catch (error) {
      console.error("❌ Background input state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read aircon configs from unit and map to output configs
  const readAirconConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      const acConfigs = await window.electronAPI.rcuController.getLocalACConfig(
        item.ip_address,
        item.id_can
      );

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      if (acConfigs && Array.isArray(acConfigs) && acConfigs.length === 10) {
        // Update output configs with aircon address mapping
        setOutputConfigs(prevConfigs => {
          return prevConfigs.map(config => {
            if (config.type === "ac") {
              // Find the AC config index for this output
              const acOutputs = prevConfigs.filter(output => output.type === "ac");
              const acConfigIndex = acOutputs.findIndex(output => output.index === config.index);

              if (acConfigIndex >= 0 && acConfigIndex < acConfigs.length) {
                const acConfig = acConfigs[acConfigIndex];
                return {
                  ...config,
                  airconAddress: acConfig.address || 0,
                  isAssigned: (acConfig.address || 0) > 0,
                };
              }
            }
            return config;
          });
        });

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
      const response =
        await window.electronAPI.rcuController.getAllOutputStates({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

      // Add small delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 200));

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
        }
      }
    } catch (error) {
      console.error("❌ Background output state read failed:", error.message);
    }
  }, [item?.ip_address, item?.id_can]);

  // Function to read input configurations from unit
  const readInputConfigsFromUnit = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return false;
    }

    try {
      const response =
        await window.electronAPI.rcuController.getAllInputConfigs({
          unitIp: item.ip_address,
          canId: item.id_can,
        });

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      if (response?.configs) {
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
      // Step 1: Read input states first
      await readInputStatesBackground();

      // Step 2: Wait for input processing to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 3: Check if dialog is still open before proceeding to outputs
      if (!isDialogOpenRef.current || childDialogOpenRef.current) {
        return;
      }

      // Step 4: Read output states
      await readOutputStatesBackground();

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

      // Load outputs after inputs
      const outputConfigsSuccess = await readOutputConfigsFromUnit();

      // Load aircon configs after outputs
      const airconConfigsSuccess = await readAirconConfigsFromUnit();

      setConfigsLoaded(true);
      setIsInitialLoading(false);

      // Initial state read
      await readStatesSequentiallyRef.current();

      // Set up auto-refresh only if enabled
      if (autoRefreshEnabled) {
        refreshIntervalRef.current = setInterval(() => {
          readStatesSequentiallyRef.current();
        }, 3000);
      }
    };

    initializeDialog();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [open, item, ioSpec, readInputConfigsFromUnit, autoRefreshEnabled]);

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

  // Effect to handle auto refresh enable/disable
  useEffect(() => {
    if (autoRefreshEnabled && open && configsLoaded && !refreshIntervalRef.current) {
      // Start auto refresh
      refreshIntervalRef.current = setInterval(() => {
        readStatesSequentiallyRef.current();
      }, 3000);
    } else if (!autoRefreshEnabled && refreshIntervalRef.current) {
      // Stop auto refresh
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, [autoRefreshEnabled, open, configsLoaded]);

  // Function to pause auto refresh (when child dialogs are open)
  const pauseAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    // Also set flag to prevent any ongoing reads
    isDialogOpenRef.current = false;
  }, []);

  // Function to resume auto refresh (when child dialogs are closed)
  const resumeAutoRefresh = useCallback(() => {
    if (!refreshIntervalRef.current && open && configsLoaded && autoRefreshEnabled) {
      isDialogOpenRef.current = true; // Re-enable the flag
      refreshIntervalRef.current = setInterval(() => {
        readStatesSequentiallyRef.current();
      }, 3000);
    }
  }, [open, configsLoaded, autoRefreshEnabled]);

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
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    readStatesSequentially: readStatesSequentiallyRef.current,
    readInputConfigsFromUnit,
    readOutputConfigsFromUnit,
    readAirconConfigsFromUnit,
    pauseAutoRefresh,
    resumeAutoRefresh,
  };
};
