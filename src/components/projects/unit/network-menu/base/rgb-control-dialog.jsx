import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { HexAlphaColorPicker } from "react-colorful";
import { Palette, Loader2, Send, Sun } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";

const rgbToHex = (r, g, b, a = 255) => {
  return (
    "#" +
    [r, g, b, a]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const hexToRgba = (hex) => {
  // Support both #RRGGBB and #RRGGBBAA formats
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex
  );
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] ? parseInt(result[4], 16) : 255,
      }
    : null;
};

// Calculate text color based on background luminance
const getTextColor = (r, g, b) => {
  return r * 0.299 + g * 0.587 + b * 0.114 > 128 ? "#000000" : "#ffffff";
};

const RGBControlDialog = ({ open, onOpenChange, unit }) => {
  const [sendingColor, setSendingColor] = useState(false);
  const [rgbChannels, setRgbChannels] = useState({
    red: 1,
    green: 2,
    blue: 3,
    alpha: 4,
  });

  // Base color at 100% brightness (stored for reference)
  const [baseColor, setBaseColor] = useState({
    r: 255,
    g: 255,
    b: 255,
    a: 255,
  });

  // Current color (affected by brightness)
  const [color, setColor] = useState({ r: 255, g: 255, b: 255, a: 255 });

  // Brightness/dimmer value (0-100)
  const [brightness, setBrightness] = useState(100);

  // Separate hex input for better UX
  const [hexInput, setHexInput] = useState("#ffffff88");

  // Use refs to prevent unnecessary re-renders
  const isUserTypingHex = useRef(false);
  const debounceRef = useRef(null);

  // Actual color is now just the color state (brightness already applied)
  const actualColor = useMemo(() => color, [color]);

  // Memoized derived values (hexColor from baseColor for color picker)
  const hexColor = useMemo(
    () => rgbToHex(baseColor.r, baseColor.g, baseColor.b, baseColor.a),
    [baseColor]
  );
  const actualHexColor = useMemo(
    () => rgbToHex(actualColor.r, actualColor.g, actualColor.b, actualColor.a),
    [actualColor]
  );
  const textColor = useMemo(
    () => getTextColor(actualColor.r, actualColor.g, actualColor.b),
    [actualColor]
  );

  // Memoized button style to prevent object recreation
  const buttonStyle = useMemo(
    () => ({
      backgroundColor: actualHexColor,
      color: textColor,
    }),
    [actualHexColor, textColor]
  );

  // Update hex input when color changes (but not when user is typing)
  useEffect(() => {
    if (!isUserTypingHex.current) {
      setHexInput(hexColor);
    }
  }, [hexColor]);

  // Reset color when dialog opens
  useEffect(() => {
    if (open) {
      const initialColor = { r: 255, g: 255, b: 255, a: 136 }; // 136 = 0x88 in decimal
      setBaseColor(initialColor);
      setColor(initialColor);
      setBrightness(100);
      setHexInput("#ffffff88");
      isUserTypingHex.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  }, [open]);

  // Debounced hex input handler
  const handleHexInputChange = useCallback(
    (value) => {
      setHexInput(value);
      isUserTypingHex.current = true;

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the actual color update
      debounceRef.current = setTimeout(() => {
        const rgba = hexToRgba(value);
        if (rgba) {
          setBaseColor(rgba);
          // Apply current brightness
          const factor = brightness / 100;
          setColor({
            r: Math.round(rgba.r * factor),
            g: Math.round(rgba.g * factor),
            b: Math.round(rgba.b * factor),
            a: rgba.a,
          });
        }
        isUserTypingHex.current = false;
      }, 300); // 300ms debounce
    },
    [brightness]
  );

  // Optimized color picker handler
  const handleColorChange = useCallback(
    (newColor) => {
      const rgba = hexToRgba(newColor);
      if (rgba) {
        setBaseColor(rgba);
        // Apply current brightness to the new color
        const factor = brightness / 100;
        setColor({
          r: Math.round(rgba.r * factor),
          g: Math.round(rgba.g * factor),
          b: Math.round(rgba.b * factor),
          a: rgba.a,
        });
      }
    },
    [brightness]
  );

  // Optimized RGBA input handler with validation
  const handleRgbaInputChange = useCallback(
    (channel, value) => {
      const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));

      // Update color directly (this is the current displayed value)
      setColor((prev) => {
        if (prev[channel] === numValue) return prev;
        return { ...prev, [channel]: numValue };
      });

      // Also update baseColor for RGB channels (reverse calculate from brightness)
      if (channel === "r" || channel === "g" || channel === "b") {
        const factor = brightness / 100;
        const baseValue = factor > 0 ? Math.round(numValue / factor) : numValue;
        setBaseColor((prev) => ({
          ...prev,
          [channel]: Math.min(255, baseValue),
        }));
      } else if (channel === "a") {
        // Alpha updates baseColor directly
        setBaseColor((prev) => ({ ...prev, a: numValue }));
      }
    },
    [brightness]
  );

  // Channel change handler with validation
  const handleChannelChange = useCallback((channel, value) => {
    const numValue = Math.max(1, Math.min(255, parseInt(value) || 1));
    setRgbChannels((prev) => {
      if (prev[channel] === numValue) return prev;
      return { ...prev, [channel]: numValue };
    });
  }, []);

  // Brightness change handler - recalculates RGB from baseColor
  const handleBrightnessChange = useCallback(
    (value) => {
      const newBrightness = value[0];
      setBrightness(newBrightness);

      // Apply new brightness to base color
      const factor = newBrightness / 100;
      setColor({
        r: Math.round(baseColor.r * factor),
        g: Math.round(baseColor.g * factor),
        b: Math.round(baseColor.b * factor),
        a: baseColor.a, // Alpha is not affected by brightness
      });
    },
    [baseColor]
  );

  // Memoized send function
  const handleSendColor = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setSendingColor(true);
    try {
      const groupSettings = [
        [rgbChannels.red, actualColor.r],
        [rgbChannels.green, actualColor.g],
        [rgbChannels.blue, actualColor.b],
        [rgbChannels.alpha, actualColor.a],
      ];

      // Use the setMultipleGroupStates function from lighting service
      await window.electronAPI.rcuController.setMultipleGroupStates({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        groupSettings,
      });

      toast.success(
        `RGBA color sent successfully!\nR:${actualColor.r} G:${actualColor.g} B:${actualColor.b} A:${actualColor.a} (${brightness}%)`
      );
    } catch (error) {
      console.error("Failed to send RGBA color:", error);
      toast.error(`Failed to send RGBA color: ${error.message}`);
    } finally {
      setSendingColor(false);
    }
  }, [unit, actualColor, rgbChannels, brightness]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Memoized channel inputs to prevent unnecessary re-renders
  const ChannelInput = React.memo(({ channel, label, value, onChange }) => (
    <div className="space-y-2">
      <Label htmlFor={`${channel}-channel`}>{label}</Label>
      <Input
        id={`${channel}-channel`}
        type="number"
        min="1"
        max="255"
        value={value}
        onChange={(e) => onChange(channel, e.target.value)}
        placeholder="1"
      />
    </div>
  ));

  const RGBAInput = React.memo(({ channel, label, value, onChange }) => (
    <div className="space-y-2">
      <Label htmlFor={`${channel}-input`}>{label}</Label>
      <Input
        id={`${channel}-input`}
        type="number"
        min="0"
        max="255"
        value={value}
        onChange={(e) => onChange(channel, e.target.value)}
      />
    </div>
  ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            RGBA Control
          </DialogTitle>
          <DialogDescription>
            Control RGBA lighting for unit {unit?.id_can} at {unit?.ip_address}:
            {CONSTANTS.UNIT.UDP_CONFIG.UDP_PORT}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* RGBA Channel Assignment */}
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <ChannelInput
                  channel="red"
                  label="Red Channel"
                  value={rgbChannels.red}
                  onChange={handleChannelChange}
                />
                <ChannelInput
                  channel="green"
                  label="Green Channel"
                  value={rgbChannels.green}
                  onChange={handleChannelChange}
                />
                <ChannelInput
                  channel="blue"
                  label="Blue Channel"
                  value={rgbChannels.blue}
                  onChange={handleChannelChange}
                />
                <ChannelInput
                  channel="alpha"
                  label="Alpha Channel"
                  value={rgbChannels.alpha}
                  onChange={handleChannelChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Picker */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {/* Color Picker with Alpha */}
                <div className="w-full">
                  <HexAlphaColorPicker
                    color={hexColor}
                    onChange={handleColorChange}
                    style={{ width: "100%", height: "200px" }}
                  />
                </div>

                {/* Manual Input Controls */}
                <div className="w-full space-y-4">
                  {/* Hex Input */}
                  <div className="space-y-2">
                    <Label htmlFor="hex-input">Hex Color (with Alpha)</Label>
                    <Input
                      id="hex-input"
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      placeholder="#ffffff88"
                    />
                  </div>

                  {/* RGBA Inputs */}
                  <div className="grid grid-cols-4 gap-4">
                    <RGBAInput
                      channel="r"
                      label="Red"
                      value={color.r}
                      onChange={handleRgbaInputChange}
                    />
                    <RGBAInput
                      channel="g"
                      label="Green"
                      value={color.g}
                      onChange={handleRgbaInputChange}
                    />
                    <RGBAInput
                      channel="b"
                      label="Blue"
                      value={color.b}
                      onChange={handleRgbaInputChange}
                    />
                    <RGBAInput
                      channel="a"
                      label="Alpha"
                      value={color.a}
                      onChange={handleRgbaInputChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brightness/Dimmer Slider */}
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="brightness-slider"
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Dimming
                  </Label>
                  <span className="text-sm font-medium">{brightness}%</span>
                </div>
                <Slider
                  id="brightness-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[brightness]}
                  onValueChange={handleBrightnessChange}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSendColor}
              disabled={sendingColor || !unit}
              className="flex items-center gap-2 transition-all duration-200 shadow-md"
              style={buttonStyle}
            >
              {sendingColor ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendingColor ? "Sending..." : "Send RGBA Color"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RGBControlDialog;
