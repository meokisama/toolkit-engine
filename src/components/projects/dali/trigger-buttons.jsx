import { memo } from "react";
import { Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { RgbColorPicker } from "react-colorful";
import { useTrigger } from "./hooks/useTrigger";
import { useTriggerType8 } from "./hooks/useTriggerType8";

/**
 * Trigger button for DALI devices - shows popover with brightness slider or color controls
 */
export const TriggerDeviceButton = memo(function TriggerDeviceButton({ address, index, disabled, deviceType, colorFeature }) {
  // Check if device is Type 6 or Type 8
  const isType6 = deviceType === 6;
  const isType8 = deviceType === 8;

  // Use useTrigger hook for Type 6 devices
  const { level, open, setOpen, handleLevelChange, selectedGateway } = useTrigger({
    type: "device",
    id: address,
  });

  // Use useTriggerType8 hook for Type 8 devices
  const {
    brightness,
    setBrightness,
    colorTemperature,
    setColorTemperature,
    rgbColor,
    setRgbColor,
    whiteValue,
    setWhiteValue,
    rInput,
    gInput,
    bInput,
    handleRgbInputChange,
    selectedGateway: selectedGatewayType8,
  } = useTriggerType8({
    address,
    index,
    colorFeature,
    open,
  });

  // Use the appropriate gateway based on device type
  const activeGateway = isType8 ? selectedGatewayType8 : selectedGateway;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled || !activeGateway}>
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          {/* Type 6: Brightness slider only */}
          {isType6 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Brightness</label>
                <span className="text-sm text-muted-foreground">{level[0]} / 255</span>
              </div>
              <Slider value={level} onValueChange={handleLevelChange} max={255} step={1} className="w-full" />
            </div>
          )}

          {/* Type 8: Color controls based on colorFeature */}
          {isType8 && (
            <>
              {/* Color Feature 2: Color Temperature Slider (1K - 10000K) */}
              {colorFeature === 2 && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Color Temperature</label>
                      <span className="text-sm text-muted-foreground">{colorTemperature[0]}K</span>
                    </div>
                    <Slider value={colorTemperature} onValueChange={setColorTemperature} min={1000} max={10000} step={100} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Brightness</label>
                      <span className="text-sm text-muted-foreground">{brightness[0]} / 254</span>
                    </div>
                    <Slider value={brightness} onValueChange={setBrightness} max={254} step={1} className="w-full" />
                  </div>
                </div>
              )}

              {/* Color Feature 3: RGB Color Picker */}
              {colorFeature === 3 && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <RgbColorPicker color={rgbColor} onChange={setRgbColor} className="w-auto!" />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">Red</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={rInput}
                          onChange={(e) => handleRgbInputChange("r", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">Green</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={gInput}
                          onChange={(e) => handleRgbInputChange("g", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">Blue</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={bInput}
                          onChange={(e) => handleRgbInputChange("b", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Brightness</label>
                      <span className="text-sm text-muted-foreground">{brightness[0]} / 254</span>
                    </div>
                    <Slider value={brightness} onValueChange={setBrightness} max={254} step={1} className="w-full" />
                  </div>
                </div>
              )}

              {/* Color Feature 4: RGB Color Picker + White (W) Input */}
              {colorFeature === 4 && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <RgbColorPicker color={rgbColor} onChange={setRgbColor} className="w-auto!" />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">R</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={rInput}
                          onChange={(e) => handleRgbInputChange("r", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">G</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={gInput}
                          onChange={(e) => handleRgbInputChange("g", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">B</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={bInput}
                          onChange={(e) => handleRgbInputChange("b", e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex justify-center">W</label>
                        <Input
                          type="number"
                          min="0"
                          max="255"
                          value={whiteValue}
                          onChange={(e) => setWhiteValue(e.target.value)}
                          className="h-8 text-xs [&::-webkit-inner-spin-button]:appearance-none text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Brightness</label>
                      <span className="text-sm text-muted-foreground">{brightness[0]} / 254</span>
                    </div>
                    <Slider value={brightness} onValueChange={setBrightness} max={254} step={1} className="w-full" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

/**
 * Trigger button for DALI groups - shows popover with brightness slider
 */
export const TriggerGroupButton = memo(function TriggerGroupButton({ groupId, disabled }) {
  const { level, open, setOpen, handleLevelChange, selectedGateway } = useTrigger({
    type: "group",
    id: groupId,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled || !selectedGateway} onClick={(e) => e.stopPropagation()}>
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-muted-foreground">{level[0]} / 255</span>
            </div>
            <Slider value={level} onValueChange={handleLevelChange} max={255} step={1} className="w-full" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

/**
 * Trigger button for DALI scenes - simple button without slider
 */
export const TriggerSceneButton = memo(function TriggerSceneButton({ sceneId, disabled }) {
  const { handleTriggerScene, selectedGateway } = useTrigger({
    type: "scene",
    id: sceneId,
  });

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled || !selectedGateway} onClick={handleTriggerScene}>
      <Play className="h-4 w-4" />
    </Button>
  );
});
