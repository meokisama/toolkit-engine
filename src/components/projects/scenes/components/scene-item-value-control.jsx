import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Percent, Sun } from "lucide-react";
import { OBJECT_TYPES } from "@/constants";

export function SceneItemValueControl({ sceneItem, updateSceneItemValue, getValueOptions }) {
  const options = getValueOptions(sceneItem.object_type, sceneItem.item_type);

  // For lighting and DMX items, always use number input for brightness (stored as 0-255)
  if (sceneItem.item_type === "lighting" || sceneItem.item_type === "dmx") {
    // Value is stored as 0-255, convert to percent for display
    const current255Value = parseInt(sceneItem.item_value || "255");
    const currentPercentValue = Math.round((current255Value * 100) / 255);

    const handlePercentChange = (e) => {
      const inputValue = e.target.value;
      if (inputValue === "") {
        updateSceneItemValue(sceneItem.id, "255");
      } else {
        const percentValue = Math.min(100, Math.max(0, parseInt(inputValue) || 0));
        // Convert from percent to 0-255 for storage
        const value255 = Math.round((percentValue * 255) / 100);
        updateSceneItemValue(sceneItem.id, value255.toString());
      }
    };

    const handle255Change = (e) => {
      const inputValue = e.target.value;
      if (inputValue === "") {
        updateSceneItemValue(sceneItem.id, "255");
      } else {
        const value = Math.min(255, Math.max(0, parseInt(inputValue) || 0));
        // Store directly as 0-255
        updateSceneItemValue(sceneItem.id, value.toString());
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <Percent className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="number" min="0" max="100" value={currentPercentValue} onChange={handlePercentChange} className="w-23 pl-8 font-semibold" />
        </div>
        <div className="relative">
          <Sun className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="number" min="0" max="255" value={current255Value} onChange={handle255Change} className="w-23 pl-8 font-semibold" />
        </div>
      </div>
    );
  }

  // For curtain items, use select dropdown with Open/Close/Stop options
  if (sceneItem.item_type === "curtain") {
    const handleCurtainChange = (value) => updateSceneItemValue(sceneItem.id, value);

    return (
      <Select value={sceneItem.item_value || "1"} onValueChange={handleCurtainChange}>
        <SelectTrigger className="w-30">
          <SelectValue placeholder="Select action" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // For aircon temperature, use number input for integer values
  if (sceneItem.object_type === OBJECT_TYPES.AC_TEMPERATURE.obj_name) {
    const handleTemperatureChange = (e) => {
      const inputValue = e.target.value;
      if (inputValue === "") {
        updateSceneItemValue(sceneItem.id, "25");
      } else {
        const value = Math.min(40, Math.max(0, parseInt(inputValue) || 25));
        updateSceneItemValue(sceneItem.id, value.toString());
      }
    };

    return (
      <div className="relative">
        <Input
          type="number"
          min="0"
          max="40"
          value={sceneItem.item_value || "25"}
          onChange={handleTemperatureChange}
          className="w-40 font-semibold"
          placeholder="25"
        />
      </div>
    );
  }

  // For other aircon items, use select dropdown
  if (options.length > 0) {
    const handleSelectChange = (value) => updateSceneItemValue(sceneItem.id, value);

    return (
      <Select value={sceneItem.item_value || ""} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Fallback for other items
  const handleFallbackChange = (e) => updateSceneItemValue(sceneItem.id, e.target.value);

  return <Input type="number" value={sceneItem.item_value || ""} onChange={handleFallbackChange} placeholder="Value" className="w-40" />;
}
