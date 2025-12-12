import React from "react";
import { BaseDeleteDialog } from "../base/base-delete-dialog";

export function DeleteSceneDialog({ open, onOpenChange, unit, asPopover = false, trigger = null }) {
  const config = {
    entityName: "Scenes",
    entityNameSingular: "Scene",
    indexRange: [0, 99],
    modes: [
      { id: "specific", label: "Delete Specific Scenes" },
      { id: "all", label: "Delete All Scenes (0-99)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.sceneController.deleteScene(unitIp, canId, index);
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.sceneController.deleteAllScenes(unitIp, canId);
      },
    },
  };

  return <BaseDeleteDialog open={open} onOpenChange={onOpenChange} unit={unit} asPopover={asPopover} trigger={trigger} config={config} />;
}
