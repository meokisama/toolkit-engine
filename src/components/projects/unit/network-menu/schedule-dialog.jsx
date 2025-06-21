import React, { useCallback, useMemo } from "react";
import { BaseControlDialog } from "@/components/shared/base-control-dialog";
import { ScheduleCard } from "./cards/schedule-card";
import { DeleteScheduleDialog } from "./delete-schedule-popover";
import { scheduleConfig } from "./configs/schedule-config";

/**
 * Optimized Schedule Control Dialog
 */
export const ScheduleDialog = React.memo(({ open, onOpenChange, unit }) => {
  // Memoized render card function
  const renderCard = useCallback(({ key, item, onDelete, loading }) => (
    <ScheduleCard
      key={key}
      item={item}
      onDelete={onDelete}
      loading={loading}
    />
  ), []);

  // Memoized entity config
  const memoizedEntityConfig = useMemo(() => scheduleConfig, []);

  return (
    <BaseControlDialog
      open={open}
      onOpenChange={onOpenChange}
      unit={unit}
      entityConfig={memoizedEntityConfig}
      renderCard={renderCard}
      DeleteComponent={DeleteScheduleDialog}
      emptyStateMessage="Load schedule information to see available schedules."
    />
  );
}, (prev, next) => {
  return (
    prev.open === next.open &&
    prev.unit?.ip_address === next.unit?.ip_address &&
    prev.unit?.id_can === next.unit?.id_can
  );
});

ScheduleDialog.displayName = "ScheduleDialog";
