import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useNetworkOutputConfig = (item, outputConfigs = [], setOutputConfigs = null, lightingItems = [], airconItems = []) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);
  const [allOutputConfigs, setAllOutputConfigs] = useState(null); // Cache for all output configs
  const [allACConfigs, setAllACConfigs] = useState(null); // Cache for all AC configs

  // Load all AC configurations from network unit
  const loadAllACConfigs = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return null;
    }

    // Return cached data if available
    if (allACConfigs) {
      console.log(`Returning cached AC configs:`, allACConfigs);
      return allACConfigs;
    }

    console.log(`Loading fresh AC configs from network unit...`);

    try {
      const acConfigs = await window.electronAPI.rcuController.getLocalACConfig(
        item.ip_address,
        item.id_can
      );

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      setAllACConfigs(acConfigs);
      return acConfigs;
    } catch (error) {
      console.error("Failed to load AC configurations:", error);
      toast.error("Failed to load AC configurations");
      return null;
    }
  }, [item?.ip_address, item?.id_can, allACConfigs]);

  // Handle output device change
  const handleOutputDeviceChange = useCallback(async (outputIndex, deviceId) => {
    if (!item?.ip_address || !item?.id_can) {
      toast.error("Network unit information not available");
      return;
    }

    try {
      // Determine output type from outputConfigs
      const outputConfig = outputConfigs.find(config => config.index === outputIndex);
      const outputType = outputConfig?.type;

      if (outputType === "ac") {
        // Handle AC output device change
        let airconAddress = 0; // Default for unassigned

        if (deviceId) {
          // Find the aircon item by ID to get its address
          const airconItem = airconItems?.find(item => item.id === parseInt(deviceId));
          if (airconItem) {
            airconAddress = parseInt(airconItem.address) || 0;
          } else {
            console.warn(`Aircon item with ID ${deviceId} not found`);
          }
        }

        // Load current AC configs, update the specific one, and save all back
        const currentACConfigs = await loadAllACConfigs();
        if (currentACConfigs && currentACConfigs.length === 10) {
          // Update the specific AC config
          const updatedACConfigs = [...currentACConfigs];
          updatedACConfigs[outputIndex] = {
            ...updatedACConfigs[outputIndex],
            address: airconAddress,
          };

          // Save all AC configs back to unit
          await window.electronAPI.rcuController.setLocalACConfig(
            item.ip_address,
            item.id_can,
            updatedACConfigs
          );

          // Clear cache to force reload next time
          setAllACConfigs(null);

          // Update local state to reflect the change
          if (setOutputConfigs) {
            setOutputConfigs(prev =>
              prev.map(config =>
                config.index === outputIndex
                  ? { ...config, airconAddress, isAssigned: airconAddress > 0 }
                  : config
              )
            );
          }

          toast.success(`AC Output ${outputIndex + 1} assignment updated`);
        } else {
          throw new Error("Failed to load current AC configurations");
        }
      } else {
        // Handle lighting/relay/dimmer output device change
        let lightingAddress = 0; // Default for unassigned

        if (deviceId) {
          // Find the lighting item by ID to get its address
          const lightingItem = lightingItems?.find(item => item.id === parseInt(deviceId));
          if (lightingItem) {
            lightingAddress = parseInt(lightingItem.address) || 0;
          } else {
            console.warn(`Lighting item with ID ${deviceId} not found`);
          }
        }

        // Send setOutputAssign command to network unit (only index and address)
        await window.electronAPI.rcuController.setOutputAssign(
          item.ip_address,
          item.id_can,
          outputIndex,
          lightingAddress
        );

        // Update local state to reflect the change if setOutputConfigs is provided
        if (setOutputConfigs) {
          setOutputConfigs(prev =>
            prev.map(config =>
              config.index === outputIndex
                ? { ...config, lightingAddress, isAssigned: lightingAddress > 0 }
                : config
            )
          );
        }

        toast.success(`Output ${outputIndex + 1} assignment updated`);
      }

      // Add delay to allow unit to process the command before auto refresh
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to update output assignment:", error);
      toast.error(`Failed to update output assignment: ${error.message}`);
    }
  }, [item?.ip_address, item?.id_can, lightingItems, airconItems, outputConfigs, setOutputConfigs, loadAllACConfigs]);

  // Load all output configs from unit (always fresh data)
  const loadAllOutputConfigs = useCallback(async () => {
    if (!item?.ip_address || !item?.id_can) {
      return null;
    }

    try {
      const configResponse = await window.electronAPI.rcuController.getOutputConfig(
        item.ip_address,
        item.id_can
      );

      // Add delay after GET command to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 300));

      if (configResponse?.success && configResponse.outputConfigs) {
        setAllOutputConfigs(configResponse.outputConfigs);
        return configResponse.outputConfigs;
      }
    } catch (error) {
      console.warn(`Failed to load output configs from unit:`, error.message);
      toast.error(`Failed to load output configurations from unit`);
    }

    return null;
  }, [item?.ip_address, item?.id_can, setAllOutputConfigs]);

  // Handle opening output configuration
  const handleOpenOutputConfig = useCallback(async (outputIndex, outputType) => {
    // Find the output config from the array
    const outputConfig = outputConfigs.find(config => config.index === outputIndex);

    // Set initial state with loading
    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: null,
      isLoading: true
    });

    // Open dialog first to show loading state
    if (outputType === "ac") {
      setACOutputDialogOpen(true);
    } else {
      setLightingOutputDialogOpen(true);
    }

    let formattedConfig = {};

    if (outputType === "ac") {
      // Load AC configuration for this specific output
      console.log(`Loading AC configs for output type: ${outputType}, index: ${outputIndex}`);
      const allACConfigs = await loadAllACConfigs();
      console.log(`loadAllACConfigs returned:`, allACConfigs);

      if (allACConfigs && allACConfigs[outputIndex]) {
        console.log(`All AC Configs:`, allACConfigs);
        console.log(`Looking for output index:`, outputIndex);

        const acConfig = allACConfigs[outputIndex];
        console.log(`AC Config for output ${outputIndex} - raw acConfig:`, acConfig);

        // Format AC config for AC output config dialog

        formattedConfig = {
          address: acConfig.address || 0,
          enable: acConfig.enable || false,
          windowMode: acConfig.windowMode || 0,
          fanType: acConfig.fanType || 0,
          tempType: acConfig.tempType || 0,
          tempUnit: acConfig.tempUnit || 0,
          valveContact: acConfig.valveContact || 0,
          valveType: acConfig.valveType || 0,
          deadband: acConfig.deadband || 0,
          lowFCU_Group: acConfig.lowFCU_Group || 0,
          medFCU_Group: acConfig.medFCU_Group || 0,
          highFCU_Group: acConfig.highFCU_Group || 0,
          fanAnalogGroup: acConfig.fanAnalogGroup || 0,
          analogCoolGroup: acConfig.analogCoolGroup || 0,
          analogHeatGroup: acConfig.analogHeatGroup || 0,
          valveCoolOpenGroup: acConfig.valveCoolOpenGroup || 0,
          valveCoolCloseGroup: acConfig.valveCoolCloseGroup || 0,
          valveHeatOpenGroup: acConfig.valveHeatOpenGroup || 0,
          valveHeatCloseGroup: acConfig.valveHeatCloseGroup || 0,
          windowBypass: acConfig.windowBypass || 0,
          setPointOffset: acConfig.setPointOffset || 0,
          unoccupyPower: acConfig.unoccupyPower || 0,
          occupyPower: acConfig.occupyPower || 0,
          standbyPower: acConfig.standbyPower || 0,
          unoccupyMode: acConfig.unoccupyMode || 0,
          occupyMode: acConfig.occupyMode || 0,
          standbyMode: acConfig.standbyMode || 0,
          unoccupyFanSpeed: acConfig.unoccupyFanSpeed || 0,
          occupyFanSpeed: acConfig.occupyFanSpeed || 0,
          standbyFanSpeed: acConfig.standbyFanSpeed || 0,
          unoccupyCoolSetPoint: acConfig.unoccupyCoolSetPoint || 0,
          occupyCoolSetPoint: acConfig.occupyCoolSetPoint || 0,
          standbyCoolSetPoint: acConfig.standbyCoolSetPoint || 0,
          unoccupyHeatSetPoint: acConfig.unoccupyHeatSetPoint || 0,
          occupyHeatSetPoint: acConfig.occupyHeatSetPoint || 0,
          standbyHeatSetPoint: acConfig.standbyHeatSetPoint || 0,
        };

        console.log(`Formatted AC config:`, formattedConfig);
      } else {
        console.log(`AC Config condition failed - allACConfigs:`, allACConfigs, `outputIndex:`, outputIndex, `allACConfigs[outputIndex]:`, allACConfigs?.[outputIndex]);
      }
    } else {
      // Load lighting/relay/dimmer output configs from unit
      const allConfigs = await loadAllOutputConfigs();

      // Find the specific config for this output
      let unitConfig = null;
      if (allConfigs) {
        unitConfig = allConfigs.find(config => config.outputIndex === outputIndex);
      }

      // Also load fresh output assign data to get latest delay values
      let freshOutputConfig = null;
      if (item?.ip_address && item?.id_can) {
        try {
          const assignResponse = await window.electronAPI.rcuController.getOutputAssign({
            unitIp: item.ip_address,
            canId: item.id_can,
          });

          // Add delay after GET command to prevent conflicts
          await new Promise(resolve => setTimeout(resolve, 300));

          if (assignResponse?.success && assignResponse.outputAssignments) {
            const assignment = assignResponse.outputAssignments.find(
              (assign) => assign.outputIndex === outputIndex
            );
            if (assignment) {
              freshOutputConfig = {
                ...outputConfig,
                lightingAddress: assignment.lightingAddress,
                delayOff: assignment.delayOff,
                delayOn: assignment.delayOn,
                isAssigned: assignment.isAssigned,
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to load fresh output assign data for output ${outputIndex}:`, error.message);
        }
      }

      // Use fresh data if available, otherwise fall back to existing data
      const configToUse = freshOutputConfig || outputConfig;

      if (configToUse) {
        // Convert delay values from network unit format (seconds) to dialog format
        const delayOffTotalSeconds = configToUse.delayOff || 0;
        const delayOnTotalSeconds = configToUse.delayOn || 0;

        formattedConfig = {
          // Delay settings from getOutputAssign (already loaded)
          delayOffHours: Math.floor(delayOffTotalSeconds / 3600),
          delayOffMinutes: Math.floor((delayOffTotalSeconds % 3600) / 60),
          delayOffSeconds: delayOffTotalSeconds % 60,
          delayOnHours: Math.floor(delayOnTotalSeconds / 3600),
          delayOnMinutes: Math.floor((delayOnTotalSeconds % 3600) / 60),
          delayOnSeconds: delayOnTotalSeconds % 60,

          // Config settings from getOutputConfig (loaded on-demand)
          minDim: unitConfig?.minDimmingLevel || 1,
          maxDim: unitConfig?.maxDimmingLevel || 100,
          autoTrigger: unitConfig?.isAutoTriggerEnabled || false,
          scheduleOnHour: unitConfig?.scheduleOnHour || 0,
          scheduleOnMinute: unitConfig?.scheduleOnMinute || 0,
          scheduleOffHour: unitConfig?.scheduleOffHour || 0,
          scheduleOffMinute: unitConfig?.scheduleOffMinute || 0,
        };
      }
    }

    // Update with loaded config
    setCurrentOutputConfig({
      index: outputIndex,
      name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${outputIndex + 1}`,
      type: outputType,
      config: formattedConfig,
      isLoading: false
    });
  }, [outputConfigs, item?.ip_address, item?.id_can, loadAllOutputConfigs]);

  // Handle saving output configuration
  const handleSaveOutputConfig = useCallback(async (config) => {
    if (!currentOutputConfig || !item?.ip_address || !item?.id_can) return false;

    try {
      if (currentOutputConfig.type === "ac") {
        // Handle AC configuration saving
        // Clear cached AC configs to force reload next time
        setAllACConfigs(null);

        // Load current AC configs, update the specific one, and save all back
        const currentACConfigs = await loadAllACConfigs();
        if (currentACConfigs && currentACConfigs.length === 10) {
          // Update the specific AC config
          const updatedACConfigs = [...currentACConfigs];
          updatedACConfigs[currentOutputConfig.index] = {
            ...updatedACConfigs[currentOutputConfig.index],
            address: config.address || 0,
            enable: config.enable || false,
            windowMode: config.windowMode || 0,
            fanType: config.fanType || 0,
            tempType: config.tempType || 0,
            tempUnit: config.tempUnit || 0,
            valveContact: config.valveContact || 0,
            valveType: config.valveType || 0,
            deadband: config.deadband || 0,
            lowFCU_Group: config.lowFCU_Group || 0,
            medFCU_Group: config.medFCU_Group || 0,
            highFCU_Group: config.highFCU_Group || 0,
            fanAnalogGroup: config.fanAnalogGroup || 0,
            analogCoolGroup: config.analogCoolGroup || 0,
            analogHeatGroup: config.analogHeatGroup || 0,
            valveCoolOpenGroup: config.valveCoolOpenGroup || 0,
            valveCoolCloseGroup: config.valveCoolCloseGroup || 0,
            valveHeatOpenGroup: config.valveHeatOpenGroup || 0,
            valveHeatCloseGroup: config.valveHeatCloseGroup || 0,
            windowBypass: config.windowBypass || 0,
            setPointOffset: config.setPointOffset || 0,
            unoccupyPower: config.unoccupyPower || 0,
            occupyPower: config.occupyPower || 0,
            standbyPower: config.standbyPower || 0,
            unoccupyMode: config.unoccupyMode || 0,
            occupyMode: config.occupyMode || 0,
            standbyMode: config.standbyMode || 0,
            unoccupyFanSpeed: config.unoccupyFanSpeed || 0,
            occupyFanSpeed: config.occupyFanSpeed || 0,
            standbyFanSpeed: config.standbyFanSpeed || 0,
            unoccupyCoolSetPoint: config.unoccupyCoolSetPoint || 0,
            occupyCoolSetPoint: config.occupyCoolSetPoint || 0,
            standbyCoolSetPoint: config.standbyCoolSetPoint || 0,
            unoccupyHeatSetPoint: config.unoccupyHeatSetPoint || 0,
            occupyHeatSetPoint: config.occupyHeatSetPoint || 0,
            standbyHeatSetPoint: config.standbyHeatSetPoint || 0,
          };

          // Save all AC configs back to unit
          await window.electronAPI.rcuController.setLocalACConfig(
            item.ip_address,
            item.id_can,
            updatedACConfigs
          );

          toast.success(`AC output ${currentOutputConfig.index + 1} configuration saved`);
        } else {
          throw new Error("Failed to load current AC configurations");
        }
      } else {
        // Handle lighting/relay/dimmer configuration saving
        // Clear cached configs to force reload next time
        setAllOutputConfigs(null);

        // Convert dialog config format to network unit format (in seconds, not milliseconds)
        const delayOffSeconds = config.delayOffHours * 3600 + config.delayOffMinutes * 60 + config.delayOffSeconds;
        const delayOnSeconds = config.delayOnHours * 3600 + config.delayOnMinutes * 60 + config.delayOnSeconds;

        // Send setOutputConfig for dimming levels, auto trigger, and schedule
        await window.electronAPI.rcuController.setOutputConfig(
          item.ip_address,
          item.id_can,
          currentOutputConfig.index,
          {
            minDimmingLevel: config.minDim || 1,
            maxDimmingLevel: config.maxDim || 100,
            autoTriggerFlag: config.autoTrigger ? 1 : 0,
            scheduleOnHour: config.scheduleOnHour || 0,
            scheduleOnMinute: config.scheduleOnMinute || 0,
            scheduleOffHour: config.scheduleOffHour || 0,
            scheduleOffMinute: config.scheduleOffMinute || 0,
          }
        );

        // Send delay settings using separate commands
        await window.electronAPI.rcuController.setOutputDelayOff(
          item.ip_address,
          item.id_can,
          currentOutputConfig.index,
          delayOffSeconds
        );

        // Add delay between commands
        await new Promise(resolve => setTimeout(resolve, 300));

        await window.electronAPI.rcuController.setOutputDelayOn(
          item.ip_address,
          item.id_can,
          currentOutputConfig.index,
          delayOnSeconds
        );

        toast.success(`Lighting output ${currentOutputConfig.index + 1} configuration saved`);
      }

      // Add delay to allow unit to process the commands
      await new Promise(resolve => setTimeout(resolve, 500));

      return true;
    } catch (error) {
      console.error("Failed to save output configuration:", error);
      toast.error("Failed to save output configuration");
      return false;
    }
  }, [currentOutputConfig, item?.ip_address, item?.id_can, loadAllACConfigs, setAllACConfigs, setAllOutputConfigs]);

  // Handle output state toggle
  const handleToggleOutputState = useCallback(async (outputIndex, currentState) => {
    if (!item?.ip_address || !item?.id_can) {
      return;
    }

    try {
      // Toggle state: if currently on (true), send 0 to turn off; if off (false), send 255 to turn on
      const newValue = currentState ? 0 : 255;

      const response = await window.electronAPI.rcuController.setOutputState({
        unitIp: item.ip_address,
        canId: item.id_can,
        outputIndex: outputIndex,
        value: newValue,
      });

      if (response) {
        toast.success(
          `Output ${outputIndex + 1} ${currentState ? "turned off" : "turned on"}`
        );
        return true;
      }
    } catch (error) {
      console.error("Failed to toggle output state:", error);
      toast.error(
        `Failed to toggle output ${outputIndex + 1}: ${error.message}`
      );
      return false;
    }
  }, [item?.ip_address, item?.id_can]);

  return {
    lightingOutputDialogOpen,
    setLightingOutputDialogOpen,
    acOutputDialogOpen,
    setACOutputDialogOpen,
    currentOutputConfig,
    handleOutputDeviceChange,
    handleOpenOutputConfig,
    handleSaveOutputConfig,
    handleToggleOutputState,
  };
};
