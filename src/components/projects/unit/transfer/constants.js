/**
 * UDP timing constants for sequential reads from network units.
 *
 * These delays exist because RCU units communicate over UDP and cannot handle
 * back-to-back requests without a brief pause between them.
 *
 * READ_DELAY  — between two consecutive requests of the same type (e.g. CH1 → CH2, item N → item N+1)
 * PHASE_DELAY — after completing a full read phase before starting the next (e.g. after all inputs done)
 */
export const UDP_READ_DELAY_MS = 50;
export const UDP_PHASE_DELAY_MS = 100;
