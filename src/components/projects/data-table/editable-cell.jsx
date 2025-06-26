"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const EditableCell = memo(function EditableCell({
  value,
  type = "text",
  onSave,
  className,
  placeholder,
  displayValue,
  icon: Icon,
  ...props
}) {
  const [editValue, setEditValue] = useState(value || "");
  const inputRef = useRef(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId;
      return (newValue) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (newValue !== value && newValue.trim() !== value?.trim()) {
            onSave(newValue);
          }
        }, 500); // 500ms debounce
      };
    })(),
    [value, onSave]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    debouncedSave(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editValue !== value) {
        onSave(editValue);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditValue(value || "");
    }
  };

  const handleBlur = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const inputProps = {
    ref: inputRef,
    value: editValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    className: cn("h-10", Icon ? "pl-8 pr-2" : "px-2", className),
    placeholder: placeholder || "-",
    ...props,
  };

  const inputElement =
    type === "number" ? (
      <Input {...inputProps} type="number" min="1" max="255" step="1" />
    ) : (
      <Input {...inputProps} type="text" />
    );

  if (Icon) {
    return (
      <div className="relative">
        <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {inputElement}
      </div>
    );
  }

  return inputElement;
});
