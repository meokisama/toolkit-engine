import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GripVertical, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import { useDaliDevices } from "./hooks/useDaliDevices";
import { useEditableName } from "./hooks/useEditableName";
import { DALI_GROUP_COUNT } from "./utils/constants";
import { TriggerGroupButton, TriggerDeviceButton } from "./trigger-buttons";

export function Group({ isActive }) {
  const { selectedProject } = useProjectDetail();

  // Fixed 16 groups
  const [groups, setGroups] = useState(() =>
    Array.from({ length: DALI_GROUP_COUNT }, (_, i) => ({
      id: i,
      name: `Group ${i}`,
      deviceIds: [],
    }))
  );

  const [activeId, setActiveId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set([0]));
  const [loading, setLoading] = useState(true);

  // Load devices using custom hook
  const { devices } = useDaliDevices(selectedProject, isActive);

  // Load group data from database - reload when tab becomes active
  useEffect(() => {
    if (!selectedProject || !isActive) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load group names
        const groupNames = await window.electronAPI.dali.getAllGroupNames(
          selectedProject.id
        );

        // Load group relationships
        const groupDevices = await window.electronAPI.dali.getAllGroupDevices(
          selectedProject.id
        );

        setGroups((prev) =>
          prev.map((group) => {
            const nameData = groupNames.find((gn) => gn.group_id === group.id);
            return {
              ...group,
              name: nameData ? nameData.name : `Group ${group.id}`,
              deviceIds: groupDevices
                .filter((gd) => gd.group_id === group.id)
                .map((gd) => gd.device_address),
            };
          })
        );
      } catch (error) {
        console.error("Failed to load group data:", error);
        toast.error("Failed to load group data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProject, isActive]);

  const handleUpdateGroupName = useCallback(
    async (groupId, newName) => {
      if (!selectedProject || !newName.trim()) return;

      try {
        await window.electronAPI.dali.updateGroupName(
          selectedProject.id,
          groupId,
          newName.trim()
        );

        setGroups((prev) =>
          prev.map((group) =>
            group.id === groupId ? { ...group, name: newName.trim() } : group
          )
        );

        toast.success("Group name updated");
      } catch (error) {
        console.error("Failed to update group name:", error);
        toast.error("Failed to update group name");
      }
    },
    [selectedProject]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || !selectedProject) return;

      // Check if dropped on a group
      if (over.id.toString().startsWith("group-")) {
        const groupId = parseInt(over.id.toString().replace("group-", ""));
        const deviceId = parseInt(active.id.toString().replace("device-", ""));

        // Check if device is already in group
        setGroups((prevGroups) => {
          const group = prevGroups.find((g) => g.id === groupId);
          if (group && group.deviceIds.includes(deviceId)) {
            return prevGroups;
          }

          // Add to database
          window.electronAPI.dali
            .addDeviceToGroup(selectedProject.id, groupId, deviceId)
            .then(() => {
              toast.success("Device added to group");
            })
            .catch((error) => {
              console.error("Failed to add device to group:", error);
              toast.error("Failed to add device to group");
            });

          // Add device to group optimistically
          return prevGroups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                deviceIds: [...group.deviceIds, deviceId],
              };
            }
            return group;
          });
        });
      }
    },
    [selectedProject]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleRemoveFromGroup = useCallback(
    async (groupId, deviceId) => {
      if (!selectedProject) return;

      // Remove from database
      window.electronAPI.dali
        .removeDeviceFromGroup(selectedProject.id, groupId, deviceId)
        .then(() => {
          toast.success("Device removed from group");
        })
        .catch((error) => {
          console.error("Failed to remove device from group:", error);
          toast.error("Failed to remove device from group");
        });

      // Remove from state optimistically
      setGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                deviceIds: group.deviceIds.filter((id) => id !== deviceId),
              }
            : group
        )
      );
    },
    [selectedProject]
  );

  const toggleGroupExpanded = useCallback((groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const activeDevice = useMemo(
    () => devices.find((d) => `device-${d.id}` === activeId),
    [devices, activeId]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left: 16 Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Groups (0-15)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-360px)]">
              <div className="space-y-2 pr-4">
                {groups.map((group) => (
                  <GroupItem
                    key={group.id}
                    group={group}
                    devices={devices}
                    expanded={expandedGroups.has(group.id)}
                    onToggleExpanded={() => toggleGroupExpanded(group.id)}
                    onRemoveDevice={handleRemoveFromGroup}
                    onUpdateName={handleUpdateGroupName}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: 64 Fixed Devices */}
        <Card>
          <CardHeader>
            <CardTitle>Devices (0-63)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-360px)]">
              <div className="space-y-2 pr-4">
                {devices.map((device) => (
                  <DeviceItem key={device.id} device={device} groups={groups} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {activeDevice ? (
          <div className="bg-primary text-primary-foreground p-3 rounded-md shadow-lg flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            <div>
              <div className="font-medium">
                {activeDevice.name || `Address ${activeDevice.address}`}
              </div>
              {activeDevice.type && (
                <div className="text-xs opacity-80">{activeDevice.type}</div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const GroupItem = memo(function GroupItem({
  group,
  devices,
  expanded,
  onToggleExpanded,
  onRemoveDevice,
  onUpdateName,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
  });

  const groupDevices = useMemo(
    () => devices.filter((d) => group.deviceIds.includes(d.id)),
    [devices, group.deviceIds]
  );

  const handleSaveName = useCallback(
    (newName) => {
      onUpdateName(group.id, newName);
    },
    [onUpdateName, group.id]
  );

  const { isEditing, editName, handlers } = useEditableName(
    group.name,
    handleSaveName
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-md bg-card transition-colors hover:border-primary",
        isOver && "border-primary border-2 bg-accent"
      )}
    >
      <div className="p-3 cursor-pointer" onClick={onToggleExpanded}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={handlers.onChange}
                  onBlur={handlers.onBlur}
                  onKeyDown={handlers.onKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="h-7 w-40"
                />
              ) : (
                <div
                  className="font-medium hover:text-primary"
                  onClick={handlers.onClick}
                >
                  {group.name}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {group.deviceIds.length} device(s)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TriggerGroupButton groupId={group.id} disabled={false} />
            <Badge variant="secondary">{group.id}</Badge>
          </div>
        </div>
      </div>

      {expanded && group.deviceIds.length > 0 && (
        <div className="border-t bg-muted/50 p-2 space-y-1">
          {groupDevices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between bg-background rounded px-2 py-1 text-sm"
            >
              <div>
                <span className="font-mono mr-2">
                  {device.address.toString().padStart(2, "0")}
                </span>
                {device.name || "Unmapped"}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDevice(group.id, device.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const DeviceItem = memo(function DeviceItem({ device, groups }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `device-${device.id}`,
  });

  const memberGroups = useMemo(
    () => groups.filter((g) => g.deviceIds.includes(device.id)),
    [groups, device.id]
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-md p-3 transition-colors",
        device.name ? "bg-card" : "bg-muted/50",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 flex-1 cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 flex items-center gap-4">
            <div className="font-mono text-sm font-medium text-muted-foreground">
              {device.address.toString().padStart(2, "0")}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{device.name || "Unmapped"}</span>
              {memberGroups.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {memberGroups.map((group) => (
                    <Badge key={group.id} variant="outline" className="text-xs">
                      G{group.id}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <TriggerDeviceButton address={device.address} disabled={false} />
        </div>
      </div>
    </div>
  );
});
