import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/custom/combobox";
import { Settings, Zap, Lightbulb, Fan, Thermometer } from "lucide-react";

const OutputConfigItem = memo(
  ({
    config,
    deviceOptions,
    onOutputDeviceChange,
    onOpenOutputConfig,
    isLoadingConfig,
  }) => {
    const isAircon = config.type === "ac";

    const getOutputIcon = useCallback((type) => {
      switch (type) {
        case "relay":
          return <Zap className="h-4 w-4" />;
        case "dimmer":
          return <Lightbulb className="h-4 w-4" />;
        case "ao":
          return <Fan className="h-4 w-4" />;
        case "ac":
          return <Thermometer className="h-4 w-4" />;
        default:
          return <Settings className="h-4 w-4" />;
      }
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

    return (
      <div className="p-4 border rounded-lg flex gap-4 justify-between items-center w-full shadow">
        <Label className="text-sm font-medium">
          {getOutputIcon(config.type)}
          {config.name}
        </Label>
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

OutputConfigItem.displayName = "OutputConfigItem";

export { OutputConfigItem };
