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
  Send,
  Calendar,
  Clock,
  ChevronsUpDown,
  GitCompare,
  ListOrdered,
  Network,
  Upload,
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
  onScheduleControl,
  onClockControl,
  onCurtainControl,
  onKnxControl,
  onMultiSceneControl,
  onSequenceControl,
  onSendSchedule,
  onSendScene,
  onFirmwareUpdate,
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
          <ContextMenuItem onClick={() => onEdit(item)}>
            <SquarePen className="text-muted-foreground" />
            <span>Edit</span>
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(item)}>
            <Copy className="text-muted-foreground" />
            <span>Duplicate</span>
          </ContextMenuItem>
        )}
        {(onEdit || onDuplicate) &&
          (onIOConfig ||
            onGroupControl ||
            onAirconControl ||
            onSceneControl ||
            onScheduleControl ||
            onClockControl ||
            onCurtainControl ||
            onKnxControl ||
            onMultiSceneControl ||
            onSendSchedule ||
            onSendScene ||
            onFirmwareUpdate ||
            onDelete) && <ContextMenuSeparator />}
        {onIOConfig && (
          <>
            <ContextMenuItem onClick={() => onIOConfig(item)}>
              <Settings className="text-muted-foreground" />
              <span>I/O Config</span>
            </ContextMenuItem>
            {(onGroupControl ||
              onAirconControl ||
              onSceneControl ||
              onScheduleControl ||
              onClockControl ||
              onCurtainControl ||
              onKnxControl ||
              onMultiSceneControl ||
              onSendSchedule ||
              onSendScene ||
              onFirmwareUpdate ||
              onDelete) && <ContextMenuSeparator />}
          </>
        )}
        {onGroupControl && (
          <ContextMenuItem onClick={() => onGroupControl(item)}>
            <Settings2 className="text-muted-foreground" />
            <span>Group Control</span>
          </ContextMenuItem>
        )}
        {onAirconControl && (
          <ContextMenuItem onClick={() => onAirconControl(item)}>
            <Thermometer className="text-muted-foreground" />
            <span>Aircon Control</span>
          </ContextMenuItem>
        )}
        {/* Automation Submenu */}
        {(onSceneControl || onScheduleControl || onMultiSceneControl || onSequenceControl) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <SlidersHorizontal className="text-muted-foreground" />
                <span className="pl-2">Automation</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {onSceneControl && (
                  <ContextMenuItem
                    onClick={() => onSceneControl.onTriggerScene(item)}
                  >
                    <Play className="text-muted-foreground" />
                    <span>Scene Control</span>
                  </ContextMenuItem>
                )}
                {onScheduleControl && (
                  <ContextMenuItem
                    onClick={() => onScheduleControl.onTriggerSchedule(item)}
                  >
                    <Calendar className="text-muted-foreground" />
                    <span>Schedule Control</span>
                  </ContextMenuItem>
                )}
                {onMultiSceneControl && (
                  <ContextMenuItem
                    onClick={() =>
                      onMultiSceneControl.onTriggerMultiScene(item)
                    }
                  >
                    <GitCompare className="text-muted-foreground" />
                    <span>Multi-Scene Control</span>
                  </ContextMenuItem>
                )}
                {onSequenceControl && (
                  <ContextMenuItem
                    onClick={() =>
                      onSequenceControl.onTriggerSequence(item)
                    }
                  >
                    <ListOrdered className="text-muted-foreground" />
                    <span>Sequence Control</span>
                  </ContextMenuItem>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}
        {/* System Submenu */}
        {(onClockControl || onFirmwareUpdate) && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Settings className="text-muted-foreground" />
                <span className="pl-2">System</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {onClockControl && (
                  <ContextMenuItem onClick={() => onClockControl(item)}>
                    <Clock className="text-muted-foreground" />
                    <span>Clock Control</span>
                  </ContextMenuItem>
                )}
                {onFirmwareUpdate && (
                  <ContextMenuItem onClick={() => onFirmwareUpdate(item)}>
                    <Upload className="text-muted-foreground" />
                    <span>Update Firmware</span>
                  </ContextMenuItem>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        {onCurtainControl && (
          <>
            <ContextMenuItem
              onClick={() => onCurtainControl.onTriggerCurtain(item)}
            >
              <ChevronsUpDown className="text-muted-foreground" />
              <span>Curtain Control</span>
            </ContextMenuItem>
          </>
        )}
        {onKnxControl && (
          <>
            <ContextMenuItem onClick={() => onKnxControl.onTriggerKnx(item)}>
              <Network className="text-muted-foreground" />
              <span>KNX Control</span>
            </ContextMenuItem>
          </>
        )}
        {onSendSchedule && (
          <>
            <ContextMenuItem onClick={() => onSendSchedule(item)}>
              <Send className="text-muted-foreground" />
              <span>Send Schedule</span>
            </ContextMenuItem>
            {onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onSendScene && (
          <>
            <ContextMenuItem onClick={() => onSendScene(item)}>
              <Send className="text-muted-foreground" />
              <span>Send Scene</span>
            </ContextMenuItem>
            {onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onDelete && (
          <ContextMenuItem onClick={() => onDelete(item)} variant="destructive">
            <Trash2 />
            <span>Delete</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
