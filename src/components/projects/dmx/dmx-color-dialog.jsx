import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RgbColorPicker } from "react-colorful";
import { useProjectDetail } from "@/contexts/project-detail-context";
import log from "electron-log/renderer";

/**
 * DMX Color Configuration Dialog
 * Allows configuring 16 colors with RGBW values for each color
 */
export function DmxColorDialog({ open, onOpenChange, item = null }) {
  const { updateItem } = useProjectDetail();
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize colors from item data
  useEffect(() => {
    if (open && item) {
      const initialColors = [];
      for (let i = 1; i <= 16; i++) {
        const colorData = item[`color${i}`];
        if (colorData) {
          const [r, g, b, w] = colorData.split(",").map(Number);
          initialColors.push({ r: r || 0, g: g || 0, b: b || 0, w: w || 0 });
        } else {
          initialColors.push({ r: 0, g: 0, b: 0, w: 0 });
        }
      }
      setColors(initialColors);
    }
  }, [open, item]);

  const handleColorChange = (colorIndex, color) => {
    setColors((prev) => {
      const newColors = [...prev];
      newColors[colorIndex] = { ...newColors[colorIndex], ...color };
      return newColors;
    });
  };

  const handleWhiteChange = (colorIndex, value) => {
    const whiteValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    setColors((prev) => {
      const newColors = [...prev];
      newColors[colorIndex] = { ...newColors[colorIndex], w: whiteValue };
      return newColors;
    });
  };

  const handleSave = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const colorData = {};
      colors.forEach((color, index) => {
        colorData[`color${index + 1}`] = `${color.r},${color.g},${color.b},${color.w}`;
      });

      await updateItem("dmx", item.id, colorData);
      onOpenChange(false);
    } catch (error) {
      log.error("Failed to save DMX colors:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure DMX Colors - {item?.name || "DMX Device"}</DialogTitle>
          <DialogDescription>Configure 16 colors with RGBW values for this DMX device.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {colors.map((color, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-semibold text-sm">Color {index + 1}</h3>
              <div className="flex gap-4">
                <div className="shrink-0">
                  <RgbColorPicker
                    color={{ r: color.r, g: color.g, b: color.b }}
                    onChange={(newColor) => handleColorChange(index, newColor)}
                    style={{ width: "150px", height: "150px" }}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Red (R)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={color.r}
                        onChange={(e) => handleColorChange(index, { ...color, r: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Green (G)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={color.g}
                        onChange={(e) => handleColorChange(index, { ...color, g: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Blue (B)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={color.b}
                        onChange={(e) => handleColorChange(index, { ...color, b: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">White (W)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={color.w}
                      onChange={(e) => handleWhiteChange(index, e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div
                    className="h-10 rounded border"
                    style={{
                      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Colors"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
