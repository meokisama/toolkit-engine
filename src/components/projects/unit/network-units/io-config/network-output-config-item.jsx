import React, { useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/custom/combobox";
import { Settings, Plus, Edit } from "lucide-react";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";
import { hasOutputConfigChanged } from "@/utils/io-config-utils";

const NetworkOutputConfigItem = memo(
  ({
    config,
    originalConfig,
    deviceOptions,
    onOutputDeviceChange,
    onOpenOutputConfig,
    onToggleState,
    onAddMissingAddress,
    onCreateEditDevice,
    isLoadingConfig,
    allOutputConfigs,
  }) => {
    const isAircon = config.type === "ac";

    // Check if this output has changed from original configuration
    const hasChanged = useMemo(() => {
      return hasOutputConfigChanged(config, originalConfig, 'network');
    }, [originalConfig, config]);

    // Check if output has address but no matching database entry
    const hasUnmappedAddress = useMemo(() => {
      if (isAircon) {
        // For aircon outputs, check airconAddress
        if (!config.airconAddress || config.airconAddress === 0) {
          return false;
        }

        // Check if aircon address exists in deviceOptions
        const addressExists = deviceOptions.some((option) => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.airconAddress;
        });

        return !addressExists;
      } else {
        // For lighting outputs, check lightingAddress
        if (!config.lightingAddress || config.lightingAddress === 0) {
          return false;
        }

        // Check if lighting address exists in deviceOptions
        const addressExists = deviceOptions.some((option) => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.lightingAddress;
        });

        return !addressExists;
      }
    }, [isAircon, config.lightingAddress, config.airconAddress, deviceOptions]);

    // Auto-map device ID based on address (lighting or aircon)
    const autoMappedDeviceId = useMemo(() => {
      if (isAircon) {
        // For aircon outputs, map based on airconAddress
        if (!config.airconAddress || config.airconAddress === 0) {
          return config.deviceId;
        }

        // Find matching aircon option by address
        const matchingOption = deviceOptions.find((option) => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.airconAddress;
        });

        return matchingOption ? parseInt(matchingOption.value) : config.deviceId;
      } else {
        // For lighting outputs, map based on lightingAddress
        if (!config.lightingAddress || config.lightingAddress === 0) {
          return config.deviceId;
        }

        // Find matching lighting option by address
        const matchingOption = deviceOptions.find((option) => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.lightingAddress;
        });

        return matchingOption ? parseInt(matchingOption.value) : config.deviceId;
      }
    }, [isAircon, config.lightingAddress, config.airconAddress, config.deviceId, deviceOptions]);

    // Generate display name based on type and index within that type
    const getDisplayName = useCallback((type, globalIndex, allConfigs) => {
      const typeLabels = {
        relay: "Relay",
        dimmer: "Dimmer",
        ao: "AO",
        ac: "Aircon",
      };

      // Calculate index within the same type (restart at 1 for each type)
      const sameTypeConfigs = allConfigs.filter((config) => config.type === type);
      const typeIndex = sameTypeConfigs.findIndex((config) => config.index === globalIndex);

      const label = typeLabels[type] || type;
      return `${label} ${typeIndex + 1}`;
    }, []);

    const handleDeviceChange = useCallback(
      (value) => {
        onOutputDeviceChange(config.index, value ? parseInt(value) : null);
      },
      [config.index, onOutputDeviceChange]
    );

    const handleConfigClick = useCallback(() => {
      onOpenOutputConfig(config.index, config.type);
    }, [config.index, config.type, onOpenOutputConfig]);

    const handleToggleClick = useCallback(() => {
      onToggleState(config.index, config.state);
    }, [config.index, config.state, onToggleState]);

    const handleAddMissingAddress = useCallback(() => {
      if (onAddMissingAddress) {
        const address = isAircon ? config.airconAddress : config.lightingAddress;
        if (address) {
          onAddMissingAddress(address, config.index, isAircon ? "aircon" : "lighting");
        }
      }
    }, [onAddMissingAddress, config.lightingAddress, config.airconAddress, config.index, isAircon]);

    const handleCreateEditClick = useCallback(() => {
      if (onCreateEditDevice) {
        onCreateEditDevice(config.index, config.type, autoMappedDeviceId);
      }
    }, [config.index, config.type, autoMappedDeviceId, onCreateEditDevice]);

    return (
      <div
        className={`p-4 border rounded-lg flex gap-4 justify-between items-center w-full shadow ${
          hasChanged ? "border-orange-500 border-2" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={config.state ? lightOn : lightOff}
            alt="Output State"
            className="w-[30px] h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleToggleClick}
          />
          <div className="flex flex-col">
            <Label className="text-sm font-medium">{getDisplayName(config.type, config.index, allOutputConfigs)}</Label>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Plus button for adding missing address to database */}
          {hasUnmappedAddress && onAddMissingAddress && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddMissingAddress}
              title={`Add ${isAircon ? "aircon" : "lighting"} address ${isAircon ? config.airconAddress : config.lightingAddress} to database`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          {/* Show combobox only if address is mapped */}
          {!hasUnmappedAddress ? (
            <Combobox
              className="w-42"
              options={deviceOptions}
              value={autoMappedDeviceId?.toString() || ""}
              onValueChange={handleDeviceChange}
              placeholder={`Select ${isAircon ? "aircon" : "lighting"}...`}
              emptyText={`No ${isAircon ? "aircon" : "lighting"} found`}
            />
          ) : (
            /* Show address info when not in database */
            <div className="w-42 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm">
              Address {isAircon ? config.airconAddress : config.lightingAddress}
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateEditClick}
            disabled={!onCreateEditDevice}
            title={`${autoMappedDeviceId ? "Edit" : "Create"} ${isAircon ? "aircon" : "lighting"}`}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleConfigClick} disabled={isLoadingConfig} title="Output settings">
            {isLoadingConfig ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }
);

NetworkOutputConfigItem.displayName = "NetworkOutputConfigItem";

export { NetworkOutputConfigItem };
