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
import { CURTAIN_TYPES } from "@/constants";

export const createCurtainColumns = (
  onEdit,
  onDelete,
  onDuplicate,
  onUpdate,
  lightingItems = []
) => {
  // Create lighting options for group selection
  const lightingOptions = lightingItems.map(item => ({
    value: item.address,
    label: item.name ? `${item.name} (${item.address})` : `Group ${item.address}`,
  }));

  const curtainTypeOptions = CURTAIN_TYPES.map(type => ({
    value: type.value,
    label: type.label,
  }));

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("name")}
          onSave={(value) => onUpdate(row.original.id, { name: value })}
          placeholder="Enter name"
        />
      ),
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("address")}
          onSave={(value) => onUpdate(row.original.id, { address: value })}
          placeholder="1-255"
          type="number"
          min="1"
          max="255"
        />
      ),
    },
    {
      accessorKey: "curtain_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <EditableSelectCell
          value={row.getValue("curtain_type")}
          options={curtainTypeOptions}
          onSave={(value) => onUpdate(row.original.id, { curtain_type: value })}
          placeholder="Select type"
        />
      ),
    },
    {
      accessorKey: "open_group",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Open Group" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("open_group");
        const lightingItem = lightingItems.find(item => item.address === value);
        const displayValue = lightingItem 
          ? (lightingItem.name ? `${lightingItem.name} (${lightingItem.address})` : `Group ${lightingItem.address}`)
          : value;

        return (
          <EditableSelectCell
            value={value}
            displayValue={displayValue}
            options={lightingOptions}
            onSave={(value) => onUpdate(row.original.id, { open_group: value })}
            placeholder="Select group"
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
        const value = row.getValue("close_group");
        const lightingItem = lightingItems.find(item => item.address === value);
        const displayValue = lightingItem 
          ? (lightingItem.name ? `${lightingItem.name} (${lightingItem.address})` : `Group ${lightingItem.address}`)
          : value;

        return (
          <EditableSelectCell
            value={value}
            displayValue={displayValue}
            options={lightingOptions}
            onSave={(value) => onUpdate(row.original.id, { close_group: value })}
            placeholder="Select group"
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
        const value = row.getValue("stop_group");
        
        // Only show stop group for 3P type
        if (curtainType !== "CURTAIN_PULSE_3P") {
          return <span className="text-muted-foreground">-</span>;
        }

        const lightingItem = lightingItems.find(item => item.address === value);
        const displayValue = lightingItem 
          ? (lightingItem.name ? `${lightingItem.name} (${lightingItem.address})` : `Group ${lightingItem.address}`)
          : value;

        return (
          <EditableSelectCell
            value={value}
            displayValue={displayValue}
            options={lightingOptions}
            onSave={(value) => onUpdate(row.original.id, { stop_group: value })}
            placeholder="Select group"
          />
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <EditableCell
          value={row.getValue("description")}
          onSave={(value) => onUpdate(row.original.id, { description: value })}
          placeholder="Enter description"
        />
      ),
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
