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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name");
      const effectiveValue = getEffectiveValue(row.original.id, "name", name);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "name", newValue)}
          className="font-medium"
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
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type");
      const effectiveValue = getEffectiveValue(row.original.id, "type", type);
      const UNIT_TYPES = [
        { value: "RLC-416", label: "RLC-416" },
        { value: "RLC-420", label: "RLC-420" },
        { value: "Bedado-17T", label: "Bedado-17T" },
        { value: "RLC-520", label: "RLC-520" },
        { value: "BSP_R14_OL", label: "BSP_R14_OL" },
        { value: "Bedado-12T", label: "Bedado-12T" },
        { value: "RCU-35L-2440", label: "RCU-35L-2440" },
        { value: "RCU-32A0", label: "RCU-32A0" },
        { value: "RCU-24RL-840", label: "RCU-24RL-840" },
        { value: "RCU-16RL-1840", label: "RCU-16RL-1840" },
        { value: "RCU-21N-8RL", label: "RCU-21N-8RL" },
        { value: "RCU-21N-16RL-1A0", label: "RCU-21N-16RL-1A0" },
        { value: "RCU-21N-8RL-4AI", label: "RCU-21N-8RL-4AI" },
        { value: "RCU-21N-16RL-5DL", label: "RCU-21N-16RL-5DL" },
        { value: "RCU-21N-16RL", label: "RCU-21N-16RL" },
        { value: "RCU-48N-32A0", label: "RCU-48N-32A0" },
        { value: "RCU-48N-16RL", label: "RCU-48N-16RL" },
        { value: "RCU-48N-16RL-1A0", label: "RCU-48N-16RL-1A0" },
        { value: "RCU-48N-16RL-5AI", label: "RCU-48N-16RL-5AI" },
        { value: "RCU-48N-16RL-5DL", label: "RCU-48N-16RL-5DL" },
        { value: "GNT-EXT-32L", label: "GNT-EXT-32L" },
        { value: "GNT-EXT-8RL", label: "GNT-EXT-8RL" },
        { value: "GNT-EXT-16RL", label: "GNT-EXT-16RL" },
        { value: "GNT-EXT-20RL", label: "GNT-EXT-20RL" },
        { value: "GNT-EXT-32RL", label: "GNT-EXT-32RL" },
        { value: "GNT-EXT-28A0", label: "GNT-EXT-28A0" },
        { value: "GNT-EXT-20RL-12A0", label: "GNT-EXT-20RL-12A0" },
        { value: "GNT-EXT-24IN", label: "GNT-EXT-24IN" },
        { value: "GNT-EXT-48IN", label: "GNT-EXT-48IN" },
      ];

      return (
        <EditableSelectCell
          value={effectiveValue}
          options={UNIT_TYPES}
          onSave={(newValue) => onCellEdit(row.original.id, "type", newValue)}
          placeholder="Choose unit type"
          renderBadge={false}
          badgeVariant="secondary"
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
          className="font-mono text-sm"
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
          className="font-mono text-sm"
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
          className="font-mono text-sm"
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
    accessorKey: "mode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mode" />
    ),
    cell: ({ row }) => {
      const mode = row.getValue("mode");
      const effectiveValue = getEffectiveValue(row.original.id, "mode", mode);
      const UNIT_MODES = [
        { value: "Slave", label: "Slave" },
        { value: "Master", label: "Master" },
        { value: "Stand Alone", label: "Stand Alone" },
      ];

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
          options={UNIT_MODES}
          onSave={(newValue) => onCellEdit(row.original.id, "mode", newValue)}
          placeholder="Choose mode"
          renderBadge={false}
          badgeVariant={getVariant(effectiveValue)}
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
          className="font-mono text-sm"
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
          className="max-w-[150px]"
          placeholder="-"
        />
      );
    },
    enableSorting: true,
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
