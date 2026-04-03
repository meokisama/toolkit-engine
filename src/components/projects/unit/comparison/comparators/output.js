import { createDiff, nullCheck } from "./helpers";
import log from "electron-log/renderer";

export function compareOutputConfigs(databaseOutputs, networkOutputs, projectItems = null) {
  const early = nullCheck(databaseOutputs, networkOutputs, "output");
  if (early) return early;

  const differences = [];
  const dbOutputs = databaseOutputs.outputs || [];
  const netOutputs = networkOutputs.outputs || [];

  for (let i = 0; i < Math.max(dbOutputs.length, netOutputs.length); i++) {
    const dbOutput = dbOutputs[i];
    const netOutput = netOutputs[i];
    const label = `Output ${i + 1}`;

    if (!dbOutput && !netOutput) continue;

    if (!dbOutput || !netOutput) {
      differences.push(createDiff("output", label, dbOutput ? "present" : "missing", netOutput ? "present" : "missing"));
      continue;
    }

    // Compare basic output properties (skip device_id and name — not meaningful for comparison)
    [
      { name: "index", lbl: `${label} Index` },
      { name: "type", lbl: `${label} Type` },
      { name: "device_type", lbl: `${label} Device Type` },
    ].forEach(({ name, lbl }) => {
      if (dbOutput[name] !== netOutput[name]) {
        differences.push(createDiff("output", lbl, dbOutput[name], netOutput[name]));
      }
    });

    // Resolve DB address from device_id via projectItems
    let dbAddress = null;
    if (dbOutput.device_id && projectItems) {
      const deviceType = dbOutput.device_type === "aircon" ? "aircon" : "lighting";
      const item = projectItems[deviceType]?.find((it) => it.id === dbOutput.device_id);
      dbAddress = item ? parseInt(item.address) : null;

      if (dbOutput.type === "ac") {
        log.info(`AC Output ${i + 1} device_id lookup:`, {
          device_id: dbOutput.device_id,
          deviceType,
          found: !!item,
          address: item?.address,
        });
      }
    }

    const netAddress = dbOutput.type === "ac" || netOutput.type === "ac"
      ? netOutput.config?.address || 0
      : netOutput.config?.address;

    const dbAddrStr = dbAddress && dbAddress > 0 ? String(dbAddress) : "0";
    const netAddrStr = netAddress && netAddress > 0 ? String(netAddress) : "0";

    if (dbAddrStr !== netAddrStr) {
      const isAc = dbOutput.type === "ac" || netOutput.type === "ac";
      if (isAc) {
        differences.push(createDiff("output", `${label} AC Address`, dbAddrStr === "0" ? "unassigned" : dbAddrStr, netAddrStr === "0" ? "unassigned" : netAddrStr));
      } else if (!(dbAddrStr === "0" && netAddrStr === "0")) {
        differences.push(createDiff("output", `${label} Address`, dbAddrStr === "0" ? "unassigned" : dbAddrStr, netAddrStr === "0" ? "unassigned" : netAddrStr));
      }
    }

    // Compare config fields by output type
    const dbConfig = dbOutput.config || {};
    const netConfig = netOutput.config || {};
    const isAcOutput = dbOutput.type === "ac" || netOutput.type === "ac";

    if (isAcOutput) {
      [
        { name: "enable", lbl: `${label} Enable` },
        { name: "windowMode", lbl: `${label} Window Mode` },
        { name: "fanType", lbl: `${label} Fan Type` },
        { name: "tempType", lbl: `${label} Temp Type` },
        { name: "tempUnit", lbl: `${label} Temp Unit` },
        { name: "valveContact", lbl: `${label} Valve Contact` },
        { name: "valveType", lbl: `${label} Valve Type` },
        { name: "deadband", lbl: `${label} Deadband` },
        { name: "lowFCU_Group", lbl: `${label} Low FCU Group` },
        { name: "medFCU_Group", lbl: `${label} Med FCU Group` },
        { name: "highFCU_Group", lbl: `${label} High FCU Group` },
        { name: "fanAnalogGroup", lbl: `${label} Fan Analog Group` },
        { name: "analogCoolGroup", lbl: `${label} Analog Cool Group` },
        { name: "analogHeatGroup", lbl: `${label} Analog Heat Group` },
        { name: "valveCoolOpenGroup", lbl: `${label} Valve Cool Open` },
        { name: "valveCoolCloseGroup", lbl: `${label} Valve Cool Close` },
        { name: "valveHeatOpenGroup", lbl: `${label} Valve Heat Open` },
        { name: "valveHeatCloseGroup", lbl: `${label} Valve Heat Close` },
        { name: "windowBypass", lbl: `${label} Window Bypass` },
        { name: "setPointOffset", lbl: `${label} Setpoint Offset` },
        { name: "unoccupyPower", lbl: `${label} Unoccupy Power` },
        { name: "occupyPower", lbl: `${label} Occupy Power` },
        { name: "standbyPower", lbl: `${label} Standby Power` },
        { name: "unoccupyMode", lbl: `${label} Unoccupy Mode` },
        { name: "occupyMode", lbl: `${label} Occupy Mode` },
        { name: "standbyMode", lbl: `${label} Standby Mode` },
        { name: "unoccupyFanSpeed", lbl: `${label} Unoccupy Fan Speed` },
        { name: "occupyFanSpeed", lbl: `${label} Occupy Fan Speed` },
        { name: "standbyFanSpeed", lbl: `${label} Standby Fan Speed` },
        { name: "unoccupyCoolSetPoint", lbl: `${label} Unoccupy Cool SP` },
        { name: "occupyCoolSetPoint", lbl: `${label} Occupy Cool SP` },
        { name: "standbyCoolSetPoint", lbl: `${label} Standby Cool SP` },
        { name: "unoccupyHeatSetPoint", lbl: `${label} Unoccupy Heat SP` },
        { name: "occupyHeatSetPoint", lbl: `${label} Occupy Heat SP` },
        { name: "standbyHeatSetPoint", lbl: `${label} Standby Heat SP` },
      ].forEach(({ name, lbl }) => {
        if (dbConfig[name] !== netConfig[name]) {
          differences.push(createDiff("output", lbl, dbConfig[name], netConfig[name]));
        }
      });
    } else {
      [
        { name: "autoTrigger", lbl: `${label} Auto Trigger` },
        { name: "delayOffHours", lbl: `${label} Delay Off Hours` },
        { name: "delayOffMinutes", lbl: `${label} Delay Off Minutes` },
        { name: "delayOffSeconds", lbl: `${label} Delay Off Seconds` },
        { name: "delayOnHours", lbl: `${label} Delay On Hours` },
        { name: "delayOnMinutes", lbl: `${label} Delay On Minutes` },
        { name: "delayOnSeconds", lbl: `${label} Delay On Seconds` },
        { name: "scheduleOnHour", lbl: `${label} Schedule On Hour` },
        { name: "scheduleOnMinute", lbl: `${label} Schedule On Minute` },
        { name: "scheduleOffHour", lbl: `${label} Schedule Off Hour` },
        { name: "scheduleOffMinute", lbl: `${label} Schedule Off Minute` },
        { name: "minDim", lbl: `${label} Min Dim` },
        { name: "maxDim", lbl: `${label} Max Dim` },
      ].forEach(({ name, lbl }) => {
        if (dbConfig[name] !== netConfig[name]) {
          differences.push(createDiff("output", lbl, dbConfig[name], netConfig[name]));
        }
      });
    }
  }

  return { isEqual: differences.length === 0, differences };
}
