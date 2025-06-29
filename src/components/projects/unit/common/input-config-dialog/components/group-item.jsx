import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/custom/combobox";
import { Trash2, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";

// Memoized group item component for better performance
export const GroupItem = memo(
  ({
    group,
    index,
    lightingItem,
    lightingOptions,
    groupOptions,
    groupTypeLabel,
    usePercentage,
    onGroupChange,
    onValueChange,
    onRemoveGroup,
  }) => {
    const handleGroupChange = useCallback(
      (value) => {
        onGroupChange(index, value ? parseInt(value) : null);
      },
      [index, onGroupChange]
    );

    const handleValueChange = useCallback(
      (e) => {
        onValueChange(index, e.target.value);
      },
      [index, onValueChange]
    );

    const handleRemove = useCallback(() => {
      onRemoveGroup(index);
    }, [index, onRemoveGroup]);

    return (
      <div key={index} className="flex items-center gap-1">
        <div className="flex-1 space-y-2">
          {!group.groupAddress ? (
            <Combobox
              options={groupOptions || lightingOptions}
              value={group.lightingId?.toString() || ""}
              onValueChange={handleGroupChange}
              placeholder={`Select ${
                groupTypeLabel?.toLowerCase() || "lighting"
              } group...`}
              emptyText={`No ${
                groupTypeLabel?.toLowerCase() || "lighting"
              } found`}
            />
          ) : (
            <div className="text-sm text-muted-foreground p-2 border rounded">
              Address: {group.groupAddress} (Not in database)
            </div>
          )}
        </div>
        <div className="relative w-24 space-y-2">
          <Sun className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={usePercentage ? 0 : 0}
            max={usePercentage ? 100 : 255}
            value={usePercentage ? group.presetPercent : group.preset}
            onChange={handleValueChange}
            className="pl-8 font-semibold"
            placeholder={usePercentage ? "0-100" : "0-255"}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

GroupItem.displayName = "GroupItem";
