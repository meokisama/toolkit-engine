import React, { useCallback, useState, useEffect } from "react";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

function DataTableViewOptionsComponent({ table, columnVisibility }) {
  // Use prop-based state instead of internal state management
  const [localColumnVisibility, setLocalColumnVisibility] = useState(columnVisibility || {});

  // Update local state when prop changes
  useEffect(() => {
    if (columnVisibility) {
      setLocalColumnVisibility(columnVisibility);
    }
  }, [columnVisibility]);

  // Memoize the columns to prevent unnecessary recalculations
  const hidableColumns = React.useMemo(() => {
    if (!table) return [];

    return table.getAllColumns().filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide());
  }, [table]);

  // Optimized toggle handler with immediate UI feedback
  const handleColumnToggle = useCallback((column, value) => {
    // Update local state first for immediate UI feedback
    setLocalColumnVisibility((prev) => ({
      ...prev,
      [column.id]: !!value,
    }));

    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      column.toggleVisibility(!!value);
    });
  }, []);

  if (!table) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="h-4 w-4" />
          <span className="hidden lg:inline">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hidableColumns.map((column) => {
          // Use local state for checked status
          const isVisible = localColumnVisibility[column.id] !== false;

          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={isVisible}
              onCheckedChange={(value) => handleColumnToggle(column, value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Memoize component to prevent unnecessary rerenders
export const DataTableViewOptions = React.memo(DataTableViewOptionsComponent);
