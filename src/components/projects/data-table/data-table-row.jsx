"use client";

import { flexRender } from "@tanstack/react-table";
import {
  Copy,
  SquarePen,
  Trash2,
  Settings,
  Settings2,
  Thermometer,
  Play,
  SlidersHorizontal,
} from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

export function DataTableRow({
  row,
  onEdit,
  onDuplicate,
  onDelete,
  onIOConfig,
  onGroupControl,
  onAirconControl,
  onSceneControl,
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
        {onEdit && (
          <ContextMenuItem
            onClick={() => onEdit(item)}
            className="cursor-pointer"
          >
            <SquarePen className="text-muted-foreground" />
            <span>Edit</span>
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem
            onClick={() => onDuplicate(item)}
            className="cursor-pointer"
          >
            <Copy className="text-muted-foreground" />
            <span>Duplicate</span>
          </ContextMenuItem>
        )}
        {(onEdit || onDuplicate) &&
          (onIOConfig ||
            onGroupControl ||
            onAirconControl ||
            onSceneControl ||
            onDelete) && <ContextMenuSeparator />}
        {onIOConfig && (
          <>
            <ContextMenuItem
              onClick={() => onIOConfig(item)}
              className="cursor-pointer"
            >
              <Settings className="text-muted-foreground" />
              <span>I/O Config</span>
            </ContextMenuItem>
            {(onGroupControl ||
              onAirconControl ||
              onSceneControl ||
              onDelete) && <ContextMenuSeparator />}
          </>
        )}
        {onGroupControl && (
          <ContextMenuItem
            onClick={() => onGroupControl(item)}
            className="cursor-pointer"
          >
            <Settings2 className="text-muted-foreground" />
            <span>Group Control</span>
          </ContextMenuItem>
        )}
        {onAirconControl && (
          <ContextMenuItem
            onClick={() => onAirconControl(item)}
            className="cursor-pointer"
          >
            <Thermometer className="text-muted-foreground" />
            <span>Aircon Control</span>
          </ContextMenuItem>
        )}
        {onSceneControl && (
          <ContextMenuItem
            onClick={() => onSceneControl.onTriggerScene(item)}
            className="cursor-pointer"
          >
            <Play className="text-muted-foreground" />
            <span>Trigger Scene</span>
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem
            onClick={() => onDelete(item)}
            className="cursor-pointer"
            variant="destructive"
          >
            <Trash2 />
            <span>Delete</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
