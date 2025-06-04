import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { MoreHorizontal, Edit, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Compact time picker component for table cells
const CompactTimePicker = ({ value, onChange }) => {
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

  const handleTimeChange = useCallback(
    (newDate) => {
      setTimeDate(newDate);
      const timeString = dateToTimeString(newDate);
      onChange(timeString);
    },
    [onChange]
  );

  // Update timeDate when value prop changes
  React.useEffect(() => {
    setTimeDate(timeStringToDate(value));
  }, [value]);

  return (
    <div className="w-fit">
      <TimePicker
        date={timeDate}
        setDate={handleTimeChange}
        showSeconds={false}
      />
    </div>
  );
};

export function createScheduleColumns(
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue
) {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "name");
        return (
          <Input
            value={value}
            onChange={(e) =>
              onCellEdit(row.original.id, "name", e.target.value)
            }
            placeholder="Enter schedule name"
          />
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "description");
        return (
          <Input
            value={value}
            onChange={(e) =>
              onCellEdit(row.original.id, "description", e.target.value)
            }
            placeholder="Enter description"
          />
        );
      },
    },
    {
      accessorKey: "time",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Time"
          className="flex items-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const value = getEffectiveValue(row.original, "time");
        return (
          <div className="flex items-center justify-center">
            <CompactTimePicker
              value={value}
              onChange={(timeString) =>
                onCellEdit(row.original.id, "time", timeString)
              }
            />
          </div>
        );
      },
    },
    {
      accessorKey: "days",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Days"
          className="text-center"
        />
      ),
      cell: ({ row }) => {
        const daysValue = getEffectiveValue(row.original, "days");
        let activeDays = [];

        try {
          activeDays =
            typeof daysValue === "string"
              ? JSON.parse(daysValue)
              : daysValue || [];
        } catch (e) {
          activeDays = [];
        }

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {DAYS_OF_WEEK.map((day) => (
              <Badge
                key={day.key}
                variant={activeDays.includes(day.key) ? "default" : "outline"}
                className="text-xs"
              >
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
      accessorKey: "sceneCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Scenes" />
      ),
      cell: ({ row }) => {
        const count = row.original.sceneCount || 0;
        return (
          <Badge variant="secondary" className="text-xs">
            {count} scene{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
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
              <DropdownMenuItem
                onClick={() => onDelete(schedule.id)}
                className="text-destructive"
              >
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
