import { useState, useEffect, useRef, useCallback } from "react";

/**
 * State machine states for auto refresh
 */
const REFRESH_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
};

/**
 * Simplified auto refresh hook using state machine pattern
 * Replaces complex ref-based logic with clear state management
 *
 * @param {Function} refreshCallback - Function to call on each refresh
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Refresh interval in ms (default: 3000)
 * @param {boolean} options.enabled - Whether auto refresh is enabled
 * @param {boolean} options.dialogOpen - Whether parent dialog is open
 * @param {boolean} options.childDialogOpen - Whether child dialog is open
 * @returns {Object} Auto refresh controls
 */
export function useAutoRefresh(refreshCallback, options = {}) {
  const { interval = 3000, enabled = false, dialogOpen = false, childDialogOpen = false } = options;

  const [state, setState] = useState(REFRESH_STATES.IDLE);
  const intervalRef = useRef(null);
  const callbackRef = useRef(refreshCallback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Start auto refresh
  const start = useCallback(() => {
    // Don't start if already running or if conditions aren't met
    if (state === REFRESH_STATES.RUNNING || !enabled || !dialogOpen || childDialogOpen) {
      return;
    }

    setState(REFRESH_STATES.RUNNING);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    }, interval);
  }, [state, enabled, dialogOpen, childDialogOpen, interval]);

  // Pause auto refresh
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(REFRESH_STATES.PAUSED);
  }, []);

  // Resume auto refresh
  const resume = useCallback(() => {
    // Only resume if enabled and dialog is open
    if (enabled && dialogOpen && !childDialogOpen) {
      setState(REFRESH_STATES.RUNNING);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (callbackRef.current) {
          callbackRef.current();
        }
      }, interval);
    }
  }, [enabled, dialogOpen, childDialogOpen, interval]);

  // Stop auto refresh completely
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(REFRESH_STATES.IDLE);
  }, []);

  // Auto-start when enabled changes to true
  useEffect(() => {
    if (enabled && dialogOpen && !childDialogOpen && state === REFRESH_STATES.IDLE) {
      start();
    } else if (!enabled && state === REFRESH_STATES.RUNNING) {
      stop();
    }
  }, [enabled, dialogOpen, childDialogOpen, state, start, stop]);

  // Auto-stop when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      stop();
    }
  }, [dialogOpen, stop]);

  // Auto-pause/resume based on child dialog
  useEffect(() => {
    if (childDialogOpen && state === REFRESH_STATES.RUNNING) {
      pause();
    } else if (!childDialogOpen && state === REFRESH_STATES.PAUSED && enabled && dialogOpen) {
      // Add delay before resuming to allow unit to process pending commands
      const timer = setTimeout(() => {
        if (enabled && dialogOpen && !childDialogOpen) {
          resume();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [childDialogOpen, state, enabled, dialogOpen, pause, resume]);

  return {
    state,
    isRunning: state === REFRESH_STATES.RUNNING,
    isPaused: state === REFRESH_STATES.PAUSED,
    isIdle: state === REFRESH_STATES.IDLE,
    start,
    pause,
    resume,
    stop,
  };
}
