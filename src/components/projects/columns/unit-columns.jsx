"use client";

import { Copy, SquarePen, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  },
];
