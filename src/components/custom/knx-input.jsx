import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export const KNXAddressInput = ({
  value = "",
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
  showValidationHints = false,
  placeholder = "0/0/0",
  size = "default",
  debounceMs = 500,
  ...props
}) => {
  const [values, setValues] = useState(() => {
    const parts = value.split(/[./]/).filter(Boolean);
    return {
      area: parts[0] || "",
      line: parts[1] || "",
      device: parts[2] || "",
    };
  });

  const refs = {
    area: useRef(null),
    line: useRef(null),
    device: useRef(null),
  };

  // Debounce timeout ref
  const debounceTimeoutRef = useRef(null);
  const latestValueRef = useRef(null);

  // Debounced onChange function
  const debouncedOnChange = useCallback(
    (fullAddress) => {
      latestValueRef.current = fullAddress;

      if (debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          onChange?.(fullAddress);
          latestValueRef.current = null;
        }, debounceMs);
      } else {
        onChange?.(fullAddress);
        latestValueRef.current = null;
      }
    },
    [onChange, debounceMs]
  );

  // Cleanup timeout on unmount and flush pending changes
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        // Flush pending change before unmount
        if (latestValueRef.current) {
          onChange?.(latestValueRef.current);
        }
      }
    };
  }, [onChange]);

  // Sync external value changes
  useEffect(() => {
    const parts = value.split(/[./]/).filter(Boolean);
    const newValues = {
      area: parts[0] || "",
      line: parts[1] || "",
      device: parts[2] || "",
    };

    // Compare current internal state with new external value
    setValues((prevValues) => {
      const hasChanged =
        prevValues.area !== newValues.area || prevValues.line !== newValues.line || prevValues.device !== newValues.device;

      return hasChanged ? newValues : prevValues;
    });
  }, [value]);

  const updateValue = useCallback(
    (field, newValue) => {
      const updatedValues = { ...values, [field]: newValue };
      setValues(updatedValues);

      // Always use / separator for output to match KNX standard
      const fullAddress = `${updatedValues.area}/${updatedValues.line}/${updatedValues.device}`;
      debouncedOnChange(fullAddress);

      // Check if address is complete
      if (updatedValues.area && updatedValues.line && updatedValues.device) {
        onComplete?.(fullAddress);
      }
    },
    [values, debouncedOnChange, onComplete]
  );

  const handleInputChange = useCallback(
    (field, event) => {
      const inputValue = event.target.value;

      // Only allow numbers
      if (!/^\d*$/.test(inputValue)) return;

      updateValue(field, inputValue);

      // Auto-focus next input when reaching max length for each field
      const maxLengths = { area: 2, line: 1, device: 3 };
      if (inputValue.length === maxLengths[field]) {
        const nextField = field === "area" ? "line" : field === "line" ? "device" : null;
        if (nextField && refs[nextField].current) {
          setTimeout(() => refs[nextField].current.focus(), 0);
        }
      }
    },
    [updateValue]
  );

  const handleKeyDown = useCallback(
    (field, event) => {
      // Handle "." and "/" to move to next field
      if (event.key === "." || event.key === "/") {
        event.preventDefault();
        const nextField = field === "area" ? "line" : field === "line" ? "device" : null;
        if (nextField && refs[nextField].current) {
          refs[nextField].current.focus();
          refs[nextField].current.select();
        }
        return;
      }

      // Enhanced backspace navigation
      if (event.key === "Backspace" && !values[field]) {
        event.preventDefault();
        const prevField = field === "device" ? "line" : field === "line" ? "area" : null;
        if (prevField && refs[prevField].current) {
          refs[prevField].current.focus();
          refs[prevField].current.select();
        }
      }

      // Arrow key navigation
      if (event.key === "ArrowLeft" && event.target.selectionStart === 0) {
        event.preventDefault();
        const prevField = field === "device" ? "line" : field === "line" ? "area" : null;
        if (prevField && refs[prevField].current) {
          refs[prevField].current.focus();
          refs[prevField].current.setSelectionRange(refs[prevField].current.value.length, refs[prevField].current.value.length);
        }
      }

      if (event.key === "ArrowRight" && event.target.selectionStart === event.target.value.length) {
        event.preventDefault();
        const nextField = field === "area" ? "line" : field === "line" ? "device" : null;
        if (nextField && refs[nextField].current) {
          refs[nextField].current.focus();
          refs[nextField].current.setSelectionRange(0, 0);
        }
      }

      // Tab navigation enhancement
      if (event.key === "Tab" && !event.shiftKey) {
        const nextField = field === "area" ? "line" : field === "line" ? "device" : null;
        if (nextField && refs[nextField].current) {
          event.preventDefault();
          refs[nextField].current.focus();
          refs[nextField].current.select();
        }
      }

      if (event.key === "Tab" && event.shiftKey) {
        const prevField = field === "device" ? "line" : field === "line" ? "area" : null;
        if (prevField && refs[prevField].current) {
          event.preventDefault();
          refs[prevField].current.focus();
          refs[prevField].current.select();
        }
      }
    },
    [values]
  );

  const handlePaste = useCallback(
    (event) => {
      event.preventDefault();
      const pastedText = event.clipboardData.getData("text").trim();

      // Handle both . and / separators
      const parts = pastedText.split(/[./]/).filter(Boolean);

      if (parts.length === 3) {
        const [area, line, device] = parts;
        // Only allow numeric values
        if (/^\d+$/.test(area) && /^\d+$/.test(line) && /^\d+$/.test(device)) {
          setValues({ area, line, device });
          const fullAddress = `${area}/${line}/${device}`;
          debouncedOnChange(fullAddress);
          onComplete?.(fullAddress);

          // Focus the last field after paste
          setTimeout(() => {
            if (refs.device.current) {
              refs.device.current.focus();
              refs.device.current.select();
            }
          }, 0);
        }
      }
    },
    [debouncedOnChange, onComplete]
  );

  // Size variants
  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-sm",
    lg: "h-10 text-base",
  };

  const fieldWidths = {
    area: size === "sm" ? "w-10" : size === "lg" ? "w-14" : "w-12",
    line: size === "sm" ? "w-10" : size === "lg" ? "w-14" : "w-12",
    device: size === "sm" ? "w-10" : size === "lg" ? "w-14" : "w-12",
  };

  const renderInput = (field, maxLength) => {
    return (
      <div className="relative">
        <input
          ref={refs[field]}
          type="text"
          value={values[field]}
          onChange={(e) => handleInputChange(field, e)}
          onKeyDown={(e) => handleKeyDown(field, e)}
          onPaste={handlePaste}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            "text-center border rounded-md transition-all duration-200",
            "focus:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "placeholder:text-muted-foreground",
            "border-input bg-background hover:border-ring/50",
            sizeClasses[size],
            fieldWidths[field],

            // Disabled state
            disabled && "opacity-50 cursor-not-allowed bg-muted",

            className
          )}
          {...props}
        />
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1">
        {renderInput("area", "2")}
        <span className="text-muted-foreground font-medium select-none">/</span>
        {renderInput("line", "1")}
        <span className="text-muted-foreground font-medium select-none">/</span>
        {renderInput("device", "3")}
      </div>
    </div>
  );
};
