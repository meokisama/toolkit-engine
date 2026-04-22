// Aircon CSV is card-format: each row = one card. The create path
// (aircon.createCard) materialises cards into single aircon rows; on export we
// project the DB rows back down to card fields.

export const airconCardsSchema = {
  category: "aircon",
  filenameSuffix: "aircon_cards",
  columns: [
    { key: "name", type: "string" },
    { key: "address", type: "string", required: true },
    { key: "description", type: "string" },
  ],
  validateRow: (item) => {
    if (!item.address || !String(item.address).trim()) return false;
    const n = parseInt(String(item.address).trim(), 10);
    return !Number.isNaN(n) && n > 0;
  },
};
