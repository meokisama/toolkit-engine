import React, { useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Memoized available group item component
export const AvailableGroupItem = memo(({ item, onAddFromAvailable }) => {
  const handleAdd = useCallback(() => {
    onAddFromAvailable(item);
  }, [item, onAddFromAvailable]);

  return (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 border rounded-lg"
    >
      <div>
        <div className="font-medium text-sm">
          {item.name || `Group ${item.address}`}
        </div>
        <div className="text-xs text-muted-foreground">
          Address: {item.address}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
      </div>
      <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
});

AvailableGroupItem.displayName = "AvailableGroupItem";
