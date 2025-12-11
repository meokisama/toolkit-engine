import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const EditableCell = memo(
  function EditableCell({ value, type = "text", onSave, className, placeholder, displayValue, icon: Icon, ...props }) {
    const [editValue, setEditValue] = useState(value || "");
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Update editValue when value prop changes
    useEffect(() => {
      setEditValue(value || "");
    }, [value]);

    // Memoized debounced save function
    const debouncedSave = useCallback(
      (newValue) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (newValue !== value && newValue.trim() !== value?.trim()) {
            onSave(newValue);
          }
        }, 500);
      },
      [value, onSave]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Memoized handlers
    const handleChange = useCallback(
      (e) => {
        const newValue = e.target.value;
        setEditValue(newValue);
        debouncedSave(newValue);
      },
      [debouncedSave]
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (editValue !== value) {
            onSave(editValue);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          setEditValue(value || "");
        }
      },
      [editValue, value, onSave]
    );

    const handleBlur = useCallback(() => {
      if (editValue !== value) {
        onSave(editValue);
      }
    }, [editValue, value, onSave]);

    // Memoized input props
    const inputProps = useCallback(
      () => ({
        ref: inputRef,
        value: editValue,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        className: cn("h-10", Icon ? "pl-8 pr-2" : "px-2", className),
        placeholder: placeholder || "-",
        ...props,
      }),
      [editValue, handleChange, handleKeyDown, handleBlur, Icon, className, placeholder, props]
    );

    const currentInputProps = inputProps();

    const inputElement =
      type === "number" ? <Input {...currentInputProps} type="number" min="1" max="255" step="1" /> : <Input {...currentInputProps} type="text" />;

    if (Icon) {
      return (
        <div className="relative">
          <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          {inputElement}
        </div>
      );
    }

    return inputElement;
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.value === nextProps.value &&
      prevProps.type === nextProps.type &&
      prevProps.className === nextProps.className &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.icon === nextProps.icon
    );
  }
);
