import { memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Sun, Percent, Thermometer, Palette } from "lucide-react";
import { parseBrightnessInput, brightnessToPercent } from "./utils/brightness";

/**
 * Component for controlling device values in a scene based on device type and color feature
 *
 * Device types:
 * - Type 6: Only brightness (0-255)
 * - Type 8 with color_feature 2: Color temperature (1000-10000) + brightness
 * - Type 8 with color_feature 3: RGB (0-254) + brightness
 * - Type 8 with color_feature 4: RGBW (0-254) + brightness
 */
export const DeviceSceneControl = memo(function DeviceSceneControl({
  device,
  values,
  onChange,
}) {
  const { type, colorFeature } = device;

  // Brightness handlers
  const handleBrightnessChange255 = useCallback(
    (e) => {
      const brightness = parseBrightnessInput(e.target.value, "0-255");
      onChange({ ...values, brightness });
    },
    [onChange, values]
  );

  const handleBrightnessChange100 = useCallback(
    (e) => {
      const brightness = parseBrightnessInput(e.target.value, "0-100");
      onChange({ ...values, brightness });
    },
    [onChange, values]
  );

  // Color temperature handler
  const handleColorTempChange = useCallback(
    (e) => {
      const colorTemp = Math.max(
        1000,
        Math.min(10000, parseInt(e.target.value) || 1000)
      );
      onChange({ ...values, colorTemp });
    },
    [onChange, values]
  );

  // RGB handlers
  const handleRChange = useCallback(
    (e) => {
      const r = Math.max(0, Math.min(254, parseInt(e.target.value) || 0));
      onChange({ ...values, r });
    },
    [onChange, values]
  );

  const handleGChange = useCallback(
    (e) => {
      const g = Math.max(0, Math.min(254, parseInt(e.target.value) || 0));
      onChange({ ...values, g });
    },
    [onChange, values]
  );

  const handleBChange = useCallback(
    (e) => {
      const b = Math.max(0, Math.min(254, parseInt(e.target.value) || 0));
      onChange({ ...values, b });
    },
    [onChange, values]
  );

  const handleWChange = useCallback(
    (e) => {
      const w = Math.max(0, Math.min(254, parseInt(e.target.value) || 0));
      onChange({ ...values, w });
    },
    [onChange, values]
  );

  const brightnessPercent = brightnessToPercent(values.brightness);

  // Type 6: Only brightness
  if (type === 6) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="number"
            min="0"
            max="255"
            value={values.brightness}
            onChange={handleBrightnessChange255}
            className="h-10 pl-8 font-bold"
          />
        </div>
        <div className="relative">
          <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="number"
            min="0"
            max="100"
            value={brightnessPercent}
            onChange={handleBrightnessChange100}
            className="h-10 pl-8 font-bold"
          />
        </div>
      </div>
    );
  }

  // Type 8 with color_feature 2: Color temperature + brightness
  if (type === 8 && colorFeature === 2) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          <Thermometer className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="number"
            min="1000"
            max="10000"
            value={values.colorTemp ?? 2700}
            onChange={handleColorTempChange}
            className="h-10 pl-8 font-bold"
            placeholder="K"
          />
        </div>
        <div className="relative">
          <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="number"
            min="0"
            max="255"
            value={values.brightness}
            onChange={handleBrightnessChange255}
            className="h-10 pl-8 font-bold"
          />
        </div>
        <div className="relative">
          <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="number"
            min="0"
            max="100"
            value={brightnessPercent}
            onChange={handleBrightnessChange100}
            className="h-10 pl-8 font-bold"
          />
        </div>
      </div>
    );
  }

  // Type 8 with color_feature 3: RGB + brightness
  if (type === 8 && colorFeature === 3) {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1">
          <div className="relative">
            <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="number"
              min="0"
              max="255"
              value={values.brightness}
              onChange={handleBrightnessChange255}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="number"
              min="0"
              max="100"
              value={brightnessPercent}
              onChange={handleBrightnessChange100}
              className="h-10 pl-8 font-bold"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-red-800 pointer-events-none">
              R
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.r ?? 0}
              onChange={handleRChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-green-800 pointer-events-none">
              G
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.g ?? 0}
              onChange={handleGChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-blue-800 pointer-events-none">
              B
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.b ?? 0}
              onChange={handleBChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
        </div>
      </div>
    );
  }

  // Type 8 with color_feature 4: RGBW + brightness
  if (type === 8 && colorFeature === 4) {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1">
          <div className="relative">
            <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="number"
              min="0"
              max="255"
              value={values.brightness}
              onChange={handleBrightnessChange255}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="number"
              min="0"
              max="100"
              value={brightnessPercent}
              onChange={handleBrightnessChange100}
              className="h-10 pl-8 font-bold"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-red-800 pointer-events-none">
              R
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.r ?? 0}
              onChange={handleRChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-green-800 pointer-events-none">
              G
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.g ?? 0}
              onChange={handleGChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-blue-800 pointer-events-none">
              B
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.b ?? 0}
              onChange={handleBChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 font-bold text-muted-foreground pointer-events-none">
              W
            </span>
            <Input
              type="number"
              min="0"
              max="254"
              value={values.w ?? 0}
              onChange={handleWChange}
              className="h-10 pl-8 font-bold"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default: show only brightness (fallback)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative">
        <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="number"
          min="0"
          max="255"
          value={values.brightness}
          onChange={handleBrightnessChange255}
          className="h-10 pl-8 font-bold"
        />
      </div>
      <div className="relative">
        <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="number"
          min="0"
          max="100"
          value={brightnessPercent}
          onChange={handleBrightnessChange100}
          className="h-10 pl-8 font-bold"
        />
      </div>
    </div>
  );
});
