import { Copy, SquarePen, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { EditableSelectCell } from "@/components/projects/data-table/editable-select-cell";
import { EditableComboboxCell } from "@/components/projects/data-table/editable-combobox-cell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CONSTANTS } from "@/constants";

export const createKnxItemsColumns = (
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue,
  projectItems = {}
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
        className="mx-1.5"
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
      const item = row.original;
      const effectiveValue = getEffectiveValue(item.id, "name", item.name);

      return (
        <EditableCell
          value={effectiveValue || ""}
          onSave={(newValue) => onCellEdit(item.id, "name", newValue)}
          placeholder="Enter device name"
          className="font-medium"
        />
      );
    },
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Address"
        className="flex items-center justify-center"
      />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "address",
        item.address
      );

      return (
        <div className="w-full flex justify-center">
          <EditableCell
            value={effectiveValue?.toString() || ""}
            onSave={(newValue) => {
              const numValue = parseInt(newValue);
              if (!isNaN(numValue) && numValue >= 0 && numValue <= 511) {
                onCellEdit(item.id, "address", numValue);
              }
            }}
            placeholder="0-511"
            type="number"
            className="text-center"
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Type"
        className="flex items-center justify-center"
      />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Factor"
        className="text-center"
      />
    ),
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
          className="text-center"
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Feedback"
        className="text-center"
      />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "feedback",
        item.feedback
      );

      return (
        <EditableSelectCell
          value={effectiveValue?.toString() || ""}
          options={CONSTANTS.KNX.KNX_FEEDBACK_TYPES.map((option) => ({
            ...option,
            value: option.value.toString(),
          }))}
          onSave={(newValue) =>
            onCellEdit(item.id, "feedback", parseInt(newValue))
          }
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="RCU Group"
        className="flex items-center justify-center"
      />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "rcu_group_id",
        item.rcu_group_id
      );

      // Get appropriate items based on KNX type
      const getRcuGroupItems = (knxType) => {
        const typeValue = parseInt(knxType);

        switch (typeValue) {
          case 1: // Switch
          case 2: // Dimmer
            return projectItems?.lighting || [];
          case 3: // Curtain
            return projectItems?.curtain || [];
          case 4: // Scene
            return projectItems?.scene || [];
          case 5: // Multi Scene
            return projectItems?.multi_scene || [];
          case 7: // AC Power
          case 8: // AC Mode
          case 9: // AC Fan Speed
          case 10: // AC Swing
          case 11: // AC Set Point
            return projectItems?.aircon || [];
          default:
            return projectItems?.lighting || [];
        }
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
        switch (typeValue) {
          case 1:
          case 2:
            return "lighting";
          case 3:
            return "curtain";
          case 4:
            return "scene";
          case 5:
            return "multi scene";
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
            return "aircon";
          default:
            return "lighting";
        }
      };

      const typeLabel = getTypeLabel(item.type);

      return (
        <EditableComboboxCell
          value={effectiveValue?.toString() || ""}
          options={rcuGroupOptions}
          onSave={(newValue) =>
            onCellEdit(
              item.id,
              "rcu_group_id",
              newValue ? parseInt(newValue) : null
            )
          }
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Switch Group" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "knx_switch_group",
        item.knx_switch_group
      );

      return (
        <EditableCell
          value={effectiveValue || ""}
          onSave={() => {}} // No-op function since editing is disabled
          placeholder="-"
          disabled={true}
          className="text-center font-mono"
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dimming Group" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "knx_dimming_group",
        item.knx_dimming_group
      );

      return (
        <EditableCell
          value={effectiveValue || ""}
          onSave={() => {}} // No-op function since editing is disabled
          placeholder="-"
          disabled={true}
          className="text-center font-mono"
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value Group" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "knx_value_group",
        item.knx_value_group
      );

      return (
        <EditableCell
          value={effectiveValue || ""}
          onSave={() => {}} // No-op function since editing is disabled
          placeholder="-"
          disabled={true}
          className="text-center font-mono"
        />
      );
    },
    enableSorting: false,
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
      const item = row.original;
      const effectiveValue = getEffectiveValue(
        item.id,
        "description",
        item.description
      );

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
      className: "w-[15%]",
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
      className: "w-[8%]",
    },
  },
];
