import React, { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BaseControlCard } from "@/components/shared/base-control-card";

// Memoized helper functions
const formatTime = (hour, minute) => {
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}`;
};

const formatDays = (weekDays) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activeDays = weekDays
    .map((active, index) => (active ? dayNames[index] : null))
    .filter(Boolean);

  if (activeDays.length === 7) return "Every day";
  if (activeDays.length === 0) return "No days";
  return activeDays.join(", ");
};

/**
 * Optimized Schedule Card
 */
export const ScheduleCard = memo(({
  item: schedule,
  onDelete,
  loading = false,
}) => {
  const title = useMemo(() => `Schedule #${schedule.index}`, [schedule.index]);

  const formattedTime = useMemo(() =>
    formatTime(schedule.hour, schedule.minute),
    [schedule.hour, schedule.minute]
  );

  const formattedDays = useMemo(() =>
    formatDays(schedule.weekDays),
    [schedule.weekDays]
  );

  const statusBadge = useMemo(() => (
    <Badge variant={schedule.enabled ? "default" : "secondary"}>
      {schedule.enabled ? "Enabled" : "Disabled"}
    </Badge>
  ), [schedule.enabled]);

  const metadata = useMemo(() => [
    {
      label: "Time",
      content: formattedTime,
      separator: true,
    },
    {
      label: "Status",
      content: statusBadge,
    },
    {
      label: "Days",
      content: formattedDays,
    },
  ], [formattedTime, statusBadge, formattedDays]);

  const sceneAddressesGrid = useMemo(() => {
    if (!schedule.sceneAddresses || schedule.sceneAddresses.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          <p className="text-sm">No scenes configured</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Scene Addresses
        </h5>
        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
          {schedule.sceneAddresses.map((address, index) => (
            <Badge
              key={`addr-${address}-${index}`}
              variant="outline"
              className="text-xs justify-center"
            >
              {address}
            </Badge>
          ))}
        </div>
      </div>
    );
  }, [schedule.sceneAddresses]);

  return (
    <BaseControlCard
      item={schedule}
      title={title}
      metadata={metadata}
      actions={[]}
      loading={loading}
      onDelete={onDelete}
    >
      <div className="mt-2 flex justify-end">
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <span className="font-light">Scenes:</span> {schedule.sceneCount}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-108" align="end">
            <div className="space-y-3">
              <div className="flex justify-between">
                <h4 className="font-medium text-sm">Schedule #{schedule.index}</h4>
                <div className="text-xs text-muted-foreground">
                  <strong>Time:</strong> {formattedTime} |{" "}
                  <strong>Total Scenes:</strong> {schedule.sceneCount}
                </div>
              </div>
              {sceneAddressesGrid}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </BaseControlCard>
  );
}, (prev, next) => {
  return (
    prev.item.index === next.item.index &&
    prev.item.enabled === next.item.enabled &&
    prev.item.hour === next.item.hour &&
    prev.item.minute === next.item.minute &&
    prev.item.sceneCount === next.item.sceneCount &&
    JSON.stringify(prev.item.weekDays) === JSON.stringify(next.item.weekDays) &&
    prev.loading === next.loading
  );
});

ScheduleCard.displayName = "ScheduleCard";
