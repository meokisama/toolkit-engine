"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function EditableCheckboxCell({
  value,
  onSave,
  className,
  label,
  trueColor = "bg-green-100 text-green-800",
  falseColor = "bg-gray-100 text-gray-800",
  showBadge = true,
}) {
  const [editValue, setEditValue] = useState(Boolean(value));

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(Boolean(value));
  }, [value]);

  const handleCheckedChange = (checked) => {
    setEditValue(checked);
    if (checked !== Boolean(value)) {
      onSave(checked);
    }
  };

  if (showBadge) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={editValue}
            onCheckedChange={handleCheckedChange}
            className={cn("h-4 w-4", className)}
          />
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              editValue ? trueColor : falseColor
            }`}
          >
            {editValue ? "Yes" : "No"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={editValue}
        onCheckedChange={handleCheckedChange}
        className={cn("h-4 w-4", className)}
      />
      {label && <span className="ml-2 text-sm text-gray-700">{label}</span>}
    </div>
  );
}
