import React from "react";
import { BaseDeleteDialog } from "./base-delete-dialog";

export function DeleteCurtainDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const config = {
    entityName: "Curtains",
    entityNameSingular: "Curtain",
    indexRange: [0, 31],
    modes: [
      { id: "specific", label: "Delete Specific Curtains" },
      { id: "all", label: "Delete All Curtains (0-31)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.rcuController.deleteCurtain({
          unitIp,
          canId,
          curtainIndex: index,
        });
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.rcuController.deleteAllCurtains(
          unitIp,
          canId
        );
      },
    },
  };

  return (
    <BaseDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      unit={unit}
      asPopover={asPopover}
      trigger={trigger}
      config={config}
    />
  );
}
