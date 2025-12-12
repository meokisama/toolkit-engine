import { toast } from "sonner";
import { readRS485Configurations } from "./rs485-config-utils";
import { readIOConfigurations } from "./io-config-utils";
import { autoCreateMissingItems } from "./device-management-utils";

// Function to read all configurations from network unit and prepare for database transfer
export async function readNetworkUnitConfigurations(networkUnit, selectedProject, projectItems, createItem, createdItemsCache) {
  try {
    // Clear cache for this transfer session
    createdItemsCache.current.aircon.clear();
    createdItemsCache.current.lighting.clear();

    console.log(`Reading configurations from network unit: ${networkUnit.ip_address}`);

    // Start with basic unit data
    const newUnit = {
      ...networkUnit,
      id: undefined, // Let the system generate new ID
      rs485_config: null,
      input_configs: null,
      output_configs: null,
      // Add fields to store advanced configurations
      scenes: [],
      schedules: [],
      curtains: [],
      knxConfigs: [],
      multiScenes: [],
      sequences: [],
    };

    // Read RS485 configurations
    const rs485Config = await readRS485Configurations(networkUnit);
    if (rs485Config) {
      newUnit.rs485_config = rs485Config;
    }

    // Read I/O configurations
    try {
      console.log("Reading I/O configurations...");
      const ioConfigs = await readIOConfigurations(networkUnit, selectedProject, projectItems, createItem, createdItemsCache);
      newUnit.input_configs = ioConfigs.input_configs;
      newUnit.output_configs = ioConfigs.output_configs;

      // Debug logging for output configs
      console.log("Output configs read from network unit:", {
        unitIp: networkUnit.ip_address,
        outputConfigs: ioConfigs.output_configs,
        outputCount: ioConfigs.output_configs?.outputs?.length || 0,
      });

      // Auto-create missing lighting, aircon, curtain items from outputs and input multi-groups
      const createdCount = await autoCreateMissingItems(ioConfigs, selectedProject, projectItems);

      if (createdCount > 0) {
        toast.success(`Auto-created ${createdCount} lighting group(s)`);
      }

      console.log("I/O configurations read successfully");
    } catch (error) {
      console.error("Failed to read I/O configurations:", error);
      // Continue without I/O configs
    }

    // Store network unit data for advanced configuration reading
    // We'll read advanced configs after the unit is created in database
    newUnit.readAdvancedConfigs = true;

    return newUnit;
  } catch (error) {
    console.error(`Failed to read configurations from network unit ${networkUnit.ip_address}:`, error);
    // Return basic unit data without configurations
    return {
      ...networkUnit,
      id: undefined,
      rs485_config: null,
      input_configs: null,
      output_configs: null,
      scenes: [],
      schedules: [],
      curtains: [],
      knxConfigs: [],
      multiScenes: [],
      sequences: [],
    };
  }
}
