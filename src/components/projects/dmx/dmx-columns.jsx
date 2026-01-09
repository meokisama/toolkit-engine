import { Radio, Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { DataTableFilterColumnHeader } from "../data-table/data-table-filter-column-header";
import { EditableCell } from "../data-table/editable-cell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function to convert RGB to Hex
const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper function to parse scene data
const parseSceneData = (sceneData) => {
  if (!sceneData) return { r: 0, g: 0, b: 0, w: 0 };
  const [r, g, b, w] = sceneData.split(",").map(Number);
  return { r: r || 0, g: g || 0, b: b || 0, w: w || 0 };
};

export const createDmxColumns = (onCellEdit, getEffectiveValue, unitItems = []) => {
  // Create filter options for source unit
  const sourceUnitFilterOptions = [
    { value: "all", label: "All" },
    { value: "default", label: "Default" },
    ...unitItems.map((unit) => ({
      value: unit.id.toString(),
      label: `${unit.type || "Unknown"} (${unit.ip_address || unit.serial_no || "N/A"}`,
    })),
  ];

  const baseColumns = [
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
        const name = row.getValue("name");
        const effectiveValue = getEffectiveValue(row.original.id, "name", name);
        return (
          <EditableCell
            value={effectiveValue || `DMX ${row.original.address}`}
            onSave={(value) => onCellEdit(row.original.id, "name", value)}
            placeholder="No name"
            className="font-medium min-w-32"
            icon={Radio}
          />
        );
      },
      enableSorting: true,
      enableHiding: false,
      meta: {
        className: "w-auto min-w-30",
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
            icon={Layers}
            onSave={(value) => onCellEdit(row.original.id, "address", value)}
            placeholder="Enter address"
            className="pl-10 font-bold"
          />
        );
      },
      enableSorting: true,
      enableHiding: false,
      meta: {
        className: "w-auto",
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
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "source_unit", item.source_unit);
        const selectedUnit = unitItems.find((u) => u.id === effectiveValue);
        const displayValue = selectedUnit
          ? `${selectedUnit.type || "Unknown"} (${selectedUnit.ip_address || selectedUnit.serial_no || "N/A"})`
          : "Default";
        return <div className="text-center text-sm font-medium px-1.5">{displayValue}</div>;
      },
      enableSorting: false,
      enableHiding: true,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true;
        if (value === "default") return !row.getValue(id);
        return row.getValue(id) === parseInt(value);
      },
      meta: {
        className: "w-auto min-w-30",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const description = row.getValue("description");
        const effectiveValue = getEffectiveValue(row.original.id, "description", description);
        return (
          <EditableCell
            value={effectiveValue}
            onSave={(value) => onCellEdit(row.original.id, "description", value)}
            placeholder="No description"
            className="min-w-48"
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-auto",
      },
    },
  ];

  // Generate 16 color columns
  const colorColumns = Array.from({ length: 16 }, (_, i) => {
    const colorNumber = i + 1;
    return {
      accessorKey: `color${colorNumber}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title={`Color ${colorNumber}`} className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const colorData = row.getValue(`color${colorNumber}`);
        const { r, g, b, w } = parseSceneData(colorData);
        const hexColor = rgbToHex(r, g, b);

        return (
          <div className="flex items-center gap-2 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="size-5 rounded border border-gray-300 shrink-0"
                  style={{ backgroundColor: hexColor }}
                  // title={`RGB(${r},${g},${b})`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">
                  <span className="text-red-400">Red:</span> {r}, <span className="text-green-400">Green:</span> {g},{" "}
                  <span className="text-blue-400">Blue:</span> {b}, White: {w}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-auto min-w-25",
      },
    };
  });

  return [...baseColumns, ...colorColumns];
};
