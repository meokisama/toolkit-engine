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
    allOutputConfigs,
  }) => {
    const isAircon = config.type === "ac";

    // Generate display name based on type and index
    const getDisplayName = useCallback((type, index) => {
      const typeLabels = {
        relay: "Relay",
        dimmer: "Dimmer",
        ao: "AO",
        ac: "Aircon",
      };

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
        const address = isAircon
          ? config.airconAddress
          : config.lightingAddress;
        if (address) {
          onAddMissingAddress(
            address,
            config.index,
            isAircon ? "aircon" : "lighting"
          );
        }
      }
    }, [
      onAddMissingAddress,
      config.lightingAddress,
      config.airconAddress,
      config.index,
      isAircon,
    ]);

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
              {getDisplayName(config.type, config.index, allOutputConfigs)}
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
              title={`Add ${isAircon ? "aircon" : "lighting"} address ${
                isAircon ? config.airconAddress : config.lightingAddress
              } to database`}
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
              Address {isAircon ? config.airconAddress : config.lightingAddress}{" "}
              (Not in database)
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
