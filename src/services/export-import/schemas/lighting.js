export const lightingSchema = {
  category: "lighting",
  filenameSuffix: "lighting",
  defaults: { object_type: "OBJ_LIGHTING", object_value: 1 },
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "string", required: true },
    { key: "description", type: "string" },
  ],
  validateRow: (item) => item.address !== "" && item.address !== null,
};
