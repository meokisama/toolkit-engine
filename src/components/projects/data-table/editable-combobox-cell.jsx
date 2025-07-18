"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function EditableComboboxCell({
  value,
  options = [],
  onSave,
  className,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
}) {
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const handleSelect = (selectedValue) => {
    // Convert string back to number if it's a numeric value
    const normalizedValue =
      !isNaN(selectedValue) && selectedValue !== ""
        ? Number(selectedValue)
        : selectedValue;

    setEditValue(normalizedValue);
    setOpen(false);

    // Use loose equality to handle string/number type mismatches
    if (normalizedValue != value) {
      onSave(normalizedValue);
    }
  };

  // Find the selected option to display its label
  // Use loose equality to handle string/number type mismatches
  const selectedOption = options.find((option) => option.value == editValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between text-left font-normal",
            !editValue && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {/* Clear option */}
              <CommandItem value="" onSelect={handleSelect}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !editValue ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">Clear selection</span>
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={String(option.value)}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      editValue == option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
