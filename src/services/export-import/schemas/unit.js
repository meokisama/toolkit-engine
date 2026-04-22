export const unitSchema = {
  category: "unit",
  filenameSuffix: "unit",
  columns: [
    { key: "type", type: "string", required: true },
    { key: "serial_no", type: "string" },
    { key: "ip_address", type: "string" },
    { key: "id_can", type: "string" },
    { key: "mode", type: "string" },
    { key: "firmware_version", type: "string" },
    { key: "description", type: "string" },
  ],
  validateRow: (item) => !!(item.type && String(item.type).trim()),
};
