import { useState, useCallback, useRef, useEffect } from "react";
import { calculateDelaySeconds, parseDelaySeconds } from "@/constants";
import { timeToDate, dateToTimeComponents, validateDelayOffTime } from "../utils/time-helpers";

// Constants
const DEFAULT_DELAY = { hours: 0, minutes: 0, seconds: 0 };
const DEFAULT_RLC_OPTIONS = {
  ramp: 0,
  preset: 255,
  ledDisplay: 0,
  nightlight: false,
  backlight: false,
  autoMode: false,
  delayOff: DEFAULT_DELAY,
};

export const useRlcOptions = (initialRlcOptions = {}) => {
  const [rlcOptions, setRlcOptions] = useState(DEFAULT_RLC_OPTIONS);
  const [delayOffTime, setDelayOffTime] = useState(timeToDate(0, 0, 0));
  const debounceRef = useRef(null);

  // Initialize from props - backend already parses ledStatus into individual fields
  useEffect(() => {
    if (!initialRlcOptions || Object.keys(initialRlcOptions).length === 0) return;

    const delaySeconds = initialRlcOptions.delayOff || initialRlcOptions.delay_off || 0;
    const delayTime = parseDelaySeconds(delaySeconds);

    setRlcOptions({
      ramp: initialRlcOptions.ramp ?? 0,
      preset: initialRlcOptions.preset ?? 255,
      ledDisplay: initialRlcOptions.ledDisplay ?? 0,
      nightlight: initialRlcOptions.nightlight ?? false,
      backlight: initialRlcOptions.backlight ?? false,
      autoMode: initialRlcOptions.autoMode ?? initialRlcOptions.auto_mode ?? false,
      delayOff: delayTime,
    });
    setDelayOffTime(timeToDate(delayTime.hours, delayTime.minutes, delayTime.seconds));
  }, [initialRlcOptions]);

  // Cleanup debounce on unmount
  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  const handleRlcOptionChange = useCallback((field, value) => {
    setRlcOptions((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDelayOffTimeChange = useCallback((newDate) => {
    setDelayOffTime(newDate);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const { hours, minutes, seconds } = dateToTimeComponents(newDate);
      setRlcOptions((prev) => ({ ...prev, delayOff: validateDelayOffTime(hours, minutes, seconds) }));
    }, 300);
  }, []);

  const resetRlcOptions = useCallback(() => {
    setRlcOptions(DEFAULT_RLC_OPTIONS);
    setDelayOffTime(timeToDate(0, 0, 0));
  }, []);

  // Returns individual fields - backend handles byte calculation
  const getFinalRlcOptions = useCallback(() => {
    const { delayOff, ...rest } = rlcOptions;
    return { ...rest, delayOff: calculateDelaySeconds(delayOff.hours, delayOff.minutes, delayOff.seconds) };
  }, [rlcOptions]);

  return { rlcOptions, delayOffTime, handleRlcOptionChange, handleDelayOffTimeChange, resetRlcOptions, getFinalRlcOptions };
};
