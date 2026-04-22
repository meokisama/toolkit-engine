// KNX links to an RCU group via (rcu_group_type, rcu_group_id). The type string
// names the target table (lighting | curtain | scene | multi_scenes | sequences | aircon);
// the id FKs into that table. CSV exposes the *address* of the referenced item
// so files remain human-editable and survive id churn.

export const knxSchema = {
  category: "knx",
  filenameSuffix: "knx",
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "int", required: true },
    { key: "type", type: "int", default: 0 },
    { key: "factor", type: "int", default: 1 },
    { key: "feedback", type: "int", default: 0 },
    { key: "knx_switch_group", type: "string" },
    { key: "knx_dimming_group", type: "string" },
    { key: "knx_value_group", type: "string" },
    { key: "knx_status_group", type: "string" },
    { key: "rcu_group_type", type: "string" },
    {
      key: "rcu_group_id",
      csv: "rcu_group_address",
      format: (item, ctx) => {
        if (!item.rcu_group_id || !item.rcu_group_type) return "";
        return ctx.lookupById?.(item.rcu_group_type, item.rcu_group_id) ?? "";
      },
      parse: (val, row, ctx) => {
        if (!val || !row.rcu_group_type) return null;
        return ctx.lookupByAddress?.(row.rcu_group_type, val) ?? null;
      },
    },
    { key: "description", type: "string" },
  ],
  validateRow: (item) =>
    item.address !== null && Number.isInteger(item.address) && item.address >= 0 && item.address <= 511,
};
