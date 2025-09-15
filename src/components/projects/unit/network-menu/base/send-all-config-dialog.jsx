"use client";

import React, { useState, useCallback, useRef, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Play,
  Calendar,
  GitCompare,
  Network,
  ChevronsUpDown,
  CheckCircle,
  XCircle,
  Loader2,
  List,
  Database,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  NetworkUnitSelector,
  useNetworkUnitSelector,
} from "@/components/shared/network-unit-selector";
import { DatabaseUnitSelector } from "@/components/shared/database-unit-selector";
import { deleteAllConfigsFromUnits } from "./delete-all-configs-helper";

function SendAllConfigDialogComponent({ open, onOpenChange }) {
  const { selectedProject, projectItems } = useProjectDetail();
  const { selectedUnitIds, handleSelectionChange, clearSelection } =
    useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const databaseUnitSelectorRef = useRef(null);
  const [selectedDatabaseUnitId, setSelectedDatabaseUnitId] = useState("");
  const [configTypes, setConfigTypes] = useState({
    scenes: true,
    schedules: true,
    multiScenes: true,
    sequences: true,
    knx: true,
    curtain: true,
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const databaseUnits = projectItems.unit || [];

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      clearSelection();
      setSelectedDatabaseUnitId("");
      setResults([]);
      setShowResults(false);
      setProgress(0);
      setCurrentOperation("");
      setValidationErrors([]);
    }
  }, [open, clearSelection]);

  // Handle config type toggle
  const handleConfigTypeToggle = useCallback((type, checked) => {
    setConfigTypes((prev) => ({
      ...prev,
      [type]: checked,
    }));
  }, []);

  // Handle select all config types
  const handleSelectAllConfigTypes = useCallback(() => {
    setConfigTypes({
      scenes: true,
      schedules: true,
      multiScenes: true,
      sequences: true,
      knx: true,
      curtain: true,
    });
  }, []);

  // Handle select none config types
  const handleSelectNoneConfigTypes = useCallback(() => {
    setConfigTypes({
      scenes: false,
      schedules: false,
      multiScenes: false,
      sequences: false,
      knx: false,
      curtain: false,
    });
  }, []);

  // Validation function for write configuration
  const validateWriteConfiguration = useCallback(() => {
    const errors = [];

    if (!selectedDatabaseUnitId) {
      return errors; // No validation needed if no database unit selected
    }

    if (selectedUnitIds.length === 0) {
      errors.push("Please select at least one network unit");
      return errors;
    }

    if (selectedUnitIds.length > 1) {
      errors.push(
        "Please select only one network unit when writing database configuration"
      );
      return errors;
    }

    const databaseUnit = databaseUnits.find(
      (unit) => unit.id === selectedDatabaseUnitId
    );
    if (!databaseUnit) {
      errors.push("Selected database unit not found");
      return errors;
    }

    const selectedNetworkUnits =
      networkUnitSelectorRef.current?.getSelectedUnits() || [];
    if (selectedNetworkUnits.length === 0) {
      errors.push("Selected network unit not found");
      return errors;
    }

    const networkUnit = selectedNetworkUnits[0];

    // Validate board type match
    if (databaseUnit.type !== networkUnit.type) {
      errors.push(
        `Board type mismatch: Database unit is ${databaseUnit.type}, Network unit is ${networkUnit.type}`
      );
    }

    // Get all network units for duplicate checking
    const allNetworkUnits = networkUnitSelectorRef.current?.getAllUnits() || [];

    // Check for duplicate IP address
    const duplicateIpUnits = allNetworkUnits.filter(
      (unit) =>
        unit.ip_address === databaseUnit.ip_address &&
        unit.id !== networkUnit.id
    );
    if (duplicateIpUnits.length > 0) {
      errors.push(
        `IP address ${databaseUnit.ip_address} already exists on another network unit`
      );
    }

    // Check for duplicate CAN ID (excluding Stand Alone units)
    if (databaseUnit.mode !== "Stand-Alone") {
      const duplicateCanUnits = allNetworkUnits.filter(
        (unit) =>
          unit.id_can === databaseUnit.id_can &&
          unit.id !== networkUnit.id &&
          unit.mode !== "Stand-Alone"
      );
      if (duplicateCanUnits.length > 0) {
        errors.push(
          `CAN ID ${databaseUnit.id_can} already exists on another network unit (excluding Stand-Alone units)`
        );
      }
    }

    // Check for multiple Masters on same CAN network
    if (databaseUnit.mode === "Master") {
      const canPrefix = databaseUnit.id_can.split(".").slice(0, 3).join(".");
      const masterUnits = allNetworkUnits.filter(
        (unit) =>
          unit.mode === "Master" &&
          unit.id_can.startsWith(canPrefix) &&
          unit.id !== networkUnit.id
      );
      if (masterUnits.length > 0) {
        errors.push(
          `Another Master unit already exists on CAN network ${canPrefix}.x`
        );
      }
    }

    return errors;
  }, [selectedDatabaseUnitId, selectedUnitIds, databaseUnits]);

  // Helper functions for configuration writing
  const changeIpAddress = async (oldIp, newIp, canId) => {
    const oldIpBytes = oldIp.split(".").map((part) => parseInt(part));
    const newIpBytes = newIp.split(".").map((part) => parseInt(part));
    const data = [...newIpBytes, ...oldIpBytes];

    const response = await window.electronAPI.rcuController.changeIpAddress({
      unitIp: oldIp,
      canId: canId,
      data: data,
    });

    if (!response.result.success) {
      throw new Error("Failed to change IP address");
    }
  };

  const changeCanId = async (unitIp, newLastPart, oldCanId) => {
    const response = await window.electronAPI.rcuController.changeCanId({
      unitIp: unitIp,
      canId: oldCanId,
      newLastPart: newLastPart,
    });

    if (!response.result.success) {
      throw new Error("Failed to change CAN ID");
    }
  };

  const changeHardwareConfig = async (unitIp, canId, config) => {
    let configByte = 0;

    const modeMap = {
      "Stand-Alone": 0,
      Slave: 1,
      Master: 2,
    };
    configByte |= (modeMap[config.mode] || 0) & 0x03;

    if (config.can_load) {
      configByte |= 0x04;
    }

    if (config.recovery_mode) {
      configByte |= 0x40;
    }

    const response = await window.electronAPI.rcuController.setHardwareConfig({
      unitIp: unitIp,
      canId: canId,
      configByte: configByte,
    });

    if (!response.result.success) {
      throw new Error("Failed to change hardware configuration");
    }
  };

  const writeIOConfiguration = async (unitIp, canId, ioConfig) => {
    if (!ioConfig) {
      console.log("No I/O config provided, skipping");
      return;
    }

    try {
      // Write input configurations
      if (ioConfig.inputs && Array.isArray(ioConfig.inputs)) {
        for (
          let inputIndex = 0;
          inputIndex < ioConfig.inputs.length;
          inputIndex++
        ) {
          const input = ioConfig.inputs[inputIndex];
          if (input && input.functionValue !== undefined) {
            const inputConfigData = {
              inputNumber: inputIndex,
              inputType: parseInt(input.functionValue) || 0,
              ramp: parseInt(input.ramp) || 0,
              preset: parseInt(input.preset) || 255,
              ledStatus: parseInt(input.ledStatus) || 0,
              autoMode: input.autoMode || false,
              delayOff: parseInt(input.delayOff) || 0,
              groups: input.groups || [],
            };

            await window.electronAPI.rcuController.setupInputConfig({
              unitIp: unitIp,
              canId: canId,
              inputConfig: inputConfigData,
            });

            // Small delay between input configurations
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      // Write output configurations
      if (ioConfig.outputs && Array.isArray(ioConfig.outputs)) {
        // Note: Output assignments will be collected after detailed configurations are processed
        // This is moved to after the detailed config processing to ensure lightingAddress is available

        // Process individual output configurations (delays, dimming, etc.)
        for (
          let outputIndex = 0;
          outputIndex < ioConfig.outputs.length;
          outputIndex++
        ) {
          const output = ioConfig.outputs[outputIndex];
          if (output) {
            // Set output delays if specified
            if (output.delayOff !== undefined && output.delayOff > 0) {
              console.log(
                `Setting delay off for output ${outputIndex}: ${output.delayOff} seconds`
              );
              await window.electronAPI.rcuController.setOutputDelayOff(
                unitIp,
                canId,
                outputIndex,
                parseInt(output.delayOff) || 0
              );

              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            if (output.delayOn !== undefined && output.delayOn > 0) {
              console.log(
                `Setting delay on for output ${outputIndex}: ${output.delayOn} seconds`
              );
              await window.electronAPI.rcuController.setOutputDelayOn(
                unitIp,
                canId,
                outputIndex,
                parseInt(output.delayOn) || 0
              );

              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Set output configuration (dimming levels, auto trigger, schedule) for lighting outputs
            if (
              output.deviceType !== "aircon" &&
              (output.minDim !== undefined ||
                output.maxDim !== undefined ||
                output.autoTrigger !== undefined ||
                output.scheduleOnHour !== undefined ||
                output.scheduleOnMinute !== undefined ||
                output.scheduleOffHour !== undefined ||
                output.scheduleOffMinute !== undefined)
            ) {
              await window.electronAPI.rcuController.setOutputConfig(
                unitIp,
                canId,
                outputIndex,
                {
                  minDimmingLevel: parseInt(output.minDim) || 1,
                  maxDimmingLevel: parseInt(output.maxDim) || 100,
                  autoTriggerFlag: output.autoTrigger ? 1 : 0,
                  scheduleOnHour: parseInt(output.scheduleOnHour) || 0,
                  scheduleOnMinute: parseInt(output.scheduleOnMinute) || 0,
                  scheduleOffHour: parseInt(output.scheduleOffHour) || 0,
                  scheduleOffMinute: parseInt(output.scheduleOffMinute) || 0,
                }
              );

              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        }
      }

      // Write AC configurations if present
      if (ioConfig.acConfigs && Array.isArray(ioConfig.acConfigs)) {
        console.log(
          `Sending AC configurations to ${unitIp}:`,
          ioConfig.acConfigs
        );
        await window.electronAPI.rcuController.setLocalACConfig(
          unitIp,
          canId,
          ioConfig.acConfigs
        );
        console.log(`AC configurations sent successfully to ${unitIp}`);
      }
    } catch (error) {
      console.error("Failed to write I/O configuration:", error);
      throw error;
    }
  };

  // Convert database RS485 format to network format
  const convertDatabaseToNetworkRS485Format = (databaseConfig) => {
    return {
      baudrate: databaseConfig.baudrate,
      parity: databaseConfig.parity,
      stopBit: databaseConfig.stop_bit,
      boardId: databaseConfig.board_id,
      rs485Type: databaseConfig.config_type,
      numSlaves: databaseConfig.num_slave_devs,
      reserved: databaseConfig.reserved || [0, 0, 0, 0, 0],
      slaves: (databaseConfig.slave_cfg || []).map((slave) => ({
        slaveId: slave.slave_id,
        slaveGroup: slave.slave_group,
        numIndoors: slave.num_indoors,
        indoorGroups: slave.indoor_group || new Array(16).fill(0),
      })),
    };
  };

  const writeRS485Configuration = async (unitIp, canId, rs485Config) => {
    if (!rs485Config || !Array.isArray(rs485Config)) return;

    try {
      console.log(`Writing RS485 configuration to ${unitIp}:`, rs485Config);

      // RS485 configuration is typically an array of 2 configurations (RS485-1 and RS485-2)
      for (let portIndex = 0; portIndex < rs485Config.length; portIndex++) {
        const config = rs485Config[portIndex];
        if (config) {
          console.log(`Writing RS485 CH${portIndex + 1} config:`, config);

          // Convert database format to network format
          const networkConfig = convertDatabaseToNetworkRS485Format(config);
          console.log(
            `Converted RS485 CH${portIndex + 1} config:`,
            networkConfig
          );

          if (portIndex === 0) {
            // RS485 CH1
            await window.electronAPI.rcuController.setRS485CH1Config({
              unitIp: unitIp,
              canId: canId,
              config: networkConfig,
            });
          } else if (portIndex === 1) {
            // RS485 CH2
            await window.electronAPI.rcuController.setRS485CH2Config({
              unitIp: unitIp,
              canId: canId,
              config: networkConfig,
            });
          }

          // Small delay between RS485 port configurations
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      console.log(`RS485 configuration written successfully to ${unitIp}`);
    } catch (error) {
      console.error("Failed to write RS485 configuration:", error);
      throw error;
    }
  };

  // Write database unit configuration to network unit
  const writeDatabaseConfigToUnit = async (databaseUnit, networkUnit) => {
    try {
      setCurrentOperation(
        `Writing database configuration to ${networkUnit.type} (${networkUnit.ip_address})...`
      );

      // Use network unit's current IP and CAN ID for initial operations
      let currentIp = networkUnit.ip_address;
      let currentCanId = networkUnit.id_can;

      // 1. Write hardware configuration (mode, can_load, recovery_mode)
      await changeHardwareConfig(currentIp, currentCanId, {
        mode: databaseUnit.mode,
        can_load: databaseUnit.can_load,
        recovery_mode: databaseUnit.recovery_mode,
      });
      setProgress((prev) => prev + 15);

      // Use new JSON structure
      console.log("Database unit I/O configs:", {
        input_configs: databaseUnit.input_configs,
        output_configs: databaseUnit.output_configs,
      });

      if (databaseUnit.input_configs || databaseUnit.output_configs) {
        setCurrentOperation("Writing I/O configuration...");

        const inputConfigs = databaseUnit.input_configs || { inputs: [] };
        const outputConfigs = databaseUnit.output_configs || { outputs: [] };

        // Convert new structure to format compatible with existing UDP logic
        const detailedIOConfig = {
          inputs: (inputConfigs.inputs || []).map((input) => ({
            index: input.index,
            functionValue: input.function_value || 0, // Use functionValue for compatibility
            lightingId: input.lighting_id,
            ramp: input.rlc_config?.ramp || 0,
            preset: input.rlc_config?.preset || 100,
            ledStatus: input.rlc_config?.ledStatus || 0, // Use ledStatus for compatibility
            autoMode: input.rlc_config?.autoMode || 0, // Use autoMode for compatibility
            delayOff: input.rlc_config?.delayOff || 0, // Use delayOff for compatibility
            delayOn: input.rlc_config?.delayOn || 0, // Use delayOn for compatibility
            groups: input.multi_group_config || [], // Use groups for compatibility
          })),
          outputs: (outputConfigs.outputs || []).map((output) => ({
            index: output.index,
            name: output.name,
            type: output.type,
            deviceId: output.device_id,
            deviceType: output.device_type, // Keep consistent naming
            config: output.config || {},
          })),
        };

        console.log("Detailed I/O config prepared:", {
          inputsCount: detailedIOConfig.inputs?.length || 0,
          outputsCount: detailedIOConfig.outputs?.length || 0,
          inputs: detailedIOConfig.inputs,
          outputs: detailedIOConfig.outputs,
        });

        // Process input configurations - data is already prepared above
        // No additional processing needed for new structure

        // Process output configurations - data is already prepared above
        console.log("Starting output configuration processing...", {
          hasOutputs:
            detailedIOConfig.outputs && Array.isArray(detailedIOConfig.outputs),
          outputsCount: detailedIOConfig.outputs?.length || 0,
        });

        if (
          detailedIOConfig.outputs &&
          Array.isArray(detailedIOConfig.outputs)
        ) {
          try {
            // Load detailed output configurations from database
            const detailedOutputConfigs =
              await window.electronAPI.unit.getAllOutputConfigs(
                databaseUnit.id
              );

            // Load lighting and aircon items to convert deviceId to address
            const lightingItems = await window.electronAPI.lighting.getAll(
              databaseUnit.project_id
            );
            const airconItems = await window.electronAPI.aircon.getAll(
              databaseUnit.project_id
            );

            // Initialize AC configs array (10 items) with default values matching packet structure
            const acConfigs = new Array(10).fill(null).map((_, index) => ({
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
            }));

            // First pass: Process all output configurations and set lightingAddress
            for (let i = 0; i < detailedIOConfig.outputs.length; i++) {
              const output = detailedIOConfig.outputs[i];
              const detailedConfig = detailedOutputConfigs.find(
                (config) => config.output_index === output.index
              );
              if (detailedConfig && detailedConfig.config_data) {
                let lightingAddress = 0;

                // Convert deviceId to address based on device type
                // Use device_id and device_type from output level (not from config_data)
                if (detailedConfig.device_id) {
                  const deviceId = parseInt(detailedConfig.device_id);

                  console.log(`Processing output ${output.index}:`, {
                    deviceId,
                    deviceType: detailedConfig.device_type,
                    lightingItemsCount: lightingItems.length,
                    airconItemsCount: airconItems.length,
                  });

                  if (detailedConfig.device_type === "aircon") {
                    // Aircon outputs should not have lighting address
                    lightingAddress = 0;

                    // Map AC output config to AC configs array
                    if (detailedConfig.device_type === "aircon") {
                      const acOutputs = detailedIOConfig.outputs.filter((o) => {
                        const detailedConfigForOutput =
                          detailedOutputConfigs.find(
                            (config) => config.output_index === o.index
                          );
                        return (
                          detailedConfigForOutput?.device_type === "aircon"
                        );
                      });
                      const acConfigIndex = acOutputs.findIndex(
                        (o) => o.index === output.index
                      );

                      if (acConfigIndex >= 0 && acConfigIndex < 10) {
                        // Find aircon item by ID to get address for AC config
                        const airconItem = airconItems.find(
                          (item) => item.id === deviceId
                        );
                        const airconAddress =
                          parseInt(airconItem?.address) || 0;

                        acConfigs[acConfigIndex] = {
                          address: airconAddress,
                          enable: detailedConfig.config_data.enable || false,
                          windowMode:
                            detailedConfig.config_data.windowMode || 0,
                          fanType: detailedConfig.config_data.fanType || 0,
                          tempType: detailedConfig.config_data.tempType || 0,
                          tempUnit: detailedConfig.config_data.tempUnit || 0,
                          valveContact:
                            detailedConfig.config_data.valveContact || 0,
                          valveType: detailedConfig.config_data.valveType || 0,
                          deadband: detailedConfig.config_data.deadband || 0,
                          lowFCU_Group:
                            detailedConfig.config_data.lowFCU_Group || 0,
                          medFCU_Group:
                            detailedConfig.config_data.medFCU_Group || 0,
                          highFCU_Group:
                            detailedConfig.config_data.highFCU_Group || 0,
                          fanAnalogGroup:
                            detailedConfig.config_data.fanAnalogGroup || 0,
                          analogCoolGroup:
                            detailedConfig.config_data.analogCoolGroup || 0,
                          analogHeatGroup:
                            detailedConfig.config_data.analogHeatGroup || 0,
                          valveCoolOpenGroup:
                            detailedConfig.config_data.valveCoolOpenGroup || 0,
                          valveCoolCloseGroup:
                            detailedConfig.config_data.valveCoolCloseGroup || 0,
                          valveHeatOpenGroup:
                            detailedConfig.config_data.valveHeatOpenGroup || 0,
                          valveHeatCloseGroup:
                            detailedConfig.config_data.valveHeatCloseGroup || 0,
                          windowBypass:
                            detailedConfig.config_data.windowBypass || 0,
                          setPointOffset:
                            detailedConfig.config_data.setPointOffset || 0,
                          unoccupyPower:
                            detailedConfig.config_data.unoccupyPower || 0,
                          occupyPower:
                            detailedConfig.config_data.occupyPower || 0,
                          standbyPower:
                            detailedConfig.config_data.standbyPower || 0,
                          unoccupyMode:
                            detailedConfig.config_data.unoccupyMode || 0,
                          occupyMode:
                            detailedConfig.config_data.occupyMode || 0,
                          standbyMode:
                            detailedConfig.config_data.standbyMode || 0,
                          unoccupyFanSpeed:
                            detailedConfig.config_data.unoccupyFanSpeed || 0,
                          occupyFanSpeed:
                            detailedConfig.config_data.occupyFanSpeed || 0,
                          standbyFanSpeed:
                            detailedConfig.config_data.standbyFanSpeed || 0,
                          unoccupyCoolSetPoint:
                            detailedConfig.config_data.unoccupyCoolSetPoint ||
                            0,
                          occupyCoolSetPoint:
                            detailedConfig.config_data.occupyCoolSetPoint || 0,
                          standbyCoolSetPoint:
                            detailedConfig.config_data.standbyCoolSetPoint || 0,
                          unoccupyHeatSetPoint:
                            detailedConfig.config_data.unoccupyHeatSetPoint ||
                            0,
                          occupyHeatSetPoint:
                            detailedConfig.config_data.occupyHeatSetPoint || 0,
                          standbyHeatSetPoint:
                            detailedConfig.config_data.standbyHeatSetPoint || 0,
                        };
                      }
                    }
                  } else {
                    // Find lighting item by ID to get address
                    const lightingItem = lightingItems.find(
                      (item) => item.id === deviceId
                    );
                    if (lightingItem) {
                      lightingAddress = parseInt(lightingItem.address) || 0;
                      console.log(
                        `Found lighting item for output ${output.index}:`,
                        {
                          lightingItemId: lightingItem.id,
                          lightingItemAddress: lightingItem.address,
                          lightingAddress,
                        }
                      );
                    } else {
                      console.log(
                        `No lighting item found for deviceId ${deviceId} in output ${output.index}`
                      );
                    }
                  }
                }

                // Convert delay format from database to expected format
                const configData = detailedConfig.config_data;
                let delayOff = 0;
                let delayOn = 0;

                // Convert delay off from hours/minutes/seconds to total seconds
                if (
                  configData.delayOffHours !== undefined ||
                  configData.delayOffMinutes !== undefined ||
                  configData.delayOffSeconds !== undefined
                ) {
                  delayOff =
                    (parseInt(configData.delayOffHours) || 0) * 3600 +
                    (parseInt(configData.delayOffMinutes) || 0) * 60 +
                    (parseInt(configData.delayOffSeconds) || 0);
                }

                // Convert delay on from hours/minutes/seconds to total seconds
                if (
                  configData.delayOnHours !== undefined ||
                  configData.delayOnMinutes !== undefined ||
                  configData.delayOnSeconds !== undefined
                ) {
                  delayOn =
                    (parseInt(configData.delayOnHours) || 0) * 3600 +
                    (parseInt(configData.delayOnMinutes) || 0) * 60 +
                    (parseInt(configData.delayOnSeconds) || 0);
                }

                // Merge detailed configuration with basic output config
                detailedIOConfig.outputs[i] = {
                  ...output,
                  ...configData,
                  lightingAddress: lightingAddress,
                  delayOff: delayOff, // Convert to seconds for UDP command
                  delayOn: delayOn, // Convert to seconds for UDP command
                };

                // Debug logging for delay values
                if (delayOff > 0 || delayOn > 0) {
                  console.log(`Output ${i} delay values:`, {
                    delayOff: delayOff,
                    delayOn: delayOn,
                    originalConfig: {
                      delayOffHours: configData.delayOffHours,
                      delayOffMinutes: configData.delayOffMinutes,
                      delayOffSeconds: configData.delayOffSeconds,
                      delayOnHours: configData.delayOnHours,
                      delayOnMinutes: configData.delayOnMinutes,
                      delayOnSeconds: configData.delayOnSeconds,
                    },
                  });
                }
              }
            }

            // Add AC configs to detailed I/O config
            detailedIOConfig.acConfigs = acConfigs;

            console.log("About to process output assignments...", {
              totalOutputs: detailedIOConfig.outputs.length,
              outputTypes: detailedIOConfig.outputs.map((o) => ({
                index: o.index,
                deviceType: o.deviceType,
                hasLightingAddress: o.lightingAddress !== undefined,
              })),
            });

            // Now collect output assignments after detailed configurations are processed
            // Only collect assignments for non-aircon outputs
            const outputAssignments = [];
            const nonAirconOutputs = detailedIOConfig.outputs.filter(
              (output) => output.deviceType !== "aircon"
            );

            console.log(
              "Setting output assignments for non-aircon outputs:",
              nonAirconOutputs.map((o) => ({
                index: o.index,
                deviceType: o.deviceType,
                lightingAddress: o.lightingAddress || 0,
              }))
            );

            for (const output of nonAirconOutputs) {
              if (output && output.lightingAddress !== undefined) {
                outputAssignments.push(parseInt(output.lightingAddress) || 0);
              } else {
                // Add 0 for outputs without assignment
                outputAssignments.push(0);
              }
            }

            // Send all output assignments in one packet if we have any non-aircon outputs
            if (outputAssignments.length > 0) {
              console.log(
                "Sending bulk output assignments for non-aircon outputs:",
                outputAssignments
              );
              await window.electronAPI.rcuController.setAllOutputAssignments(
                currentIp,
                currentCanId,
                outputAssignments
              );

              // Small delay after bulk assignment
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          } catch (error) {
            console.warn(
              "Failed to load detailed output configurations:",
              error
            );
          }
        }

        await writeIOConfiguration(currentIp, currentCanId, detailedIOConfig);
        setProgress((prev) => prev + 10);
      }

      // 4. Write RS485 configuration if exists
      console.log("Database unit RS485 config check:", {
        hasRS485Config: !!databaseUnit.rs485_config,
        rs485ConfigType: typeof databaseUnit.rs485_config,
        rs485ConfigLength: Array.isArray(databaseUnit.rs485_config)
          ? databaseUnit.rs485_config.length
          : "not array",
        rs485Config: databaseUnit.rs485_config,
      });

      if (databaseUnit.rs485_config) {
        setCurrentOperation("Writing RS485 configuration...");
        await writeRS485Configuration(
          currentIp,
          currentCanId,
          databaseUnit.rs485_config
        );
        setProgress((prev) => prev + 10);
      } else {
        console.log(
          "No RS485 configuration found in database unit, skipping RS485 config write"
        );
      }

      // 5. Write IP and CAN ID changes last (to avoid communication issues)
      if (databaseUnit.ip_address !== networkUnit.ip_address) {
        setCurrentOperation("Updating IP address...");
        await changeIpAddress(
          networkUnit.ip_address,
          databaseUnit.ip_address,
          currentCanId
        );
        currentIp = databaseUnit.ip_address; // Update current IP for next operation
        setProgress((prev) => prev + 15);
      }

      if (databaseUnit.id_can !== networkUnit.id_can) {
        setCurrentOperation("Updating CAN ID...");
        const newLastPart = parseInt(databaseUnit.id_can.split(".")[3]);
        await changeCanId(currentIp, newLastPart, currentCanId);
        setProgress((prev) => prev + 15);
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to write database configuration:", error);
      return { success: false, error: error.message };
    }
  };

  const getProjectConfigurations = async () => {
    try {
      if (!selectedProject) {
        throw new Error("No project selected");
      }

      const configs = {};

      if (configTypes.scenes) {
        const scenes = await window.electronAPI.scene.getAll(
          selectedProject.id
        );
        // Add calculated index to scenes (same as manual send)
        configs.scenes = scenes.map((scene, index) => ({
          ...scene,
          calculatedIndex: index,
        }));
      }
      if (configTypes.schedules) {
        const schedules = await window.electronAPI.schedule.getAll(
          selectedProject.id
        );
        // Add calculated index to schedules
        configs.schedules = schedules.map((schedule, index) => ({
          ...schedule,
          calculatedIndex: index,
        }));
      }
      if (configTypes.multiScenes) {
        const multiScenes = await window.electronAPI.multiScenes.getAll(
          selectedProject.id
        );
        // Add calculated index to multi-scenes
        configs.multiScenes = multiScenes.map((multiScene, index) => ({
          ...multiScene,
          calculatedIndex: index,
        }));
      }
      if (configTypes.sequences) {
        const sequences = await window.electronAPI.sequences.getAll(
          selectedProject.id
        );
        // Add calculated index to sequences
        configs.sequences = sequences.map((sequence, index) => ({
          ...sequence,
          calculatedIndex: index,
        }));
      }
      if (configTypes.knx) {
        configs.knx = await window.electronAPI.knx.getAll(selectedProject.id);
      }
      if (configTypes.curtain) {
        const curtains = await window.electronAPI.curtain.getAll(
          selectedProject.id
        );
        // Add calculated index to curtains
        configs.curtain = curtains.map((curtain, index) => ({
          ...curtain,
          calculatedIndex: index,
        }));
      }

      return configs;
    } catch (error) {
      console.error("Failed to get project configurations:", error);
      throw error;
    }
  };

  const sendConfigToUnit = async (unit, configType, configData) => {
    try {
      switch (configType) {
        case "scenes":
          for (const scene of configData) {
            // Get scene items with details for each scene
            let sceneItems = [];
            try {
              sceneItems = await window.electronAPI.scene.getItemsWithDetails(
                scene.id
              );
            } catch (error) {
              console.error(
                `Failed to load items for scene ${scene.id}:`,
                error
              );
              // Skip scenes without items
              continue;
            }

            // Prepare scene items data for sending (same as manual send)
            const sceneItemsData = sceneItems.map((item) => ({
              object_value: item.object_value || 0,
              item_address: item.item_address || "0",
              item_value: item.item_value || "0",
            }));

            await window.electronAPI.rcuController.setupScene(
              unit.ip_address,
              unit.id_can,
              {
                sceneIndex: scene.calculatedIndex ?? 0,
                sceneName: scene.name,
                sceneAddress: scene.address,
                sceneItems: sceneItemsData,
              }
            );
          }
          break;

        case "schedules":
          for (const schedule of configData) {
            // Get schedule data with scenes for each schedule (same as manual send)
            let scheduleData = null;
            try {
              scheduleData = await window.electronAPI.schedule.getForSending(
                schedule.id
              );
            } catch (error) {
              console.error(
                `Failed to load data for schedule ${schedule.id}:`,
                error
              );
              // Skip schedules without data
              continue;
            }

            await window.electronAPI.schedule.send({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              scheduleIndex: schedule.calculatedIndex ?? 0,
              enabled: scheduleData.enabled,
              weekDays: scheduleData.parsedDays,
              hour: scheduleData.hour,
              minute: scheduleData.minute,
              sceneAddresses: scheduleData.sceneAddresses,
            });
          }
          break;

        case "multiScenes":
          for (const multiScene of configData) {
            // Get multi-scene scenes for each multi-scene (same as manual send)
            let multiSceneScenes = [];
            try {
              multiSceneScenes = await window.electronAPI.multiScenes.getScenes(
                multiScene.id
              );
            } catch (error) {
              console.error(
                `Failed to load scenes for multi-scene ${multiScene.id}:`,
                error
              );
              // Skip multi-scenes without scenes
              continue;
            }

            // Extract scene addresses (same as manual send)
            const sceneAddresses = multiSceneScenes.map((s) => s.scene_address);

            await window.electronAPI.rcuController.setupMultiScene(
              unit.ip_address,
              unit.id_can,
              {
                multiSceneIndex: multiScene.calculatedIndex ?? 0,
                multiSceneName: multiScene.name,
                multiSceneAddress: multiScene.address,
                multiSceneType: multiScene.type,
                sceneAddresses,
              }
            );
          }
          break;

        case "sequences":
          for (const sequence of configData) {
            // Get sequence multi-scenes for each sequence (same as manual send)
            let sequenceMultiScenes = [];
            try {
              sequenceMultiScenes =
                await window.electronAPI.sequences.getMultiScenes(sequence.id);
            } catch (error) {
              console.error(
                `Failed to load multi-scenes for sequence ${sequence.id}:`,
                error
              );
              // Skip sequences without multi-scenes
              continue;
            }

            // Extract multi-scene addresses (same as manual send)
            const multiSceneAddresses = sequenceMultiScenes.map(
              (s) => s.multi_scene_address
            );

            await window.electronAPI.rcuController.setupSequence(
              unit.ip_address,
              unit.id_can,
              {
                sequenceIndex: sequence.calculatedIndex ?? 0,
                sequenceAddress: sequence.address,
                multiSceneAddresses,
              }
            );
          }
          break;

        case "knx":
          // Get all project items for RCU group lookup
          const lightingItems = await window.electronAPI.lighting.getAll(
            selectedProject.id
          );
          const curtainItems = await window.electronAPI.curtain.getAll(
            selectedProject.id
          );
          const sceneItems = await window.electronAPI.scene.getAll(
            selectedProject.id
          );
          const multiSceneItems = await window.electronAPI.multiScenes.getAll(
            selectedProject.id
          );
          const sequenceItems = await window.electronAPI.sequences.getAll(
            selectedProject.id
          );
          const airconItems = await window.electronAPI.aircon.getAll(
            selectedProject.id
          );

          for (const knx of configData) {
            // Get RCU group based on KNX type
            let rcuGroup = null;

            switch (knx.type) {
              case 1: // Switch
              case 2: // Dimmer
                rcuGroup = lightingItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              case 3: // Curtain
                rcuGroup = curtainItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              case 4: // Scene
                rcuGroup = sceneItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              case 5: // Multi Scene
                rcuGroup = multiSceneItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              case 6: // Sequences
                rcuGroup = sequenceItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              case 7: // AC Power
              case 8: // AC Mode
              case 9: // AC Fan Speed
              case 10: // AC Swing
              case 11: // AC Set Point
                rcuGroup = airconItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
              default:
                rcuGroup = lightingItems.find(
                  (item) => item.id === knx.rcu_group_id
                );
                break;
            }

            if (rcuGroup) {
              await window.electronAPI.rcuController.setKnxConfig(
                unit.ip_address,
                unit.id_can,
                {
                  address: knx.address,
                  type: knx.type,
                  factor: knx.factor || 1,
                  feedback: knx.feedback || 0,
                  rcuGroup: rcuGroup.address,
                  knxSwitchGroup: knx.knx_switch_group || "",
                  knxDimmingGroup: knx.knx_dimming_group || "",
                  knxValueGroup: knx.knx_value_group || "",
                },
                unit.type || "Unknown Unit" // Pass unit type for logging
              );
            }
          }
          break;

        case "curtain":
          // Get lighting items once for all curtain configs (optimization)
          const curtainLightingItems = await window.electronAPI.lighting.getAll(
            selectedProject.id
          );

          for (const curtain of configData) {
            // Get lighting groups for curtain
            const openGroup = curtainLightingItems.find(
              (item) => item.id === curtain.open_group_id
            );
            const closeGroup = curtainLightingItems.find(
              (item) => item.id === curtain.close_group_id
            );
            const stopGroup = curtainLightingItems.find(
              (item) => item.id === curtain.stop_group_id
            );

            if (openGroup && closeGroup) {
              // Use curtain_value directly from database (more reliable than lookup)
              const curtainTypeValue = curtain.curtain_value || 0;

              await window.electronAPI.rcuController.setCurtainConfig(
                unit.ip_address,
                unit.id_can,
                {
                  index: curtain.calculatedIndex ?? 0,
                  address: parseInt(curtain.address),
                  curtainType: curtainTypeValue,
                  pausePeriod: curtain.pause_period || 0,
                  transitionPeriod: curtain.transition_period || 0,
                  openGroup: parseInt(openGroup.address),
                  closeGroup: parseInt(closeGroup.address),
                  stopGroup: stopGroup ? parseInt(stopGroup.address) : 0,
                }
              );
            }
          }
          break;

        default:
          throw new Error(`Unknown config type: ${configType}`);
      }

      return { success: true };
    } catch (error) {
      console.error(
        `Failed to send ${configType} to unit ${unit.ip_address}:`,
        error
      );
      return { success: false, error: error.message };
    }
  };

  const handleSendConfigurations = async () => {
    // Validate write configuration if database unit is selected
    if (selectedDatabaseUnitId) {
      const errors = validateWriteConfiguration();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }

    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    const selectedConfigTypes = Object.entries(configTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);

    if (!selectedDatabaseUnitId && selectedConfigTypes.length === 0) {
      toast.error(
        "Please select at least one configuration type or a database unit"
      );
      return;
    }

    // Get selected units from NetworkUnitSelector
    const selectedUnits =
      networkUnitSelectorRef.current?.getSelectedUnits() || [];

    if (selectedUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    setValidationErrors([]);
    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      const operationResults = [];
      let totalOperations = 0;
      let completedOperations = 0;

      // Calculate total operations
      if (selectedDatabaseUnitId) {
        totalOperations += 1; // Database unit configuration write
      }
      if (selectedConfigTypes.length > 0) {
        // Add delete operations (one delete per unit per config type) + send operations
        totalOperations += selectedUnits.length * selectedConfigTypes.length; // Delete operations
        totalOperations += selectedUnits.length * selectedConfigTypes.length; // Send operations
      }

      // Write database unit configuration if selected
      if (selectedDatabaseUnitId) {
        const databaseUnit = databaseUnits.find(
          (unit) => unit.id === selectedDatabaseUnitId
        );
        const networkUnit = selectedUnits[0]; // Only one unit should be selected when writing database config

        setCurrentOperation("Writing database unit configuration...");
        const writeResult = await writeDatabaseConfigToUnit(
          databaseUnit,
          networkUnit
        );

        operationResults.push({
          unit: `${networkUnit.type} (${networkUnit.ip_address})`,
          configType: "Database Configuration",
          success: writeResult.success,
          message: writeResult.success
            ? "Database configuration written successfully"
            : writeResult.error,
          count: 1,
        });

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
      }

      // Send project configurations if any are selected
      if (selectedConfigTypes.length > 0) {
        setCurrentOperation("Loading project configurations...");
        const configs = await getProjectConfigurations();

        // First, delete all existing configs from selected units
        setCurrentOperation("Deleting existing configurations...");
        const deleteResults = await deleteAllConfigsFromUnits(
          selectedUnits,
          selectedConfigTypes,
          (progress, message) => {
            // Calculate progress: delete operations take up first 50% of total progress
            const deleteProgress = (progress / 100) * 50;
            setProgress(deleteProgress);
            setCurrentOperation(message);
          }
        );

        // Add delete results to operation results
        operationResults.push(...deleteResults);

        // Update completed operations to account for delete operations
        completedOperations += selectedUnits.length * selectedConfigTypes.length;

        for (const unit of selectedUnits) {
          for (const configType of selectedConfigTypes) {
            const configData = configs[configType] || [];

            if (configData.length > 0) {
              setCurrentOperation(
                `Sending ${configType} to ${unit.type || "Unit"} (${unit.ip_address
                })...`
              );

              const result = await sendConfigToUnit(
                unit,
                configType,
                configData
              );

              operationResults.push({
                unit: `${unit.type || "Unit"} (${unit.ip_address})`,
                configType,
                success: result.success,
                message: result.success ? "Sent successfully" : result.error,
                count: configData.length,
              });
            } else {
              operationResults.push({
                unit: `${unit.type || "Unit"} (${unit.ip_address})`,
                configType,
                success: true,
                message: "No items to send",
                count: 0,
              });
            }

            completedOperations++;
            // Calculate progress: send operations take up remaining 50% of progress
            const sendProgress = 50 + ((completedOperations - (selectedUnits.length * selectedConfigTypes.length)) / (selectedUnits.length * selectedConfigTypes.length)) * 50;
            setProgress(sendProgress);
          }
        }
      }

      setResults(operationResults);
      setShowResults(true);
      setCurrentOperation("Completed");

      const successCount = operationResults.filter((r) => r.success).length;
      const totalCount = operationResults.length;

      if (successCount === totalCount) {
        toast.success(
          `All configurations sent successfully to ${selectedUnits.length} unit(s)`
        );
      } else {
        toast.warning(
          `${successCount}/${totalCount} operations completed successfully`
        );
      }
    } catch (error) {
      console.error("Failed to send configurations:", error);
      toast.error(`Failed to send configurations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const configTypeLabels = {
    scenes: { label: "Scenes", icon: Play },
    schedules: { label: "Schedules", icon: Calendar },
    sequences: { label: "Sequences", icon: List },
    curtain: { label: "Curtain", icon: ChevronsUpDown },
    knx: { label: "KNX", icon: Network },
    multiScenes: { label: "Multi-Scenes", icon: GitCompare },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Configurations
          </DialogTitle>
          <DialogDescription>
            {selectedDatabaseUnitId
              ? "Write database unit configuration and send project configurations to network unit."
              : "Send project configurations to selected network units."}
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Configuration Types Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Configuration Types</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllConfigTypes}
                      disabled={loading}
                      className="h-7 px-2 text-xs"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectNoneConfigTypes}
                      disabled={loading}
                      className="h-7 px-2 text-xs"
                    >
                      <Square className="h-4 w-4" />
                      Select None
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-6">
                {Object.entries(configTypeLabels).map(([type, { label }]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={configTypes[type]}
                      onCheckedChange={(checked) =>
                        handleConfigTypeToggle(type, checked)
                      }
                      disabled={loading}
                    />
                    <label
                      htmlFor={type}
                      className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {/* <Icon className="h-4 w-4" /> */}
                      {label}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Database Unit Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />
                  Database Unit Configuration (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DatabaseUnitSelector
                  value={selectedDatabaseUnitId}
                  onValueChange={setSelectedDatabaseUnitId}
                  units={databaseUnits}
                  disabled={loading}
                  placeholder="Select a database unit to write its configuration"
                  ref={databaseUnitSelectorRef}
                />
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Network Units */}
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={loading}
              maxSelection={selectedDatabaseUnitId ? 1 : null}
              ref={networkUnitSelectorRef}
            />

            {/* Progress */}
            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{currentOperation}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendConfigurations}
                disabled={
                  loading ||
                  selectedUnitIds.length === 0 ||
                  (selectedDatabaseUnitId && selectedUnitIds.length !== 1)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedDatabaseUnitId ? "Writing..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {selectedDatabaseUnitId
                      ? "Write Configuration"
                      : "Send Configurations"}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {result.unit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {configTypeLabels[result.configType]?.label} (
                              {result.count} items)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={result.success ? "default" : "destructive"}
                          >
                            {result.success ? "Success" : "Failed"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Memoized export for optimal performance
export const SendAllConfigDialog = memo(
  SendAllConfigDialogComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange
    );
  }
);
