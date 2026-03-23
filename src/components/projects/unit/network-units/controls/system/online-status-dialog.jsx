import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, Network } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RS485 } from "@/constants/rs485";
import { ROOM_MODE_LABELS, TCP_MODE_LABELS } from "@/constants/room-config";
import log from "electron-log/renderer";

const POLL_INTERVAL_MS = 3000;

const RS485_TYPE_MAP = Object.fromEntries(RS485.TYPES.map((t) => [t.value, t.label]));

function StatusBadge({ online }) {
  return online ? (
    <Badge className="gap-1 bg-green-500 hover:bg-green-500">
      <Wifi className="h-3 w-3" />
      Online
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Offline
    </Badge>
  );
}

export function OnlineStatusDialog({ open, onOpenChange, unit }) {
  const [rs485Data, setRs485Data] = useState(null);
  const [tcpData, setTcpData] = useState(null);
  const [switchData, setSwitchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!unit) return;

    setLoading(true);
    setError(null);

    try {
      let failCount = 0;

      try {
        const rs485Value = await window.electronAPI.deviceController.checkRS485OnlineStatus({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });
        setRs485Data(rs485Value);
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
      } catch (e) {
        log.warn("Switch online status failed:", e?.message);
        setSwitchData(null);
        failCount++;
      }

      if (failCount === 3) {
        setError("Failed to retrieve online status from unit");
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Online Status
          </DialogTitle>
          <DialogDescription>
            Check the connection status of devices on unit <span className="font-mono">{unit?.ip_address}</span>. Automatically updates every{" "}
            {POLL_INTERVAL_MS / 1000} seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}

          {/* RS485 Channels */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>RS485 Devices</span>
                {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!rs485Data && !loading && !error && <p className="text-sm text-muted-foreground">Loading...</p>}
              {rs485Data && rs485Data.length === 0 && <p className="text-sm text-muted-foreground">No RS485 channels found.</p>}
              {rs485Data &&
                rs485Data.map((ch) => (
                  <div key={ch.channel} className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      CH{ch.channel + 1} — {RS485_TYPE_MAP[ch.rs485Type] ?? `Type ${ch.rs485Type}`}
                    </div>
                    {ch.devices.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-2">No devices.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {ch.devices.map((dev) => (
                          <div key={dev.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                            <span className="font-mono">ID {dev.id.toString().padStart(2, "0")}</span>
                            <StatusBadge online={dev.online} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Switch Channels */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Switch Devices</span>
                {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!switchData && !loading && !error && <p className="text-sm text-muted-foreground">Loading...</p>}
              {switchData && switchData.length === 0 && <p className="text-sm text-muted-foreground">No switch channels found.</p>}
              {switchData &&
                switchData.map((ch) => (
                  <div key={ch.channel} className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">CH{ch.channel + 1}</div>
                    {ch.switches.length === 0 ? (
                      <p className="text-xs text-muted-foreground pl-2">No switches.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {ch.switches.map((sw) => (
                          <div key={`${sw.id}-${sw.keyId}`} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                            <div className="flex flex-col">
                              <span className="font-mono">ID {sw.id.toString().padStart(2, "0")} — Key {sw.keyId}</span>
                              <span className="text-muted-foreground">{sw.typeLabel}</span>
                            </div>
                            <StatusBadge online={sw.online} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* TCP Master/Slave */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Master / Slave Units</span>
                {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!tcpData && !loading && !error && <p className="text-sm text-muted-foreground">Loading...</p>}
              {tcpData && (
                <>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Room Mode: <span className="font-medium text-foreground">{ROOM_MODE_LABELS[tcpData.roomMode] ?? tcpData.roomMode}</span>
                    </span>
                    <span>
                      TCP Mode: <span className="font-medium text-foreground">{TCP_MODE_LABELS[tcpData.tcpMode] ?? tcpData.tcpMode}</span>
                    </span>
                  </div>
                  {tcpData.devices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No unit is connected.</p>
                  ) : (
                    <div className="space-y-1">
                      {tcpData.devices.map((dev, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                          <span className="font-mono">{dev.ip}</span>
                          <StatusBadge online={dev.online} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
