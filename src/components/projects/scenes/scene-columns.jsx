import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { DataTableFilterColumnHeader } from "@/components/projects/data-table/data-table-filter-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { Settings, Copy, Trash2, SlidersHorizontal, Layers, FilePen, Send } from "lucide-react";

export const createSceneColumns = (onEdit, onDuplicate, onDelete, onCellEdit, getEffectiveValue, onSendToUnit, unitItems = []) => {
  // Create filter options for source unit
  const sourceUnitFilterOptions = [
    { value: "all", label: "All" },
    { value: "default", label: "Default" },
    ...unitItems.map((unit) => ({
      value: unit.id.toString(),
      label: `${unit.type || "Unknown"} (${unit.ip_address || unit.serial_no || "N/A"})`,
    })),
  ];

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="mx-1.5" />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: "w-[3%]",
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" className="pl-1" />,
      cell: ({ row }) => {
        const name = row.getValue("name");
        const effectiveValue = getEffectiveValue(row.original.id, "name", name);
        return (
          <EditableCell
            value={effectiveValue || "Untitled Scene"}
            type="text"
            onSave={(newValue) => onCellEdit(row.original.id, "name", newValue)}
            className="font-medium min-w-40"
            placeholder="Enter scene name"
            icon={SlidersHorizontal}
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
      accessorKey: "address",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Address" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const address = row.getValue("address");
        const effectiveValue = getEffectiveValue(row.original.id, "address", address);
        return (
          <EditableCell
            value={effectiveValue}
            type="number"
            onSave={(newValue) => onCellEdit(row.original.id, "address", newValue)}
            className="text-center font-bold"
            icon={Layers}
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
      accessorKey: "source_unit",
      header: ({ column }) => (
        <DataTableFilterColumnHeader
          column={column}
          title="Source Unit"
          className="text-center justify-center"
          filterOptions={sourceUnitFilterOptions}
        />
      ),
      cell: ({ row }) => {
        const sourceUnit = row.getValue("source_unit");
        const effectiveValue = getEffectiveValue(row.original.id, "source_unit", sourceUnit);
        const selectedUnit = unitItems.find((u) => u.id === effectiveValue);
        const displayValue = selectedUnit
          ? `${selectedUnit.type || "Unknown"} (${selectedUnit.ip_address || selectedUnit.serial_no || "N/A"})`
          : "Default";
        return <div className="text-center text-sm px-1.5 font-medium">{displayValue}</div>;
      },
      enableSorting: false,
      enableHiding: true,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        if (value === "default") return !row.getValue(id);
        return row.getValue(id) === parseInt(value);
      },
      meta: {
        className: "w-[12%]",
      },
    },

    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" className="pl-1" />,
      cell: ({ row }) => {
        const description = row.getValue("description");
        const effectiveValue = getEffectiveValue(row.original.id, "description", description);
        return (
          <EditableCell
            value={effectiveValue}
            type="text"
            onSave={(newValue) => onCellEdit(row.original.id, "description", newValue)}
            placeholder="Enter description"
            icon={FilePen}
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[25%]",
      },
    },
    {
      id: "itemCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="text-center" />,
      cell: ({ row }) => {
        // This will be populated by the parent component with scene item count
        const itemCount = row.original.itemCount || 0;
        return (
          <div className="flex justify-center">
            <Badge>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </Badge>
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
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button variant="outline" size="icon" onClick={() => onEdit(item)} className="cursor-pointer" title="Manage scene items">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onSendToUnit(item)} className="cursor-pointer" title="Send scene to network unit">
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDuplicate(item)} className="cursor-pointer" title="Duplicate scene">
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
        className: "w-[8%]",
      },
    },
  ];
};
