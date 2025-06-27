import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/custom/combobox";
import { Settings } from "lucide-react";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";

const NetworkOutputConfigItem = memo(
  ({
    config,
    deviceOptions,
    onOutputDeviceChange,
    onOpenOutputConfig,
    onToggleState,
    isLoadingConfig,
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

    return (
      <div className="p-4 border rounded-lg flex gap-4 justify-between items-center w-full shadow">
        <div className="flex items-center gap-3">
          <img
            src={config.state ? lightOn : lightOff}
            alt="Output State"
            className="w-[30px] h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleToggleClick}
          />
          <Label className="text-sm font-medium">
            {getDisplayName(config.type, config.index)}
          </Label>
          <Badge variant="outline" className="text-xs">
            {config.type.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Combobox
            className="w-56"
            options={deviceOptions}
            value={config.deviceId?.toString() || ""}
            onValueChange={handleDeviceChange}
            placeholder={`Select ${isAircon ? "aircon" : "lighting"}...`}
            emptyText={`No ${isAircon ? "aircon" : "lighting"} found`}
          />
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
