import { Copy, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { KNXAddressInput } from "@/components/custom/knx-input";

export const createKnxItemsColumns = (
  onEdit,
  onDuplicate,
  onDelete,
  onCellEdit,
  getEffectiveValue
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
      className: "w-[25%]",
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="KNX Address"
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
          <KNXAddressInput
            value={effectiveValue || ""}
            onChange={(newValue) => onCellEdit(item.id, "address", newValue)}
            disabled={false}
            debounceMs={500}
          />
        </div>
      );
    },
    meta: {
      className: "w-[20%]",
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
          multiline={true}
        />
      );
    },
    meta: {
      className: "w-[35%]",
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(item)}
            className="cursor-pointer"
            title="Edit KNX device"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDuplicate(item)}
            className="cursor-pointer"
            title="Duplicate KNX device"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(item)}
            className="text-destructive hover:text-destructive cursor-pointer"
            title="Delete KNX device"
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
