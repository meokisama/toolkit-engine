import React from "react";
import { BaseDeleteDialog } from "../base/base-delete-dialog";

export function DeleteKnxDialog({
  open,
  onOpenChange,
  unit,
  asPopover = false,
  trigger = null,
}) {
  const config = {
    entityName: "KNX Configurations",
    entityNameSingular: "KNX Configuration",
    indexRange: [0, 511],
    indexLabel: "KNX Address",
    modes: [
      { id: "specific", label: "Delete Specific KNX Configurations" },
      { id: "all", label: "Delete All KNX Configurations (0-511)" },
    ],
    apiMethods: {
      deleteOne: async ({ unitIp, canId, index }) => {
        return await window.electronAPI.rcuController.deleteKnxConfig({
          unitIp,
          canId,
          knxAddress: index,
        });
      },
      deleteAll: async (unitIp, canId) => {
        return await window.electronAPI.rcuController.deleteAllKnxConfigs(
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
