import React, { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "lucide-react";

export const DatabaseUnitSelector = forwardRef(
  (
    {
      value,
      onValueChange,
      units = [],
      disabled = false,
      placeholder = "Select a database unit",
    },
    ref
  ) => {
    const getUnitDisplayName = (unit) => {
      return `${unit.type} - ${unit.ip_address} (${unit.id_can})`;
    };

    return (
      <div className="space-y-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {units.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Database className="h-4 w-4 mr-2" />
                No database units available
              </div>
            ) : (
              units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <div className="font-medium">
                      {getUnitDisplayName(unit)}
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

DatabaseUnitSelector.displayName = "DatabaseUnitSelector";
