import { Copy, SquarePen, Trash2, Sun, Layers, FilePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { EditableCell } from "@/components/projects/data-table/editable-cell";
import { useCallback } from "react";

export const createProjectItemsColumns = (onEdit, onDuplicate, onDelete, onCellEdit, getEffectiveValue) => [
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

      // ✅ Memoize onSave function với dependencies cụ thể
      const handleNameSave = useCallback(
        (newValue) => {
          onCellEdit(row.original.id, "name", newValue);
        },
        [row.original.id, onCellEdit]
      );

      return (
        <EditableCell
          value={effectiveValue || `Group ${row.original.address}`}
          type="text"
          onSave={handleNameSave}
          className="font-medium"
          placeholder="No name"
          icon={Sun}
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[25%]",
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" className="pl-1" />,
    cell: ({ row }) => {
      const address = row.getValue("address");
      const effectiveValue = getEffectiveValue(row.original.id, "address", address);

      // ✅ Memoize onSave function
      const handleAddressSave = useCallback(
        (newValue) => {
          onCellEdit(row.original.id, "address", newValue);
        },
        [row.original.id, onCellEdit]
      );

      return (
        <EditableCell
          value={effectiveValue}
          type="number"
          className="text-center font-semibold"
          onSave={handleAddressSave}
          displayValue={effectiveValue ? effectiveValue : "-"}
          icon={Layers}
        />
      );
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[3%]",
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" className="pl-1" />,
    cell: ({ row }) => {
      const description = row.getValue("description");
      const effectiveValue = getEffectiveValue(row.original.id, "description", description);

      // ✅ Memoize onSave function
      const handleDescriptionSave = useCallback(
        (newValue) => {
          onCellEdit(row.original.id, "description", newValue);
        },
        [row.original.id, onCellEdit]
      );

      return <EditableCell value={effectiveValue} type="text" onSave={handleDescriptionSave} placeholder="No description." icon={FilePen} />;
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[45%]",
    },
  },

  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      // ✅ Memoize action handlers
      const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);
      const handleDuplicate = useCallback(() => onDuplicate(item), [item, onDuplicate]);
      const handleDelete = useCallback(() => onDelete(item), [item, onDelete]);

      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="icon" onClick={handleEdit} className="cursor-pointer" title="Edit">
            <SquarePen />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleDuplicate} className="cursor-pointer" title="Duplicate">
            <Copy />
            <span className="sr-only">Duplicate</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            className="cursor-pointer hover:bg-destructive/10 text-destructive hover:text-destructive hover:border-destructive/30"
            title="Delete"
          >
            <Trash2 />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: "w-[5%]",
    },
  },
];
