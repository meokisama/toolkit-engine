import React from "react";
import { BaseDeleteDialog } from "../base/base-delete-dialog";

export function DeleteScheduleDialog({ open, onOpenChange, unit, asPopover = false, trigger = null }) {
  const config = {
    entityName: "Schedules",
    entityNameSingular: "Schedule",
    indexRange: [0, 31],
    modes: [
      { id: "specific", label: "Delete Specific Schedules" },
      { id: "all", label: "Delete All Schedules (0-31)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.scheduleController.deleteSchedule({
          unitIp,
          canId,
          scheduleIndex: index,
        });
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.scheduleController.deleteAllSchedules(unitIp, canId);
      },
    },
  };

  return <BaseDeleteDialog open={open} onOpenChange={onOpenChange} unit={unit} asPopover={asPopover} trigger={trigger} config={config} />;
}
