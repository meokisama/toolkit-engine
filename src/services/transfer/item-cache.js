import log from "electron-log/renderer";

/**
 * TransferItemCache — pre-fetches all lighting, aircon, and curtain items once
 * at the start of a transfer session and provides O(1) address-based lookups.
 *
 * This replaces the pattern of calling getAll() inside loops (N+1 queries).
 * Items created during transfer are added to the cache so subsequent lookups
 * within the same session still hit the cache instead of the database.
 */
export class TransferItemCache {
  constructor() {
    this._lighting = new Map(); // address (string) → item
    this._aircon = new Map();
    this._curtain = new Map();
    this._initialized = false;
  }

  /**
   * Pre-fetch all items for a project in parallel (3 IPC calls total).
   * Must be called once before using any lookup/cache methods.
   * @param {string} projectId
   */
  async initialize(projectId) {
    const [lighting, aircon, curtain] = await Promise.all([
      window.electronAPI.lighting.getAll(projectId).catch((err) => {
        log.warn("TransferItemCache: failed to fetch lighting items:", err);
        return [];
      }),
      window.electronAPI.aircon.getAll(projectId).catch((err) => {
        log.warn("TransferItemCache: failed to fetch aircon items:", err);
        return [];
      }),
      window.electronAPI.curtain.getAll(projectId).catch((err) => {
        log.warn("TransferItemCache: failed to fetch curtain items:", err);
        return [];
      }),
    ]);

    lighting.forEach((i) => this._lighting.set(String(i.address), i));
    aircon.forEach((i) => this._aircon.set(String(i.address), i));
    curtain.forEach((i) => this._curtain.set(String(i.address), i));

    this._initialized = true;
    log.info(
      `TransferItemCache initialized — lighting: ${lighting.length}, aircon: ${aircon.length}, curtain: ${curtain.length}`
    );
  }

  get initialized() {
    return this._initialized;
  }

  // --- Lighting ---
  findLighting(address) {
    return this._lighting.get(String(address)) ?? null;
  }
  cacheLighting(item) {
    this._lighting.set(String(item.address), item);
  }

  // --- Aircon ---
  findAircon(address) {
    return this._aircon.get(String(address)) ?? null;
  }
  cacheAircon(item) {
    this._aircon.set(String(item.address), item);
  }

  // --- Curtain ---
  findCurtain(address) {
    return this._curtain.get(String(address)) ?? null;
  }
  cacheCurtain(item) {
    this._curtain.set(String(item.address), item);
  }
}
