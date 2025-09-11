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
import { HexColorPicker } from "react-colorful";
import { Palette, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";

const rgbToHex = (r, g, b) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
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
  });

  // Single source of truth for color
  const [color, setColor] = useState({ r: 255, g: 255, b: 255 });

  // Separate hex input for better UX
  const [hexInput, setHexInput] = useState("#ffffff");

  // Use refs to prevent unnecessary re-renders
  const isUserTypingHex = useRef(false);
  const debounceRef = useRef(null);

  // Memoized derived values
  const hexColor = useMemo(() => rgbToHex(color.r, color.g, color.b), [color]);
  const textColor = useMemo(
    () => getTextColor(color.r, color.g, color.b),
    [color]
  );

  // Memoized button style to prevent object recreation
  const buttonStyle = useMemo(
    () => ({
      backgroundColor: hexColor,
      color: textColor,
    }),
    [hexColor, textColor]
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
      setColor({ r: 255, g: 255, b: 255 });
      setHexInput("#ffffff");
      isUserTypingHex.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  }, [open]);

  // Debounced hex input handler
  const handleHexInputChange = useCallback((value) => {
    setHexInput(value);
    isUserTypingHex.current = true;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the actual color update
    debounceRef.current = setTimeout(() => {
      const rgb = hexToRgb(value);
      if (rgb) {
        setColor(rgb);
      }
      isUserTypingHex.current = false;
    }, 300); // 300ms debounce
  }, []);

  // Optimized color picker handler
  const handleColorChange = useCallback((newColor) => {
    const rgb = hexToRgb(newColor);
    if (rgb) {
      setColor(rgb);
    }
  }, []);

  // Optimized RGB input handler with validation
  const handleRgbInputChange = useCallback((channel, value) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    setColor((prev) => {
      // Only update if value actually changed
      if (prev[channel] === numValue) return prev;
      return { ...prev, [channel]: numValue };
    });
  }, []);

  // Channel change handler with validation
  const handleChannelChange = useCallback((channel, value) => {
    const numValue = Math.max(1, Math.min(255, parseInt(value) || 1));
    setRgbChannels((prev) => {
      if (prev[channel] === numValue) return prev;
      return { ...prev, [channel]: numValue };
    });
  }, []);

  // Memoized send function
  const handleSendColor = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setSendingColor(true);
    try {
      const groupSettings = [
        [rgbChannels.red, color.r],
        [rgbChannels.green, color.g],
        [rgbChannels.blue, color.b],
      ];

      // Use the setMultipleGroupStates function from lighting service
      await window.electronAPI.rcuController.setMultipleGroupStates({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        groupSettings,
      });

      toast.success(
        `RGB color sent successfully!\nR:${color.r} G:${color.g} B:${color.b}`
      );
    } catch (error) {
      console.error("Failed to send RGB color:", error);
      toast.error(`Failed to send RGB color: ${error.message}`);
    } finally {
      setSendingColor(false);
    }
  }, [unit, color, rgbChannels]);

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

  const RGBInput = React.memo(({ channel, label, value, onChange }) => (
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            RGB Control
          </DialogTitle>
          <DialogDescription>
            Control RGB lighting for unit {unit?.id_can} at {unit?.ip_address}:
            {CONSTANTS.UNIT.UDP_CONFIG.UDP_PORT}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* RGB Channel Assignment */}
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <ChannelInput
                  channel="red"
                  label="Red Address (R)"
                  value={rgbChannels.red}
                  onChange={handleChannelChange}
                />
                <ChannelInput
                  channel="green"
                  label="Green Address (G)"
                  value={rgbChannels.green}
                  onChange={handleChannelChange}
                />
                <ChannelInput
                  channel="blue"
                  label="Blue Address (B)"
                  value={rgbChannels.blue}
                  onChange={handleChannelChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Picker */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {/* Color Picker */}
                <div className="w-full">
                  <HexColorPicker
                    color={hexColor}
                    onChange={handleColorChange}
                    style={{ width: "100%", height: "200px" }}
                  />
                </div>

                {/* Manual Input Controls */}
                <div className="w-full space-y-4">
                  {/* Hex Input */}
                  <div className="space-y-2">
                    <Label htmlFor="hex-input">Hex Color</Label>
                    <Input
                      id="hex-input"
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>

                  {/* RGB Inputs */}
                  <div className="grid grid-cols-3 gap-4">
                    <RGBInput
                      channel="r"
                      label="Red (0-255)"
                      value={color.r}
                      onChange={handleRgbInputChange}
                    />
                    <RGBInput
                      channel="g"
                      label="Green (0-255)"
                      value={color.g}
                      onChange={handleRgbInputChange}
                    />
                    <RGBInput
                      channel="b"
                      label="Blue (0-255)"
                      value={color.b}
                      onChange={handleRgbInputChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSendColor}
              disabled={sendingColor || !unit}
              className="flex items-center gap-2 transition-all duration-200"
              style={buttonStyle}
            >
              {sendingColor ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendingColor ? "Sending..." : "Send RGB Color"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RGBControlDialog;
