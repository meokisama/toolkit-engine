import { useState, useCallback, useRef, useEffect } from "react";
import { calculateDelaySeconds, parseDelaySeconds, calculateLedStatus, parseLedStatus } from "@/constants";
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
  useEffect(() => {
    if (initialRlcOptions && Object.keys(initialRlcOptions).length > 0) {
      // Parse delay off time - handle both formats
      const delaySeconds = initialRlcOptions.delayOff || initialRlcOptions.delay_off || 0;
      const delayTime = parseDelaySeconds(delaySeconds);

      // Handle ledStatus - it can be a number or an object with raw property
      let ledStatusValue = 0;

      // Check for led_status (network format) first
      if (initialRlcOptions.led_status !== undefined) {
        ledStatusValue = initialRlcOptions.led_status;
      } else if (typeof initialRlcOptions.ledStatus === "number") {
        ledStatusValue = initialRlcOptions.ledStatus;
      } else if (initialRlcOptions.ledStatus && typeof initialRlcOptions.ledStatus === "object") {
        // If it's already parsed object from service, use the raw value
        if (initialRlcOptions.ledStatus.raw !== undefined) {
          ledStatusValue = initialRlcOptions.ledStatus.raw;
        } else {
          // If it's an object with individual properties, calculate the raw value
          ledStatusValue = calculateLedStatus(
            initialRlcOptions.ledStatus.displayMode || 0,
            initialRlcOptions.ledStatus.nightlight || false,
            initialRlcOptions.ledStatus.backlight || false
          );
        }
      }

      const ledStatusParsed = parseLedStatus(ledStatusValue);

      setRlcOptions({
        ramp: initialRlcOptions.ramp ?? 0,
        preset: initialRlcOptions.preset ?? 255,
        ledDisplay: ledStatusParsed.displayMode,
        nightlight: ledStatusParsed.nightlight,
        backlight: ledStatusParsed.backlight,
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
  const getFinalRlcOptions = useCallback(() => {
    // Calculate LED status from display mode and flags
    const ledStatus = calculateLedStatus(rlcOptions.ledDisplay, rlcOptions.nightlight, rlcOptions.backlight);

    // Calculate delay off in seconds
    const delayOffSeconds = calculateDelaySeconds(rlcOptions.delayOff.hours, rlcOptions.delayOff.minutes, rlcOptions.delayOff.seconds);

    return {
      ramp: rlcOptions.ramp,
      preset: rlcOptions.preset,
      ledStatus: ledStatus,
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
