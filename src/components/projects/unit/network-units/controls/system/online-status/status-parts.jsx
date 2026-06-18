import { Wifi, WifiOff, Inbox, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Compact online/offline pill with a leading wifi glyph. */
export function StatusPill({ online }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        online ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      {online ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
      {online ? "Online" : "Offline"}
    </span>
  );
}

/** Section container: header row with icon, title, an optional online/total counter, and a history button. */
export function SectionCard({ icon: Icon, title, count, onHistory, children }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium leading-none">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="flex items-center gap-1.5">
          {count && count.total > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                count.online === undefined
                  ? "bg-muted text-muted-foreground"
                  : count.online === count.total
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
              )}
            >
              {count.online === undefined ? `${count.total} ${count.label ?? "devices"}` : `${count.online}/${count.total} online`}
            </span>
          )}
          {onHistory && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" title="View online/offline history" onClick={onHistory}>
              <History className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-muted-foreground">
      <Inbox className="h-5 w-5 opacity-50" />
      <p className="text-xs">{children}</p>
    </div>
  );
}

export function SectionSkeleton({ rows = 2 }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Array.from({ length: rows * 2 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

/** A single device tile: a primary (mono) label, optional sub-label, and a status pill. */
export function DeviceTile({ primary, secondary, online }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-xs">{primary}</span>
        {secondary && <span className="truncate text-[11px] text-muted-foreground">{secondary}</span>}
      </div>
      {online !== undefined && <StatusPill online={online} />}
    </div>
  );
}
