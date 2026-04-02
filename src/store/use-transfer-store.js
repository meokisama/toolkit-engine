import { create } from "zustand";

export const TRANSFER_STATUS = {
  IDLE: "idle",
  CONFIRMING: "confirming", // waiting for user confirmation before overwrite
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

export const TRANSFER_STEP = {
  PREFETCH: "prefetch",
  DELETE_EXISTING: "delete_existing",
  READ_RS485: "read_rs485",
  READ_IO: "read_io",
  IMPORT_UNIT: "import_unit",
  READ_CURTAINS: "read_curtains",
  READ_SCENES: "read_scenes",
  READ_SCHEDULES: "read_schedules",
  READ_KNX: "read_knx",
  READ_MULTI_SCENES: "read_multi_scenes",
  READ_SEQUENCES: "read_sequences",
};

const STEP_LABELS = {
  [TRANSFER_STEP.PREFETCH]: "Pre-loading project items...",
  [TRANSFER_STEP.DELETE_EXISTING]: "Removing old configuration...",
  [TRANSFER_STEP.READ_RS485]: "Reading RS485 configuration...",
  [TRANSFER_STEP.READ_IO]: "Reading I/O configuration...",
  [TRANSFER_STEP.IMPORT_UNIT]: "Saving unit to database...",
  [TRANSFER_STEP.READ_CURTAINS]: "Reading curtain configuration...",
  [TRANSFER_STEP.READ_SCENES]: "Reading scenes...",
  [TRANSFER_STEP.READ_SCHEDULES]: "Reading schedules...",
  [TRANSFER_STEP.READ_KNX]: "Reading KNX configuration...",
  [TRANSFER_STEP.READ_MULTI_SCENES]: "Reading multi-scenes...",
  [TRANSFER_STEP.READ_SEQUENCES]: "Reading sequences...",
};

const initialState = {
  status: TRANSFER_STATUS.IDLE,
  pendingUnits: [],
  conflictingUnits: [],
  currentUnitIndex: 0,
  currentStep: null,
  totalUnits: 0,
  errors: [],
};

export const useTransferStore = create((set, get) => ({
  ...initialState,

  // Prepare a transfer batch. If any units conflict with existing DB units,
  // status becomes 'confirming' and waits for user action before execution.
  prepare: (pendingUnits, conflictingUnits) =>
    set({
      pendingUnits,
      conflictingUnits,
      totalUnits: pendingUnits.length,
      status: conflictingUnits.length > 0 ? TRANSFER_STATUS.CONFIRMING : TRANSFER_STATUS.RUNNING,
      currentUnitIndex: 0,
      currentStep: null,
      errors: [],
    }),

  // User chose to overwrite conflicting units — proceed with execution
  confirmOverwrite: () => set({ status: TRANSFER_STATUS.RUNNING }),

  // User cancelled the overwrite dialog
  cancelTransfer: () => set(initialState),

  // Update progress during execution
  setProgress: (unitIndex, step) => set({ currentUnitIndex: unitIndex, currentStep: step }),

  addError: (unitIp, message) =>
    set((state) => ({
      errors: [...state.errors, { unitIp, message, at: Date.now() }],
    })),

  complete: () => set({ status: TRANSFER_STATUS.COMPLETED, currentStep: null }),

  fail: (message) =>
    set((state) => ({
      status: TRANSFER_STATUS.FAILED,
      errors: [...state.errors, { message, at: Date.now() }],
      currentStep: null,
    })),

  reset: () => set(initialState),

  // Derived values (computed on access, not stored)
  get currentUnit() {
    const { pendingUnits, currentUnitIndex } = get();
    return pendingUnits[currentUnitIndex] ?? null;
  },

  get progress() {
    const { currentUnitIndex, totalUnits } = get();
    return totalUnits > 0 ? Math.round((currentUnitIndex / totalUnits) * 100) : 0;
  },

  get currentStepLabel() {
    return STEP_LABELS[get().currentStep] ?? "";
  },

  get isRunning() {
    return get().status === TRANSFER_STATUS.RUNNING;
  },

  get isConfirming() {
    return get().status === TRANSFER_STATUS.CONFIRMING;
  },
}));
