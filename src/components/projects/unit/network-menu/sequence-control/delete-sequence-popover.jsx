import React from "react";
import { BaseDeleteDialog } from "../base/base-delete-dialog";

export function DeleteSequenceDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const config = {
    entityName: "Sequences",
    entityNameSingular: "Sequence",
    indexRange: [0, 19],
    modes: [
      { id: "specific", label: "Delete Specific Sequences" },
      { id: "all", label: "Delete All Sequences (0-19)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.rcuController.deleteSequence(
          unitIp,
          canId,
          index
        );
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.rcuController.deleteAllSequences(
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
