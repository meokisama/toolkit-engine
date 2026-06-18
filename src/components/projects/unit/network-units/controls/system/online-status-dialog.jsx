import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wifi, WifiOff, Network, AppWindow, Cable, Keyboard, Server } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RS485 } from "@/constants/rs485";
import { ROOM_MODE_LABELS, TCP_MODE_LABELS } from "@/constants/room-config";
import log from "electron-log/renderer";
import { FLATTENERS, recordEvents, countOnline } from "./online-status/status-history";
import { StatusPill, SectionCard, SectionSkeleton, DeviceTile, EmptyState } from "./online-status/status-parts";
import { OnlineStatusHistoryDialog } from "./online-status/history-dialog";

const POLL_INTERVAL_MS = 3000;

const RS485_TYPE_MAP = Object.fromEntries(RS485.TYPES.map((t) => [t.value, t.label]));

export function OnlineStatusDialog({ open, onOpenChange, unit }) {
  const [rs485Data, setRs485Data] = useState(null);
  const [tcpData, setTcpData] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [canData, setCanData] = useState(null);
  const [appServiceData, setAppServiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({});
  const [historyKey, setHistoryKey] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!unit) return;

    setLoading(true);
    setError(null);

    try {
      let failCount = 0;
      const snapshots = {};

      try {
        const rs485Value = await window.electronAPI.deviceController.checkRS485OnlineStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setRs485Data(rs485Value);
        if (Array.isArray(rs485Value)) snapshots.rs485 = FLATTENERS.rs485(rs485Value);
      } catch (e) {
        log.warn("RS485 online status failed:", e?.message);
        setRs485Data(null);
        failCount++;
      }

      try {
        const tcpValue = await window.electronAPI.deviceController.checkTcpOnlineStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setTcpData(tcpValue);
        if (tcpValue?.devices) snapshots.tcp = FLATTENERS.tcp(tcpValue);
      } catch (e) {
        log.warn("TCP online status failed:", e?.message);
        setTcpData(null);
        failCount++;
      }

      try {
        const switchValue = await window.electronAPI.deviceController.checkSwitchOnlineStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setSwitchData(switchValue);
        if (Array.isArray(switchValue)) snapshots.switch = FLATTENERS.switch(switchValue);
      } catch (e) {
        log.warn("Switch online status failed:", e?.message);
        setSwitchData(null);
        failCount++;
      }

      try {
        const canValue = await window.electronAPI.deviceController.checkCanOnlineStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setCanData(canValue);
        if (Array.isArray(canValue)) snapshots.can = FLATTENERS.can(canValue);
      } catch (e) {
        log.warn("CAN online status failed:", e?.message);
        setCanData(null);
        failCount++;
      }

      try {
        const appServiceValue = await window.electronAPI.deviceController.checkAppServiceStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setAppServiceData(appServiceValue);
        if (Array.isArray(appServiceValue)) snapshots.app = FLATTENERS.app(appServiceValue);
      } catch (e) {
        log.warn("App Service online status failed:", e?.message);
        setAppServiceData(null);
        failCount++;
      }

      if (failCount === 5) {
        setError("Failed to retrieve online status from unit");
      }

      // Record edge-triggered history: one event per device only when its state changes.
      const now = Date.now();
      setHistory((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(snapshots)) {
          next[key] = recordEvents(prev[key], snapshots[key], now);
        }
        return next;
      });
    } catch (err) {
      log.error("Online status check failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  useEffect(() => {
    if (!open || !unit) return;

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [open, unit, fetchStatus]);

  // Reset cached data + history when the dialog closes so a re-open starts fresh.
  useEffect(() => {
    if (open) return;
    setRs485Data(null);
    setTcpData(null);
    setSwitchData(null);
    setCanData(null);
    setAppServiceData(null);
    setError(null);
    setHistory({});
    setHistoryKey(null);
  }, [open]);

  const rs485Count = useMemo(() => countOnline(rs485Data, (ch) => ch.devices), [rs485Data]);
  const switchCount = useMemo(() => countOnline(switchData, (ch) => ch.switches), [switchData]);
  const appCount = useMemo(() => {
    if (!appServiceData) return { online: 0, total: 0 };
    const apps = appServiceData.filter((a) => a.appEnum !== 0);
    return { online: apps.filter((a) => a.online).length, total: apps.length };
  }, [appServiceData]);
  const tcpCount = useMemo(() => {
    if (!tcpData?.devices) return { online: 0, total: 0 };
    return { online: tcpData.devices.filter((d) => d.online).length, total: tcpData.devices.length };
  }, [tcpData]);

  const overall = useMemo(() => {
    const total = rs485Count.total + switchCount.total + appCount.total + tcpCount.total;
    const online = rs485Count.online + switchCount.online + appCount.online + tcpCount.online;
    return { online, total };
  }, [rs485Count, switchCount, appCount, tcpCount]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Online Status
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                Unit <span className="font-mono text-foreground">{unit?.ip_address}</span>
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={cn("absolute inline-flex h-full w-full rounded-full bg-emerald-500", loading && "animate-ping opacity-75")} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live · every {POLL_INTERVAL_MS / 1000}s
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Overall summary strip */}
          <div className="flex items-center justify-between gap-4 border-b bg-muted/30 px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Devices online</span>
              <span className="font-semibold tabular-nums">
                {overall.online}
                <span className="text-muted-foreground">/{overall.total}</span>
              </span>
            </div>
            {overall.total > 0 && (
              <div className="flex flex-1 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(overall.online / overall.total) * 100}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round((overall.online / overall.total) * 100)}%</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                <WifiOff className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* RS485 Channels */}
            <SectionCard icon={Cable} title="RS485 Devices" count={rs485Count} onHistory={() => setHistoryKey("rs485")}>
              {!rs485Data && !error && <SectionSkeleton rows={1} />}
              {rs485Data && rs485Data.length === 0 && <EmptyState>No RS485 channels found.</EmptyState>}
              {rs485Data &&
                rs485Data.map((ch) => (
                  <div key={ch.channel} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-foreground">CH{ch.channel + 1}</span>
                      {RS485_TYPE_MAP[ch.rs485Type] ?? `Type ${ch.rs485Type}`}
                    </div>
                    {ch.devices.length === 0 ? (
                      <p className="pl-1 text-xs text-muted-foreground">No devices.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {ch.devices.map((dev) => (
                          <DeviceTile key={dev.id} primary={`ID ${dev.id.toString().padStart(2, "0")}`} online={dev.online} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </SectionCard>

            {/* Switch Channels */}
            <SectionCard icon={Keyboard} title="Switch Devices" count={switchCount} onHistory={() => setHistoryKey("switch")}>
              {!switchData && !error && <SectionSkeleton rows={1} />}
              {switchData && switchData.length === 0 && <EmptyState>No switch channels found.</EmptyState>}
              {switchData &&
                switchData.map((ch) => (
                  <div key={ch.channel} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-foreground">CH{ch.channel + 1}</span>
                    </div>
                    {ch.switches.length === 0 ? (
                      <p className="pl-1 text-xs text-muted-foreground">No switches.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {ch.switches.map((sw) => (
                          <DeviceTile
                            key={`${sw.id}-${sw.keyId}`}
                            primary={`ID ${sw.id.toString().padStart(2, "0")} · Key ${sw.keyId}`}
                            secondary={sw.typeLabel}
                            online={sw.online}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </SectionCard>

            {/* CAN Network */}
            <SectionCard icon={Network} title="CAN Network Devices" count={canData ? { total: canData.length, label: "devices" } : undefined} onHistory={() => setHistoryKey("can")}>
              {!canData && !error && <SectionSkeleton rows={1} />}
              {canData && canData.length === 0 && <EmptyState>No CAN devices found.</EmptyState>}
              {canData && canData.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {canData.map((dev, idx) => (
                    <DeviceTile key={idx} primary={dev.canId} secondary={dev.unitName} />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* App Services */}
            <SectionCard icon={AppWindow} title="App Services" count={appCount} onHistory={() => setHistoryKey("app")}>
              {!appServiceData && !error && <SectionSkeleton rows={1} />}
              {appServiceData && appServiceData.length === 0 && <EmptyState>No app service configured.</EmptyState>}
              {appServiceData && appServiceData.length > 0 && (
                <div className="space-y-1.5">
                  {appServiceData.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-medium">{app.appName}</span>
                        {app.appEnum !== 0 && (
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {app.ip}:{app.port}
                          </span>
                        )}
                        {app.inroomNodeOnline !== null && (
                          <span className="text-[11px] text-muted-foreground">Inroom node: {app.inroomNodeOnline ? "Online" : "Offline"}</span>
                        )}
                      </div>
                      {app.appEnum !== 0 && <StatusPill online={app.online} />}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* TCP Master/Slave */}
            <SectionCard icon={Server} title="Master / Slave Units" count={tcpCount} onHistory={() => setHistoryKey("tcp")}>
              {!tcpData && !error && <SectionSkeleton rows={1} />}
              {tcpData && (
                <>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-md border bg-muted/40 px-2 py-1 text-muted-foreground">
                      Room Mode: <span className="font-medium text-foreground">{ROOM_MODE_LABELS[tcpData.roomMode] ?? tcpData.roomMode}</span>
                    </span>
                    <span className="rounded-md border bg-muted/40 px-2 py-1 text-muted-foreground">
                      TCP Mode: <span className="font-medium text-foreground">{TCP_MODE_LABELS[tcpData.tcpMode] ?? tcpData.tcpMode}</span>
                    </span>
                  </div>
                  {tcpData.devices.length === 0 ? (
                    <EmptyState>No unit is connected.</EmptyState>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {tcpData.devices.map((dev, idx) => (
                        <DeviceTile key={idx} primary={dev.ip} online={dev.online} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OnlineStatusHistoryDialog
        open={!!historyKey}
        onOpenChange={(o) => !o && setHistoryKey(null)}
        sectionKey={historyKey}
        section={historyKey ? history[historyKey] : null}
      />
    </>
  );
}
