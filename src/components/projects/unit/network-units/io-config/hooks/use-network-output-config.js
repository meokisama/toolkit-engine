import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export const useNetworkOutputConfig = (
  item,
  outputConfigs = [],
  setOutputConfigs = null,
  lightingItems = [],
  airconItems = [],
  readAirconConfigsFromUnit = null
) => {
  const [lightingOutputDialogOpen, setLightingOutputDialogOpen] = useState(false);
  const [acOutputDialogOpen, setACOutputDialogOpen] = useState(false);
  const [currentOutputConfig, setCurrentOutputConfig] = useState(null);

  // Reset state when item changes (switching between different network units)
  useEffect(() => {
    setCurrentOutputConfig(null);

    // Close any open dialogs when switching units
    setLightingOutputDialogOpen(false);
    setACOutputDialogOpen(false);
  }, [item?.ip_address, item?.id_can]); // Reset when unit IP or CAN ID changes

  // Load and map aircon configs to output configs
  const loadAndMapAirconConfigs = useCallback(async () => {
    if (!readAirconConfigsFromUnit) {
      return;
    }

    try {
      await readAirconConfigsFromUnit();
    } catch (error) {
      console.error("Failed to load and map aircon configs:", error);
      toast.error("Failed to load aircon configurations");
    }
  }, [readAirconConfigsFromUnit]);

  // Helper function to calculate index within the same type
  const getTypeIndex = useCallback((globalIndex, outputType, allConfigs) => {
    const sameTypeConfigs = allConfigs.filter((config) => config.type === outputType);
    const typeIndex = sameTypeConfigs.findIndex((config) => config.index === globalIndex);
    return typeIndex + 1;
  }, []);

  // Handle output device change - LOCAL STATE ONLY (no send to unit)
  const handleOutputDeviceChange = useCallback(
    async (outputIndex, deviceId) => {
      try {
        // Determine output type from outputConfigs
        const outputConfig = outputConfigs.find((config) => config.index === outputIndex);
        const outputType = outputConfig?.type;

        if (outputType === "ac") {
          // Handle AC output device change
          let airconAddress = 0; // Default for unassigned

          if (deviceId) {
            // Find the aircon item by ID to get its address
            const airconItem = airconItems?.find((item) => item.id === parseInt(deviceId));
            if (airconItem) {
              airconAddress = parseInt(airconItem.address) || 0;
            } else {
              console.error(`Aircon item with ID ${deviceId} not found`);
            }
          }

          // Update local state only - changes will be sent when user clicks Save button
          if (setOutputConfigs) {
            setOutputConfigs((prev) =>
              prev.map((config) =>
                config.index === outputIndex
                  ? {
                      ...config,
                      airconAddress,
                      isAssigned: airconAddress > 0,
                    }
                  : config
              )
            );
          }
        } else {
          // Handle lighting/relay/dimmer output device change
          let lightingAddress = 0; // Default for unassigned

          if (deviceId) {
            // Find the lighting item by ID to get its address
            const lightingItem = lightingItems?.find((item) => item.id === parseInt(deviceId));
            if (lightingItem) {
              lightingAddress = parseInt(lightingItem.address) || 0;
            } else {
              console.error(`Lighting item with ID ${deviceId} not found`);
            }
          }

          // Update local state only - changes will be sent when user clicks Save button
          if (setOutputConfigs) {
            setOutputConfigs((prev) =>
              prev.map((config) =>
                config.index === outputIndex
                  ? {
                      ...config,
                      lightingAddress,
                      isAssigned: lightingAddress > 0,
                    }
                  : config
              )
            );
          }
        }
      } catch (error) {
        console.error("Failed to update output assignment:", error);
        toast.error(`Failed to update output assignment: ${error.message}`);
      }
    },
    [lightingItems, airconItems, outputConfigs, setOutputConfigs]
  );

  // Handle opening output configuration - READ FROM LOCAL STATE
  const handleOpenOutputConfig = useCallback(
    async (outputIndex, outputType, currentOutputConfigData) => {
      // Calculate the correct index within the type
      const typeIndex = getTypeIndex(outputIndex, outputType, outputConfigs);

      // Use config from local state (passed from parent)
      const localConfig = currentOutputConfigData || {};

      let formattedConfig = {};

      if (outputType === "ac") {
        // Format AC config from local state
        formattedConfig = {
          address: localConfig.airconAddress ?? 0,
          enable: localConfig.acEnable ?? false,
          windowMode: localConfig.acWindowMode ?? 0,
          fanType: localConfig.acFanType ?? 0,
          tempType: localConfig.acTempType ?? 0,
          tempUnit: localConfig.acTempUnit ?? 0,
          valveContact: localConfig.acValveContact ?? 0,
          valveType: localConfig.acValveType ?? 0,
          deadband: localConfig.acDeadband ?? 0,
          lowFCU_Group: localConfig.acLowFCU_Group ?? 0,
          medFCU_Group: localConfig.acMedFCU_Group ?? 0,
          highFCU_Group: localConfig.acHighFCU_Group ?? 0,
          fanAnalogGroup: localConfig.acFanAnalogGroup ?? 0,
          analogCoolGroup: localConfig.acAnalogCoolGroup ?? 0,
          analogHeatGroup: localConfig.acAnalogHeatGroup ?? 0,
          valveCoolOpenGroup: localConfig.acValveCoolOpenGroup ?? 0,
          valveCoolCloseGroup: localConfig.acValveCoolCloseGroup ?? 0,
          valveHeatOpenGroup: localConfig.acValveHeatOpenGroup ?? 0,
          valveHeatCloseGroup: localConfig.acValveHeatCloseGroup ?? 0,
          windowBypass: localConfig.acWindowBypass ?? 0,
          setPointOffset: localConfig.acSetPointOffset ?? 0,
          windowOpenAction: localConfig.acWindowOpenAction ?? 0,
          windowOpenCoolSetPoint: localConfig.acWindowOpenCoolSetPoint ?? 0,
          windowOpenHeatSetPoint: localConfig.acWindowOpenHeatSetPoint ?? 0,
          windowDelay: localConfig.acWindowDelay ?? 0,
          roomAddress: localConfig.acRoomAddress ?? 0,
          unoccupyPower: localConfig.acUnoccupyPower ?? 0,
          occupyPower: localConfig.acOccupyPower ?? 0,
          standbyPower: localConfig.acStandbyPower ?? 0,
          unoccupyMode: localConfig.acUnoccupyMode ?? 0,
          occupyMode: localConfig.acOccupyMode ?? 0,
          standbyMode: localConfig.acStandbyMode ?? 0,
          unoccupyFanSpeed: localConfig.acUnoccupyFanSpeed ?? 0,
          occupyFanSpeed: localConfig.acOccupyFanSpeed ?? 0,
          standbyFanSpeed: localConfig.acStandbyFanSpeed ?? 0,
          unoccupyCoolSetPoint: localConfig.acUnoccupyCoolSetPoint ?? 0,
          occupyCoolSetPoint: localConfig.acOccupyCoolSetPoint ?? 0,
          standbyCoolSetPoint: localConfig.acStandbyCoolSetPoint ?? 0,
          unoccupyHeatSetPoint: localConfig.acUnoccupyHeatSetPoint ?? 0,
          occupyHeatSetPoint: localConfig.acOccupyHeatSetPoint ?? 0,
          standbyHeatSetPoint: localConfig.acStandbyHeatSetPoint ?? 0,
        };
      } else {
        // Format lighting config from local state
        const delayOffTotalSeconds = localConfig.delayOff || 0;
        const delayOnTotalSeconds = localConfig.delayOn || 0;

        formattedConfig = {
          delayOffHours: Math.floor(delayOffTotalSeconds / 3600),
          delayOffMinutes: Math.floor((delayOffTotalSeconds % 3600) / 60),
          delayOffSeconds: delayOffTotalSeconds % 60,
          delayOnHours: Math.floor(delayOnTotalSeconds / 3600),
          delayOnMinutes: Math.floor((delayOnTotalSeconds % 3600) / 60),
          delayOnSeconds: delayOnTotalSeconds % 60,
          minDim: localConfig.minDim ?? 1,
          maxDim: localConfig.maxDim ?? 100,
          autoTrigger: localConfig.autoTrigger ?? false,
          scheduleOnHour: localConfig.scheduleOnHour ?? 0,
          scheduleOnMinute: localConfig.scheduleOnMinute ?? 0,
          scheduleOffHour: localConfig.scheduleOffHour ?? 0,
          scheduleOffMinute: localConfig.scheduleOffMinute ?? 0,
        };
      }

      // Set state immediately from local config (no loading needed)
      setCurrentOutputConfig({
        index: outputIndex,
        name: `${outputType === "ac" ? "AC" : "Lighting"} Output ${typeIndex}`,
        type: outputType,
        config: formattedConfig,
        isLoading: false,
      });

      // Open dialog
      if (outputType === "ac") {
        setACOutputDialogOpen(true);
      } else {
        setLightingOutputDialogOpen(true);
      }
    },
    [outputConfigs, getTypeIndex]
  );

  // Handle saving output configuration - LOCAL STATE ONLY (no send to unit)
  const handleSaveOutputConfig = useCallback(
    async (config) => {
      if (!currentOutputConfig) return false;

      try {
        if (currentOutputConfig.type === "ac") {
          // Handle AC configuration saving - update local state only
          if (setOutputConfigs) {
            setOutputConfigs((prev) =>
              prev.map((outputConfig) =>
                outputConfig.index === currentOutputConfig.index
                  ? {
                      ...outputConfig,
                      acEnable: config.enable ?? false,
                      acWindowMode: config.windowMode ?? 0,
                      acFanType: config.fanType ?? 0,
                      acTempType: config.tempType ?? 0,
                      acTempUnit: config.tempUnit ?? 0,
                      acValveContact: config.valveContact ?? 0,
                      acValveType: config.valveType ?? 0,
                      acDeadband: config.deadband ?? 0,
                      acLowFCU_Group: config.lowFCU_Group ?? 0,
                      acMedFCU_Group: config.medFCU_Group ?? 0,
                      acHighFCU_Group: config.highFCU_Group ?? 0,
                      acFanAnalogGroup: config.fanAnalogGroup ?? 0,
                      acAnalogCoolGroup: config.analogCoolGroup ?? 0,
                      acAnalogHeatGroup: config.analogHeatGroup ?? 0,
                      acValveCoolOpenGroup: config.valveCoolOpenGroup ?? 0,
                      acValveCoolCloseGroup: config.valveCoolCloseGroup ?? 0,
                      acValveHeatOpenGroup: config.valveHeatOpenGroup ?? 0,
                      acValveHeatCloseGroup: config.valveHeatCloseGroup ?? 0,
                      acWindowBypass: config.windowBypass ?? 0,
                      acSetPointOffset: config.setPointOffset ?? 0,
                      acWindowOpenAction: config.windowOpenAction ?? 0,
                      acWindowOpenCoolSetPoint: config.windowOpenCoolSetPoint ?? 0,
                      acWindowOpenHeatSetPoint: config.windowOpenHeatSetPoint ?? 0,
                      acWindowDelay: config.windowDelay ?? 0,
                      acRoomAddress: config.roomAddress ?? 0,
                      acUnoccupyPower: config.unoccupyPower ?? 0,
                      acOccupyPower: config.occupyPower ?? 0,
                      acStandbyPower: config.standbyPower ?? 0,
                      acUnoccupyMode: config.unoccupyMode ?? 0,
                      acOccupyMode: config.occupyMode ?? 0,
                      acStandbyMode: config.standbyMode ?? 0,
                      acUnoccupyFanSpeed: config.unoccupyFanSpeed ?? 0,
                      acOccupyFanSpeed: config.occupyFanSpeed ?? 0,
                      acStandbyFanSpeed: config.standbyFanSpeed ?? 0,
                      acUnoccupyCoolSetPoint: config.unoccupyCoolSetPoint ?? 0,
                      acOccupyCoolSetPoint: config.occupyCoolSetPoint ?? 0,
                      acStandbyCoolSetPoint: config.standbyCoolSetPoint ?? 0,
                      acUnoccupyHeatSetPoint: config.unoccupyHeatSetPoint ?? 0,
                      acOccupyHeatSetPoint: config.occupyHeatSetPoint ?? 0,
                      acStandbyHeatSetPoint: config.standbyHeatSetPoint ?? 0,
                    }
                  : outputConfig
              )
            );
          }
        } else {
          // Handle lighting/relay/dimmer configuration saving - update local state only
          const delayOffSeconds = config.delayOffHours * 3600 + config.delayOffMinutes * 60 + config.delayOffSeconds;
          const delayOnSeconds = config.delayOnHours * 3600 + config.delayOnMinutes * 60 + config.delayOnSeconds;

          if (setOutputConfigs) {
            setOutputConfigs((prev) =>
              prev.map((outputConfig) =>
                outputConfig.index === currentOutputConfig.index
                  ? {
                      ...outputConfig,
                      minDim: config.minDim ?? 1,
                      maxDim: config.maxDim ?? 100,
                      autoTrigger: config.autoTrigger ?? false,
                      scheduleOnHour: config.scheduleOnHour ?? 0,
                      scheduleOnMinute: config.scheduleOnMinute ?? 0,
                      scheduleOffHour: config.scheduleOffHour ?? 0,
                      scheduleOffMinute: config.scheduleOffMinute ?? 0,
                      delayOff: delayOffSeconds,
                      delayOn: delayOnSeconds,
                    }
                  : outputConfig
              )
            );
          }
        }

        return true;
      } catch (error) {
        console.error("Failed to save output configuration:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to save output configuration";
        toast.error(errorMessage);
        return false;
      }
    },
    [currentOutputConfig, setOutputConfigs]
  );

  // Handle output state toggle
  const handleToggleOutputState = useCallback(
    async (outputIndex, currentState) => {
      if (!item?.ip_address || !item?.id_can) {
        return;
      }

      try {
        // Toggle state: if currently on (true), send 0 to turn off; if off (false), send 255 to turn on
        const newValue = currentState ? 0 : 255;

        const response = await window.electronAPI.ioController.setOutputState({
          unitIp: item.ip_address,
          canId: item.id_can,
          outputIndex: outputIndex,
          value: newValue,
        });

        if (response) {
          // Calculate the correct index within the type for toast message
          const outputConfig = outputConfigs.find((config) => config.index === outputIndex);
          const typeIndex = getTypeIndex(outputIndex, outputConfig?.type, outputConfigs);
          const typeLabel =
            outputConfig?.type === "ac"
              ? "AC"
              : outputConfig?.type === "relay"
              ? "Relay"
              : outputConfig?.type === "dimmer"
              ? "Dimmer"
              : outputConfig?.type === "ao"
              ? "AO"
              : "Output";

          toast.success(`${typeLabel} ${typeIndex} ${currentState ? "turned off" : "turned on"}`);
          return true;
        }
      } catch (error) {
        console.error("Failed to toggle output state:", error);

        // Calculate the correct index within the type for error toast message
        const outputConfig = outputConfigs.find((config) => config.index === outputIndex);
        const typeIndex = getTypeIndex(outputIndex, outputConfig?.type, outputConfigs);
        const typeLabel =
          outputConfig?.type === "ac"
            ? "AC"
            : outputConfig?.type === "relay"
            ? "Relay"
            : outputConfig?.type === "dimmer"
            ? "Dimmer"
            : outputConfig?.type === "ao"
            ? "AO"
            : "Output";

        toast.error(`Failed to toggle ${typeLabel} ${typeIndex}: ${error.message}`);
        return false;
      }
    },
    [item?.ip_address, item?.id_can, outputConfigs, getTypeIndex]
  );

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
    loadAndMapAirconConfigs,
  };
};
