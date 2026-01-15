import { useState, useCallback, useRef, useEffect } from "react";
import { calculateDelaySeconds, parseDelaySeconds } from "@/constants";
import { timeToDate, dateToTimeComponents, validateDelayOffTime } from "../utils/time-helpers";

export const useRlcOptions = (initialRlcOptions = {}) => {
  // RLC Options state
  const [rlcOptions, setRlcOptions] = useState({
    ramp: 0,
    preset: 255,
    ledDisplay: 0,
    nightlight: false,
    backlight: false,
    autoMode: false,
    delayOff: {
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  });

  // Time picker state for delay off - local state for immediate UI updates
  const [delayOffTime, setDelayOffTime] = useState(new Date(new Date().setHours(0, 0, 0, 0)));

  // Debounce timeout ref for time picker
  const timePickerDebounceRef = useRef(null);

  // Initialize RLC options from initialRlcOptions
  // Backend already parses ledStatus into individual fields (ledDisplay, nightlight, backlight)
  useEffect(() => {
    if (initialRlcOptions && Object.keys(initialRlcOptions).length > 0) {
      // Parse delay off time - handle both formats
      const delaySeconds = initialRlcOptions.delayOff || initialRlcOptions.delay_off || 0;
      const delayTime = parseDelaySeconds(delaySeconds);

      // Read LED options directly from backend (already parsed)
      setRlcOptions({
        ramp: initialRlcOptions.ramp ?? 0,
        preset: initialRlcOptions.preset ?? 255,
        ledDisplay: initialRlcOptions.ledDisplay ?? 0,
        nightlight: initialRlcOptions.nightlight ?? false,
        backlight: initialRlcOptions.backlight ?? false,
        autoMode: initialRlcOptions.autoMode ?? initialRlcOptions.auto_mode ?? false,
        delayOff: delayTime,
      });

      // Set time picker state
      setDelayOffTime(timeToDate(delayTime.hours, delayTime.minutes, delayTime.seconds));
    }
  }, [initialRlcOptions]);

  // RLC Options handlers
  const handleRlcOptionChange = useCallback((field, value) => {
    setRlcOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Debounced function to update rlcOptions
  const updateDelayOffOptions = useCallback((hours, minutes, seconds) => {
    const validated = validateDelayOffTime(hours, minutes, seconds);

    setRlcOptions((prev) => ({
      ...prev,
      delayOff: validated,
    }));
  }, []);

  // Time picker handler for delay off with debouncing
  const handleDelayOffTimeChange = useCallback(
    (newDate) => {
      // Update local state immediately for responsive UI
      setDelayOffTime(newDate);

      // Clear existing timeout
      if (timePickerDebounceRef.current) {
        clearTimeout(timePickerDebounceRef.current);
      }

      // Debounce the rlcOptions update
      timePickerDebounceRef.current = setTimeout(() => {
        const { hours, minutes, seconds } = dateToTimeComponents(newDate);
        updateDelayOffOptions(hours, minutes, seconds);
      }, 300); // 300ms debounce delay
    },
    [updateDelayOffOptions]
  );

  // Reset RLC options to default
  const resetRlcOptions = useCallback(() => {
    setRlcOptions({
      ramp: 0,
      preset: 255,
      ledDisplay: 0,
      nightlight: false,
      backlight: false,
      autoMode: false,
      delayOff: { hours: 0, minutes: 0, seconds: 0 },
    });
    setDelayOffTime(timeToDate(0, 0, 0));
  }, []);

  // Get final RLC options for saving
  // Returns individual fields - backend will handle byte calculation
  const getFinalRlcOptions = useCallback(() => {
    // Calculate delay off in seconds
    const delayOffSeconds = calculateDelaySeconds(rlcOptions.delayOff.hours, rlcOptions.delayOff.minutes, rlcOptions.delayOff.seconds);

    return {
      ramp: rlcOptions.ramp,
      preset: rlcOptions.preset,
      ledDisplay: rlcOptions.ledDisplay,
      nightlight: rlcOptions.nightlight,
      backlight: rlcOptions.backlight,
      autoMode: rlcOptions.autoMode,
      delayOff: delayOffSeconds,
    };
  }, [rlcOptions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timePickerDebounceRef.current) {
        clearTimeout(timePickerDebounceRef.current);
      }
    };
  }, []);

  return {
    rlcOptions,
    delayOffTime,
    handleRlcOptionChange,
    handleDelayOffTimeChange,
    resetRlcOptions,
    getFinalRlcOptions,
  };
};
