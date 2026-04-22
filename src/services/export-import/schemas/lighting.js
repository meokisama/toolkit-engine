export const lightingSchema = {
  category: "lighting",
  filenameSuffix: "lighting",
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "string", required: true },
    { key: "description", type: "string" },
    { key: "object_type", type: "string", default: "OBJ_LIGHTING" },
    { key: "object_value", type: "int", default: 1 },
  ],
  validateRow: (item) => item.address !== "" && item.address !== null,
};
