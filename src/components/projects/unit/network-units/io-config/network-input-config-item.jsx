import React, { useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputFunctionSubmenu } from "../../shared/input-config";
import { Settings } from "lucide-react";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";
import { getInputFunctions, getInputFunctionByValue } from "@/constants";
import { hasInputConfigChanged } from "@/utils/io-config-utils";

const NetworkInputConfigItem = memo(({ config, unitType, originalConfig, onInputFunctionChange, onOpenInputDetailConfig, onToggleInputState }) => {
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

  // Check if this input has changed from original configuration
  const hasChanged = useMemo(() => {
    if (!originalConfig) return false;
    return hasInputConfigChanged(originalConfig, config);
  }, [originalConfig, config]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleFunctionChange = useCallback(
    (value) => {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        onInputFunctionChange(config.index, numValue);
      }
    },
    [config.index, onInputFunctionChange],
  );

  const handleInputDetailClick = useCallback(() => {
    onOpenInputDetailConfig(config.index, config.functionValue || 0);
  }, [config.index, config.functionValue, onOpenInputDetailConfig]);

  const handleToggleClick = useCallback(() => {
    if (onToggleInputState) {
      onToggleInputState(config.index, config.isActive);
    }
  }, [config.index, config.isActive, onToggleInputState]);

  return (
    <div
      className={`p-4 border rounded-lg flex gap-4 items-center justify-between shadow ${
        hasChanged ? "border-orange-500 border-2" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={config.isActive ? lightOn : lightOff}
          alt="Input State"
          className="w-[30px] h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleToggleClick}
        />
        <Label className="text-sm font-medium">{config.name}</Label>
      </div>
      <div className="flex items-center gap-2">
        <InputFunctionSubmenu
          availableFunctions={availableFunctions}
          value={(config.functionValue || 0).toString()}
          onValueChange={handleFunctionChange}
          placeholder="Select function..."
          className="w-48"
        />
        <Button variant="outline" onClick={handleInputDetailClick} size="icon" disabled={!showConfigButton}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

NetworkInputConfigItem.displayName = "NetworkInputConfigItem";

export { NetworkInputConfigItem };
