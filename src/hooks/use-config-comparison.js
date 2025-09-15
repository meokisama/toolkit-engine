import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  findMatchingUnits,
  compareUnitConfigurations
} from '@/services/config-comparison';
import { getUnitIOSpec } from '@/utils/io-config-utils';

/**
 * Hook for managing configuration comparison between database and network units
 */
export function useConfigComparison() {
  const [comparisonResults, setComparisonResults] = useState(new Map());
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [hasComparisonResults, setHasComparisonResults] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState(null);

  // Cache for network unit configurations to avoid repeated reads
  const networkConfigCache = useRef(new Map());

  /**
   * Convert network RS485 format to database format (same as in network-unit-table.jsx)
   */
  const convertNetworkToDialogFormat = useCallback((networkConfig) => {
    if (!networkConfig) return null;

    return {
      baudrate: networkConfig.baudrate || 9600,
      parity: networkConfig.parity || 0,
      stop_bit: networkConfig.stopBit || 0,
      board_id: networkConfig.boardId || 0,
      config_type: networkConfig.rs485Type || 0,
      num_slave_devs: networkConfig.numSlaves || 0,
      reserved: networkConfig.reserved || [0, 0, 0, 0, 0],
      slave_cfg: (networkConfig.slaves || []).map((slave) => ({
        slave_id: slave.slaveId || 0,
        slave_group: slave.slaveGroup || 0,
        num_indoors: slave.numIndoors || 0,
        indoor_group: slave.indoorGroups || Array(16).fill(0),
      })),
    };
  }, []);

  /**
   * Read all configurations from a network unit (following the same pattern as transfer function)
   * @param {Object} networkUnit - Network unit to read from
   * @returns {Object} Network unit with all configurations
   */
  const readNetworkUnitConfigurations = useCallback(async (networkUnit) => {
    const cacheKey = `${networkUnit.ip_address}_${networkUnit.id_can}`;

    // Check cache first
    if (networkConfigCache.current.has(cacheKey)) {
      return networkConfigCache.current.get(cacheKey);
    }

    try {
      console.log(`Reading configurations from network unit: ${networkUnit.ip_address}`);

      const unitWithConfigs = { ...networkUnit };

      // Read RS485 configurations sequentially (same as transfer function)
      try {
        console.log("Reading RS485 CH1 configuration...");
        const ch1Config = await window.electronAPI.rcuController.getRS485CH1Config({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        // Add delay between RS485 channel reads
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log("Reading RS485 CH2 configuration...");
        const ch2Config = await window.electronAPI.rcuController.getRS485CH2Config({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        // Convert to database format (same as transfer function)
        unitWithConfigs.rs485_config = [
          convertNetworkToDialogFormat(ch1Config),
          convertNetworkToDialogFormat(ch2Config),
        ];

        // Add delay after RS485 config read
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Failed to read RS485 config from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.rs485_config = null;
      }

      // Read input configurations (same as transfer function)
      try {
        const inputResponse = await window.electronAPI.rcuController.getAllInputConfigs({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        const inputConfigs = { inputs: [] };

        // Get unit IO spec to determine number of inputs
        const ioSpec = getUnitIOSpec(networkUnit.type);
        if (!ioSpec) {
          unitWithConfigs.input_configs = inputConfigs;
          return;
        }

        // Process inputs based on unit spec (same as transfer function)
        if (inputResponse?.configs) {
          for (let i = 0; i < ioSpec.inputs; i++) {
            const unitConfig = inputResponse.configs.find(
              (config) => config.inputNumber === i
            );

            if (unitConfig) {
              inputConfigs.inputs.push({
                index: i,
                function_value: unitConfig.inputType || 0,
                lighting_id: null, // Will be resolved when needed
                multi_group_config: unitConfig.groups || [],
                rlc_config: {
                  ramp: unitConfig.ramp || 0,
                  preset: unitConfig.preset || 255,
                  ledStatus: unitConfig.ledStatus?.raw || 0,
                  autoMode: unitConfig.autoMode || 0,
                  delayOff: unitConfig.delayOff || 0,
                  delayOn: unitConfig.delayOn || 0,
                },
              });
            } else {
              // Create default config for missing inputs (same as transfer function)
              inputConfigs.inputs.push({
                index: i,
                function_value: 0,
                lighting_id: null,
                multi_group_config: [],
                rlc_config: {
                  ramp: 0,
                  preset: 255,
                  ledStatus: 0,
                  autoMode: 0,
                  delayOff: 0,
                  delayOn: 0,
                },
              });
            }
          }
        }

        unitWithConfigs.input_configs = inputConfigs;

        // Add delay after input config read
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Failed to read input configs from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.input_configs = null;
      }

      // Read output configurations (same as transfer function)
      try {
        // Read output assignments first
        const assignResponse = await window.electronAPI.rcuController.getOutputAssign({
          unitIp: networkUnit.ip_address,
          canId: networkUnit.id_can,
        });

        // Add delay between output reads
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Read output configurations second
        const configResponse = await window.electronAPI.rcuController.getOutputConfig(
          networkUnit.ip_address,
          networkUnit.id_can
        );

        // Add delay between output reads
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Read AC configurations third
        const acConfigResponse = await window.electronAPI.rcuController.getLocalACConfig(
          networkUnit.ip_address,
          networkUnit.id_can
        );

        const outputConfigs = { outputs: [] };

        // Get unit IO spec to determine output types (same as transfer function)
        const ioSpec = getUnitIOSpec(networkUnit.type);
        if (!ioSpec) {
          unitWithConfigs.output_configs = outputConfigs;
          return;
        }

        // Helper function to get output type for index (same as transfer function)
        const getOutputTypeForIndex = (index, outputSpec) => {
          let currentIndex = 0;

          // Check relay outputs first
          if (index < currentIndex + outputSpec.relay) {
            return "relay";
          }
          currentIndex += outputSpec.relay;

          // Check dimmer outputs
          if (index < currentIndex + outputSpec.dimmer) {
            return "dimmer";
          }
          currentIndex += outputSpec.dimmer;

          // Check analog outputs
          if (index < currentIndex + outputSpec.ao) {
            return "ao";
          }
          currentIndex += outputSpec.ao;

          // Check AC outputs
          if (index < currentIndex + outputSpec.ac) {
            return "ac";
          }

          return "unknown";
        };

        // Process all outputs (same logic as transfer function)
        for (let i = 0; i < ioSpec.totalOutputs; i++) {
          const assignment = assignResponse?.outputAssignments?.find(a => a.outputIndex === i);
          const config = configResponse?.outputConfigs?.find(c => c.outputIndex === i);

          // Determine output type
          const outputType = assignment?.outputType || getOutputTypeForIndex(i, ioSpec.outputs);

          let configData;
          let assignmentAddress = null;

          if (outputType === "ac") {
            // For aircon outputs, get AC config
            const acOutputs = [];
            for (let j = 0; j < ioSpec.totalOutputs; j++) {
              if (getOutputTypeForIndex(j, ioSpec.outputs) === "ac") {
                acOutputs.push(j);
              }
            }

            const acConfigIndex = acOutputs.indexOf(i);
            let acConfig = null;
            if (acConfigIndex >= 0 && acConfigIndex < (acConfigResponse?.length || 0)) {
              acConfig = acConfigResponse[acConfigIndex];
              assignmentAddress = acConfig?.address || 0;
            }

            // Aircon config structure (same as transfer function)
            // Note: address is added here only for comparison purposes
            configData = {
              address: assignmentAddress || 0, // For comparison only
              enable: acConfig?.enable || false,
              windowMode: acConfig?.windowMode || 0,
              fanType: acConfig?.fanType || 0,
              tempType: acConfig?.tempType || 0,
              tempUnit: acConfig?.tempUnit || 0,
              valveContact: acConfig?.valveContact || 0,
              valveType: acConfig?.valveType || 0,
              deadband: acConfig?.deadband || 20,
              lowFCU_Group: acConfig?.lowFCU_Group || 0,
              medFCU_Group: acConfig?.medFCU_Group || 0,
              highFCU_Group: acConfig?.highFCU_Group || 0,
              fanAnalogGroup: acConfig?.fanAnalogGroup || 0,
              analogCoolGroup: acConfig?.analogCoolGroup || 0,
              analogHeatGroup: acConfig?.analogHeatGroup || 0,
              valveCoolOpenGroup: acConfig?.valveCoolOpenGroup || 0,
              valveCoolCloseGroup: acConfig?.valveCoolCloseGroup || 0,
              valveHeatOpenGroup: acConfig?.valveHeatOpenGroup || 0,
              valveHeatCloseGroup: acConfig?.valveHeatCloseGroup || 0,
              windowBypass: acConfig?.windowBypass || 0,
              setPointOffset: acConfig?.setPointOffset || 0,
              unoccupyPower: acConfig?.unoccupyPower || 0,
              occupyPower: acConfig?.occupyPower || 0,
              standbyPower: acConfig?.standbyPower || 0,
              unoccupyMode: acConfig?.unoccupyMode || 0,
              occupyMode: acConfig?.occupyMode || 0,
              standbyMode: acConfig?.standbyMode || 0,
              unoccupyFanSpeed: acConfig?.unoccupyFanSpeed || 0,
              occupyFanSpeed: acConfig?.occupyFanSpeed || 0,
              standbyFanSpeed: acConfig?.standbyFanSpeed || 0,
              unoccupyCoolSetPoint: acConfig?.unoccupyCoolSetPoint || 0,
              occupyCoolSetPoint: acConfig?.occupyCoolSetPoint || 0,
              standbyCoolSetPoint: acConfig?.standbyCoolSetPoint || 0,
              unoccupyHeatSetPoint: acConfig?.unoccupyHeatSetPoint || 0,
              occupyHeatSetPoint: acConfig?.occupyHeatSetPoint || 0,
              standbyHeatSetPoint: acConfig?.standbyHeatSetPoint || 0,
            };
          } else {
            // Lighting/relay/dimmer config structure (same as transfer function)
            assignmentAddress = assignment?.lightingAddress || assignment?.address || 0;

            configData = {
              address: assignmentAddress || 0, // Add address to config for comparison
              autoTrigger: config?.autoTriggerFlag === 1 || false,
              delayOffHours: 0,
              delayOffMinutes: 0,
              delayOffSeconds: assignment?.delay || assignment?.delayOff || 0,
              delayOnHours: 0,
              delayOnMinutes: 0,
              delayOnSeconds: assignment?.delayOn || 0,
              scheduleOnHour: config?.scheduleOnHour || 0,
              scheduleOnMinute: config?.scheduleOnMinute || 0,
              scheduleOffHour: config?.scheduleOffHour || 0,
              scheduleOffMinute: config?.scheduleOffMinute || 0,
            };

            // Add dimming settings for dimmer, relay, and AO outputs
            if (outputType === "dimmer" || outputType === "relay" || outputType === "ao") {
              configData.minDim = config?.minDimmingLevel ? Math.round((config.minDimmingLevel / 255) * 100) : 1;
              configData.maxDim = config?.maxDimmingLevel ? Math.round((config.maxDimmingLevel / 255) * 100) : 100;
            }
          }

          const outputConfig = {
            index: i,
            type: outputType,
            device_id: assignment?.deviceId || null,
            device_type: outputType === "ac" ? "aircon" : "lighting",
            name: `${outputType} ${i + 1}`,
            config: configData
          };

          outputConfigs.outputs.push(outputConfig);
        }

        unitWithConfigs.output_configs = outputConfigs;
      } catch (error) {
        console.warn(`Failed to read output configs from ${networkUnit.ip_address}:`, error);
        unitWithConfigs.output_configs = null;
      }

      // Read advanced configurations (scenes, schedules, curtains, knx, multi scenes, sequences)
      try {
        console.log("Reading advanced configurations...");

        // Read scenes
        try {
          const scenesResult = await window.electronAPI.rcuController.getAllScenesInformation({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
          });
          unitWithConfigs.scenes = scenesResult?.scenes || [];
          console.log(`Found ${unitWithConfigs.scenes.length} scenes on network unit`);
        } catch (error) {
          console.warn(`Failed to read scenes from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.scenes = [];
        }

        // Add delay between reads
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Read schedules
        try {
          const schedulesResult = await window.electronAPI.rcuController.getAllSchedulesInformation({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
          });
          unitWithConfigs.schedules = schedulesResult?.schedules || [];
          console.log(`Found ${unitWithConfigs.schedules.length} schedules on network unit`);
        } catch (error) {
          console.warn(`Failed to read schedules from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.schedules = [];
        }

        // Add delay between reads
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Read curtains
        try {
          const curtainsResult = await window.electronAPI.rcuController.getCurtainConfig({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
            curtainIndex: null, // Get all curtains
          });
          unitWithConfigs.curtains = curtainsResult?.curtains || [];
          console.log(`Found ${unitWithConfigs.curtains.length} curtains on network unit`);
        } catch (error) {
          console.warn(`Failed to read curtains from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.curtains = [];
        }

        // Add delay between reads
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Read KNX configurations
        try {
          const knxResult = await window.electronAPI.rcuController.getKnxConfig({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
            knxAddress: null, // Get all KNX configs
          });
          unitWithConfigs.knxConfigs = knxResult?.knxConfigs || [];
          console.log(`Found ${unitWithConfigs.knxConfigs.length} KNX configs on network unit`);
        } catch (error) {
          console.warn(`Failed to read KNX configs from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.knxConfigs = [];
        }

        // Add delay between reads
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Read multi scenes
        try {
          const multiScenesResult = await window.electronAPI.rcuController.getAllMultiScenesInformation({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
          });
          unitWithConfigs.multiScenes = multiScenesResult?.multiScenes || [];
          console.log(`Found ${unitWithConfigs.multiScenes.length} multi scenes on network unit`);
        } catch (error) {
          console.warn(`Failed to read multi scenes from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.multiScenes = [];
        }

        // Add delay between reads
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Read sequences
        try {
          const sequencesResult = await window.electronAPI.rcuController.getAllSequencesInformation({
            unitIp: networkUnit.ip_address,
            canId: networkUnit.id_can,
          });
          unitWithConfigs.sequences = sequencesResult?.sequences || [];
          console.log(`Found ${unitWithConfigs.sequences.length} sequences on network unit`);
        } catch (error) {
          console.warn(`Failed to read sequences from ${networkUnit.ip_address}:`, error);
          unitWithConfigs.sequences = [];
        }

      } catch (error) {
        console.warn(`Failed to read advanced configurations from ${networkUnit.ip_address}:`, error);
        // Set default empty arrays for all advanced configs
        unitWithConfigs.scenes = [];
        unitWithConfigs.schedules = [];
        unitWithConfigs.curtains = [];
        unitWithConfigs.knxConfigs = [];
        unitWithConfigs.multiScenes = [];
        unitWithConfigs.sequences = [];
      }

      // Cache the result
      networkConfigCache.current.set(cacheKey, unitWithConfigs);

      return unitWithConfigs;
    } catch (error) {
      console.error(`Failed to read configurations from network unit ${networkUnit.ip_address}:`, error);
      throw error;
    }
  }, [convertNetworkToDialogFormat]);

  /**
   * Get database configurations for a project (scenes, schedules, curtains, knx, multi scenes, sequences)
   * @param {number} projectId - Project ID
   * @returns {Object} Database configurations
   */
  const getDatabaseConfigurations = useCallback(async (projectId) => {
    try {
      console.log(`Loading database configurations for project ${projectId}`);

      // Load all database configurations in parallel
      const [scenes, schedules, curtains, knx, multiScenes, sequences] = await Promise.all([
        window.electronAPI.scene.getAll(projectId),
        window.electronAPI.schedule.getAll(projectId),
        window.electronAPI.curtain.getAll(projectId),
        window.electronAPI.knx.getAll(projectId),
        window.electronAPI.multiScenes.getAll(projectId),
        window.electronAPI.sequences.getAll(projectId),
      ]);

      // For scenes, we need to get scene items as well
      const scenesWithItems = await Promise.all(
        scenes.map(async (scene) => {
          try {
            const items = await window.electronAPI.scenes.getItems(scene.id);
            return { ...scene, items };
          } catch (error) {
            console.warn(`Failed to load items for scene ${scene.id}:`, error);
            return { ...scene, items: [] };
          }
        })
      );

      // For schedules, we need to get schedule scenes as well
      const schedulesWithScenes = await Promise.all(
        schedules.map(async (schedule) => {
          try {
            const scenes = await window.electronAPI.schedules.getScenes(schedule.id);
            return { ...schedule, scenes };
          } catch (error) {
            console.warn(`Failed to load scenes for schedule ${schedule.id}:`, error);
            return { ...schedule, scenes: [] };
          }
        })
      );

      // For multi scenes, we need to get multi scene scenes as well
      const multiScenesWithScenes = await Promise.all(
        multiScenes.map(async (multiScene) => {
          try {
            const scenes = await window.electronAPI.multiScenes.getScenes(multiScene.id);
            return { ...multiScene, scenes };
          } catch (error) {
            console.warn(`Failed to load scenes for multi scene ${multiScene.id}:`, error);
            return { ...multiScene, scenes: [] };
          }
        })
      );

      // For sequences, we need to get sequence multi scenes as well
      const sequencesWithMultiScenes = await Promise.all(
        sequences.map(async (sequence) => {
          try {
            const multiScenes = await window.electronAPI.sequences.getMultiScenes(sequence.id);
            return { ...sequence, multiScenes };
          } catch (error) {
            console.warn(`Failed to load multi scenes for sequence ${sequence.id}:`, error);
            return { ...sequence, multiScenes: [] };
          }
        })
      );

      console.log(`Loaded database configurations:`, {
        scenes: scenesWithItems.length,
        schedules: schedulesWithScenes.length,
        curtains: curtains.length,
        knx: knx.length,
        multiScenes: multiScenesWithScenes.length,
        sequences: sequencesWithMultiScenes.length,
      });

      return {
        scenes: scenesWithItems,
        schedules: schedulesWithScenes,
        curtains,
        knx,
        multiScenes: multiScenesWithScenes,
        sequences: sequencesWithMultiScenes,
      };
    } catch (error) {
      console.error(`Failed to load database configurations for project ${projectId}:`, error);
      return {
        scenes: [],
        schedules: [],
        curtains: [],
        knx: [],
        multiScenes: [],
        sequences: [],
      };
    }
  }, []);

  /**
   * Compare configurations between database units and network units
   * @param {Array} databaseUnits - Array of database units
   * @param {Array} networkUnits - Array of network units
   * @param {Object} projectItems - Project items for device_id to address lookup
   */
  const compareConfigurations = useCallback(async (databaseUnits, networkUnits, projectItems = null) => {
    if (!databaseUnits?.length || !networkUnits?.length) {
      toast.warning('No units available for comparison');
      return;
    }

    setIsComparing(true);
    setComparisonProgress(0);

    const loadingToast = toast.loading('Comparing configurations between database and network units...');

    try {
      // Find matching units
      const matchingUnits = findMatchingUnits(databaseUnits, networkUnits);

      if (matchingUnits.length === 0) {
        toast.warning('No matching units found between database and network', { id: loadingToast });
        return;
      }

      console.log(`Found ${matchingUnits.length} matching units for comparison`);

      const results = new Map();

      // Process each matching pair
      for (let i = 0; i < matchingUnits.length; i++) {
        const { databaseUnit, networkUnit } = matchingUnits[i];

        setComparisonProgress(((i + 1) / matchingUnits.length) * 100);

        toast.loading(
          `Comparing unit ${i + 1}/${matchingUnits.length}: ${networkUnit.type} (${networkUnit.ip_address})...`,
          { id: loadingToast }
        );

        try {
          // Read network unit configurations
          const networkUnitWithConfigs = await readNetworkUnitConfigurations(networkUnit);

          // Get database configurations for this unit's project
          const databaseConfigs = await getDatabaseConfigurations(databaseUnit.project_id);

          // Compare configurations
          const comparisonResult = await compareUnitConfigurations(databaseUnit, networkUnitWithConfigs, projectItems, databaseConfigs);

          // Store results for both database and network units
          const resultData = {
            ...comparisonResult,
            databaseUnit,
            networkUnit: networkUnitWithConfigs,
            comparedAt: new Date().toISOString()
          };

          results.set(`db_${databaseUnit.id}`, resultData);
          results.set(`net_${networkUnit.ip_address}_${networkUnit.id_can}`, resultData);

        } catch (error) {
          console.error(`Failed to compare unit ${networkUnit.ip_address}:`, error);

          // Store error result
          const errorResult = {
            isEqual: false,
            differences: [`Failed to read configurations: ${error.message}`],
            error: true,
            databaseUnit,
            networkUnit,
            comparedAt: new Date().toISOString()
          };

          results.set(`db_${databaseUnit.id}`, errorResult);
          results.set(`net_${networkUnit.ip_address}_${networkUnit.id_can}`, errorResult);
        }
      }

      setComparisonResults(results);

      // Create detailed summary
      const totalMatches = matchingUnits.length;
      const resultArray = Array.from(results.values());
      const uniqueResults = resultArray.filter((_, index) => index % 2 === 0); // Remove duplicates

      const identicalUnits = uniqueResults.filter(result => result.isEqual && !result.error);
      const differentUnits = uniqueResults.filter(result => !result.isEqual && !result.error);
      const errorUnits = uniqueResults.filter(result => result.error);

      const summary = {
        totalMatches,
        identicalCount: identicalUnits.length,
        differentCount: differentUnits.length,
        errorCount: errorUnits.length,
        identicalUnits,
        differentUnits,
        errorUnits,
        allDifferences: differentUnits.reduce((acc, unit) => {
          acc.push({
            unitInfo: `${unit.databaseUnit.type} (${unit.databaseUnit.ip_address})`,
            differences: unit.differences || []
          });
          return acc;
        }, [])
      };

      setComparisonSummary(summary);
      setHasComparisonResults(true);

      toast.success(
        `Comparison complete: ${identicalUnits.length} identical, ${differentUnits.length} different, ${errorUnits.length} errors`,
        { id: loadingToast }
      );

    } catch (error) {
      console.error('Failed to compare configurations:', error);
      toast.error(`Failed to compare configurations: ${error.message}`, { id: loadingToast });
    } finally {
      setIsComparing(false);
      setComparisonProgress(0);
    }
  }, [readNetworkUnitConfigurations]);

  /**
   * Get comparison result for a specific unit
   * @param {string} unitKey - Unit key (db_id or net_ip_can)
   * @returns {Object|null} Comparison result
   */
  const getComparisonResult = useCallback((unitKey) => {
    return comparisonResults.get(unitKey) || null;
  }, [comparisonResults]);

  /**
   * Clear all comparison results and cache
   */
  const clearComparisons = useCallback(() => {
    setComparisonResults(new Map());
    setHasComparisonResults(false);
    setComparisonSummary(null);
    networkConfigCache.current.clear();
  }, []);

  /**
   * Get the background color class for a unit based on comparison result
   * @param {string} unitKey - Unit key
   * @returns {string} CSS class name
   */
  const getUnitRowClass = useCallback((unitKey) => {
    const result = comparisonResults.get(unitKey);

    if (!result) {
      return ''; // Default background
    }

    if (result.error) {
      return 'bg-yellow-50 hover:bg-yellow-100'; // Yellow for errors
    }

    if (result.isEqual) {
      return 'bg-green-50 hover:bg-green-100'; // Green for identical
    } else {
      return 'bg-red-50 hover:bg-red-100'; // Red for different
    }
  }, [comparisonResults]);

  return {
    comparisonResults,
    isComparing,
    comparisonProgress,
    hasComparisonResults,
    comparisonSummary,
    compareConfigurations,
    getComparisonResult,
    clearComparisons,
    getUnitRowClass
  };
}
