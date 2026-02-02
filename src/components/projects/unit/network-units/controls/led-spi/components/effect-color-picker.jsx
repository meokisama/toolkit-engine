import { useCallback, useMemo } from "react";
import { RgbColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VALIDATION } from "../constants";

// Helper: RGB to Hex
const rgbToHex = (r, g, b) => {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper: Hex to RGB
const hexToRgb = (hex) => {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return null;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
};

export function EffectColorPicker({ color, onColorChange, disabled }) {
  // Convert to format expected by react-colorful
  const rgbColor = useMemo(
    () => ({
      r: color.r,
      g: color.g,
      b: color.b,
    }),
    [color.r, color.g, color.b],
  );

  // Convert RGB to Hex for display
  const hexValue = useMemo(() => rgbToHex(color.r, color.g, color.b), [color.r, color.g, color.b]);

  const handleColorPickerChange = useCallback(
    (newColor) => {
      onColorChange({
        r: newColor.r,
        g: newColor.g,
        b: newColor.b,
      });
    },
    [onColorChange],
  );

  const handleInputChange = useCallback(
    (channel, value) => {
      const numValue = Math.max(VALIDATION.COLOR.min, Math.min(VALIDATION.COLOR.max, parseInt(value) || 0));
      onColorChange({ [channel]: numValue });
    },
    [onColorChange],
  );

  const handleHexChange = useCallback(
    (value) => {
      // Allow partial input while typing
      let hex = value.trim();
      if (!hex.startsWith("#")) {
        hex = "#" + hex;
      }

      // Only update RGB if we have a valid 6-character hex
      if (hex.length === 7) {
        const rgb = hexToRgb(hex);
        if (rgb) {
          onColorChange({ r: rgb.r, g: rgb.g, b: rgb.b });
        }
      }
    },
    [onColorChange],
  );

  return (
    <div className="space-y-4 grid grid-cols-2 gap-6 pt-2">
      {/* Color Picker */}
      <div className="flex justify-center">
        <RgbColorPicker color={rgbColor} onChange={handleColorPickerChange} style={{ width: "100%" }} />
      </div>

      {/* Color Inputs */}
      <div className="flex flex-col gap-3">
        {/* Hex Input */}
        <div className="space-y-2">
          <Label htmlFor="color-hex">Hex</Label>
          <Input
            id="color-hex"
            type="text"
            value={hexValue}
            onChange={(e) => handleHexChange(e.target.value)}
            disabled={disabled}
            placeholder="#ffffff"
            className="h-8 font-mono"
            maxLength={7}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* R Input */}
          <div className="space-y-2">
            <Label htmlFor="color-r">Red</Label>
            <Input
              id="color-r"
              type="number"
              min={VALIDATION.COLOR.min}
              max={VALIDATION.COLOR.max}
              value={color.r}
              onChange={(e) => handleInputChange("r", e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          {/* G Input */}
          <div className="space-y-2">
            <Label htmlFor="color-g">Green</Label>
            <Input
              id="color-g"
              type="number"
              min={VALIDATION.COLOR.min}
              max={VALIDATION.COLOR.max}
              value={color.g}
              onChange={(e) => handleInputChange("g", e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          {/* B Input */}
          <div className="space-y-2">
            <Label htmlFor="color-b">Blue</Label>
            <Input
              id="color-b"
              type="number"
              min={VALIDATION.COLOR.min}
              max={VALIDATION.COLOR.max}
              value={color.b}
              onChange={(e) => handleInputChange("b", e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          {/* W Input */}
          <div className="space-y-2">
            <Label htmlFor="color-w">White</Label>
            <Input
              id="color-w"
              type="number"
              min={VALIDATION.COLOR.min}
              max={VALIDATION.COLOR.max}
              value={color.w}
              onChange={(e) => handleInputChange("w", e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
