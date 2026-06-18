import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { segmentsFromEvents, computeDeviceStats, fmtClock, fmtDuration } from "./status-history";
import { StatusPill } from "./status-parts";
import { useTimeViewport } from "./use-time-viewport";

// SVG user-space. Drawn with preserveAspectRatio="none"; strokes use non-scaling
// vector-effect so they stay crisp regardless of how wide the chart stretches.
const W = 1000;
const H = 44;
const TOP = 10; // online rail (y)
const BOT = 34; // offline rail (y)

/**
 * A digital pulse (square-wave) trace: high = online (emerald), low = offline (rose).
 * `viewStart`/`viewEnd` define the visible (zoomable) time domain; `now` closes the
 * trailing segment. Anything outside the domain is clipped by the SVG viewBox.
 */
export function Waveform({ events, now, viewStart, viewEnd }) {
  const span = Math.max(1, viewEnd - viewStart);
  const xOf = (t) => ((t - viewStart) / span) * W;
  const yOf = (online) => (online ? TOP : BOT);
  const segs = segmentsFromEvents(events, now);

  return (
    <div className="overflow-hidden rounded-md border bg-muted/30">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-12 w-full" role="img" aria-label="Online/offline timeline">
        {/* rails */}
        <line x1="0" y1={TOP} x2={W} y2={TOP} className="stroke-border/70" strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1={BOT} x2={W} y2={BOT} className="stroke-border/70" strokeWidth="1" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
        {segs.map((sg, i) => {
          const x1 = xOf(sg.start);
          const x2 = xOf(sg.end);
          const y = yOf(sg.online);
          return (
            <g key={i}>
              {/* area highlight under online runs */}
              {sg.online && <rect x={x1} y={TOP} width={Math.max(0, x2 - x1)} height={BOT - TOP} className="fill-emerald-500/8" />}
              {/* vertical edge from the previous level */}
              {i > 0 && (
                <line x1={x1} y1={yOf(segs[i - 1].online)} x2={x1} y2={y} className="stroke-foreground/25" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              )}
              {/* the level run */}
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                className={sg.online ? "stroke-emerald-500/80" : "stroke-rose-500/80"}
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              >
                <title>{`${fmtClock(sg.start)} – ${fmtClock(sg.end)} · ${sg.online ? "Online" : "Offline"} (${fmtDuration(sg.end - sg.start)})`}</title>
              </line>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Evenly-spaced clock ticks beneath a chart; aligns with the waveform above. */
export function TimeAxis({ start, end, ticks = 4 }) {
  const span = Math.max(1, end - start);
  return (
    <div className="relative mt-1 h-3.5">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const t = start + (span * i) / ticks;
        const pct = (i / ticks) * 100;
        const transform = i === 0 ? "translateX(0)" : i === ticks ? "translateX(-100%)" : "translateX(-50%)";
        return (
          <span key={i} className="absolute top-0 font-mono text-[10px] tabular-nums text-muted-foreground" style={{ left: `${pct}%`, transform }}>
            {fmtClock(t)}
          </span>
        );
      })}
    </div>
  );
}

/** Live status dot — emerald (pulsing) when online, muted when offline. */
function StatusDot({ online }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
    </span>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", accent)}>{value}</span>
    </div>
  );
}

/**
 * A self-contained device card: status header, stats strip, and a pulse chart with
 * its own independent zoom/pan viewport, mini zoom controls, and time axis.
 */
export function DeviceWaveformRow({ info, device, now }) {
  const { uptime, changes, current } = computeDeviceStats(device, now);
  const lastChangeAt = device.events[device.events.length - 1].t;
  const { containerRef, viewStart, viewEnd, isZoomed, reset, zoomIn, zoomOut, bind } = useTimeViewport(device.firstSeen, now);

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-foreground/15">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot online={current} />
            <span className="truncate font-mono text-sm font-medium">{info.label}</span>
          </div>
          {info.sublabel && <p className="mt-0.5 truncate pl-4 text-[11px] text-muted-foreground">{info.sublabel}</p>}
        </div>
        <StatusPill online={current} />
      </div>

      {/* stats strip */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <Stat label="Uptime" value={`${uptime}%`} accent={uptime === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
        <span className="h-3 w-px bg-border" />
        <Stat label="Changes" value={changes} />
        <span className="h-3 w-px bg-border" />
        <Stat label="Stable for" value={fmtDuration(now - lastChangeAt)} />
      </div>

      {/* chart toolbar */}
      <div className="mb-1 mt-3 flex items-center justify-between">
        <span className="text-[10px] tabular-nums text-muted-foreground">
          Window <span className="font-mono text-foreground">{fmtDuration(viewEnd - viewStart)}</span>
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="Zoom out" onClick={zoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="Zoom in" onClick={zoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="Reset to live view" onClick={reset} disabled={!isZoomed}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* chart (independent pan/zoom) */}
      <div
        ref={containerRef}
        className="cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={bind.onPointerDown}
        onPointerMove={bind.onPointerMove}
        onPointerUp={bind.onPointerUp}
        onPointerCancel={bind.onPointerCancel}
      >
        <Waveform events={device.events} now={now} viewStart={viewStart} viewEnd={viewEnd} />
      </div>
      <TimeAxis start={viewStart} end={viewEnd} />
    </div>
  );
}
