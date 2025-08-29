import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Copy,
  Trash2,
  Send,
  FileText,
  Hash,
  Settings,
} from "lucide-react";
import { CONSTANTS } from "@/constants";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export function createMultiSceneColumns(
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
            placeholder="Enter multi-scene name"
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
          <div className="w-full flex justify-center">
            <EditableCell
              value={effectiveValue?.toString() || ""}
              onSave={(newValue) => {
                onCellEdit(row.original.id, "address", newValue.toString());
              }}
              placeholder="0-255"
              type="number"
              className="text-center font-semibold w-full"
              icon={Hash}
            />
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[8%]",
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Type"
          className="flex items-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "type");
        return (
          <EditableSelectCell
            value={effectiveValue}
            options={CONSTANTS.MULTI_SCENES.TYPES}
            onSave={(newValue) => onCellEdit(row.original.id, "type", newValue)}
            placeholder="Select type"
            className="w-full"
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[8%]",
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
            className=""
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
      accessorKey: "sceneCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Scenes"
          className="flex items-center justify-center"
        />
      ),
      cell: ({ row }) => {
        const sceneCount = row.original.sceneCount || 0;
        return (
          <div className="flex justify-center">
            <Badge>
              {sceneCount} scene{sceneCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[15%]",
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const multiScene = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(multiScene)}
              className="cursor-pointer"
              title="Edit multi-scene"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSendToUnit(multiScene)}
              className="cursor-pointer"
              title="Send multi-scene to network unit"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDuplicate(multiScene.id)}
              className="cursor-pointer"
              title="Duplicate multi-scene"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(multiScene)}
              className="text-destructive hover:text-destructive cursor-pointer"
              title="Delete multi-scene"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[15%]",
      },
    },
  ];
}
