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
import { MoreHorizontal, Edit, Copy, Trash2 } from "lucide-react";
import { CONSTANTS } from "@/constants";

export function createMultiSceneColumns(
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue
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
      header: "Name",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const effectiveValue = getEffectiveValue(row.original, "name", value);
        return (
          <div
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[2rem] flex items-center"
            onClick={() => onCellEdit(row.original, "name", effectiveValue)}
          >
            {effectiveValue || ""}
          </div>
        );
      },
      meta: {
        className: "w-[25%]",
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const effectiveValue = getEffectiveValue(row.original, "type", value);
        const typeLabel = CONSTANTS.MULTI_SCENES.TYPES.find(t => t.value === effectiveValue)?.label || "Unknown";
        return (
          <div
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[2rem] flex items-center"
            onClick={() => onCellEdit(row.original, "type", effectiveValue)}
          >
            {typeLabel}
          </div>
        );
      },
      meta: {
        className: "w-[15%]",
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const effectiveValue = getEffectiveValue(row.original, "description", value);
        return (
          <div
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[2rem] flex items-center"
            onClick={() => onCellEdit(row.original, "description", effectiveValue)}
          >
            {effectiveValue || ""}
          </div>
        );
      },
      meta: {
        className: "w-[35%]",
      },
    },
    {
      accessorKey: "sceneCount",
      header: "Scenes",
      cell: ({ row }) => {
        const sceneCount = row.original.sceneCount || 0;
        return (
          <div className="text-center">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {sceneCount}
            </span>
          </div>
        );
      },
      meta: {
        className: "w-[10%]",
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const multiScene = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(multiScene)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(multiScene.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(multiScene.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[12%]",
      },
    },
  ];
}
