import { createDiff } from "./helpers";

const MAX_SLAVES = 4;
const STATE_NAMES = ["Unrent", "Unoccupy", "Checkin", "Welcome", "WelcomeNight", "Staff", "OutOfService"];

const ROOM_FIELDS = [
  { field: "occupancy_type", lbl: "Occupancy Type" },
  { field: "occupancy_scene_type", lbl: "Occupancy Scene Type" },
  { field: "enable_welcome_night", lbl: "Enable Welcome Night" },
  { field: "period", lbl: "Period" },
  { field: "pir_init_time", lbl: "PIR Init Time" },
  { field: "pir_verify_time", lbl: "PIR Verify Time" },
  { field: "unrent_period", lbl: "Unrent Period" },
  { field: "standby_time", lbl: "Standby Time" },
];

const STATE_AIRCON_FIELDS = [
  { field: "airconActive", lbl: "Aircon Active", bool: true },
  { field: "airconMode", lbl: "Aircon Mode" },
  { field: "airconFanSpeed", lbl: "Aircon Fan Speed" },
  { field: "airconCoolSetpoint", lbl: "Aircon Cool SP" },
  { field: "airconHeatSetpoint", lbl: "Aircon Heat SP" },
];

// Treat empty/zero IP markers as equivalent regardless of origin.
const normalizeIp = (ip) => (!ip || ip === "0.0.0.0" ? "" : String(ip).trim());
// DB may store null for knx_address; RCU encodes empty as "0/0/0".
const normalizeKnxAddr = (addr) => (!addr || addr === "0/0/0" ? "" : String(addr).trim());

export function compareRoomConfig(databaseRoom, networkRoom) {
  // Both sides empty — nothing to compare
  if (!databaseRoom && !networkRoom) return { isEqual: true, differences: [] };
  if (!databaseRoom) {
    return { isEqual: false, differences: [createDiff("room", "Room Configuration", "missing", "present")] };
  }
  if (!networkRoom) {
    return { isEqual: false, differences: [createDiff("room", "Room Configuration", "present", "missing")] };
  }

  const differences = [];
  const dbGen = databaseRoom.generalConfig || {};
  const netGen = networkRoom.generalConfig || {};

  // General scalar fields (shared snake_case between DB and RCU response)
  const generalFields = [
    { field: "room_amount", lbl: "Room Amount" },
    { field: "room_mode", lbl: "Room Mode" },
    { field: "client_mode", lbl: "Client Mode" },
    { field: "tcp_mode", lbl: "TCP Mode" },
    { field: "slave_amount", lbl: "Slave Amount" },
    { field: "port", lbl: "Port" },
    { field: "client_port", lbl: "Client Port" },
  ];
  generalFields.forEach(({ field, lbl }) => {
    const dbVal = dbGen[field] ?? 0;
    const netVal = netGen[field] ?? 0;
    if (dbVal !== netVal) {
      differences.push(createDiff("room", `General ${lbl}`, dbVal, netVal));
    }
  });

  const dbClientIp = normalizeIp(dbGen.client_ip);
  const netClientIp = normalizeIp(netGen.client_ip);
  if (dbClientIp !== netClientIp) {
    differences.push(createDiff("room", "General Client IP", dbClientIp || "empty", netClientIp || "empty"));
  }

  const dbKnxAddr = normalizeKnxAddr(dbGen.knx_address);
  const netKnxAddr = normalizeKnxAddr(netGen.knx_address);
  if (dbKnxAddr !== netKnxAddr) {
    differences.push(createDiff("room", "General KNX Address", dbKnxAddr || "empty", netKnxAddr || "empty"));
  }

  // Slave IPs — compare position-preserving with normalization
  const dbIPs = dbGen.slaveIPs || [];
  const netIPs = netGen.slaveIPs || [];
  for (let i = 0; i < MAX_SLAVES; i++) {
    const dbIp = normalizeIp(dbIPs[i]);
    const netIp = normalizeIp(netIPs[i]);
    if (dbIp !== netIp) {
      differences.push(createDiff("room", `General Slave IP[${i + 1}]`, dbIp || "empty", netIp || "empty"));
    }
  }

  // Per-room detail configs — match by room_address
  const dbRooms = Array.isArray(databaseRoom.rooms) ? databaseRoom.rooms : [];
  const netRooms = Array.isArray(networkRoom.rooms) ? networkRoom.rooms : [];

  const dbRoomMap = new Map();
  const netRoomMap = new Map();
  dbRooms.forEach((r) => {
    if (r.room_address !== undefined) dbRoomMap.set(parseInt(r.room_address), r);
  });
  netRooms.forEach((r) => {
    if (r.room_address !== undefined) netRoomMap.set(parseInt(r.room_address), r);
  });

  const allAddrs = new Set([...dbRoomMap.keys(), ...netRoomMap.keys()]);

  allAddrs.forEach((addr) => {
    const dbR = dbRoomMap.get(addr);
    const netR = netRoomMap.get(addr);
    const label = `Room ${addr}`;

    if (!dbR) {
      differences.push(createDiff("room", label, "missing", "present"));
      return;
    }
    if (!netR) {
      differences.push(createDiff("room", label, "present", "missing"));
      return;
    }

    ROOM_FIELDS.forEach(({ field, lbl }) => {
      const dbVal = dbR[field] ?? 0;
      const netVal = netR[field] ?? 0;
      if (dbVal !== netVal) {
        differences.push(createDiff("room", `${label} ${lbl}`, dbVal, netVal));
      }
    });

    const dbStates = dbR.states || {};
    const netStates = netR.states || {};
    STATE_NAMES.forEach((stateName) => {
      const dbS = dbStates[stateName] || {};
      const netS = netStates[stateName] || {};

      STATE_AIRCON_FIELDS.forEach(({ field, lbl, bool }) => {
        const dbVal = bool ? Boolean(dbS[field]) : dbS[field] ?? 0;
        const netVal = bool ? Boolean(netS[field]) : netS[field] ?? 0;
        if (dbVal !== netVal) {
          differences.push(createDiff("room", `${label} ${stateName} ${lbl}`, dbVal, netVal));
        }
      });

      // Scene lists — order from firmware is meaningful, compare as sorted sets
      const dbScenes = (dbS.scenesList || []).map((n) => parseInt(n)).sort((a, b) => a - b);
      const netScenes = (netS.scenesList || []).map((n) => parseInt(n)).sort((a, b) => a - b);
      if (dbScenes.length !== netScenes.length) {
        differences.push(createDiff("room", `${label} ${stateName} Scene Count`, dbScenes.length, netScenes.length));
      } else if (dbScenes.some((v, i) => v !== netScenes[i])) {
        differences.push(
          createDiff("room", `${label} ${stateName} Scenes`, dbScenes.join(",") || "none", netScenes.join(",") || "none")
        );
      }
    });
  });

  return { isEqual: differences.length === 0, differences };
}
