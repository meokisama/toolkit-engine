import { MoreHorizontal, Copy, Edit, Trash2, Layers, Blinds } from "lucide-react";
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
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { DataTableFilterColumnHeader } from "../data-table/data-table-filter-column-header";
import { EditableCell } from "../data-table/editable-cell";
import { EditableSelectCell } from "../data-table/editable-select-cell";
import { EditableComboboxCell } from "../data-table/editable-combobox-cell";
import { CURTAIN_TYPES } from "@/constants";

export const createCurtainColumns = (onEdit, onDelete, onDuplicate, onCellEdit, getEffectiveValue, lightingItems = [], unitItems = []) => {
  // Create lighting options for group selection
  const lightingOptions = lightingItems.map((item) => ({
    value: item.id,
    label: item.name ? `${item.name} (${item.address})` : `Group ${item.address}`,
  }));

  // Create filter options for source unit
  const sourceUnitFilterOptions = [
    { value: "all", label: "All" },
    { value: "default", label: "Default" },
    ...unitItems.map((unit) => ({
      value: unit.id.toString(),
      label: `${unit.type || "Unknown"} (${unit.ip_address || unit.serial_no || "N/A"})`,
    })),
  ];

  const curtainTypeOptions = CURTAIN_TYPES.filter((type) => type.value !== 0).map((type) => ({
    value: type.name,
    label: type.label,
  }));

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
        const name = row.getValue("name");
        const effectiveValue = getEffectiveValue(row.original.id, "name", name);
        return (
          <EditableCell
            value={effectiveValue || `Curtain ${row.original.address}`}
            onSave={(value) => onCellEdit(row.original.id, "name", value)}
            placeholder="No name"
            className="font-medium min-w-32"
            icon={Blinds}
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
        const address = row.getValue("address");
        const effectiveValue = getEffectiveValue(row.original.id, "address", address);
        return (
          <EditableCell
            value={effectiveValue}
            icon={Layers}
            onSave={(value) => onCellEdit(row.original.id, "address", value)}
            placeholder="1-255"
            className="text-center font-semibold"
            type="number"
            min="1"
            max="255"
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        className: "w-[5%]",
      },
    },
    {
      accessorKey: "curtain_type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const curtainType = row.getValue("curtain_type");
        const effectiveValue = getEffectiveValue(row.original.id, "curtain_type", curtainType);
        return (
          <EditableSelectCell
            value={effectiveValue}
            options={curtainTypeOptions}
            onSave={(value) => onCellEdit(row.original.id, "curtain_type", value)}
            placeholder="Select type"
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
      accessorKey: "open_group_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Open Group" className="text-center" />,
      cell: ({ row }) => {
        const openGroupId = row.getValue("open_group_id");
        const effectiveValue = getEffectiveValue(row.original.id, "open_group_id", openGroupId);

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) => onCellEdit(row.original.id, "open_group_id", value)}
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "close_group_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Close Group" className="text-center" />,
      cell: ({ row }) => {
        const closeGroupId = row.getValue("close_group_id");
        const effectiveValue = getEffectiveValue(row.original.id, "close_group_id", closeGroupId);

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) => onCellEdit(row.original.id, "close_group_id", value)}
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "stop_group_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stop Group" className="text-center" />,
      cell: ({ row }) => {
        const curtainType = row.getValue("curtain_type");
        const stopGroupId = row.getValue("stop_group_id");
        const effectiveCurtainType = getEffectiveValue(row.original.id, "curtain_type", curtainType);
        const effectiveValue = getEffectiveValue(row.original.id, "stop_group_id", stopGroupId);

        // Only show stop group for 3P types
        if (!effectiveCurtainType || !effectiveCurtainType.includes("3P")) {
          return <p className="text-muted-foreground text-center">-</p>;
        }

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) => onCellEdit(row.original.id, "stop_group_id", value)}
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "pause_period",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pause" className="text-center justify-center w-full" />,
      cell: ({ row }) => {
        const pausePeriod = row.getValue("pause_period");
        const effectiveValue = getEffectiveValue(row.original.id, "pause_period", pausePeriod);
        return (
          <EditableCell
            value={effectiveValue}
            onSave={(value) => onCellEdit(row.original.id, "pause_period", parseInt(value) || 0)}
            placeholder="0"
            className="text-center min-w-24"
            type="number"
            min="0"
            max="65535"
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
      accessorKey: "transition_period",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Transition" className="text-center" />,
      cell: ({ row }) => {
        const transitionPeriod = row.getValue("transition_period");
        const effectiveValue = getEffectiveValue(row.original.id, "transition_period", transitionPeriod);
        return (
          <EditableCell
            value={effectiveValue}
            onSave={(value) => onCellEdit(row.original.id, "transition_period", parseInt(value) || 0)}
            placeholder="0"
            className="text-center min-w-24"
            type="number"
            min="0"
            max="65535"
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const description = row.getValue("description");
        const effectiveValue = getEffectiveValue(row.original.id, "description", description);
        return (
          <EditableCell
            value={effectiveValue}
            onSave={(value) => onCellEdit(row.original.id, "description", value)}
            placeholder="Enter description"
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[15%] min-w-50",
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
