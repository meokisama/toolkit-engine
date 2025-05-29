import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { Settings, Palette, SquarePen, Copy, Trash2 } from "lucide-react";

export const createSceneColumns = (onEdit, onDuplicate, onDelete) => [
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
      className: "w-[5%]",
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" className="pl-1" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name");
      return (
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-purple-500" />
          <span className="font-medium">{name || "Untitled Scene"}</span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[20%]",
    },
  },

  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        className="pl-1"
      />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <span className="text-muted-foreground">
          {description || "No description"}
        </span>
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[30%]",
    },
  },
  {
    id: "itemCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" className="pl-1" />
    ),
    cell: ({ row }) => {
      // This will be populated by the parent component with scene item count
      const itemCount = row.original.itemCount || 0;
      return (
        <Badge variant="secondary">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Badge>
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[10%]",
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(item)}
            className="cursor-pointer"
            title="Manage scene items"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDuplicate(item)}
            className="cursor-pointer"
            title="Duplicate scene"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(item)}
            className="text-destructive hover:text-destructive cursor-pointer"
            title="Delete scene"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: "w-[17%]",
    },
  },
];
