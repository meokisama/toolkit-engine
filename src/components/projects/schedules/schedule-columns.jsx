import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/custom/time-picker";
import { MoreHorizontal, Edit, Copy, Trash2, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

// Debounced input component for table cells
const DebouncedInput = ({ value, onChange, placeholder, debounceMs = 500 }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const debounceTimeoutRef = useRef(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced onChange
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  return <Input value={localValue} onChange={handleChange} placeholder={placeholder} />;
};

// Compact time picker component for table cells with debounce
const CompactTimePicker = ({ value, onChange, debounceMs = 300 }) => {
  const debounceTimeoutRef = useRef(null);

  // Helper functions for time conversion
  const timeStringToDate = (timeString) => {
    if (!timeString) return new Date(new Date().setHours(0, 0, 0, 0));
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const dateToTimeString = (date) => {
    if (!date) return "";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [timeDate, setTimeDate] = useState(timeStringToDate(value));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleTimeChange = useCallback(
    (newDate) => {
      // Update local state immediately for responsive UI
      setTimeDate(newDate);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the onChange call
      debounceTimeoutRef.current = setTimeout(() => {
        const timeString = dateToTimeString(newDate);
        onChange(timeString);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Update timeDate when value prop changes
  useEffect(() => {
    setTimeDate(timeStringToDate(value));
  }, [value]);

  return (
    <div className="w-fit">
      <TimePicker date={timeDate} setDate={handleTimeChange} showSeconds={false} />
    </div>
  );
};

export function createScheduleColumns(onEdit, onDuplicate, onDelete, onCellEdit, getEffectiveValue, onSendSchedule) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="mx-1.5" />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[3%]",
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "name");
        return (
          <DebouncedInput value={value} onChange={(newValue) => onCellEdit(row.original.id, "name", newValue)} placeholder="Enter schedule name" />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[15%]",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "description");
        return (
          <DebouncedInput
            value={value}
            onChange={(newValue) => onCellEdit(row.original.id, "description", newValue)}
            placeholder="Enter description"
          />
        );
      },
    },
    {
      accessorKey: "time",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "time");
        return (
          <div className="flex items-center justify-center">
            <CompactTimePicker value={value} onChange={(timeString) => onCellEdit(row.original.id, "time", timeString)} debounceMs={300} />
          </div>
        );
      },
    },
    {
      accessorKey: "days",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Days" className="text-center" />,
      cell: ({ row }) => {
        const daysValue = getEffectiveValue(row.original, "days");
        let activeDays = [];

        try {
          activeDays = typeof daysValue === "string" ? JSON.parse(daysValue) : daysValue || [];
        } catch (e) {
          activeDays = [];
        }

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {DAYS_OF_WEEK.map((day) => (
              <Badge key={day.key} variant={activeDays.includes(day.key) ? "default" : "outline"} className="text-xs">
                {day.label}
              </Badge>
            ))}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "enabled",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Enable" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "enabled");
        const isEnabled = Boolean(value);
        return (
          <div className="flex items-center justify-center -ml-4">
            <Switch checked={isEnabled} onCheckedChange={(checked) => onCellEdit(row.original.id, "enabled", checked)} />
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "sceneCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Scenes" />,
      cell: ({ row }) => {
        const count = row.original.sceneCount || 0;
        return (
          <Badge variant="secondary" className="text-xs">
            {count} scene{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const schedule = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(schedule)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(schedule.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSendSchedule(schedule)}>
                <Send className="mr-2 h-4 w-4" />
                Send Schedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(schedule)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
