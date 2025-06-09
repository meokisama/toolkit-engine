"use client";

import { flexRender } from "@tanstack/react-table";
import { Copy, SquarePen, Trash2, Settings } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export function DataTableRow({
  row,
  onEdit,
  onDuplicate,
  onDelete,
  onIOConfig,
}) {
  const item = row.original;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => onEdit(item)}
          className="cursor-pointer"
        >
          <SquarePen className="text-muted-foreground" />
          <span>Edit</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onDuplicate(item)}
          className="cursor-pointer"
        >
          <Copy className="text-muted-foreground" />
          <span>Duplicate</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        {onIOConfig && (
          <>
            <ContextMenuItem
              onClick={() => onIOConfig(item)}
              className="cursor-pointer"
            >
              <Settings className="text-muted-foreground" />
              <span>I/O Config</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onClick={() => onDelete(item)}
          className="cursor-pointer"
          variant="destructive"
        >
          <Trash2 />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
