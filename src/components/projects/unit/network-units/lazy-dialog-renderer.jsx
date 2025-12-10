import { lazy, Suspense } from "react";
import { DIALOG_TYPES } from "./hooks/use-dialog-state";

// Lazy load all dialog components
const GroupControlDialog = lazy(() =>
  import("./controls/base/group-control-dialog").then((m) => ({
    default: m.GroupControlDialog,
  }))
);

const RoomControlDialog = lazy(() =>
  import("./controls/base/ac-control-dialog").then((m) => ({
    default: m.RoomControlDialog,
  }))
);

const RGBControlDialog = lazy(() => import("./controls/base/rgb-control-dialog"));

const TriggerSceneDialog = lazy(() =>
  import("./controls/scene/scene-control-dialog").then((m) => ({
    default: m.TriggerSceneDialog,
  }))
);

const TriggerScheduleDialog = lazy(() =>
  import("./controls/schedule/schedule-control-dialog").then((m) => ({
    default: m.TriggerScheduleDialog,
  }))
);

const ClockControlDialog = lazy(() =>
  import("./controls/clock/clock-control-dialog").then((m) => ({
    default: m.ClockControlDialog,
  }))
);

const BulkClockSyncDialog = lazy(() =>
  import("./controls/clock/bulk-clock-sync-dialog").then((m) => ({
    default: m.BulkClockSyncDialog,
  }))
);

const TriggerCurtainDialog = lazy(() =>
  import("./controls/curtain/curtain-control-dialog").then((m) => ({
    default: m.TriggerCurtainDialog,
  }))
);

const TriggerKnxDialog = lazy(() =>
  import("./controls/knx/knx-control-dialog").then((m) => ({
    default: m.TriggerKnxDialog,
  }))
);

const RoomConfigControlDialog = lazy(() =>
  import("./controls/room-config/room-config-control-dialog").then((m) => ({
    default: m.RoomConfigControlDialog,
  }))
);

const TriggerMultiSceneDialog = lazy(() =>
  import("./controls/multi-scene/multi-scene-control-dialog").then((m) => ({
    default: m.TriggerMultiSceneDialog,
  }))
);

const TriggerSequenceDialog = lazy(() =>
  import("./controls/sequence/sequence-control-dialog").then((m) => ({
    default: m.TriggerSequenceDialog,
  }))
);

const FirmwareUpdateDialog = lazy(() =>
  import("./controls/base/firmware-update-dialog").then((m) => ({
    default: m.FirmwareUpdateDialog,
  }))
);

const SendAllConfigDialog = lazy(() =>
  import("./controls/base/send-all-config-dialog").then((m) => ({
    default: m.SendAllConfigDialog,
  }))
);

const NetworkIOConfigDialog = lazy(() => import("./io-config"));

const NetworkUnitEditDialog = lazy(() =>
  import("./controls/base/network-unit-edit-dialog").then((m) => ({
    default: m.NetworkUnitEditDialog,
  }))
);

/**
 * Lazy dialog renderer - only mounts the currently active dialog
 * This significantly reduces initial render cost and memory usage
 */
export function LazyDialogRenderer({
  activeDialog,
  dialogData,
  dialogState,
  handlers,
  onUnitUpdated,
}) {
  if (!activeDialog) return null;

  // Fallback loading component
  const LoadingFallback = () => null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      {activeDialog === DIALOG_TYPES.GROUP_CONTROL && (
        <GroupControlDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.GROUP_CONTROL)}
          unit={dialogData}
          onGroupControl={handlers.handleGroupControlSubmit}
        />
      )}

      {activeDialog === DIALOG_TYPES.AIRCON_CONTROL && (
        <RoomControlDialog
          room={{
            roomName: dialogData?.type || "Network Unit",
            acGroup: 1,
            unit: dialogData,
          }}
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.AIRCON_CONTROL)}
        />
      )}

      {activeDialog === DIALOG_TYPES.RGB_CONTROL && (
        <RGBControlDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.RGB_CONTROL)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_SCENE && (
        <TriggerSceneDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_SCENE)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_SCHEDULE && (
        <TriggerScheduleDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_SCHEDULE)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.CLOCK_CONTROL && (
        <ClockControlDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.CLOCK_CONTROL)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.BULK_CLOCK_SYNC && (
        <BulkClockSyncDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.BULK_CLOCK_SYNC)}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_CURTAIN && (
        <TriggerCurtainDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_CURTAIN)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_KNX && (
        <TriggerKnxDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_KNX)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.ROOM_CONFIG_CONTROL && (
        <RoomConfigControlDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.ROOM_CONFIG_CONTROL)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_MULTI_SCENE && (
        <TriggerMultiSceneDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_MULTI_SCENE)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.TRIGGER_SEQUENCE && (
        <TriggerSequenceDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.TRIGGER_SEQUENCE)}
          unit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.FIRMWARE_UPDATE && (
        <FirmwareUpdateDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.FIRMWARE_UPDATE)}
          onFirmwareUpdate={handlers.handleFirmwareUpdateComplete}
          targetUnit={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.SEND_ALL_CONFIG && (
        <SendAllConfigDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.SEND_ALL_CONFIG)}
        />
      )}

      {activeDialog === DIALOG_TYPES.IO_CONFIG && (
        <NetworkIOConfigDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.IO_CONFIG)}
          item={dialogData}
        />
      )}

      {activeDialog === DIALOG_TYPES.EDIT && (
        <NetworkUnitEditDialog
          open={true}
          onOpenChange={dialogState.createDialogHandler(DIALOG_TYPES.EDIT)}
          unit={dialogData}
          onUnitUpdated={onUnitUpdated}
        />
      )}
    </Suspense>
  );
}
