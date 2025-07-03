import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Send,
  FileText,
  Hash,
} from "lucide-react";
import { CONSTANTS } from "@/constants";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export function createSequenceColumns(
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue,
  onSendToUnit
) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="mx-1.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[3%]",
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "name");
        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => onCellEdit(row.original.id, "name", newValue)}
            placeholder="Enter sequence name"
            className="font-medium"
            icon={FileText}
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[20%]",
      },
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Address"
          className="flex items-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "address");
        return (
          <EditableCell
            value={effectiveValue?.toString() || ""}
            onSave={(newValue) => {
              const numValue = parseInt(newValue);
              if (isNaN(numValue) || numValue < 1 || numValue > 255) {
                throw new Error("Address must be between 1 and 255");
              }
              onCellEdit(row.original.id, "address", numValue);
            }}
            placeholder="1-255"
            className="text-center w-full"
            icon={Hash}
            type="number"
            min="1"
            max="255"
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "multiSceneCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Multi-Scenes"
          className="flex items-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const count = row.original.multiSceneCount || 0;
        return (
          <div className="w-full flex justify-center">
            <Badge className="text-xs">{count}</Badge>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[12%]",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "description");
        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) =>
              onCellEdit(row.original.id, "description", newValue)
            }
            placeholder="Enter description"
            className="text-muted-foreground"
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[30%]",
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const sequence = row.original;

        return (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(sequence)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(sequence.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSendToUnit(sequence)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Unit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(sequence.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[5%]",
      },
    },
  ];
}
