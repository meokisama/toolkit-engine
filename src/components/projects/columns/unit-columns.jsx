"use client";

import { Copy, SquarePen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";

export const createUnitColumns = (onEdit, onDuplicate, onDelete) => [
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
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name");
      return <div className="font-medium">{name}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type");
      return type ? (
        <Badge variant="secondary" className="text-xs">
          {type}
        </Badge>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "serial_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial No." />
    ),
    cell: ({ row }) => {
      const serialNo = row.getValue("serial_no");
      return <div className="font-mono text-sm">{serialNo || "-"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP Address" />
    ),
    cell: ({ row }) => {
      const ipAddress = row.getValue("ip_address");
      return <div className="font-mono text-sm">{ipAddress || "-"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "id_can",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID CAN" />
    ),
    cell: ({ row }) => {
      const idCan = row.getValue("id_can");
      return <div className="font-mono text-sm">{idCan || "-"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "mode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mode" />
    ),
    cell: ({ row }) => {
      const mode = row.getValue("mode");
      if (!mode) return <div className="text-muted-foreground">-</div>;
      
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
        <Badge variant={getVariant(mode)} className="text-xs">
          {mode}
        </Badge>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "firmware_version",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Firmware" />
    ),
    cell: ({ row }) => {
      const firmwareVersion = row.getValue("firmware_version");
      return <div className="font-mono text-sm">{firmwareVersion || "-"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return <div className="max-w-[150px] truncate">{description || "-"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDuplicate(item)}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(item)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
