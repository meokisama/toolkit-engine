import { readRS485Configurations } from "../readers/rs485";
import { readIOConfigurations } from "../readers/io-config";
import { autoCreateMissingItems } from "@/components/projects/unit/network-units/utils/device-management-utils";
import { toast } from "sonner";

/**
 * Read all basic configurations from network unit
 * This includes RS485 and I/O configurations but NOT advanced configs (scenes, schedules, etc.)
 *
 * @param {Object} networkUnit - Network unit to read from
 * @param {Object} options - Optional configuration
 * @param {Object} options.selectedProject - Selected project (required for I/O config)
 * @param {Object} options.projectItems - All project items (required for I/O config)
 * @param {Function} options.createItem - Function to create new items (required for I/O config)
 * @param {Object} options.createdItemsCache - Cache for created items (required for I/O config)
 * @param {boolean} options.autoCreateItems - Whether to auto-create missing lighting items (default: true)
 * @param {boolean} options.showToast - Whether to show toast notifications (default: true)
 * @returns {Promise<Object>} Network unit with rs485_config and input/output configs
 */
export async function readNetworkUnitBasicConfigurations(networkUnit, options = {}) {
  const { selectedProject, projectItems, createItem, createdItemsCache, autoCreateItems = true, showToast = true } = options;

  try {
    console.log(`Reading basic configurations from network unit: ${networkUnit.ip_address}`);

    const unitWithConfigs = {
      ...networkUnit,
      rs485_config: null,
      input_configs: null,
      output_configs: null,
    };

    // Read RS485 configurations
    const rs485Config = await readRS485Configurations(networkUnit);
    if (rs485Config) {
      unitWithConfigs.rs485_config = rs485Config;
    }

    // Read I/O configurations (requires project context)
    if (selectedProject && projectItems && createItem && createdItemsCache) {
      try {
        console.log("Reading I/O configurations...");
        const ioConfigs = await readIOConfigurations(networkUnit, selectedProject, projectItems, createItem, createdItemsCache);
        unitWithConfigs.input_configs = ioConfigs.input_configs;
        unitWithConfigs.output_configs = ioConfigs.output_configs;

        // Debug logging for output configs
        console.log("Output configs read from network unit:", {
          unitIp: networkUnit.ip_address,
          outputConfigs: ioConfigs.output_configs,
          outputCount: ioConfigs.output_configs?.outputs?.length || 0,
        });

        // Auto-create missing lighting, aircon, curtain items from outputs and input multi-groups
        if (autoCreateItems) {
          const createdCount = await autoCreateMissingItems(ioConfigs, selectedProject, projectItems);

          if (createdCount > 0 && showToast) {
            toast.success(`Auto-created ${createdCount} lighting group(s)`);
          }
        }

        console.log("I/O configurations read successfully");
      } catch (error) {
        console.error("Failed to read I/O configurations:", error);
        // Continue without I/O configs
      }
    } else {
      console.log("Skipping I/O configuration read (missing project context)");
    }

    return unitWithConfigs;
  } catch (error) {
    console.error(`Failed to read basic configurations from network unit ${networkUnit.ip_address}:`, error);
    // Return basic unit data without configurations
    return {
      ...networkUnit,
      rs485_config: null,
      input_configs: null,
      output_configs: null,
    };
  }
}
