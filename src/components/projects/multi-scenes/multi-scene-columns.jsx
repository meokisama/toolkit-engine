import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Hash } from "lucide-react";
import { CONSTANTS } from "@/constants";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { DataTableFilterColumnHeader } from "@/components/projects/data-table/data-table-filter-column-header";
import { Badge } from "@/components/ui/badge";

export function createMultiSceneColumns(onCellEdit, getEffectiveValue, unitItems = []) {
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "name");
        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => onCellEdit(row.original.id, "name", newValue)}
            placeholder="Enter multi-scene name"
            className="font-medium min-w-40"
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Address" className="flex items-center justify-center" />,
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" className="flex items-center justify-center" />,
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
        const effectiveValue = getEffectiveValue(row.original, "source_unit");
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const effectiveValue = getEffectiveValue(row.original, "description");
        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => onCellEdit(row.original.id, "description", newValue)}
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Scenes" className="flex items-center justify-center" />,
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
  ];
}
