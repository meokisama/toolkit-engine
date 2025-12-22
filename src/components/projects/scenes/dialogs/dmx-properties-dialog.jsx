import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OBJECT_TYPES } from "@/constants";
import { Palette } from "lucide-react";

/**
 * DMX Properties Dialog
 * Allows selecting one of 16 colors and setting brightness for DMX device in scene
 */
export function DmxPropertiesDialog({
  open,
  onOpenChange,
  dmxCard,
  dmxItem,
  mode = "add", // "add" or "edit"
  onConfirm,
}) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(null); // 0-15 for color1-color16
  const [brightness, setBrightness] = useState(255); // 0-255

  // Get the data source based on mode
  const dataSource = mode === "edit" ? dmxItem : dmxCard;

  // Initialize state when dialog opens
  useEffect(() => {
    if (open && mode === "edit" && dmxItem) {
      // Extract color index from object_type (e.g., OBJ_DMX_COLOR1 -> 0)
      const colorMatch = dmxItem.object_type?.match(/OBJ_DMX_COLOR(\d+)/);
      if (colorMatch) {
        setSelectedColorIndex(parseInt(colorMatch[1]) - 1); // Convert to 0-based index
      }
      setBrightness(parseInt(dmxItem.item_value) || 255);
    } else if (open && mode === "add") {
      // Reset state for add mode
      setSelectedColorIndex(null);
      setBrightness(255);
    }
  }, [open, mode, dmxItem]);

  // Parse color data from item (format: "r,g,b,w")
  const parseColorData = (colorIndex) => {
    if (!dataSource || colorIndex === null) return null;

    const colorData = dataSource[`color${colorIndex + 1}`];
    if (!colorData) return { r: 0, g: 0, b: 0, w: 0 };

    const [r, g, b, w] = colorData.split(",").map(Number);
    return { r: r || 0, g: g || 0, b: b || 0, w: w || 0 };
  };

  // Get all 16 colors from DMX item
  const getColors = () => {
    const colors = [];
    for (let i = 0; i < 16; i++) {
      colors.push(parseColorData(i));
    }
    return colors;
  };

  const colors = getColors();

  const handleConfirm = () => {
    if (selectedColorIndex === null) {
      return;
    }

    // Get object type for selected color (e.g., DMX_COLOR1, DMX_COLOR2, ...)
    const colorObjType = `DMX_COLOR${selectedColorIndex + 1}`;
    const objectTypeName = OBJECT_TYPES[colorObjType]?.obj_name;

    if (!objectTypeName) {
      console.error("Invalid color index:", selectedColorIndex);
      return;
    }

    // In edit mode, dataSource is a scene item with item_id pointing to the DMX device
    // In add mode, dataSource is the DMX card/device itself
    const dmxDeviceId = mode === "edit" ? dataSource.item_id : (dataSource.item?.id || dataSource.id);

    onConfirm({
      address: dataSource.item_address || dataSource.address,
      itemId: dmxDeviceId,
      objectType: objectTypeName,
      value: brightness.toString(),
      colorIndex: selectedColorIndex,
    });

    onOpenChange(false);

    // Reset state only for add mode
    if (mode === "add") {
      setSelectedColorIndex(null);
      setBrightness(255);
    }
  };

  const brightnessPercent = Math.round((brightness / 255) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit DMX Color" : "Add DMX to Scene"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Modify" : "Select"} the color and brightness you want to control in this scene for{" "}
            <strong>{dataSource?.name || `DMX ${dataSource?.address}`}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Select Color
            </Label>
            <RadioGroup
              value={selectedColorIndex?.toString()}
              onValueChange={(value) => setSelectedColorIndex(parseInt(value))}
              className="grid grid-cols-4 gap-3"
            >
              {colors.map((color, index) => (
                <div key={index} className="relative">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`color-${index}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`color-${index}`}
                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                  >
                    <div
                      className="h-12 w-full rounded border"
                      style={{
                        backgroundColor: color ? `rgb(${color.r}, ${color.g}, ${color.b})` : "#000",
                      }}
                    />
                    <span className="text-xs font-medium">Color {index + 1}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Brightness Control */}
          {selectedColorIndex !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Brightness</Label>
                <span className="text-sm text-muted-foreground">
                  {brightnessPercent}% ({brightness}/255)
                </span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => setBrightness(value)}
                max={255}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Off (0)</span>
                <span>Max (255)</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedColorIndex === null}>
            {mode === "edit" ? "Update Color" : "Add to Scene"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
