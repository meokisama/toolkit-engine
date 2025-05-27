import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import {
  Settings,
  Palette,
  MoreHorizontal,
  SquarePen,
  Copy,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      className: "w-[30%]",
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
      className: "w-[40%]",
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
    id: "manage",
    header: "Manage",
    cell: ({ row }) => {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(row.original)}
          className="h-8 px-2"
        >
          <Settings className="h-4 w-4 mr-1" />
          Manage
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: "w-[12%]",
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                className="cursor-pointer"
              >
                <SquarePen className="text-muted-foreground" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDuplicate(item)}
                className="cursor-pointer"
              >
                <Copy className="text-muted-foreground" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="text-destructive" />
                <span>Delete</span>
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
