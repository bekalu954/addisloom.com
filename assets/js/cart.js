/* Addis Loom — cart storage and pricing (used by the design studio, cart and order pages).
   Item details live in localStorage; artwork (mockups + uploaded files) lives in
   IndexedDB because it is too large for localStorage. Prices shown here are for
   display only — checkout recalculates them on the server. */
(function () {
  const C = window.ADDIS_CONFIG;
  const KEY = "al_cart_v1";

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const write = (items) => { localStorage.setItem(KEY, JSON.stringify(items)); updateBadge(); };

  /* ---- IndexedDB for artwork ---- */
  let dbp;
  function db() {
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open("addisloom-cart", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("art");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return dbp;
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction("art", mode), store = tx.objectStore("art");
      const req = fn(store);
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  /* ---- Pricing (same arithmetic as the studio and the checkout server) ---- */
  function priceItem(it) {
    const g = C.garments[it.garment], m = C.methods[it.method];
    const sides = (it.front ? 1 : 0) + (it.back ? 1 : 0);
    let count = 0, plus = 0;
    for (const [s, n] of Object.entries(it.qty || {})) { if (!n) continue; count += n; if (/^\d?XL$/.test(s) && s !== "XL") plus += n; }
    const decoEach = it.method === "print" ? m.perSide * sides : m.perLocation * sides;
    const tier = [...C.quantityDiscounts].reverse().find((d) => count >= d.min);
    const off = tier ? tier.off : 0;
    const sub = (g.base + decoEach) * count + C.plusSizeUpcharge * plus;
    const line = Math.round((sub - sub * off) * 100) / 100;
    const setup = it.method === "embroidery" ? m.setup * sides : 0;
    return { count, off, line, setup, total: line + setup };
  }

  function updateBadge() {
    const n = read().length;
    document.querySelectorAll("[data-cart-count]").forEach((el) => { el.textContent = n; el.hidden = !n; });
  }

  window.AddisCart = {
    list: read,
    count: () => read().length,
    priceItem,
    async add(item, art) {
      item.id = item.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      await idb("readwrite", (s) => s.put(art, item.id));
      write([...read(), item]);
      return item.id;
    },
    async remove(id) {
      write(read().filter((i) => i.id !== id));
      await idb("readwrite", (s) => s.delete(id)).catch(() => {});
    },
    setQty(id, qty) { write(read().map((i) => (i.id === id ? { ...i, qty } : i))); },
    art: (id) => idb("readonly", (s) => s.get(id)),
    async clear() { write([]); await idb("readwrite", (s) => s.clear()).catch(() => {}); },
    updateBadge
  };
  updateBadge();
})();
