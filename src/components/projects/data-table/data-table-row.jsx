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
  Wrench,
  Palette,
  Building2,
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
  onRgbControl,
  onSceneControl,
  onScheduleControl,
  onClockControl,
  onCurtainControl,
  onKnxControl,
  onRoomConfigControl,
  onMultiSceneControl,
  onSequenceControl,
  onSendSchedule,
  onSendScene,
  onSendCurtain,
  onSendKnx,
  onSendMultiScene,
  onSendSequence,
  onFirmwareUpdate,
  onTransferToDatabase,
  customRowClass,
}) {
  const item = row.original;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={customRowClass}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
        {(onEdit || onDuplicate || onTransferToDatabase) &&
          (onIOConfig ||
            onGroupControl ||
            onAirconControl ||
            onRgbControl ||
            onSceneControl ||
            onScheduleControl ||
            onClockControl ||
            onCurtainControl ||
            onKnxControl ||
            onMultiSceneControl ||
            onSendSchedule ||
            onSendScene ||
            onSendCurtain ||
            onSendKnx ||
            onSendMultiScene ||
            onSendSequence ||
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
              onRgbControl ||
              onSceneControl ||
              onScheduleControl ||
              onClockControl ||
              onCurtainControl ||
              onKnxControl ||
              onMultiSceneControl ||
              onSendSchedule ||
              onSendScene ||
              onSendCurtain ||
              onSendKnx ||
              onSendMultiScene ||
              onSendSequence ||
              onFirmwareUpdate ||
              onDelete) && <ContextMenuSeparator />}
          </>
        )}
        {/* Utilities Submenu */}
        {(onGroupControl || onAirconControl || onRgbControl) && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Wrench className="text-muted-foreground" />
              <span className="pl-2">Utilities</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
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
              {onRgbControl && (
                <ContextMenuItem onClick={() => onRgbControl(item)}>
                  <Palette className="text-muted-foreground" />
                  <span>RGB Control</span>
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {/* Automation Submenu */}
        {(onSceneControl || onScheduleControl || onMultiSceneControl || onSequenceControl) && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <SlidersHorizontal className="text-muted-foreground" />
              <span className="pl-2">Automation</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {onSceneControl && (
                <ContextMenuItem onClick={() => onSceneControl.onTriggerScene(item)}>
                  <Play className="text-muted-foreground" />
                  <span>Scene Control</span>
                </ContextMenuItem>
              )}
              {onScheduleControl && (
                <ContextMenuItem onClick={() => onScheduleControl.onTriggerSchedule(item)}>
                  <Calendar className="text-muted-foreground" />
                  <span>Schedule Control</span>
                </ContextMenuItem>
              )}
              {onMultiSceneControl && (
                <ContextMenuItem onClick={() => onMultiSceneControl.onTriggerMultiScene(item)}>
                  <GitCompare className="text-muted-foreground" />
                  <span>Multi-Scene Control</span>
                </ContextMenuItem>
              )}
              {onSequenceControl && (
                <ContextMenuItem onClick={() => onSequenceControl.onTriggerSequence(item)}>
                  <ListOrdered className="text-muted-foreground" />
                  <span>Sequence Control</span>
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
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
            <ContextMenuItem onClick={() => onCurtainControl.onTriggerCurtain(item)}>
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
        {onRoomConfigControl && (
          <>
            <ContextMenuItem onClick={() => onRoomConfigControl.onRoomConfigControl(item)}>
              <Building2 className="text-muted-foreground" />
              <span>Room Control</span>
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
            {!onSendCurtain && onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onSendCurtain && (
          <>
            <ContextMenuItem onClick={() => onSendCurtain(item)}>
              <Send className="text-muted-foreground" />
              <span>Send Curtain</span>
            </ContextMenuItem>
            {!onSendKnx && onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onSendKnx && (
          <>
            <ContextMenuItem onClick={() => onSendKnx(item)}>
              <Send className="text-muted-foreground" />
              <span>Send KNX</span>
            </ContextMenuItem>
            {!onSendMultiScene && !onSendSequence && onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onSendMultiScene && (
          <>
            <ContextMenuItem onClick={() => onSendMultiScene(item)}>
              <Send className="text-muted-foreground" />
              <span>Send Multi-Scene</span>
            </ContextMenuItem>
            {!onSendSequence && onDelete && <ContextMenuSeparator />}
          </>
        )}
        {onSendSequence && (
          <>
            <ContextMenuItem onClick={() => onSendSequence(item)}>
              <Send className="text-muted-foreground" />
              <span>Send Sequence</span>
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
        {onTransferToDatabase && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onTransferToDatabase(item)}>
              <Upload className="text-muted-foreground" />
              <span>Transfer to Database</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
