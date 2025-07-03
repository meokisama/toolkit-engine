import React, { useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/custom/combobox";
import { Settings, Plus } from "lucide-react";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";

const NetworkOutputConfigItem = memo(
  ({
    config,
    deviceOptions,
    onOutputDeviceChange,
    onOpenOutputConfig,
    onToggleState,
    onAddMissingAddress,
    isLoadingConfig,
  }) => {
    const isAircon = config.type === "ac";

    // Check if output has address but no matching database entry
    const hasUnmappedAddress = useMemo(() => {
      if (isAircon) {
        // Check for unmapped aircon address
        if (!config.airconAddress || config.airconAddress === 0) {
          return false;
        }

        // Check if aircon address exists in deviceOptions
        const addressExists = deviceOptions.some(option => {
          // Extract address from label format "Name (Address)"
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.airconAddress;
        });

        return !addressExists;
      } else {
        // Check for unmapped lighting address
        if (!config.lightingAddress || config.lightingAddress === 0) {
          return false;
        }

        // Check if lighting address exists in deviceOptions
        const addressExists = deviceOptions.some(option => {
          // Extract address from label format "Name (Address)"
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.lightingAddress;
        });

        return !addressExists;
      }
    }, [isAircon, config.lightingAddress, config.airconAddress, deviceOptions]);

    // Auto-map device ID based on address
    const autoMappedDeviceId = useMemo(() => {
      if (isAircon) {
        // Auto-map aircon device ID based on aircon address
        if (!config.airconAddress || config.airconAddress === 0) {
          return config.deviceId;
        }

        // Find matching aircon option by address
        const matchingOption = deviceOptions.find(option => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.airconAddress;
        });

        return matchingOption ? parseInt(matchingOption.value) : config.deviceId;
      } else {
        // Auto-map lighting device ID based on lighting address
        if (!config.lightingAddress || config.lightingAddress === 0) {
          return config.deviceId;
        }

        // Find matching lighting option by address
        const matchingOption = deviceOptions.find(option => {
          const match = option.label.match(/\((\d+)\)$/);
          return match && parseInt(match[1]) === config.lightingAddress;
        });

        return matchingOption ? parseInt(matchingOption.value) : config.deviceId;
      }
    }, [isAircon, config.lightingAddress, config.airconAddress, config.deviceId, deviceOptions]);

    // Generate display name based on type and index
    const getDisplayName = useCallback((type, index) => {
      const typeLabels = {
        relay: "Relay",
        dimmer: "Dimmer",
        ao: "AO",
        ac: "Aircon",
      };

      const label = typeLabels[type] || type;
      return `${label} ${index + 1}`;
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
        if (isAircon && config.airconAddress) {
          onAddMissingAddress(config.airconAddress, config.index, "aircon");
        } else if (!isAircon && config.lightingAddress) {
          onAddMissingAddress(config.lightingAddress, config.index, "lighting");
        }
      }
    }, [onAddMissingAddress, isAircon, config.airconAddress, config.lightingAddress, config.index]);

    return (
      <div className="p-4 border rounded-lg flex gap-4 justify-between items-center w-full shadow">
        <div className="flex items-center gap-3">
          <img
            src={config.state ? lightOn : lightOff}
            alt="Output State"
            className="w-[30px] h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleToggleClick}
          />
          <div className="flex flex-col">
            <Label className="text-sm font-medium">
              {getDisplayName(config.type, config.index)}
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              className="w-56"
              options={deviceOptions}
              value={autoMappedDeviceId?.toString() || ""}
              onValueChange={handleDeviceChange}
              placeholder={`Select ${isAircon ? "aircon" : "lighting"}...`}
              emptyText={`No ${isAircon ? "aircon" : "lighting"} found`}
            />
          ) : (
            /* Show address info when not in database */
            <div className="w-56 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm">
              Address {isAircon ? config.airconAddress : config.lightingAddress} (Not in database)
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleConfigClick}
            disabled={isLoadingConfig}
          >
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
