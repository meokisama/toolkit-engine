import { format } from "date-fns";

/**
 * Pure helpers for online/offline history tracking.
 *
 * History is recorded *edge-triggered*: a device only gets a new event when its
 * online state actually changes (plus one event the first time it is seen). This
 * keeps memory tiny and makes the data a natural fit for a pulse/step chart.
 *
 * Section shape:
 *   {
 *     startedAt: number,                              // ms, when tracking began
 *     labels:  { [key]: { label, sublabel } },
 *     devices: { [key]: { firstSeen: number, events: [{ t: number, online: boolean }] } },
 *   }
 */

/**
 * Flatten each section's raw payload into a uniform `[{ key, label, sublabel, online }]`.
 * `key` must be stable across polls so a device keeps the same timeline row.
 */
export const FLATTENERS = {
  rs485: (data) =>
    data.flatMap((ch) =>
      ch.devices.map((dev) => ({
        key: `ch${ch.channel}-id${dev.id}`,
        label: `CH${ch.channel + 1} · ID ${dev.id.toString().padStart(2, "0")}`,
        online: !!dev.online,
      })),
    ),
  switch: (data) =>
    data.flatMap((ch) =>
      ch.switches.map((sw) => ({
        key: `ch${ch.channel}-id${sw.id}-key${sw.keyId}`,
        label: `CH${ch.channel + 1} · ID ${sw.id.toString().padStart(2, "0")} · Key ${sw.keyId}`,
        sublabel: sw.typeLabel,
        online: !!sw.online,
      })),
    ),
  can: (data) => data.map((dev) => ({ key: `can-${dev.canId}`, label: dev.canId, sublabel: dev.unitName, online: true })),
  app: (data) =>
    data
      .filter((a) => a.appEnum !== 0)
      .map((a) => ({ key: `app-${a.appEnum}-${a.appName}`, label: a.appName, sublabel: `${a.ip}:${a.port}`, online: !!a.online })),
  tcp: (data) => data.devices.map((dev) => ({ key: `tcp-${dev.ip}`, label: dev.ip, online: !!dev.online })),
};

/**
 * Fold one poll's device list into a section, appending an event only where the
 * state changed. Devices previously seen but missing from this poll are recorded
 * as offline (for CAN/TCP a vanished device means it dropped off the bus/link).
 */
export function recordEvents(section, items, now) {
  const prev = section ?? { startedAt: now, labels: {}, devices: {} };
  const labels = { ...prev.labels };
  const devices = { ...prev.devices };
  const seen = new Set();

  for (const it of items) {
    seen.add(it.key);
    labels[it.key] = { label: it.label, sublabel: it.sublabel };
    const dev = devices[it.key];
    if (!dev) {
      devices[it.key] = { firstSeen: now, events: [{ t: now, online: it.online }] };
    } else if (dev.events[dev.events.length - 1].online !== it.online) {
      devices[it.key] = { firstSeen: dev.firstSeen, events: [...dev.events, { t: now, online: it.online }] };
    }
  }

  for (const key of Object.keys(devices)) {
    if (seen.has(key)) continue;
    const dev = devices[key];
    if (dev.events[dev.events.length - 1].online !== false) {
      devices[key] = { firstSeen: dev.firstSeen, events: [...dev.events, { t: now, online: false }] };
    }
  }

  return { startedAt: prev.startedAt, labels, devices };
}

/** Expand a device's edge events into drawable `[{ start, end, online }]` segments up to `end`. */
export function segmentsFromEvents(events, end) {
  const segs = [];
  for (let i = 0; i < events.length; i++) {
    segs.push({
      start: events[i].t,
      end: i + 1 < events.length ? events[i + 1].t : end,
      online: events[i].online,
    });
  }
  return segs;
}

/** Derive per-device stats for one timeline row. */
export function computeDeviceStats(device, end) {
  const segments = segmentsFromEvents(device.events, end);
  let onlineMs = 0;
  for (const s of segments) if (s.online) onlineMs += s.end - s.start;
  const totalMs = Math.max(1, end - device.firstSeen);
  const uptime = Math.round((onlineMs / totalMs) * 100);
  const changes = device.events.length - 1;
  const current = device.events[device.events.length - 1].online;
  return { segments, onlineMs, totalMs, uptime, changes, current };
}

/** Sum online/total across grouped data; `pick` returns the device array for one group. */
export function countOnline(groups, pick) {
  if (!groups) return { online: 0, total: 0 };
  let online = 0;
  let total = 0;
  for (const g of groups) {
    for (const d of pick(g)) {
      total++;
      if (d.online) online++;
    }
  }
  return { online, total };
}

export function fmtClock(ts) {
  return format(ts, "HH:mm:ss");
}

export function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
