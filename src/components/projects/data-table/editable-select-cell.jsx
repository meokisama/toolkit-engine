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
  const [editValue, setEditValue] = useState(value || "");

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const handleValueChange = (newValue) => {
    setEditValue(newValue);
    if (newValue !== value) {
      onSave(newValue);
    }
  };

  const displayText = renderValue ? renderValue(editValue) : editValue;

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
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
