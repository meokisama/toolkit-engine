import { useState, useCallback, useRef, useEffect } from "react";
import { useDali } from "@/contexts/dali-context";
import { toast } from "sonner";

/**
 * Custom hook for handling DALI Type 8 device trigger logic with debounce
 * Supports different color features: Temperature (2), RGB (3), RGBW (4)
 *
 * @param {Object} params
 * @param {number} params.address - Device address
 * @param {number} params.index - Device index
 * @param {number} params.colorFeature - Color feature type (2=Temperature, 3=RGB, 4=RGBW)
 * @param {boolean} params.open - Popover open state
 * @returns {Object} - State values and handlers
 */
export function useTriggerType8({ address, index, colorFeature, open }) {
  const { selectedGateway } = useDali();

  // State for Type 8 color controls
  const [brightness, setBrightness] = useState([127]); // Default brightness
  const [colorTemperature, setColorTemperature] = useState([5000]); // Default 5000K
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });
  const [whiteValue, setWhiteValue] = useState("128");

  // Local input states for RGB (to prevent focus loss during typing)
  const [rInput, setRInput] = useState("255");
  const [gInput, setGInput] = useState("255");
  const [bInput, setBInput] = useState("255");

  // Debounce timer refs
  const debounceTimerRef = useRef(null);
  const rgbInputDebounceRef = useRef(null);

  /**
   * Handle RGB input changes with debounce
   * This prevents focus loss by keeping input state separate
   */
  const handleRgbInputChange = useCallback((channel, value) => {
    // Update local input state immediately (no focus loss)
    if (channel === "r") setRInput(value);
    else if (channel === "g") setGInput(value);
    else if (channel === "b") setBInput(value);

    // Clear existing timer
    if (rgbInputDebounceRef.current) {
      clearTimeout(rgbInputDebounceRef.current);
    }

    // Debounce update to actual rgbColor (300ms)
    rgbInputDebounceRef.current = setTimeout(() => {
      const numValue = parseInt(value) || 0;
      const clampedValue = Math.min(Math.max(numValue, 0), 255);

      setRgbColor((prev) => ({
        ...prev,
        [channel]: clampedValue,
      }));
    }, 300);
  }, []);

  /**
   * Sync input states when rgbColor changes externally (e.g., from color picker)
   */
  useEffect(() => {
    setRInput(String(rgbColor.r));
    setGInput(String(rgbColor.g));
    setBInput(String(rgbColor.b));
  }, [rgbColor.r, rgbColor.g, rgbColor.b]);

  /**
   * Trigger Type 8 device with current values
   */
  const triggerDevice = useCallback(async () => {
    if (!selectedGateway || index === null || index === undefined) {
      return;
    }

    try {
      // Build color data based on color feature
      let colorData = {};
      if (colorFeature === 2) {
        colorData = { colorTemperature: colorTemperature[0] };
      } else if (colorFeature === 3) {
        colorData = { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b };
      } else if (colorFeature === 4) {
        colorData = {
          r: rgbColor.r,
          g: rgbColor.g,
          b: rgbColor.b,
          w: parseInt(whiteValue) || 0,
        };
      }

      await window.electronAPI.daliController.triggerType8Device({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
        deviceIndex: index,
        deviceAddress: address,
        colorFeature: colorFeature,
        brightness: brightness[0],
        colorData: colorData,
      });
    } catch (error) {
      console.error("Failed to trigger Type 8 device:", error);
      toast.error(`Failed to trigger Type 8 device: ${error.message}`);
    }
  }, [selectedGateway, index, address, colorFeature, brightness, colorTemperature, rgbColor, whiteValue]);

  /**
   * Debounced trigger - auto-trigger when values change and popover is open
   */
  useEffect(() => {
    if (!open || !selectedGateway || index === null || index === undefined) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer (300ms)
    debounceTimerRef.current = setTimeout(() => {
      triggerDevice();
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGateway, index, triggerDevice]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (rgbInputDebounceRef.current) {
        clearTimeout(rgbInputDebounceRef.current);
      }
    };
  }, []);

  return {
    // State values
    brightness,
    colorTemperature,
    rgbColor,
    whiteValue,

    // RGB input states (for manual input without focus loss)
    rInput,
    gInput,
    bInput,

    // State setters
    setBrightness,
    setColorTemperature,
    setRgbColor,
    setWhiteValue,

    // RGB input handler
    handleRgbInputChange,

    // Gateway info
    selectedGateway,
  };
}
