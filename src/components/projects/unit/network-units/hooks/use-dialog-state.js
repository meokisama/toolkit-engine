import { useReducer, useCallback } from "react";

// Dialog types constants
export const DIALOG_TYPES = {
  GROUP_CONTROL: "groupControl",
  AIRCON_CONTROL: "airconControl",
  RGB_CONTROL: "rgbControl",
  TRIGGER_SCENE: "triggerScene",
  TRIGGER_SCHEDULE: "triggerSchedule",
  CLOCK_CONTROL: "clockControl",
  BULK_CLOCK_SYNC: "bulkClockSync",
  TRIGGER_CURTAIN: "triggerCurtain",
  TRIGGER_KNX: "triggerKnx",
  DMX_CONTROL: "dmxControl",
  ROOM_CONFIG_CONTROL: "roomConfigControl",
  TRIGGER_MULTI_SCENE: "triggerMultiScene",
  TRIGGER_SEQUENCE: "triggerSequence",
  FIRMWARE_UPDATE: "firmwareUpdate",
  SEND_ALL_CONFIG: "sendAllConfig",
  IO_CONFIG: "ioConfig",
  EDIT: "edit",
  LED_SPI_CONTROL: "ledSpiControl",
};

// Action types
const OPEN_DIALOG = "OPEN_DIALOG";
const CLOSE_DIALOG = "CLOSE_DIALOG";
const CLOSE_ALL = "CLOSE_ALL";

// Initial state
const initialState = {
  activeDialog: null,
  dialogData: null,
};

// Reducer function
function dialogReducer(state, action) {
  switch (action.type) {
    case OPEN_DIALOG:
      return {
        activeDialog: action.dialogType,
        dialogData: action.data || null,
      };
    case CLOSE_DIALOG:
      // Only close if it's the currently active dialog
      if (state.activeDialog === action.dialogType) {
        return initialState;
      }
      return state;
    case CLOSE_ALL:
      return initialState;
    default:
      return state;
  }
}

/**
 * Custom hook to manage dialog states efficiently
 * Replaces 12+ individual useState hooks with a single reducer
 */
export function useDialogState() {
  const [state, dispatch] = useReducer(dialogReducer, initialState);

  // Helper to check if a specific dialog is open
  const isDialogOpen = useCallback((dialogType) => state.activeDialog === dialogType, [state.activeDialog]);

  // Open a dialog with optional data
  const openDialog = useCallback((dialogType, data = null) => {
    dispatch({ type: OPEN_DIALOG, dialogType, data });
  }, []);

  // Close a specific dialog
  const closeDialog = useCallback((dialogType) => {
    dispatch({ type: CLOSE_DIALOG, dialogType });
  }, []);

  // Close all dialogs
  const closeAllDialogs = useCallback(() => {
    dispatch({ type: CLOSE_ALL });
  }, []);

  // Generic onChange handler for dialogs
  const createDialogHandler = useCallback(
    (dialogType) => (open) => {
      if (open) {
        openDialog(dialogType);
      } else {
        closeDialog(dialogType);
      }
    },
    [openDialog, closeDialog]
  );

  return {
    // State
    activeDialog: state.activeDialog,
    dialogData: state.dialogData,

    // Helpers
    isDialogOpen,
    openDialog,
    closeDialog,
    closeAllDialogs,
    createDialogHandler,
  };
}
