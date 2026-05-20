const PREFIX = "ambre_";
const DB_PATH = "sqlite:ambre.db";
const cache = new Map();
let db = null;
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export async function initDB() {
  if (!isTauri) {
    _warmCacheFromLocalStorage();
    _cleanSampleIfNeeded();
    return;
  }

  const { default: Database } = await import("@tauri-apps/plugin-sql");
  db = await Database.load(DB_PATH);
  await db.execute(`CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`);

  const [{ n }] = await db.select(`SELECT count(*) as n FROM store`);
  if (n === 0) await _migrateFromLocalStorage(db);

  const rows = await db.select(`SELECT key, value FROM store`);
  for (const row of rows) {
    try { cache.set(row.key, JSON.parse(row.value)); }
    catch { cache.set(row.key, row.value); }
  }

  await _cleanSampleIfNeededAsync();
}

export function dbGet(key, defaultValue) {
  return cache.has(key) ? cache.get(key) : defaultValue;
}

export function dbSet(key, value) {
  cache.set(key, value);
  _persist(key, value).catch(err => console.error("[ambre/db] persist failed:", key, err));
}

/* Supprime les données exemple en mode navigateur (synchrone). */
function _cleanSampleIfNeeded() {
  if (cache.get("sampleMode") !== "1") return;
  cache.delete("sampleMode");
  cache.delete("transactions");
  window.localStorage.removeItem(PREFIX + "sampleMode");
  window.localStorage.removeItem(PREFIX + "transactions");
  // Compat : ancien flag sans préfixe
  window.localStorage.removeItem("ambre.sampleMode");
}

/* Supprime les données exemple en mode Tauri (asynchrone). */
async function _cleanSampleIfNeededAsync() {
  if (cache.get("sampleMode") !== "1") {
    // Compat : ancien flag localStorage sans préfixe
    const legacy = typeof window !== "undefined"
      ? window.localStorage.getItem("ambre.sampleMode") : null;
    if (legacy !== "1") return;
    window.localStorage.removeItem("ambre.sampleMode");
  }
  cache.delete("sampleMode");
  cache.delete("transactions");
  if (db) {
    await db.execute(`DELETE FROM store WHERE key IN ('sampleMode', 'transactions')`);
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("ambre.sampleMode");
    window.localStorage.removeItem(PREFIX + "transactions");
  }
}

async function _persist(key, value) {
  const s = JSON.stringify(value);
  if (!isTauri || !db) { window.localStorage.setItem(PREFIX + key, s); return; }
  await db.execute(
    `INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, s]
  );
}

async function _migrateFromLocalStorage(database) {
  const KEYS = ["transactions", "categories", "importHistory", "alerts",
    "stg.theme", "stg.lang", "stg.homeScreen", "stg.backupOn", "stg.backupFreq",
    "stg.montantFmt", "stg.dateFmt", "stg.premierJour", "stg.verrouiller",
    "stg.lancer", "stg.tz", "stg.channels", "stg.accent", "stg.taille",
    "stg.densite", "stg.reduire", "dash.chartPeriod"];
  for (const key of KEYS) {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw !== null)
      await database.execute(`INSERT OR IGNORE INTO store (key, value) VALUES (?, ?)`, [key, raw]);
  }
}

function _warmCacheFromLocalStorage() {
  for (let i = 0; i < window.localStorage.length; i++) {
    const lsKey = window.localStorage.key(i);
    if (lsKey?.startsWith(PREFIX)) {
      const key = lsKey.slice(PREFIX.length);
      try { cache.set(key, JSON.parse(window.localStorage.getItem(lsKey))); }
      catch { cache.set(key, window.localStorage.getItem(lsKey)); }
    }
  }
}
