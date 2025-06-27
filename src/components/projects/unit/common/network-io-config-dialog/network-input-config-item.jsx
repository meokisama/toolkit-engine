import React, { useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputFunctionSubmenu } from "../io-config-dialog/input-function-submenu";
import { Settings } from "lucide-react";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";
import {
  getInputFunctions,
  getInputFunctionByValue,
} from "@/constants";

const NetworkInputConfigItem = memo(
  ({
    config,
    unitType,
    onInputFunctionChange,
    onOpenMultiGroupConfig,
  }) => {
    // Memoize available functions to prevent recalculation on every render
    const availableFunctions = useMemo(() => {
      return getInputFunctions(unitType, config.index);
    }, [unitType, config.index]);

    // Check current function for configuration
    const currentFunction = useMemo(() => {
      return getInputFunctionByValue(config.functionValue || 0);
    }, [config.functionValue]);

    // Show config button for functions that support configuration
    const showConfigButton = useMemo(() => {
      return currentFunction && currentFunction.name !== "IP_UNUSED";
    }, [currentFunction]);

    // Memoized handlers to prevent unnecessary re-renders
    const handleFunctionChange = useCallback(
      (value) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          onInputFunctionChange(config.index, numValue);
        }
      },
      [config.index, onInputFunctionChange]
    );

    const handleMultiGroupClick = useCallback(() => {
      onOpenMultiGroupConfig(config.index, config.functionValue || 0);
    }, [config.index, config.functionValue, onOpenMultiGroupConfig]);

    return (
      <div className="p-4 border rounded-lg flex gap-4 items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <img
            src={config.isActive ? lightOn : lightOff}
            alt="Input State"
            className="w-[30px] h-auto rounded-lg"
          />
          <Label className="text-sm font-medium">{config.name}</Label>
        </div>
        <div className="flex items-center gap-2">
          <InputFunctionSubmenu
            availableFunctions={availableFunctions}
            value={(config.functionValue || 0).toString()}
            onValueChange={handleFunctionChange}
            placeholder="Select function..."
            className="w-56"
          />
          <Button
            variant="outline"
            onClick={handleMultiGroupClick}
            size="icon"
            disabled={!showConfigButton}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

NetworkInputConfigItem.displayName = "NetworkInputConfigItem";

export { NetworkInputConfigItem };
