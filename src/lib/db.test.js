import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* Mock minimal de window.localStorage, suffisant pour exercer le chemin
 * "mode navigateur" de db.js (isTauri est calculé à l'import du module à
 * partir de `"__TAURI__" in window` — absent ici, donc toujours false). */
function makeLocalStorageMock() {
  const store = new Map();
  return {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
    key: i => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
}

/* Simule un redémarrage de l'app : un nouveau module db.js repart avec un
 * cache en mémoire vide et relit le localStorage (partagé, lui, entre les
 * "démarrages" puisqu'il vit sur le mock attaché à `window`). */
async function freshDb() {
  vi.resetModules();
  return await import("./db.js");
}

describe("db.js — sortie du mode exemple", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.window = { localStorage: makeLocalStorageMock() };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("purge les transactions d'exemple non modifiées au redémarrage (comportement voulu)", async () => {
    const db1 = await freshDb();
    await db1.initDB();
    db1.dbSet("sampleMode", "1");
    db1.dbSet("transactions", [{ id: 1, lbl: "Café" }]);

    const db2 = await freshDb();
    await db2.initDB();

    expect(db2.dbGet("sampleMode", null)).toBeNull();
    expect(db2.dbGet("transactions", [])).toEqual([]);
  });

  it("conserve les transactions si une vraie donnée a été ajoutée en mode exemple", async () => {
    const db1 = await freshDb();
    await db1.initDB();
    db1.dbSet("sampleMode", "1");
    db1.dbSet("transactions", [{ id: 1, lbl: "Café (exemple)" }]);

    // L'utilisateur ajoute une vraie transaction par-dessus l'exemple, puis
    // sort du mode exemple — c'est ce que fait désormais le setter retourné
    // par useTransactions() dans store.js à chaque écriture réelle.
    db1.dbSet("transactions", [
      { id: 1, lbl: "Café (exemple)" },
      { id: 2, lbl: "Vraie transaction" },
    ]);
    db1.clearSampleMode();

    // Redémarrage simulé
    const db2 = await freshDb();
    await db2.initDB();

    const txs = db2.dbGet("transactions", []);
    expect(db2.dbGet("sampleMode", null)).toBeNull();
    expect(txs).toHaveLength(2);
    expect(txs.some(t => t.lbl === "Vraie transaction")).toBe(true);
    expect(txs.some(t => t.lbl === "Café (exemple)")).toBe(true);
  });

  it("clearSampleMode() ne fait rien si le mode exemple n'est pas actif", async () => {
    const db1 = await freshDb();
    await db1.initDB();
    db1.dbSet("transactions", [{ id: 1, lbl: "Réel" }]);

    expect(() => db1.clearSampleMode()).not.toThrow();
    expect(db1.dbGet("transactions", [])).toHaveLength(1);
  });
});
