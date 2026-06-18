import { useState, useRef, useEffect, useCallback } from "react";

const MIN_SPAN_MS = 2000; // deepest zoom: 2 seconds across the chart
const ZOOM_IN = 0.6;
const ZOOM_OUT = 1 / ZOOM_IN;

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Clamp a [start,end] window to within [fullStart,fullEnd], enforcing the min span. */
function clampRange(start, end, fullStart, fullEnd) {
  const fullSpan = Math.max(1, fullEnd - fullStart);
  const span = clampN(end - start, MIN_SPAN_MS, fullSpan);
  let s = start;
  let e = start + span;
  if (s < fullStart) {
    s = fullStart;
    e = s + span;
  }
  if (e > fullEnd) {
    e = fullEnd;
    s = e - span;
  }
  return { start: Math.max(fullStart, s), end: e };
}

/**
 * Shared, zoomable/pannable time window over [fullStart, fullEnd].
 *
 * `view === null` means "auto": the window tracks the full range and follows the
 * live right edge. Any zoom/pan switches to an explicit, frozen window until reset.
 *
 * Attach the returned `containerRef` (a callback ref) to the chart area and spread
 * `bind` onto it for pointer panning. Ctrl/⌘ + wheel zooms toward the cursor; plain
 * wheel is left for scrolling. The callback ref re-binds the native wheel listener
 * every time the element mounts (e.g. each time the dialog opens).
 */
export function useTimeViewport(fullStart, fullEnd) {
  const [view, setView] = useState(null);
  const elRef = useRef(null);
  const wheelCleanupRef = useRef(null);
  const dragRef = useRef(null);

  const fullSpan = Math.max(1, fullEnd - fullStart);
  const auto = view === null;
  const viewStart = auto ? fullStart : view.start;
  const viewEnd = auto ? fullEnd : view.end;

  // Latest values for the imperative wheel/pointer handlers, avoiding re-binds.
  const stateRef = useRef();
  stateRef.current = { viewStart, viewEnd, fullStart, fullEnd, fullSpan };

  // New tracking session / switching section → back to live.
  useEffect(() => {
    setView(null);
  }, [fullStart]);

  const applyZoom = useCallback((factor, anchorFrac) => {
    const st = stateRef.current;
    const curSpan = st.viewEnd - st.viewStart;
    const anchorT = st.viewStart + anchorFrac * curSpan;
    const newSpan = clampN(curSpan * factor, MIN_SPAN_MS, st.fullSpan);
    const next = clampRange(anchorT - anchorFrac * newSpan, anchorT - anchorFrac * newSpan + newSpan, st.fullStart, st.fullEnd);
    setView(next.end - next.start >= st.fullSpan - 1 ? null : next);
  }, []);

  // Callback ref: (re)bind the native wheel listener whenever the node mounts.
  const containerRef = useCallback(
    (node) => {
      if (wheelCleanupRef.current) {
        wheelCleanupRef.current();
        wheelCleanupRef.current = null;
      }
      elRef.current = node;
      if (!node) return;
      const onWheel = (e) => {
        if (!e.ctrlKey && !e.metaKey) return; // leave plain scroll to the list
        e.preventDefault();
        const rect = node.getBoundingClientRect();
        if (!rect.width) return;
        const frac = clampN((e.clientX - rect.left) / rect.width, 0, 1);
        applyZoom(e.deltaY < 0 ? ZOOM_IN : ZOOM_OUT, frac);
      };
      node.addEventListener("wheel", onWheel, { passive: false });
      wheelCleanupRef.current = () => node.removeEventListener("wheel", onWheel);
    },
    [applyZoom],
  );

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const node = elRef.current;
    if (!node) return;
    const st = stateRef.current;
    const rect = node.getBoundingClientRect();
    dragRef.current = { x: e.clientX, start: st.viewStart, end: st.viewEnd, width: rect.width || 1 };
    node.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const st = stateRef.current;
    const span = d.end - d.start;
    const dt = ((e.clientX - d.x) / d.width) * span;
    setView(clampRange(d.start - dt, d.end - dt, st.fullStart, st.fullEnd));
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    elRef.current?.releasePointerCapture?.(e.pointerId);
  }, []);

  return {
    containerRef,
    viewStart,
    viewEnd,
    isZoomed: !auto,
    reset: useCallback(() => setView(null), []),
    zoomIn: useCallback(() => applyZoom(ZOOM_IN, 0.5), [applyZoom]),
    zoomOut: useCallback(() => applyZoom(ZOOM_OUT, 0.5), [applyZoom]),
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
