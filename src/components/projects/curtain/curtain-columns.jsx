import { ArrowUpDown, MoreHorizontal, Copy, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { EditableCell } from "../data-table/editable-cell";
import { EditableSelectCell } from "../data-table/editable-select-cell";
import { EditableComboboxCell } from "../data-table/editable-combobox-cell";
import { CURTAIN_TYPES } from "@/constants";

export const createCurtainColumns = (
  onEdit,
  onDelete,
  onDuplicate,
  onCellEdit,
  getEffectiveValue,
  lightingItems = []
) => {
  // Create lighting options for group selection
  const lightingOptions = lightingItems.map((item) => ({
    value: item.address,
    label: item.name
      ? `${item.name} (${item.address})`
      : `Group ${item.address}`,
  }));

  const curtainTypeOptions = CURTAIN_TYPES.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  return [
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
            onSave={(value) => onCellEdit(row.original.id, "name", value)}
            placeholder="Enter name"
          />
        );
      },
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => {
        const address = row.getValue("address");
        const effectiveValue = getEffectiveValue(
          row.original.id,
          "address",
          address
        );
        return (
          <EditableCell
            value={effectiveValue}
            onSave={(value) => onCellEdit(row.original.id, "address", value)}
            placeholder="1-255"
            type="number"
            min="1"
            max="255"
          />
        );
      },
    },
    {
      accessorKey: "curtain_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const curtainType = row.getValue("curtain_type");
        const effectiveValue = getEffectiveValue(
          row.original.id,
          "curtain_type",
          curtainType
        );
        return (
          <EditableSelectCell
            value={effectiveValue}
            options={curtainTypeOptions}
            onSave={(value) =>
              onCellEdit(row.original.id, "curtain_type", value)
            }
            placeholder="Select type"
          />
        );
      },
    },
    {
      accessorKey: "open_group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Open Group" />
      ),
      cell: ({ row }) => {
        const openGroup = row.getValue("open_group");
        const effectiveValue = getEffectiveValue(
          row.original.id,
          "open_group",
          openGroup
        );

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) => onCellEdit(row.original.id, "open_group", value)}
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
      },
    },
    {
      accessorKey: "close_group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Close Group" />
      ),
      cell: ({ row }) => {
        const closeGroup = row.getValue("close_group");
        const effectiveValue = getEffectiveValue(
          row.original.id,
          "close_group",
          closeGroup
        );

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) =>
              onCellEdit(row.original.id, "close_group", value)
            }
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
      },
    },
    {
      accessorKey: "stop_group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stop Group" />
      ),
      cell: ({ row }) => {
        const curtainType = row.getValue("curtain_type");
        const stopGroup = row.getValue("stop_group");
        const effectiveCurtainType = getEffectiveValue(
          row.original.id,
          "curtain_type",
          curtainType
        );
        const effectiveValue = getEffectiveValue(
          row.original.id,
          "stop_group",
          stopGroup
        );

        // Only show stop group for 3P type
        if (effectiveCurtainType !== "CURTAIN_PULSE_3P") {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <EditableComboboxCell
            value={effectiveValue}
            options={lightingOptions}
            onSave={(value) => onCellEdit(row.original.id, "stop_group", value)}
            placeholder="Select group"
            searchPlaceholder="Search lighting groups..."
            emptyMessage="No lighting groups found."
          />
        );
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
            onSave={(value) =>
              onCellEdit(row.original.id, "description", value)
            }
            placeholder="Enter description"
          />
        );
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
              <DropdownMenuItem onClick={() => onDuplicate(item.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item.id)}
                className="text-red-600"
              >
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
