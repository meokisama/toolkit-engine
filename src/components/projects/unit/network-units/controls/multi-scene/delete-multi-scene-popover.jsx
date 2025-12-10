import React from "react";
import { BaseDeleteDialog } from "../base/base-delete-dialog";

export function DeleteMultiSceneDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const config = {
    entityName: "Multi-Scenes",
    entityNameSingular: "Multi-Scene",
    indexRange: [0, 39],
    modes: [
      { id: "specific", label: "Delete Specific Multi-Scenes" },
      { id: "all", label: "Delete All Multi-Scenes (0-39)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.multiScenesController.deleteMultiScene(
          unitIp,
          canId,
          index
        );
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.multiScenesController.deleteAllMultiScenes(
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
