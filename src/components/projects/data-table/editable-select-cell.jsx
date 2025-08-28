"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EditableSelectCell({
  value,
  options = [],
  onSave,
  className,
  placeholder = "Select...",
  renderValue,
  renderBadge = false,
  badgeVariant = "secondary",
}) {
  // Convert value to string for Select component compatibility
  const [editValue, setEditValue] = useState(value !== null && value !== undefined ? String(value) : "");

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value !== null && value !== undefined ? String(value) : "");
  }, [value]);

  const handleValueChange = (newValue) => {
    setEditValue(newValue);
    // Convert back to original type if it was a number
    const originalOption = options.find(opt => String(opt.value) === newValue);
    const convertedValue = originalOption ? originalOption.value : newValue;

    if (convertedValue !== value) {
      onSave(convertedValue);
    }
  };

  // Find the option for display text
  const selectedOption = options.find(opt => String(opt.value) === editValue);
  const displayText = renderValue ? renderValue(editValue) : (selectedOption ? selectedOption.label : editValue);

  return (
    <Select value={editValue} onValueChange={handleValueChange}>
      <SelectTrigger className={cn("!h-10", className)}>
        {renderBadge && editValue ? (
          <Badge variant={badgeVariant} className="text-xs">
            {displayText}
          </Badge>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
