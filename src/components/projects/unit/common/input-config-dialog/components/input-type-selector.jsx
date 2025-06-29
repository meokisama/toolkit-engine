import React from "react";
import { Label } from "@/components/ui/label";
import { InputFunctionSubmenu } from "../../io-config-dialog/input-function-submenu";

export const InputTypeSelector = ({
  currentInputType,
  availableInputFunctions,
  currentInputFunction,
  inputIndex,
  unitType,
  onInputTypeChange,
}) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Input Type</Label>
      <InputFunctionSubmenu
        value={currentInputType?.toString() || "0"}
        onValueChange={onInputTypeChange}
        availableFunctions={availableInputFunctions}
        placeholder="Select input type..."
        className="w-full"
      />
    </div>
  );
};
