import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { EditableComboboxCell } from "@/components/projects/data-table/editable-combobox-cell";
import { EditableCheckboxCell } from "@/components/projects/data-table/editable-checkbox-cell";
import { UNIT_TYPES, UNIT_MODES } from "@/constants";

// Memoized options to prevent recreation on every import
const UNIT_TYPE_OPTIONS = UNIT_TYPES.map((unit) => ({
  value: unit.name,
  label: unit.name,
}));
const UNIT_MODE_OPTIONS = UNIT_MODES.map((mode) => ({
  value: mode,
  label: mode,
}));

export const createUnitColumns = (onCellEdit, getEffectiveValue) => [
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
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue("type");
      const effectiveValue = getEffectiveValue(row.original.id, "type", type);

      return (
        <EditableComboboxCell
          value={effectiveValue}
          options={UNIT_TYPE_OPTIONS}
          onSave={(newValue) => onCellEdit(row.original.id, "type", newValue)}
          placeholder="Choose unit type"
          searchPlaceholder="Search unit types..."
          emptyMessage="No unit types found."
          className="w-full"
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[12%]",
    },
  },
  {
    accessorKey: "serial_no",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Serial No." className="flex items-center justify-center" />,
    cell: ({ row }) => {
      const serialNo = row.getValue("serial_no");
      const effectiveValue = getEffectiveValue(row.original.id, "serial_no", serialNo);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "serial_no", newValue)}
          className="text-sm w-full min-w-36 text-center"
          placeholder="-"
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[12%]",
    },
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP Address" className="flex items-center justify-center" />,
    cell: ({ row }) => {
      const ipAddress = row.getValue("ip_address");
      const effectiveValue = getEffectiveValue(row.original.id, "ip_address", ipAddress);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "ip_address", newValue)}
          className="text-sm w-full min-w-30 text-center"
          placeholder="-"
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
    accessorKey: "id_can",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID CAN" className="text-center" />,
    cell: ({ row }) => {
      const idCan = row.getValue("id_can");
      const effectiveValue = getEffectiveValue(row.original.id, "id_can", idCan);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "id_can", newValue)}
          className="text-sm w-full text-center min-w-22"
          placeholder="-"
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
    accessorKey: "mode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mode" className="flex items-center justify-center" />,
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
      className: "w-[8%]",
    },
  },
  {
    accessorKey: "firmware_version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Firmware" className="text-center" />,
    cell: ({ row }) => {
      const firmwareVersion = row.getValue("firmware_version");
      const effectiveValue = getEffectiveValue(row.original.id, "firmware_version", firmwareVersion);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "firmware_version", newValue)}
          className="text-sm w-full text-center"
          placeholder="-"
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[8%]",
    },
  },
  {
    accessorKey: "hardware_version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hardware" className="text-center" />,
    cell: ({ row }) => {
      const hardwareVersion = row.getValue("hardware_version");
      const effectiveValue = getEffectiveValue(row.original.id, "hardware_version", hardwareVersion);
      return (
        <EditableCell
          value={effectiveValue}
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "hardware_version", newValue)}
          className="text-sm w-full text-center"
          placeholder="-"
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[8%]",
    },
  },
  {
    accessorKey: "can_load",
    header: ({ column }) => <DataTableColumnHeader column={column} title="CAN Load" className="text-center" />,
    cell: ({ row }) => {
      const canLoad = row.getValue("can_load");
      const effectiveValue = getEffectiveValue(row.original.id, "can_load", canLoad);
      return (
        <EditableCheckboxCell
          value={effectiveValue}
          onSave={(newValue) => onCellEdit(row.original.id, "can_load", newValue)}
          trueColor="bg-green-100 text-green-800"
          falseColor="bg-gray-100 text-gray-800"
          showBadge={false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[8%]",
    },
  },
  {
    accessorKey: "recovery_mode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recovery" className="text-center" />,
    cell: ({ row }) => {
      const recoveryMode = row.getValue("recovery_mode");
      const effectiveValue = getEffectiveValue(row.original.id, "recovery_mode", recoveryMode);
      return (
        <EditableCheckboxCell
          value={effectiveValue}
          onSave={(newValue) => onCellEdit(row.original.id, "recovery_mode", newValue)}
          trueColor="bg-red-100 text-red-800"
          falseColor="bg-gray-100 text-gray-800"
          showBadge={false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[8%]",
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
          type="text"
          onSave={(newValue) => onCellEdit(row.original.id, "description", newValue)}
          placeholder="-"
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[25%]",
    },
  },
];
