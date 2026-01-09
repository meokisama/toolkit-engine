import { Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { DataTableFilterColumnHeader } from "@/components/projects/data-table/data-table-filter-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { EditableComboboxCell } from "@/components/projects/data-table/editable-combobox-cell";
import { CONSTANTS } from "@/constants";

// KNX Address validation helper - validates format a/b/c
const validateKnxAddress = (address) => {
  if (!address || address.trim() === "") {
    return true; // Empty is valid (optional field)
  }

  const knxAddressPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{1,3})$/;
  return knxAddressPattern.test(address);
};

export const createKnxItemsColumns = (onCellEdit, getEffectiveValue, projectItems = {}, unitItems = []) => {
  // Create filter options for source unit
  const sourceUnitFilterOptions = [
    { value: "all", label: "All" },
    { value: "default", label: "Default" },
    ...unitItems.map((unit) => ({
      value: unit.id.toString(),
      label: `${unit.type || "Unknown"} (${unit.ip_address || unit.serial_no || "N/A"}`,
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
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "name", item.name);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => onCellEdit(item.id, "name", newValue)}
            placeholder="Enter device name"
            className="font-medium min-w-40"
          />
        );
      },
      meta: {
        className: "w-[15%]",
      },
    },
    {
      accessorKey: "address",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Address" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "address", item.address);

        return (
          <div className="w-full flex justify-center">
            <EditableCell
              value={effectiveValue?.toString() || ""}
              icon={Layers}
              onSave={(newValue) => {
                const numValue = parseInt(newValue);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 511) {
                  onCellEdit(item.id, "address", numValue);
                }
              }}
              placeholder="0-511"
              type="number"
              className="pl-10 font-bold"
            />
          </div>
        );
      },
      meta: {
        className: "w-[5%]",
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "type", item.type);

        return (
          <EditableSelectCell
            value={effectiveValue?.toString() || ""}
            options={CONSTANTS.KNX.KNX_OUTPUT_TYPES.map((option) => ({
              ...option,
              value: option.value.toString(),
            }))}
            onSave={(newValue) => onCellEdit(item.id, "type", parseInt(newValue))}
            placeholder="Select type"
            className="w-full"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[12%]",
      },
    },
    {
      accessorKey: "factor",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Factor" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "factor", item.factor);

        return (
          <EditableCell
            value={effectiveValue?.toString() || "2"}
            onSave={(newValue) => {
              const numValue = parseInt(newValue);
              if (!isNaN(numValue) && numValue >= 1) {
                onCellEdit(item.id, "factor", numValue);
              }
            }}
            placeholder="≥1"
            type="number"
            className="text-center min-w-20 font-semibold"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[8%]",
      },
    },
    {
      accessorKey: "feedback",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Feedback" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "feedback", item.feedback);

        return (
          <EditableSelectCell
            value={effectiveValue?.toString() || ""}
            options={CONSTANTS.KNX.KNX_FEEDBACK_TYPES.map((option) => ({
              ...option,
              value: option.value.toString(),
            }))}
            onSave={(newValue) => onCellEdit(item.id, "feedback", parseInt(newValue))}
            placeholder="Select feedback"
            className="w-full"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "rcu_group_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="RCU Group" className="flex items-center justify-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "rcu_group_id", item.rcu_group_id);

        // Get appropriate items based on KNX type
        const getRcuGroupItems = (knxType) => {
          const typeValue = parseInt(knxType);
          const typeConfig = CONSTANTS.KNX.KNX_OUTPUT_TYPES.find((t) => t.value === typeValue);
          return typeConfig?.resource ? projectItems?.[typeConfig.resource] || [] : projectItems?.lighting || [];
        };

        const rcuGroupItems = getRcuGroupItems(item.type);

        // Convert items to options format
        const rcuGroupOptions = rcuGroupItems.map((rcuItem) => ({
          value: rcuItem.id.toString(),
          label: rcuItem.name || `Group ${rcuItem.address}`,
        }));

        // Get type label for placeholder and search text
        const getTypeLabel = (knxType) => {
          const typeValue = parseInt(knxType);
          const typeConfig = CONSTANTS.KNX.KNX_OUTPUT_TYPES.find((t) => t.value === typeValue);
          return typeConfig?.resource || "lighting";
        };

        const typeLabel = getTypeLabel(item.type);

        return (
          <EditableComboboxCell
            value={effectiveValue?.toString() || ""}
            options={rcuGroupOptions}
            onSave={(newValue) => onCellEdit(item.id, "rcu_group_id", newValue ? parseInt(newValue) : null)}
            placeholder="Select RCU group"
            searchPlaceholder={`Search ${typeLabel} groups...`}
            emptyMessage={`No ${typeLabel} groups found.`}
            className="w-full"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[12%]",
      },
    },
    {
      accessorKey: "knx_switch_group",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Switch Group" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "knx_switch_group", item.knx_switch_group);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => {
              if (validateKnxAddress(newValue)) {
                onCellEdit(item.id, "knx_switch_group", newValue);
              }
            }}
            placeholder="-"
            disabled={false}
            className="text-center font-mono min-w-20"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "knx_dimming_group",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dimming Group" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "knx_dimming_group", item.knx_dimming_group);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => {
              if (validateKnxAddress(newValue)) {
                onCellEdit(item.id, "knx_dimming_group", newValue);
              }
            }}
            placeholder="-"
            disabled={false}
            className="text-center font-mono min-w-20"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "knx_value_group",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Value Group" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "knx_value_group", item.knx_value_group);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => {
              if (validateKnxAddress(newValue)) {
                onCellEdit(item.id, "knx_value_group", newValue);
              }
            }}
            placeholder="-"
            disabled={false}
            className="text-center font-mono min-w-20"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[10%]",
      },
    },
    {
      accessorKey: "knx_status_group",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status Group" className="text-center" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "knx_status_group", item.knx_status_group);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => {
              if (validateKnxAddress(newValue)) {
                onCellEdit(item.id, "knx_status_group", newValue);
              }
            }}
            placeholder="-"
            disabled={false}
            className="text-center font-mono min-w-20"
          />
        );
      },
      enableSorting: false,
      meta: {
        className: "w-[10%]",
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
        // Parse to ensure proper type comparison
        const effectiveValueInt = effectiveValue ? parseInt(effectiveValue) : null;
        const selectedUnit = unitItems.find((u) => u.id === effectiveValueInt);
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
        className: "w-[12%]",
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => {
        const item = row.original;
        const effectiveValue = getEffectiveValue(item.id, "description", item.description);

        return (
          <EditableCell
            value={effectiveValue || ""}
            onSave={(newValue) => onCellEdit(item.id, "description", newValue)}
            placeholder="Enter description"
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      meta: {
        className: "w-[12%]",
      },
    },
  ];
};
