const DMX_COLOR_COUNT = 16;

const colorColumns = Array.from({ length: DMX_COLOR_COUNT }, (_, i) => ({
  key: `color${i + 1}`,
  type: "string",
}));

export const dmxSchema = {
  category: "dmx",
  filenameSuffix: "dmx",
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "string", required: true },
    { key: "description", type: "string" },
    ...colorColumns,
  ],
  validateRow: (item) => item.address !== "" && item.address !== null,
};
