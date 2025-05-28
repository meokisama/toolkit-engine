"use client";

import { Copy, SquarePen, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UNIT_TYPES, UNIT_MODES } from "@/constants";

// Convert string arrays to option objects for select components
const UNIT_TYPE_OPTIONS = UNIT_TYPES.map((type) => ({
  value: type,
  label: type,
}));
const UNIT_MODE_OPTIONS = UNIT_MODES.map((mode) => ({
  value: mode,
  label: mode,
}));

export const createUnitColumns = (
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue
) => [
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
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type");
      const effectiveValue = getEffectiveValue(row.original.id, "type", type);

      return (
        <EditableSelectCell
          value={effectiveValue}
          options={UNIT_TYPE_OPTIONS}
          onSave={(newValue) => onCellEdit(row.original.id, "type", newValue)}
          placeholder="Choose unit type"
          renderBadge={false}
          badgeVariant="secondary"
          className="w-full"
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "serial_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial No." />
    ),
    cell: ({ row }) => {
      const serialNo = row.getValue("serial_no");
      const effectiveValue = getEffectiveValue(
        row.original.id,
        "serial_no",
        serialNo
      );
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) =>
            onCellEdit(row.original.id, "serial_no", newValue)
          }
          className="font-mono text-sm w-full"
          placeholder="-"
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP Address" />
    ),
    cell: ({ row }) => {
      const ipAddress = row.getValue("ip_address");
      const effectiveValue = getEffectiveValue(
        row.original.id,
        "ip_address",
        ipAddress
      );
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) =>
            onCellEdit(row.original.id, "ip_address", newValue)
          }
          className="font-mono text-sm w-full"
          placeholder="-"
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "id_can",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID CAN" />
    ),
    cell: ({ row }) => {
      const idCan = row.getValue("id_can");
      const effectiveValue = getEffectiveValue(
        row.original.id,
        "id_can",
        idCan
      );
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "id_can", newValue)}
          className="font-mono text-sm w-full"
          placeholder="-"
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "mode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mode" />
    ),
    cell: ({ row }) => {
      const mode = row.getValue("mode");
      const effectiveValue = getEffectiveValue(row.original.id, "mode", mode);

      const getVariant = (mode) => {
        switch (mode) {
          case "Master":
            return "default";
          case "Slave":
            return "secondary";
          case "Stand Alone":
            return "outline";
          default:
            return "secondary";
        }
      };

      return (
        <EditableSelectCell
          value={effectiveValue}
          options={UNIT_MODE_OPTIONS}
          onSave={(newValue) => onCellEdit(row.original.id, "mode", newValue)}
          placeholder="Choose mode"
          renderBadge={false}
          badgeVariant={getVariant(effectiveValue)}
          className="w-full"
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
    accessorKey: "firmware_version",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Firmware" />
    ),
    cell: ({ row }) => {
      const firmwareVersion = row.getValue("firmware_version");
      const effectiveValue = getEffectiveValue(
        row.original.id,
        "firmware_version",
        firmwareVersion
      );
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) =>
            onCellEdit(row.original.id, "firmware_version", newValue)
          }
          className="font-mono text-sm w-full"
          placeholder="-"
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
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      const effectiveValue = getEffectiveValue(
        row.original.id,
        "description",
        description
      );
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) =>
            onCellEdit(row.original.id, "description", newValue)
          }
          placeholder="-"
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
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="text-red-600" />
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
      className: "w-[10%]",
    },
  },
];
