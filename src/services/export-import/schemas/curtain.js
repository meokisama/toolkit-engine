// Curtain references lighting groups via FK (open/close/stop_group_id -> lighting.id).
// CSV round-trips these through lighting *addresses*, which are user-visible and
// stable across exports of the same project. Cross-project imports resolve to
// whatever lighting addresses happen to exist in the destination project; unknown
// addresses import as null.

function fkColumn(key, csvName) {
  return {
    key,
    csv: csvName,
    format: (item, ctx) => ctx.lookupById?.("lighting", item[key]) ?? "",
    parse: (val, _row, ctx) => {
      if (!val) return null;
      return ctx.lookupByAddress?.("lighting", val) ?? null;
    },
  };
}

export const curtainSchema = {
  category: "curtain",
  filenameSuffix: "curtain",
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "string", required: true },
    { key: "description", type: "string" },
    { key: "object_type", type: "string", default: "OBJ_CURTAIN" },
    { key: "object_value", type: "int", default: 2 },
    { key: "curtain_type", type: "string" },
    { key: "curtain_value", type: "int", default: 0 },
    fkColumn("open_group_id", "open_group_address"),
    fkColumn("close_group_id", "close_group_address"),
    fkColumn("stop_group_id", "stop_group_address"),
    { key: "pause_period", type: "int", default: 0 },
    { key: "transition_period", type: "int", default: 0 },
  ],
  validateRow: (item) => item.address !== "" && item.address !== null,
};
