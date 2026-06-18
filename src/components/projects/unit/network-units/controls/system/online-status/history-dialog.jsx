import { Cable, Keyboard, Network, AppWindow, Server, Activity, MousePointer2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNow } from "./use-now";
import { fmtDuration } from "./status-history";
import { EmptyState } from "./status-parts";
import { DeviceWaveformRow } from "./device-waveform";

const SECTION_META = {
  rs485: { title: "RS485 Devices", icon: Cable },
  switch: { title: "Switch Devices", icon: Keyboard },
  can: { title: "CAN Network Devices", icon: Network },
  app: { title: "App Services", icon: AppWindow },
  tcp: { title: "Master / Slave Units", icon: Server },
};

/** Per-section history: one self-contained pulse chart per device, each independently zoomable/pannable. */
export function OnlineStatusHistoryDialog({ open, onOpenChange, sectionKey, section }) {
  const now = useNow(open);
  const meta = SECTION_META[sectionKey] ?? {};
  const Icon = meta.icon ?? Activity;

  const start = section?.startedAt ?? now;
  const end = Math.max(now, start + 1);
  const devices = section?.devices ?? {};
  const keys = Object.keys(devices).sort((a, b) => (section.labels[a]?.label ?? "").localeCompare(section.labels[b]?.label ?? ""));
  const tracked = keys.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {meta.title ?? "History"}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>State changes recorded since the dialog opened</span>
            {tracked && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>Tracking {fmtDuration(end - start)}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  {keys.length} {keys.length === 1 ? "device" : "devices"}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-6 py-4">
          {tracked ? (
            keys.map((key) => <DeviceWaveformRow key={key} info={section.labels[key]} device={devices[key]} now={end} />)
          ) : (
            <EmptyState>No history yet — a point is logged only when a device changes state. Keep this open.</EmptyState>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-6 py-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm bg-emerald-500/80" /> Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm bg-rose-500/80" /> Offline
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <MousePointer2 className="h-3 w-3" />
            Drag a chart to pan · Ctrl/⌘ + scroll to zoom · each device is independent
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
