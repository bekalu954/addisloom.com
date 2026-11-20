/* Addis Loom — Design Lab (design studio)
   Layout: tool rail (left) → slide-out panel → stage → front/back views (right),
   with Save | Share and Get Price in the bottom bar. Pricing, cart items and the
   quote request use the same fields as before, so cart.html and checkout are unchanged. */
(function () {
  const { config: C, money, esc, drawGarment, AREAS, isDark, sendRequest } = window.Addis;
  const ARTLIB = window.AddisArt || { CATS: [], ART: [], svgFor: () => "" };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const lab = $("#main");

  /* ---------------- Fonts & ink colors ---------------- */
  const ETH = ', "Noto Sans Ethiopic"';
  const FONTS = [
    ["Bold modern", '800 {s}px "Bricolage Grotesque"' + ETH],
    ["Clean", '700 {s}px "Source Sans 3"' + ETH],
    ["Block", '400 {s}px "Anton"' + ETH],
    ["Tall block", '400 {s}px "Bebas Neue"' + ETH],
    ["Condensed", '700 {s}px "Oswald"' + ETH],
    ["Varsity", '400 {s}px "Graduate"' + ETH],
    ["Rounded", '400 {s}px "Righteous"' + ETH],
    ["Chunky", '400 {s}px "Bungee"' + ETH],
    ["Classic serif", '700 {s}px "Playfair Display"' + ETH],
    ["Fashion serif", '400 {s}px "Abril Fatface"' + ETH],
    ["Script", '400 {s}px "Pacifico"' + ETH],
    ["Retro script", '400 {s}px "Lobster"' + ETH],
    ["Elegant script", '400 {s}px "Great Vibes"' + ETH],
    ["Handwritten", '700 {s}px "Caveat"' + ETH],
    ["Marker", '400 {s}px "Permanent Marker"' + ETH],
    ["Amharic sans (ፊደል)", '700 {s}px "Noto Sans Ethiopic"'],
    ["Amharic serif (ፊደል)", '700 {s}px "Noto Serif Ethiopic"']
  ];
  const INKS = [
    ["Black", "#1B1B1B"], ["White", "#FFFFFF"], ["Forest green", "#2C5F2D"], ["Gold", "#FCDC04"],
    ["Red", "#B3302A"], ["Navy", "#22304A"], ["Royal blue", "#1E5AC8"], ["Sky blue", "#5BB4E5"],
    ["Orange", "#E36414"], ["Purple", "#6A2C91"], ["Pink", "#E85D9E"], ["Brown", "#7A4B2A"],
    ["Grey", "#8E9590"], ["Old gold", "#C9A227"], ["Teal", "#0E8F8A"], ["Maroon", "#6E1E26"]
  ];
  const familyOf = (font) => (String(font).match(/"([^"]+)"/) || [, "font"])[1];

  /* ---------------- State ---------------- */
  const state = {
    garment: params.get("garment") && C.garments[params.get("garment")] ? params.get("garment") : "tee",
    color: C.colors.find((c) => c.hex.toLowerCase() === (params.get("color") || "").toLowerCase())?.hex || C.colors[0].hex,
    method: params.get("method") === "embroidery" ? "embroidery" : "print",
    side: "front",
    layers: { front: [], back: [] },
    selected: null,
    qty: {},
    name: "Untitled design",
    roster: "",
    showArea: true,
    panel: "home",
    artCat: null,
    artQuery: ""
  };
  if (C.garments[state.garment].printOk === false) state.method = "embroidery";
  let uid = 0;
  const recentUploads = [];

  const cv = $("#studioCanvas"), ctx = cv.getContext("2d");
  const S = cv.width / 500;
  const area = (side = state.side) => AREAS[state.garment][side];
  const sel = () => state.layers[state.side].find((l) => l.id === state.selected) || null;
  const colorName = () => (C.colors.find((c) => c.hex === state.color) || {}).name || "";

  /* ---------------- Toast ---------------- */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* ---------------- Geometry ---------------- */
  function fontFor(l) { return l.font.replace("{s}", Math.max(1, Math.round(l.size * l.scale))); }
  function arcParams(l, c2d) {
    const fs = l.size * l.scale;
    c2d.save(); c2d.font = fontFor(l); const w = c2d.measureText(l.text).width; c2d.restore();
    const sweep = (Math.abs(l.arc || 0) * Math.PI) / 180;
    if (sweep < 0.02) return { w, fs, sweep: 0 };
    const R = w / sweep;
    const half = sweep / 2;
    const bw = sweep <= Math.PI ? 2 * R * Math.sin(half) + fs * 0.7 : 2 * R + fs;
    const bh = R - R * Math.cos(half) + fs * 1.15;
    const cy = (R + R * Math.cos(half)) / 2;
    return { w, fs, sweep, R, bw, bh, cy };
  }
  // Size of a layer in its own (unrotated) frame, centered on (x, y).
  function localBox(l, c2d = ctx) {
    if (l.type === "text") {
      const a = arcParams(l, c2d);
      return a.sweep ? { w: a.bw, h: a.bh } : { w: a.w, h: a.fs * 1.15 };
    }
    return { w: l.w * l.scale, h: l.h * l.scale };
  }
  function toLocal(l, p) {
    const r = ((l.rot || 0) * Math.PI) / 180, dx = p.x - l.x, dy = p.y - l.y;
    return { x: dx * Math.cos(r) + dy * Math.sin(r), y: -dx * Math.sin(r) + dy * Math.cos(r) };
  }
  function hit(l, p, pad = 6) {
    const b = localBox(l), q = toLocal(l, p);
    return Math.abs(q.x) <= b.w / 2 + pad && Math.abs(q.y) <= b.h / 2 + pad;
  }
  const HANDLE_R = 12, PAD = 8;
  function handles(l) {
    const b = localBox(l), hw = b.w / 2 + PAD, hh = b.h / 2 + PAD;
    return { del: [-hw, -hh], rotate: [hw, -hh], scale: [hw, hh], dup: [-hw, hh] };
  }
  function hitHandle(l, p) {
    const q = toLocal(l, p);
    for (const [k, [hx, hy]] of Object.entries(handles(l))) if (Math.hypot(q.x - hx, q.y - hy) <= HANDLE_R + 3) return k;
    return null;
  }

  /* ---------------- Drawing ---------------- */
  function drawText(c2d, l, stitch) {
    c2d.font = fontFor(l); c2d.textBaseline = "middle"; c2d.lineJoin = "round";
    const ow = (l.outline || 0) * l.scale;
    const paint = (txt, x, y, align) => {
      c2d.textAlign = align;
      if (ow > 0) { c2d.save(); c2d.shadowColor = "transparent"; c2d.strokeStyle = l.outlineColor || "#1B1B1B"; c2d.lineWidth = ow * 2; c2d.strokeText(txt, x, y); c2d.restore(); }
      c2d.fillStyle = l.color; c2d.fillText(txt, x, y);
      if (stitch) { c2d.save(); c2d.shadowColor = "transparent"; c2d.strokeStyle = "rgba(255,255,255,.18)"; c2d.lineWidth = .6; c2d.setLineDash([1.5, 1.5]); c2d.strokeText(txt, x, y); c2d.restore(); }
    };
    const a = arcParams(l, c2d);
    if (!a.sweep) { paint(l.text, 0, 0, "center"); return; }
    const up = (l.arc || 0) > 0;
    let acc = 0;
    for (const ch of [...l.text]) {
      const cw = c2d.measureText(ch).width;
      const phi = -a.sweep / 2 + (acc + cw / 2) / a.R;
      acc += cw;
      c2d.save();
      if (up) { c2d.translate(a.R * Math.sin(phi), a.cy - a.R * Math.cos(phi)); c2d.rotate(phi); }
      else { c2d.translate(a.R * Math.sin(phi), -a.cy + a.R * Math.cos(phi)); c2d.rotate(-phi); }
      paint(ch, 0, 0, "center");
      c2d.restore();
    }
  }
  function drawLayer(c2d, l, stitch) {
    c2d.save();
    c2d.translate(l.x, l.y);
    c2d.rotate(((l.rot || 0) * Math.PI) / 180);
    if (stitch) { c2d.shadowColor = "rgba(0,0,0,.35)"; c2d.shadowOffsetY = 1.2; c2d.shadowBlur = 1.5; }
    if (l.type === "text") drawText(c2d, l, stitch);
    else if (l.img) {
      const w = l.w * l.scale, h = l.h * l.scale;
      if (l.flip) c2d.scale(-1, 1);
      c2d.drawImage(l.img, -w / 2, -h / 2, w, h);
    }
    c2d.restore();
  }
  function drawHandle(c2d, x, y, kind) {
    c2d.save();
    c2d.beginPath(); c2d.arc(x, y, HANDLE_R, 0, Math.PI * 2);
    c2d.fillStyle = kind === "del" ? "#B3302A" : "#1B2A1C"; c2d.fill();
    c2d.strokeStyle = "#fff"; c2d.lineWidth = 2; c2d.stroke();
    c2d.strokeStyle = "#fff"; c2d.lineWidth = 2; c2d.lineCap = "round"; c2d.beginPath();
    if (kind === "del") { c2d.moveTo(x - 4.5, y - 4.5); c2d.lineTo(x + 4.5, y + 4.5); c2d.moveTo(x + 4.5, y - 4.5); c2d.lineTo(x - 4.5, y + 4.5); }
    if (kind === "dup") { c2d.moveTo(x - 5, y); c2d.lineTo(x + 5, y); c2d.moveTo(x, y - 5); c2d.lineTo(x, y + 5); }
    if (kind === "scale") { c2d.moveTo(x - 4, y - 4); c2d.lineTo(x + 5, y + 5); c2d.moveTo(x + 5, y); c2d.lineTo(x + 5, y + 5); c2d.lineTo(x, y + 5); c2d.moveTo(x - 4, y - 4); c2d.lineTo(x - 4, y + 1); c2d.moveTo(x - 4, y - 4); c2d.lineTo(x + 1, y - 4); }
    if (kind === "rotate") { c2d.arc(x, y, 5, -Math.PI * 0.9, Math.PI * 0.55); c2d.moveTo(x + 5, y + 4); c2d.lineTo(x + 1.5, y + 5); c2d.moveTo(x + 5, y + 4); c2d.lineTo(x + 5.5, y + 0.5); }
    c2d.stroke();
    c2d.restore();
  }

  function renderScene(canvas, side, { exportMode = false, ui = false, layers = null } = {}) {
    const c2d = canvas.getContext("2d"), s = canvas.width / 500;
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.clearRect(0, 0, canvas.width, canvas.height);
    if (exportMode) { c2d.fillStyle = "#fff"; c2d.fillRect(0, 0, canvas.width, canvas.height); }
    c2d.setTransform(s, 0, 0, s, 0, 0);
    drawGarment(c2d, state.garment, state.color, side);
    const [ax, ay, aw, ah] = area(side);
    const stitch = state.method === "embroidery";
    c2d.save();
    c2d.beginPath(); c2d.rect(ax, ay, aw, ah); c2d.clip();
    for (const l of layers || state.layers[side]) drawLayer(c2d, l, stitch);
    c2d.restore();
    if (ui) {
      c2d.save();
      if (state.showArea || drag) {
        c2d.setLineDash([6, 6]); c2d.lineWidth = 1.5;
        c2d.strokeStyle = isDark(state.color) ? "rgba(255,255,255,.55)" : "rgba(27,42,28,.45)";
        c2d.strokeRect(ax, ay, aw, ah);
        if (drag && drag.mode === "move") {
          // center guide while dragging
          const l = drag.l;
          if (Math.abs(l.x - (ax + aw / 2)) < 0.5) { c2d.setLineDash([]); c2d.strokeStyle = "#B3302A"; c2d.beginPath(); c2d.moveTo(ax + aw / 2, ay); c2d.lineTo(ax + aw / 2, ay + ah); c2d.stroke(); }
        }
      }
      const l = side === state.side ? sel() : null;
      if (l) {
        const b = localBox(l, c2d);
        c2d.translate(l.x, l.y); c2d.rotate(((l.rot || 0) * Math.PI) / 180);
        c2d.setLineDash([]); c2d.strokeStyle = "#B3302A"; c2d.lineWidth = 1.6;
        c2d.strokeRect(-b.w / 2 - PAD, -b.h / 2 - PAD, b.w + PAD * 2, b.h + PAD * 2);
        for (const [k, [hx, hy]] of Object.entries(handles(l))) drawHandle(c2d, hx, hy, k);
      }
      c2d.restore();
    }
  }

  let raf = 0;
  function render() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      renderScene(cv, state.side, { ui: true });
      $$("canvas[data-thumb]").forEach((t) => renderScene(t, t.dataset.thumb));
      const chip = $("#chipCanvas"); const c2 = chip.getContext("2d");
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, chip.width, chip.height);
      c2.setTransform(chip.width / 500, 0, 0, chip.width / 500, 0, 0); drawGarment(c2, state.garment, state.color, "front");
    });
  }
  function renderNow() { cancelAnimationFrame(raf); raf = 0; render(); }

  /* ---------------- History (undo / redo) + autosave ---------------- */
  const hist = { past: [], future: [], last: null };
  const copyLayers = (L) => ({ front: L.front.map((l) => ({ ...l })), back: L.back.map((l) => ({ ...l })) });
  const snapshot = () => ({ garment: state.garment, color: state.color, method: state.method, layers: copyLayers(state.layers) });
  function commit() {
    hist.past.push(hist.last); if (hist.past.length > 60) hist.past.shift();
    hist.last = snapshot(); hist.future = [];
    updateHistoryBtns(); scheduleSave(); price(); updateChip();
  }
  function restore(snap) {
    state.garment = snap.garment; state.color = snap.color; state.method = snap.method;
    state.layers = copyLayers(snap.layers);
    if (!sel()) state.selected = null;
    syncPanel(); render(); price(); updateChip(); scheduleSave(); buildQty();
  }
  function undo() { if (!hist.past.length) return; hist.future.push(hist.last); hist.last = hist.past.pop(); restore(hist.last); updateHistoryBtns(); }
  function redo() { if (!hist.future.length) return; hist.past.push(hist.last); hist.last = hist.future.pop(); restore(hist.last); updateHistoryBtns(); }
  function updateHistoryBtns() { $("#undoBtn").disabled = !hist.past.length; $("#redoBtn").disabled = !hist.future.length; }
  $("#undoBtn").addEventListener("click", undo);
  $("#redoBtn").addEventListener("click", redo);

  // Drafts live in IndexedDB so uploaded images survive a reload.
  let draftDb;
  function ddb() {
    if (!draftDb) draftDb = new Promise((res, rej) => {
      const r = indexedDB.open("addisloom-studio", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("drafts");
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return draftDb;
  }
  async function draftOp(mode, fn) {
    const d = await ddb();
    return new Promise((res, rej) => {
      const tx = d.transaction("drafts", mode), req = fn(tx.objectStore("drafts"));
      tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error);
    });
  }
  function draftData() {
    return { garment: state.garment, color: state.color, method: state.method, qty: state.qty, name: state.name, roster: state.roster, design: serializeDesign(), savedAt: Date.now() };
  }
  let saveT;
  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (editId) return; // cart edits are saved to the cart, not the draft
      draftOp("readwrite", (s) => s.put(draftData(), "current")).catch(() => {});
    }, 700);
  }

  /* ---------------- Serializing ---------------- */
  function serializeDesign() {
    const out = {};
    ["front", "back"].forEach((s) => {
      out[s] = state.layers[s].map((l) => l.type === "text"
        ? { type: "text", text: l.text, font: l.font, color: l.color, size: l.size, scale: l.scale, x: l.x, y: l.y, rot: l.rot || 0, arc: l.arc || 0, outline: l.outline || 0, outlineColor: l.outlineColor || "", nn: l.nn || "", inkSet: !!l.inkSet }
        : { type: "image", name: l.name, src: l.img.src, w: l.w, h: l.h, scale: l.scale, x: l.x, y: l.y, rot: l.rot || 0, flip: !!l.flip, art: l.art || null, orig: l.orig || "" });
    });
    return out;
  }
  function loadImage(src) {
    return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; });
  }
  async function loadDesign(d) {
    for (const s of ["front", "back"]) {
      state.layers[s] = [];
      for (const l of d[s] || []) {
        if (l.type === "text") state.layers[s].push({ rot: 0, arc: 0, outline: 0, ...l, id: ++uid, inkSet: l.inkSet !== false });
        else {
          const img = await loadImage(l.src);
          if (img) state.layers[s].push({ id: ++uid, type: "image", name: l.name, img, w: l.w, h: l.h, scale: l.scale, x: l.x, y: l.y, rot: l.rot || 0, flip: !!l.flip, art: l.art || null, orig: l.orig || "" });
        }
      }
    }
  }

  /* ---------------- Adding things ---------------- */
  function defaultInk() {
    return isDark(state.color) ? "#FCDC04" : (state.color.toUpperCase() === "#F4CF2A" ? "#1B2A1C" : "#2C5F2D");
  }
  function place(l, at) {
    const [ax, ay, aw, ah] = area();
    l.x = at?.x ?? ax + aw / 2;
    l.y = at?.y ?? ay + Math.min(ah / 2, 70 + state.layers[state.side].length * 46);
    clamp(l);
  }
  function addText(text, opts = {}) {
    text = (text || "").trim(); if (!text) return null;
    const [, , aw] = area();
    const l = { id: ++uid, type: "text", text, font: opts.font || FONTS[0][1], color: opts.color || defaultInk(), size: opts.size || 44, scale: 1, rot: 0, arc: opts.arc || 0, outline: 0, outlineColor: "#1B1B1B", inkSet: !!opts.color, nn: opts.nn || "" };
    place(l, opts.at);
    const b = localBox(l); if (b.w > aw * 0.95) l.scale = (aw * 0.95) / b.w;
    state.layers[state.side].push(l); state.selected = l.id;
    if (!opts.silent) { commit(); openPanel("editText"); render(); }
    return l;
  }
  function addImageFromSrc(src, name, extra = {}) {
    return loadImage(src).then((img) => {
      if (!img) { toast("That image couldn't be opened. Try a PNG or JPG."); return null; }
      const [, , aw, ah] = area();
      const w = img.naturalWidth || 300, h = img.naturalHeight || 300;
      const fit = Math.min((aw * (extra.fitW || 0.7)) / w, (ah * (extra.fitH || 0.55)) / h);
      const l = { id: ++uid, type: "image", name, img, w: w * fit, h: h * fit, scale: 1, rot: 0, flip: false, art: extra.art || null, lowRes: !extra.art && Math.max(w, h) < 700 };
      place(l, extra.at || { y: area()[1] + area()[3] / 2 });
      state.layers[state.side].push(l); state.selected = l.id;
      if (!extra.silent) { commit(); openPanel("editImage"); render(); }
      return l;
    });
  }
  function addFile(file) {
    if (!file || !file.type.startsWith("image/")) { toast("Please choose an image file (PNG, JPG, SVG or WEBP)."); return; }
    if (file.size > 15 * 1024 * 1024) { toast("That file is over 15 MB. Try a smaller version; you can email the full file later.", 4000); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (!recentUploads.find((u) => u.src === reader.result)) recentUploads.unshift({ src: reader.result, name: file.name });
      addImageFromSrc(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  }
  function artSrc(a, color) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ARTLIB.svgFor(a, color)); }
  function addArt(key, opts = {}) {
    const a = ARTLIB.ART.find((x) => x.key === key); if (!a) return Promise.resolve(null);
    const color = opts.color || defaultInk();
    return addImageFromSrc(artSrc(a, color), a.name, { art: { key, color: a.multi ? "" : color }, fitW: opts.fitW || 0.45, fitH: opts.fitH || 0.35, at: opts.at, silent: opts.silent });
  }
  async function recolorArt(l, color, touched = true) {
    const a = ARTLIB.ART.find((x) => x.key === l.art.key); if (!a || a.multi) return;
    const img = await loadImage(artSrc(a, color)); if (!img) return;
    l.img = img; l.art = { key: l.art.key, color, touched: touched || !!l.art.touched }; render();
  }
  function removeWhite(l) {
    const src = l.orig || l.img.src;
    if (l.orig) { // toggle back
      loadImage(l.orig).then((img) => { l.img = img; l.orig = ""; commit(); render(); syncPanel(); });
      return;
    }
    const c = document.createElement("canvas");
    c.width = l.img.naturalWidth; c.height = l.img.naturalHeight;
    const x = c.getContext("2d"); x.drawImage(l.img, 0, 0);
    let data;
    try { data = x.getImageData(0, 0, c.width, c.height); } catch (e) { toast("This image can't be edited here."); return; }
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const m = Math.min(d[i], d[i + 1], d[i + 2]);
      if (m > 238) d[i + 3] = 0;
      else if (m > 210) d[i + 3] = Math.round(d[i + 3] * (238 - m) / 28);
    }
    x.putImageData(data, 0, 0);
    loadImage(c.toDataURL("image/png")).then((img) => { l.orig = src; l.img = img; commit(); render(); syncPanel(); toast("White background removed."); });
  }

  function clamp(l, side = state.side) {
    const [ax, ay, aw, ah] = area(side);
    l.x = Math.max(ax, Math.min(ax + aw, l.x)); l.y = Math.max(ay, Math.min(ay + ah, l.y));
  }
  const clampAll = () => ["front", "back"].forEach((s) => state.layers[s].forEach((l) => clamp(l, s)));

  function removeLayer(l) {
    state.layers[state.side] = state.layers[state.side].filter((x) => x !== l);
    if (state.selected === l.id) state.selected = null;
    commit(); syncPanel(); render();
  }
  function duplicate(l) {
    const c = { ...l, id: ++uid, x: l.x + 14, y: l.y + 14 };
    clamp(c); state.layers[state.side].push(c); state.selected = c.id; commit(); syncPanel(); render();
  }
  function reorder(l, dir) {
    const L = state.layers[state.side], i = L.indexOf(l), j = i + dir;
    if (j < 0 || j >= L.length) return;
    [L[i], L[j]] = [L[j], L[i]]; commit(); syncPanel(); render();
  }
  function centerH(l) { const [ax, , aw] = area(); l.x = ax + aw / 2; commit(); render(); }

  /* ---------------- Canvas interaction ---------------- */
  let drag = null;
  function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (500 / r.width), y: (e.clientY - r.top) * (560 / r.height) }; }
  cv.addEventListener("pointerdown", (e) => {
    const p = pt(e), cur = sel();
    cv.focus({ preventScroll: true });
    if (cur) {
      const h = hitHandle(cur, p);
      if (h === "del") { removeLayer(cur); return; }
      if (h === "dup") { duplicate(cur); return; }
      if (h === "rotate") {
        drag = { mode: "rotate", l: cur, a0: Math.atan2(p.y - cur.y, p.x - cur.x), r0: cur.rot || 0, moved: false };
        cv.setPointerCapture(e.pointerId); return;
      }
      if (h === "scale") {
        drag = { mode: "scale", l: cur, d0: Math.hypot(p.x - cur.x, p.y - cur.y) || 1, s0: cur.scale, moved: false };
        cv.setPointerCapture(e.pointerId); return;
      }
    }
    const list = state.layers[state.side];
    for (let i = list.length - 1; i >= 0; i--) {
      if (hit(list[i], p)) {
        const l = list[i];
        drag = { mode: "move", l, dx: p.x - l.x, dy: p.y - l.y, moved: false };
        const changed = state.selected !== l.id;
        state.selected = l.id; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
        if (changed) syncPanel();
        render(); return;
      }
    }
    if (state.selected) { state.selected = null; syncPanel(); render(); }
  });
  cv.addEventListener("pointermove", (e) => {
    const p = pt(e);
    if (!drag) {
      const cur = sel(); let c = "default";
      if (cur) { const h = hitHandle(cur, p); if (h) c = h === "rotate" ? "alias" : h === "scale" ? "nwse-resize" : "pointer"; }
      if (c === "default" && state.layers[state.side].some((l) => hit(l, p))) c = "grab";
      cv.style.cursor = c; return;
    }
    const l = drag.l; drag.moved = true;
    if (drag.mode === "move") {
      l.x = p.x - drag.dx; l.y = p.y - drag.dy;
      const [ax, , aw] = area();
      if (Math.abs(l.x - (ax + aw / 2)) < 4) l.x = ax + aw / 2; // snap to center
      clamp(l);
    } else if (drag.mode === "rotate") {
      let r = drag.r0 + ((Math.atan2(p.y - l.y, p.x - l.x) - drag.a0) * 180) / Math.PI;
      r = ((r + 540) % 360) - 180;
      if (e.shiftKey) r = Math.round(r / 15) * 15;
      else for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(r - snap) < 4) r = snap;
      l.rot = Math.round(r);
    } else if (drag.mode === "scale") {
      l.scale = Math.max(0.15, Math.min(6, drag.s0 * Math.hypot(p.x - l.x, p.y - l.y) / drag.d0));
    }
    render();
  });
  function endDrag() {
    if (!drag) return;
    const moved = drag.moved; drag = null; cv.style.cursor = "grab";
    if (moved) { commit(); syncPanel(true); }
    render();
  }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);
  cv.tabIndex = 0;

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && !typing) {
      if (e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if (e.key.toLowerCase() === "d" && sel()) { e.preventDefault(); duplicate(sel()); return; }
    }
    if (typing || $("#priceDialog").open) return;
    const l = sel(); if (!l) return;
    if (document.activeElement !== cv && document.activeElement !== document.body) return;
    const d = e.shiftKey ? 10 : 2;
    const m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (m) { e.preventDefault(); l.x += m[0]; l.y += m[1]; clamp(l); render(); clearTimeout(l._nudge); l._nudge = setTimeout(commit, 500); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeLayer(l); }
    if (e.key === "Escape") { state.selected = null; syncPanel(); render(); }
  });

  // Drop or paste images anywhere
  const stage = $("#labStage");
  ["dragenter", "dragover"].forEach((t) => stage.addEventListener(t, (e) => { e.preventDefault(); stage.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((t) => stage.addEventListener(t, (e) => { e.preventDefault(); stage.classList.remove("drag"); }));
  stage.addEventListener("drop", (e) => addFile(e.dataTransfer.files[0]));
  document.addEventListener("paste", (e) => {
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) { e.preventDefault(); addFile(item.getAsFile()); }
  });
  $("#fileInput").addEventListener("change", (e) => { addFile(e.target.files[0]); e.target.value = ""; });

  /* ---------------- Sides, zoom, print area ---------------- */
  function setSide(side) {
    state.side = side; state.selected = null;
    $$(".view-btn").forEach((x) => x.setAttribute("aria-pressed", x.dataset.side === side));
    syncPanel(); render();
  }
  $$(".view-btn").forEach((b) => b.addEventListener("click", () => setSide(b.dataset.side)));
  // Size the stage to the space available (keeps the 500 × 560 garment ratio).
  const scroller = $("#stageScroll"), inner = $("#stageInner");
  function fitStage() {
    const w = scroller.clientWidth - 16, h = scroller.clientHeight - 16;
    let cw = Math.max(120, Math.min(w, (h * 500) / 560));
    if (lab.classList.contains("zoomed")) cw *= 1.7;
    inner.style.width = cw + "px"; inner.style.height = (cw * 560) / 500 + "px";
  }
  if (window.ResizeObserver) new ResizeObserver(fitStage).observe(scroller); else window.addEventListener("resize", fitStage);
  $("#zoomBtn").addEventListener("click", (e) => {
    const on = lab.classList.toggle("zoomed"); e.currentTarget.setAttribute("aria-pressed", on); fitStage();
    if (on) { const sc = $("#stageScroll"); requestAnimationFrame(() => { sc.scrollTop = (sc.scrollHeight - sc.clientHeight) * 0.25; sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; }); }
  });
  $("#gridBtn").addEventListener("click", (e) => { state.showArea = !state.showArea; e.currentTarget.setAttribute("aria-pressed", state.showArea); render(); });

  /* ---------------- Panels ---------------- */
  const ICON = {
    upload: '<svg viewBox="0 0 64 64"><path d="M18 46a12 12 0 0 1-2-24A16 16 0 0 1 47 20a11 11 0 0 1 1 26"/><path d="M32 30v24m-8-16 8-8 8 8"/></svg>',
    text: '<svg viewBox="0 0 64 64"><rect x="6" y="16" width="52" height="32" rx="3"/><text x="28" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="currentColor" stroke="none">abc</text><path d="M46 23v18"/></svg>',
    art: '<svg viewBox="0 0 64 64"><rect x="8" y="12" width="48" height="40" rx="3"/><path d="m8 44 14-14 12 12 8-8 14 14"/><circle cx="42" cy="24" r="4"/></svg>',
    products: '<svg viewBox="0 0 64 64"><path d="M22 10 8 18l4 12 6-3v25h26V27l6 3 4-12-14-8c-1 4-5 6-9 6s-8-2-9-6Z"/><rect x="40" y="34" width="18" height="22" rx="2"/><path d="M45 34v-4a4 4 0 0 1 8 0v4"/></svg>',
    ideas: '<svg viewBox="0 0 64 64"><path d="M32 8l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/><path d="M48 36l2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM16 38l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></svg>',
    names: '<svg viewBox="0 0 64 64"><path d="M22 10 8 18l4 12 6-3v25h26V27l6 3 4-12-14-8c-1 4-5 6-9 6s-8-2-9-6Z"/><path d="M25 32h14M28 38l-2 10m8-10v10"/></svg>'
  };
  const TITLES = { home: "What's next for you?", ideas: "Templates", details: "Product and decoration", upload: "Upload artwork", text: "Add text", art: "Add art", names: "Names & numbers", products: "Change product", editText: "Edit text", editImage: "Edit artwork", welcome: "Welcome back" };
  const RAIL = { home: null, ideas: "ideas", details: "details", upload: "upload", text: "text", art: "art", names: "names", products: "products", editText: "text", editImage: null, welcome: null };

  $$(".lab-rail button").forEach((b) => b.addEventListener("click", () => {
    if (state.panel === b.dataset.tool && !lab.classList.contains("panel-closed")) { closePanel(); return; }
    state.selected = null; render(); openPanel(b.dataset.tool);
  }));
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => openPanel(b.dataset.open)));
  $("#addProductsBtn").addEventListener("click", () => openPanel("products"));
  $("#panelClose").addEventListener("click", closePanel);
  $("#panelBack").addEventListener("click", () => {
    if (state.panel === "art" && (state.artCat || state.artQuery)) { state.artCat = null; state.artQuery = ""; openPanel("art"); return; }
    state.selected = null; render(); openPanel("home");
  });
  function closePanel() { lab.classList.add("panel-closed"); $$(".lab-rail button").forEach((b) => b.removeAttribute("aria-current")); }

  function openPanel(name) {
    state.panel = name;
    lab.classList.remove("panel-closed");
    $("#panelTitle").textContent = TITLES[name] || "";
    $("#panelBack").hidden = name === "home" || name === "welcome";
    $$(".lab-rail button").forEach((b) => b.setAttribute("aria-current", b.dataset.tool === RAIL[name]));
    const body = $("#panelBody");
    const inner = document.createElement("div"); // fresh element so old listeners are dropped
    body.replaceChildren(inner);
    (P[name] || P.home)(inner);
    body.scrollTop = 0;
  }
  // Keep the panel in step with the current selection.
  function syncPanel(soft) {
    const l = sel();
    if (l) {
      const want = l.type === "text" ? "editText" : "editImage";
      if (state.panel !== want || !soft) openPanel(want);
      else updateEditControls(l);
    } else if (state.panel === "editText" || state.panel === "editImage") openPanel("home");
    else if (state.panel === "home") openPanel("home");
  }

  /* ---- Panel building blocks ---- */
  function inkRow(current, onPick, id) {
    return `<div class="ink-row" data-ink="${id}">${INKS.map(([n, h]) => `<button type="button" class="ink" style="background:${h}" title="${n}" aria-label="${n}" data-hex="${h}" aria-pressed="${h.toLowerCase() === (current || "").toLowerCase()}"></button>`).join("")}<input type="color" value="${current && /^#[0-9a-f]{6}$/i.test(current) ? current : "#1b1b1b"}" aria-label="Custom color" title="Custom color"></div>`;
  }
  function bindInk(root, id, onPick) {
    const row = $(`[data-ink="${id}"]`, root); if (!row) return;
    row.addEventListener("click", (e) => {
      const b = e.target.closest(".ink"); if (!b) return;
      $$(".ink", row).forEach((x) => x.setAttribute("aria-pressed", x === b));
      onPick(b.dataset.hex, true);
    });
    const ci = $("input[type=color]", row);
    ci.addEventListener("input", () => { $$(".ink", row).forEach((x) => x.setAttribute("aria-pressed", "false")); onPick(ci.value, false); });
    ci.addEventListener("change", () => commit());
  }
  function slider(id, label, min, max, step, val, fmt = (v) => v) {
    return `<div class="slider"><label class="lbl" for="${id}">${label} <output id="${id}Out">${fmt(val)}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  }
  function bindSlider(root, id, fmt, onInput) {
    const r = $("#" + id, root), o = $("#" + id + "Out", root); if (!r) return;
    r.addEventListener("input", () => { o.textContent = fmt(+r.value); onInput(+r.value); render(); });
    r.addEventListener("change", () => commit());
  }
  function layerListHTML() {
    const list = state.layers[state.side];
    if (!list.length) return "";
    return `<h3>On the ${state.side} (${list.length})</h3><ul class="layer-list">${[...list].reverse().map((l) => `
      <li class="${l.id === state.selected ? "active" : ""}">
        <button class="pick" type="button" data-id="${l.id}">${l.type === "text" ? "Aa  " + esc(l.text) : (l.art ? "★  " : "🖼  ") + esc(l.name)}</button>
        <button class="icon-only" type="button" data-del="${l.id}" aria-label="Remove ${esc(l.type === "text" ? l.text : l.name)}" title="Remove"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg></button>
      </li>`).join("")}</ul>`;
  }
  function bindLayerList(root) {
    root.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-id]"), del = e.target.closest("[data-del]");
      if (del) { const l = state.layers[state.side].find((x) => x.id === +del.dataset.del); if (l) removeLayer(l); }
      else if (pick) { state.selected = +pick.dataset.id; syncPanel(); render(); }
    });
  }
  const toolRowHTML = (l) => `<div class="tool-row">
      <button type="button" data-t="center"><svg viewBox="0 0 24 24"><path d="M12 3v18M7 8h10v8H7z"/></svg>Center</button>
      <button type="button" data-t="dup"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/></svg>Duplicate</button>
      <button type="button" data-t="up"><svg viewBox="0 0 24 24"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>Forward</button>
      <button type="button" data-t="down"><svg viewBox="0 0 24 24"><path d="M12 5v14m-6-6 6 6 6-6"/></svg>Backward</button>
      ${l.type === "image" ? `<button type="button" data-t="flip"><svg viewBox="0 0 24 24"><path d="M12 3v18M8 7 3 12l5 5V7Zm8 0 5 5-5 5V7Z"/></svg>Flip</button>` : ""}
      <button type="button" data-t="side"><svg viewBox="0 0 24 24"><path d="M4 12h16m-5-5 5 5-5 5"/></svg>Move to ${state.side === "front" ? "back" : "front"}</button>
      <button type="button" class="danger" data-t="del"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg>Delete</button>
    </div>`;
  function bindToolRow(root, l) {
    $(".tool-row", root).addEventListener("click", (e) => {
      const t = e.target.closest("[data-t]")?.dataset.t; if (!t) return;
      if (t === "center") centerH(l);
      if (t === "dup") duplicate(l);
      if (t === "up") reorder(l, 1);
      if (t === "down") reorder(l, -1);
      if (t === "flip") { l.flip = !l.flip; commit(); render(); }
      if (t === "del") removeLayer(l);
      if (t === "side") {
        const to = state.side === "front" ? "back" : "front";
        state.layers[state.side] = state.layers[state.side].filter((x) => x !== l);
        state.layers[to].push(l); clamp(l, to);
        state.side = to; $$(".view-btn").forEach((x) => x.setAttribute("aria-pressed", x.dataset.side === to));
        commit(); syncPanel(); render(); toast(`Moved to the ${to}.`);
      }
    });
  }
  function updateEditControls(l) {
    const set = (id, v, f = (x) => x) => { const r = $("#" + id); if (r) { r.value = v; $("#" + id + "Out").textContent = f(v); } };
    set("scaleR", l.scale, pct); set("rotR", l.rot || 0, deg);
  }
  const pct = (v) => Math.round(v * 100) + "%";
  const deg = (v) => Math.round(v) + "°";

  /* ---- The panels ---- */
  const P = {
    home(b) {
      b.innerHTML = `
        <div class="home-grid">
          <button type="button" data-go="upload">${ICON.upload}Uploads</button>
          <button type="button" data-go="text">${ICON.text}Add Text</button>
          <button type="button" data-go="art">${ICON.art}Add Art</button>
          <button type="button" data-go="products">${ICON.products}Change Products</button>
          <button type="button" data-go="ideas">${ICON.ideas}Templates</button>
          <button type="button" data-go="names">${ICON.names}Names &amp; Numbers</button>
        </div>
        <div class="home-tips"><strong>Uploading anytime is simple!</strong>
          <ul style="padding:0;margin:0">
            <li>✥ Drag and drop an image anywhere</li>
            <li>📋 Copy and paste from your clipboard</li>
          </ul>
        </div>
        <div id="homeLayers">${layerListHTML()}</div>`;
      $(".home-grid", b).addEventListener("click", (e) => { const g = e.target.closest("[data-go]"); if (g) openPanel(g.dataset.go); });
      bindLayerList($("#homeLayers", b));
    },

    welcome(b) {
      b.innerHTML = `<div class="welcome">
        <canvas width="320" height="358" id="welcomeCv"></canvas>
        <p style="margin:0 auto"><strong>${esc(state.name)}</strong><br><span class="muted">Your last design is still here.</span></p>
        <button class="btn gold" type="button" id="wContinue">Continue my design</button>
        <button class="btn ghost" type="button" id="wNew">Start a new design</button>
      </div>`;
      renderScene($("#welcomeCv", b), state.layers.front.length ? "front" : "back");
      $("#wContinue", b).onclick = () => openPanel("home");
      $("#wNew", b).onclick = () => newDesign(false);
    },

    products(b) {
      b.innerHTML = `<p class="muted" style="margin-top:0">Your design stays put when you switch. Anything outside the new print area is moved inside it.</p>
        <div class="tile-grid">${Object.entries(C.garments).map(([k, g]) => `
          <button type="button" class="tile" data-g="${k}" aria-pressed="${k === state.garment}">
            <canvas width="240" height="269" data-gthumb="${k}"></canvas>${esc(g.label)}
            <small>${C.showPrices ? "from " + money(g.base) : ""}${g.printOk === false ? (C.showPrices ? " · " : "") + "embroidery only" : ""}</small>
          </button>`).join("")}</div>`;
      $$("canvas[data-gthumb]", b).forEach((c) => {
        const x = c.getContext("2d"); x.setTransform(c.width / 500, 0, 0, c.width / 500, 0, 0); drawGarment(x, c.dataset.gthumb, state.color, "front");
      });
      $(".tile-grid", b).addEventListener("click", (e) => {
        const t = e.target.closest("[data-g]"); if (!t) return;
        setGarment(t.dataset.g);
        $$(".tile", b).forEach((x) => x.setAttribute("aria-pressed", x === t));
        toast(`Switched to ${C.garments[state.garment].label}.`);
      });
    },

    details(b) {
      const g = C.garments[state.garment];
      const tier = C.quantityDiscounts[0];
      b.innerHTML = `
        <h3>Decoration method</h3>
        ${Object.entries(C.methods).map(([k, m]) => {
          const ok = k === "print" ? g.printOk !== false : g.embroideryOk;
          const desc = k === "print" ? "Best for photos, gradients and many colors. Soft and machine washable." :
            (C.showPrices ? `Best for logos and names. Includes up to ~8,000 stitches per spot, plus a one-time ${money(m.setup)} digitizing fee per location.` : "Best for logos and names. Fine detail and gradients are simplified.");
          return `<button type="button" class="method-card" data-m="${k}" aria-pressed="${k === state.method}" ${ok ? "" : "disabled"}><strong>${esc(m.label)}${C.showPrices ? ` · +${money(k === "print" ? m.perSide : m.perLocation)}/${k === "print" ? "side" : "location"}` : ""}</strong><span>${ok ? desc : "Not available on " + esc(g.label.toLowerCase())}</span></button>`;
        }).join("")}
        <h3>Product color: <span style="font-weight:600" id="colorLabel">${esc(colorName())}</span></h3>
        <div class="color-grid">${C.colors.map((c) => `<button type="button" class="swatch${isDark(c.hex) ? " dark" : ""}" style="background:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}" data-c="${c.hex}" aria-pressed="${c.hex === state.color}"></button>`).join("")}</div>
        ${C.showPrices && tier ? `<p class="note">Order ${tier.min}+ pieces and save ${Math.round(tier.off * 100)}%. Bigger orders save up to ${Math.round(C.quantityDiscounts[C.quantityDiscounts.length - 1].off * 100)}%.</p>` : ""}
        <button class="pill full-btn" type="button" id="toProducts">Change product</button>`;
      b.addEventListener("click", (e) => {
        const m = e.target.closest("[data-m]");
        if (m && !m.disabled) { state.method = m.dataset.m; $$("[data-m]", b).forEach((x) => x.setAttribute("aria-pressed", x === m)); commit(); render(); }
        const c = e.target.closest("[data-c]");
        if (c) {
          state.color = c.dataset.c;
          $$("[data-c]", b).forEach((x) => x.setAttribute("aria-pressed", x === c));
          $("#colorLabel", b).textContent = colorName(); render();
          autoInk().then(() => { commit(); render(); });
        }
      });
      $("#toProducts", b).onclick = () => openPanel("products");
    },

    upload(b) {
      b.innerHTML = `
        <label class="dropzone" id="dropzone" for="fileInput">
          <svg viewBox="0 0 64 64"><path d="M18 46a12 12 0 0 1-2-24A16 16 0 0 1 47 20a11 11 0 0 1 1 26"/><path d="M32 30v24m-8-16 8-8 8 8"/></svg>
          <strong>Choose a file</strong> or drop it here<br>
          <span class="muted">PNG, JPG, SVG or WEBP · up to 15 MB</span>
        </label>
        <div class="note"><strong>Tips for a sharp print</strong><br>Use the largest file you have. A PNG with a transparent background looks best. You can remove a white background after uploading.</div>
        ${recentUploads.length ? `<h3>Recent uploads</h3><div class="recent-uploads">${recentUploads.map((u, i) => `<button type="button" data-u="${i}" title="${esc(u.name)}" aria-label="Add ${esc(u.name)} again" style="background-image:url('${u.src}')"></button>`).join("")}</div>` : ""}
        <p class="muted" style="margin-top:14px">By uploading, you confirm you have the right to use this artwork.</p>`;
      const dz = $("#dropzone", b);
      ["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
      ["dragleave", "drop"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove("drag"); }));
      dz.addEventListener("drop", (e) => addFile(e.dataTransfer.files[0]));
      b.addEventListener("click", (e) => { const u = e.target.closest("[data-u]"); if (u) { const r = recentUploads[+u.dataset.u]; addImageFromSrc(r.src, r.name); } });
    },

    text(b) {
      b.innerHTML = `
        <div class="field"><label for="newText">Your text</label>
          <textarea id="newText" rows="2" maxlength="60" placeholder="Enter text here"></textarea></div>
        <button class="pill dark full-btn" type="button" id="addTextBtn">Add to design</button>
        <h3 style="margin-top:22px">Quick styles</h3>
        <div class="tile-grid" id="quickStyles">
          ${[["Bold modern", "BOLD"], ["Varsity", "VARSITY"], ["Retro script", "Retro"], ["Elegant script", "Elegant"], ["Tall block", "TALL BLOCK"], ["Amharic sans (ፊደል)", "ሰላም"]].map(([n, s]) => {
            const f = FONTS.find((x) => x[0] === n);
            return `<button type="button" class="tile" data-font="${esc(f[1])}" style='font:${f[1].replace("{s}", 20)}'>${esc(s)}<small style="font:400 .78rem var(--text)">${esc(n)}</small></button>`;
          }).join("")}
        </div>
        <p class="muted" style="margin-top:12px">Amharic (ፊደል) is supported in every font.</p>`;
      const ta = $("#newText", b);
      let font = FONTS[0][1];
      const go = () => { if (!ta.value.trim()) { ta.focus(); toast("Type your text first."); return; } addText(ta.value.replace(/\s*\n\s*/g, " "), { font }); };
      $("#addTextBtn", b).onclick = go;
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } });
      $("#quickStyles", b).addEventListener("click", (e) => {
        const t = e.target.closest("[data-font]"); if (!t) return;
        font = t.dataset.font;
        if (ta.value.trim()) go(); else { $$("#quickStyles .tile", b).forEach((x) => x.setAttribute("aria-pressed", x === t)); ta.focus(); }
      });
      setTimeout(() => ta.focus(), 50);
    },

    editText(b) {
      const l = sel(); if (!l) return P.home(b);
      b.innerHTML = `
        <div class="field"><label for="eText">Edit your text</label><textarea id="eText" rows="2" maxlength="60">${esc(l.text)}</textarea></div>
        <h3>Font</h3>
        <div class="font-list">${FONTS.map(([n, f]) => `<button type="button" data-f="${esc(f)}" aria-pressed="${familyOf(f) === familyOf(l.font)}" style='font:${f.replace("{s}", 17)}' title="${esc(n)}">${esc(n.replace(/ \(ፊደል\)/, " ፊደል"))}</button>`).join("")}</div>
        <h3>Color</h3>${inkRow(l.color, null, "fill")}
        ${state.method === "embroidery" ? `<p class="muted" style="margin:6px 0 0">We'll match the closest thread color.</p>` : ""}
        ${slider("scaleR", "Size", 0.2, 4, 0.01, l.scale, pct)}
        ${slider("rotR", "Rotation", -180, 180, 1, l.rot || 0, deg)}
        ${slider("arcR", "Curve", -270, 270, 5, l.arc || 0, (v) => (v ? (v > 0 ? "Arch up " : "Arch down ") + Math.abs(v) + "°" : "Straight"))}
        ${slider("outR", "Outline", 0, 6, 0.25, l.outline || 0, (v) => (v ? v.toFixed(1) : "None"))}
        <div id="outColors" ${l.outline ? "" : "hidden"} style="margin-top:8px">${inkRow(l.outlineColor, null, "outline")}</div>
        ${toolRowHTML(l)}
        <div id="editLayers" style="margin-top:18px">${layerListHTML()}</div>`;
      const ta = $("#eText", b); let tT;
      ta.addEventListener("input", () => { l.text = ta.value.replace(/\s*\n\s*/g, " ") || " "; render(); clearTimeout(tT); tT = setTimeout(commit, 600); });
      $(".font-list", b).addEventListener("click", (e) => {
        const f = e.target.closest("[data-f]"); if (!f) return;
        l.font = f.dataset.f; $$(".font-list button", b).forEach((x) => x.setAttribute("aria-pressed", x === f));
        (document.fonts ? document.fonts.load(fontFor(l), l.text) : Promise.resolve()).then(() => { render(); });
        commit(); render();
      });
      bindInk(b, "fill", (hex, done) => { l.color = hex; l.inkSet = true; render(); if (done) commit(); });
      bindInk(b, "outline", (hex, done) => { l.outlineColor = hex; render(); if (done) commit(); });
      bindSlider(b, "scaleR", pct, (v) => { l.scale = v; });
      bindSlider(b, "rotR", deg, (v) => { l.rot = v; });
      bindSlider(b, "arcR", (v) => (v ? (v > 0 ? "Arch up " : "Arch down ") + Math.abs(v) + "°" : "Straight"), (v) => { l.arc = v; });
      bindSlider(b, "outR", (v) => (v ? v.toFixed(1) : "None"), (v) => { l.outline = v; $("#outColors", b).hidden = !v; });
      bindToolRow(b, l);
      bindLayerList($("#editLayers", b));
    },

    editImage(b) {
      const l = sel(); if (!l) return P.home(b);
      const a = l.art && ARTLIB.ART.find((x) => x.key === l.art.key);
      b.innerHTML = `
        <div class="row" style="align-items:center;gap:12px"><div style="flex:0 0 64px;height:64px;border:2px solid var(--line);border-radius:10px;background:#F7F9F6 url('${l.img.src.replace(/'/g, "%27")}') center/contain no-repeat"></div><div><strong style="color:var(--ink)">${esc(l.name)}</strong><br><span class="muted">${l.art ? "Clip art" : "Your upload"}</span></div></div>
        ${l.lowRes ? `<p class="note">This image is small and may look blurry when printed. If you have a larger version, we'll ask for it with your proof.</p>` : ""}
        ${a && !a.multi ? `<h3>Art color</h3>${inkRow(l.art.color, null, "art")}` : ""}
        ${!l.art ? `<div class="tool-row"><button type="button" id="bgBtn"><svg viewBox="0 0 24 24"><path d="M4 20 20 4M4 4h16v16H4z"/></svg>${l.orig ? "Restore background" : "Remove white background"}</button></div>` : ""}
        ${state.method === "embroidery" && !l.art ? `<p class="note">For embroidery we turn your image into stitches. Photos and gradients will be simplified.</p>` : ""}
        ${slider("scaleR", "Size", 0.1, 5, 0.01, l.scale, pct)}
        ${slider("rotR", "Rotation", -180, 180, 1, l.rot || 0, deg)}
        ${toolRowHTML(l)}
        <div id="editLayers" style="margin-top:18px">${layerListHTML()}</div>`;
      if (a && !a.multi) bindInk(b, "art", (hex, done) => { recolorArt(l, hex).then(() => { if (done) commit(); }); });
      if (!l.art) $("#bgBtn", b).onclick = () => removeWhite(l);
      bindSlider(b, "scaleR", pct, (v) => { l.scale = v; });
      bindSlider(b, "rotR", deg, (v) => { l.rot = v; });
      bindToolRow(b, l);
      bindLayerList($("#editLayers", b));
    },

    art(b) {
      const ink = defaultInk();
      const tileArt = (a) => `<button type="button" data-art="${a.key}" title="${esc(a.name)}" aria-label="Add ${esc(a.name)}" style="color:${ink}">${ARTLIB.svgFor(a, "currentColor").replace(/ width="\d+" height="\d+"/, "")}</button>`;
      const q = state.artQuery.trim().toLowerCase();
      let content;
      if (q) {
        const res = ARTLIB.ART.filter((a) => (a.name + " " + a.tags + " " + a.cat).toLowerCase().includes(q));
        content = res.length ? `<div class="art-grid">${res.map(tileArt).join("")}</div>` : `<p class="muted">No art matches “${esc(q)}”. Try another word, or <a href="mailto:${esc(C.business.email)}">ask our designers</a> to draw it for you.</p>`;
      } else if (state.artCat) {
        const res = ARTLIB.ART.filter((a) => (state.artCat === "popular" ? a.pop : a.cat === state.artCat));
        content = `<h3>${esc((ARTLIB.CATS.find((c) => c[0] === state.artCat) || [])[1] || "")}</h3><div class="art-grid">${res.map(tileArt).join("")}</div>`;
      } else {
        content = `<div class="tile-grid">${ARTLIB.CATS.map(([k, n]) => {
          const first = ARTLIB.ART.find((a) => (k === "popular" ? a.pop : a.cat === k));
          return `<button type="button" class="tile" data-cat="${k}"><span class="ico" style="color:var(--ink)">${first ? ARTLIB.svgFor(first, "currentColor").replace(/ width="\d+" height="\d+"/, ' width="44" height="44"') : ""}</span>${esc(n)}</button>`;
        }).join("")}</div>`;
      }
      b.innerHTML = `<div class="field"><label for="artSearch" class="sr-only">Search art</label><input id="artSearch" type="search" placeholder="Search for artwork" value="${esc(state.artQuery)}"></div>
        <div id="artContent" style="margin-top:12px">${content}</div>
        <p class="muted" style="margin-top:14px">Need something custom? Our designers can draw it for free with your order.</p>`;
      $("#panelBack").hidden = !(state.artCat || q);
      const s = $("#artSearch", b); let st;
      s.addEventListener("input", () => { clearTimeout(st); st = setTimeout(() => { state.artQuery = s.value; openPanel("art"); const n = $("#artSearch"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
      b.addEventListener("click", (e) => {
        const c = e.target.closest("[data-cat]"); if (c) { state.artCat = c.dataset.cat; openPanel("art"); return; }
        const a = e.target.closest("[data-art]"); if (a) addArt(a.dataset.art);
      });
    },

    names(b) {
      const hasName = state.layers.back.some((l) => l.nn === "name"), hasNum = state.layers.back.some((l) => l.nn === "number");
      b.innerHTML = `
        <p style="margin-top:0">Give everyone their own name and number on the back. We'll use the placeholders below as the style guide.</p>
        <label class="row" style="gap:10px;font-weight:700;color:var(--ink);margin:8px 0"><input type="checkbox" id="nnName" ${hasName ? "checked" : ""} style="flex:0 0 auto;width:20px;height:20px;accent-color:var(--forest)"> Add names</label>
        <label class="row" style="gap:10px;font-weight:700;color:var(--ink);margin:8px 0"><input type="checkbox" id="nnNum" ${hasNum ? "checked" : ""} style="flex:0 0 auto;width:20px;height:20px;accent-color:var(--forest)"> Add numbers</label>
        <div class="field" style="margin-top:14px"><label for="roster">Roster: one person per line</label>
          <textarea id="roster" rows="8" placeholder="Name, Number, Size&#10;ABEBE, 10, L&#10;SARAH, 7, M">${esc(state.roster)}</textarea></div>
        <button class="pill full-btn" type="button" id="rosterQty">Use roster sizes for my quantities</button>
        <p class="muted" style="margin-top:12px">Your roster is sent with your order, and every name appears on your proof before we make anything.</p>`;
      const toggle = (kind, on) => {
        const [ax, ay, aw] = area("back");
        state.layers.back = state.layers.back.filter((l) => l.nn !== kind);
        if (on) {
          const prev = state.side; state.side = "back";
          addText(kind === "name" ? "NAME" : "00", { silent: true, nn: kind, font: '400 {s}px "Graduate"' + ETH, size: kind === "name" ? 34 : 120, color: defaultInk(), at: { x: ax + aw / 2, y: ay + (kind === "name" ? 40 : 140) } });
          state.side = prev;
        }
        state.selected = null; setSide("back"); commit(); openPanel("names");
      };
      $("#nnName", b).onchange = (e) => toggle("name", e.target.checked);
      $("#nnNum", b).onchange = (e) => toggle("number", e.target.checked);
      $("#roster", b).addEventListener("input", (e) => { state.roster = e.target.value; scheduleSave(); });
      $("#rosterQty", b).onclick = () => {
        const g = C.garments[state.garment]; const counts = {};
        let people = 0;
        state.roster.split(/\n/).map((x) => x.trim()).filter(Boolean).forEach((line) => {
          people++;
          if (g.oneSize) { counts.ONE = (counts.ONE || 0) + 1; return; }
          const size = line.split(/[,;\t]/).map((x) => x.trim().toUpperCase()).find((x) => C.sizes.includes(x === "XXL" ? "2XL" : x === "XXXL" ? "3XL" : x));
          const s = size === "XXL" ? "2XL" : size === "XXXL" ? "3XL" : size;
          if (s) counts[s] = (counts[s] || 0) + 1;
        });
        if (!people) { toast("Add at least one person to the roster first."); return; }
        state.qty = counts; buildQty(); price(); scheduleSave();
        const got = Object.values(counts).reduce((a, n) => a + n, 0);
        toast(got < people ? `Quantities set for ${got} of ${people} people. Add a size (S, M, L…) to the rest.` : `Quantities set for ${got} people.`, 3800);
      };
    },

    ideas(b) {
      b.innerHTML = `<p class="muted" style="margin-top:0">Start from a layout, then change the words, fonts and colors. A template replaces what's on the ${state.side}.</p>
        <div class="tile-grid">${TEMPLATES.map((t, i) => `<button type="button" class="tile" data-tpl="${i}"><canvas width="240" height="269" data-tthumb="${i}"></canvas>${esc(t.name)}</button>`).join("")}</div>`;
      $$("canvas[data-tthumb]", b).forEach(async (c) => {
        const layers = await buildTemplate(TEMPLATES[+c.dataset.tthumb], state.side);
        renderScene(c, state.side, { layers });
      });
      b.addEventListener("click", async (e) => {
        const t = e.target.closest("[data-tpl]"); if (!t) return;
        if (state.layers[state.side].length && !confirm(`Replace what's on the ${state.side} with this template?`)) return;
        state.layers[state.side] = await buildTemplate(TEMPLATES[+t.dataset.tpl], state.side);
        state.selected = null; commit(); render(); toast("Template added. Click any item to edit it.");
      });
    }
  };

  /* ---------------- Templates ---------------- */
  // Positions are fractions of the print area. Fonts are referenced by FONTS name.
  const F = (n) => (FONTS.find((f) => f[0] === n) || FONTS[0])[1];
  const TEMPLATES = [
    { name: "Event tee", items: [
      { t: "EVENT NAME", f: "Block", size: 54, fy: 0.18 },
      { t: "RICHMOND, VA · 2027", f: "Clean", size: 18, fy: 0.32, ink: "accent" },
      { art: "tibeb", fy: 0.42, fw: 0.9 }] },
    { name: "Family reunion", items: [
      { t: "The Johnson Family", f: "Retro script", size: 40, fy: 0.2, arc: 50 },
      { art: "house", fy: 0.42, fw: 0.28 },
      { t: "REUNION 2027", f: "Tall block", size: 40, fy: 0.62, ink: "accent" }] },
    { name: "Team jersey", items: [
      { t: "LIONS", f: "Varsity", size: 50, fy: 0.15, arc: 40, outline: 1.5 },
      { t: "10", f: "Varsity", size: 140, fy: 0.5, outline: 2 }] },
    { name: "Left-chest logo", items: [
      { art: "star", fx: 0.8, fy: 0.08, fw: 0.16 },
      { t: "Your Business", f: "Bold modern", size: 16, fx: 0.8, fy: 0.2 }] },
    { name: "Church choir", items: [
      { art: "cross-ornate", fy: 0.15, fw: 0.3 },
      { t: "St. Mary Choir", f: "Classic serif", size: 34, fy: 0.37 },
      { t: "CHRISTMAS CONCERT 2026", f: "Clean", size: 15, fy: 0.47, ink: "accent" }] },
    { name: "Birthday squad", items: [
      { art: "crown", fy: 0.13, fw: 0.3, ink: "accent" },
      { t: "Birthday", f: "Marker", size: 46, fy: 0.33 },
      { t: "SQUAD", f: "Chunky", size: 40, fy: 0.47 }] },
    { name: "Class of", items: [
      { art: "grad-cap", fy: 0.13, fw: 0.36 },
      { t: "CLASS OF", f: "Varsity", size: 30, fy: 0.33, ink: "accent" },
      { t: "2027", f: "Varsity", size: 80, fy: 0.5 }] },
    { name: "Coffee lover", items: [
      { art: "jebena", fy: 0.2, fw: 0.36 },
      { t: "Buna Time", f: "Script", size: 40, fy: 0.46 },
      { t: "ቡና", f: "Amharic sans (ፊደል)", size: 30, fy: 0.58, ink: "accent" }] },
    { name: "5K run", items: [
      { art: "running", fy: 0.13, fw: 0.34 },
      { t: "5K FUN RUN", f: "Condensed", size: 44, fy: 0.33 },
      { t: "Run for a cause · 2027", f: "Clean", size: 16, fy: 0.43, ink: "accent" }] },
    { name: "Arched name", items: [
      { t: "ADDIS", f: "Fashion serif", size: 52, fy: 0.2, arc: 70 },
      { art: "divider", fy: 0.36, fw: 0.5, ink: "accent" },
      { t: "EST. 2026", f: "Clean", size: 18, fy: 0.45 }] }
  ];
  async function buildTemplate(t, side) {
    const [ax, ay, aw, ah] = area(side);
    const ink = defaultInk();
    const accent = isDark(state.color) ? "#FFFFFF" : "#B3302A";
    const out = [];
    for (const it of t.items) {
      const x = ax + aw * (it.fx ?? 0.5), y = ay + ah * it.fy;
      const color = it.ink === "accent" ? accent : ink;
      if (it.t) {
        const l = { id: ++uid, type: "text", text: it.t, font: F(it.f), color, size: it.size, scale: 1, rot: 0, arc: it.arc || 0, outline: it.outline || 0, outlineColor: isDark(state.color) ? "#1B1B1B" : "#FFFFFF", x, y, inkSet: it.ink === "accent" };
        const b = localBox(l); if (b.w > aw * 0.95) l.scale = (aw * 0.95) / b.w;
        if (it.outline) l.outlineColor = it.ink === "accent" ? ink : accent;
        out.push(l);
      } else {
        const a = ARTLIB.ART.find((z) => z.key === it.art); if (!a) continue;
        const img = await loadImage(artSrc(a, color)); if (!img) continue;
        const w = aw * (it.fw || 0.3), h = w * (img.naturalHeight / img.naturalWidth || 1);
        out.push({ id: ++uid, type: "image", name: a.name, img, w, h, scale: 1, rot: 0, flip: false, art: { key: a.key, color: a.multi ? "" : color }, x, y });
      }
    }
    return out;
  }

  /* ---------------- Garment / color ---------------- */
  function setGarment(k) {
    // Carry each item to the same relative spot in the new print area, shrinking it if it no longer fits.
    const before = { front: area("front"), back: area("back") };
    state.garment = k;
    ["front", "back"].forEach((s) => {
      const [ox, oy, ow, oh] = before[s], [nx, ny, nw, nh] = area(s);
      state.layers[s].forEach((l) => {
        l.x = nx + ((l.x - ox) / ow) * nw; l.y = ny + ((l.y - oy) / oh) * nh;
        const b = localBox(l), f = Math.min(1, (nw * 0.95) / b.w, (nh * 0.95) / b.h);
        if (f < 1) l.scale *= f;
      });
    });
    const g = C.garments[k];
    if (g.printOk === false) state.method = "embroidery";
    if (state.method === "embroidery" && !g.embroideryOk) state.method = "print";
    clampAll(); buildQty(); commit(); render();
  }
  function autoInk() {
    const ink = defaultInk(), jobs = [];
    ["front", "back"].forEach((s) => state.layers[s].forEach((l) => {
      if (l.type === "text" && !l.inkSet) l.color = ink;
      if (l.art && l.art.color && !l.art.touched && l.art.color !== ink) jobs.push(recolorArt(l, ink, false));
    }));
    return Promise.all(jobs);
  }
  function updateChip() {
    $("#chipGarment").textContent = C.garments[state.garment].label;
    $("#chipColor").textContent = colorName();
    $("#chipDot").style.background = state.color;
  }

  /* ---------------- Quantity + price ---------------- */
  function buildQty() {
    const g = C.garments[state.garment];
    if (g.oneSize) {
      const n = state.qty.ONE || Object.values(state.qty).reduce((a, b) => a + (b || 0), 0) || 1;
      state.qty = { ONE: n };
      $("#qtyBox").innerHTML = `<div class="size-grid" style="max-width:200px"><div><label for="qtyOne">How many?</label><input id="qtyOne" type="number" inputmode="numeric" min="0" max="5000" value="${n}" data-size="ONE"></div></div>`;
      $("#plusNote").textContent = "";
    } else {
      if (state.qty.ONE !== undefined) { const n = state.qty.ONE; state.qty = n ? { M: n } : {}; }
      if (!Object.values(state.qty).some((v) => v > 0)) state.qty = { M: 1 };
      $("#qtyBox").innerHTML = `<div class="size-grid">${C.sizes.map((s) =>
        `<div><label for="q${s}">${s}</label><input id="q${s}" type="number" inputmode="numeric" min="0" max="5000" value="${state.qty[s] || 0}" data-size="${s}"></div>`).join("")}</div>`;
      $("#plusNote").textContent = C.showPrices ? `2XL and larger add ${money(C.plusSizeUpcharge)} each.` : "";
    }
    $$("#qtyBox input").forEach((i) => {
      i.addEventListener("focus", () => i.select());
      i.addEventListener("input", () => { state.qty[i.dataset.size] = Math.max(0, parseInt(i.value, 10) || 0); price(); scheduleSave(); });
    });
  }

  function calc() {
    const g = C.garments[state.garment];
    const sides = ["front", "back"].filter((s) => state.layers[s].length > 0).length;
    const m = C.methods[state.method];
    const decoEach = state.method === "print" ? m.perSide * sides : m.perLocation * sides;
    const sizes = g.oneSize ? { ONE: state.qty.ONE || 0 } : state.qty;
    let count = 0, plus = 0;
    for (const [s, n] of Object.entries(sizes)) { if (!n) continue; count += n; if (/^\d?XL$/.test(s) && s !== "XL") plus += n; }
    const tier = [...C.quantityDiscounts].reverse().find((d) => count >= d.min);
    const off = tier ? tier.off : 0;
    const sub = (g.base + decoEach) * count + C.plusSizeUpcharge * plus;
    const discount = sub * off;
    const setup = state.method === "embroidery" && sides > 0 ? m.setup * sides : 0;
    const total = sub - discount + setup;
    return { g, sides, decoEach, count, plus, off, sub, discount, setup, total };
  }
  function price() {
    const p = calc();
    if (!C.showPrices) {
      $("#getPriceText").textContent = "Get a Quote";
      $("#estLabel").textContent = "Your order";
      $("#estTotal").textContent = p.count ? `${p.count} piece${p.count > 1 ? "s" : ""}` : "No pieces yet";
      $("#estEach").textContent = p.count ? "Free quote within one business day" : "Add a quantity above";
      const lines = [["Item", p.g.label], ["Color", colorName()], ["Decoration", C.methods[state.method].label], ["Decorated sides", p.sides ? String(p.sides) : "None yet"]];
      $("#estLines").innerHTML = lines.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("");
      $("#estNote").textContent = "Larger orders cost less per piece. We'll email your price and a mockup before anything is made.";
      return;
    }
    $("#estTotal").textContent = money(p.total);
    $("#estEach").textContent = p.count ? `${p.count} piece${p.count > 1 ? "s" : ""} · about ${money(p.total / p.count)} each` : "Add a quantity to see your price";
    const lines = [
      [`${p.g.label} × ${p.count}`, money(p.g.base * p.count)],
      [p.sides ? `${C.methods[state.method].label}, ${p.sides} side${p.sides > 1 ? "s" : ""}` : "No decoration added yet", money(p.decoEach * p.count)]
    ];
    if (p.plus) lines.push([`2XL+ × ${p.plus}`, money(C.plusSizeUpcharge * p.plus)]);
    if (p.discount) lines.push([`${Math.round(p.off * 100)}% quantity discount`, "−" + money(p.discount)]);
    if (p.setup) lines.push(["Digitizing (one time)", money(p.setup)]);
    const next = C.quantityDiscounts.find((d) => d.min > p.count);
    $("#estLines").innerHTML = lines.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${b}</dd>`).join("") +
      (next && p.count ? `<dt style="grid-column:1/-1;color:#FCDC04;margin-top:6px">Order ${next.min - p.count} more to save ${Math.round(next.off * 100)}%</dt>` : "");
    $("#getPriceText").textContent = p.sides && p.count ? `Get Price · ${money(p.total)}` : "Get Price";
  }

  /* ---------------- Mockups, save & share ---------------- */
  function mockup(side, type = "image/jpeg", q = 0.85) {
    const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height;
    renderScene(c, side, { exportMode: true });
    return c.toDataURL(type, q);
  }
  function download(side = state.side) {
    const a = document.createElement("a");
    a.href = mockup(side, "image/png"); a.download = `addis-loom-${state.garment}-${side}.png`; a.click();
  }
  const describeSide = (s) => state.layers[s].map((l) => l.type === "text"
    ? `text "${l.text}" (${familyOf(l.font)}, ${l.color}${l.arc ? ", curved" : ""}${l.outline ? ", outlined" : ""})`
    : l.art ? `clip art "${l.name}"${l.art.color ? " (" + l.art.color + ")" : ""}` : `image "${l.name}"`).join("; ");
  const rosterText = () => state.roster.trim() ? "Names & numbers roster: " + state.roster.trim().split(/\n/).map((x) => x.trim()).filter(Boolean).join(" | ") : "";

  async function newDesign(ask = true) {
    if (ask && (state.layers.front.length || state.layers.back.length) && !confirm("Start a new design? Your current design will be cleared from this device.")) return;
    state.layers = { front: [], back: [] }; state.selected = null; state.roster = ""; state.name = "Untitled design";
    $("#designName").value = state.name;
    await draftOp("readwrite", (s) => s.delete("current")).catch(() => {});
    hist.past = []; hist.future = []; hist.last = snapshot(); updateHistoryBtns();
    setSide("front"); openPanel("home"); price();
  }

  const saveBtn = $("#saveBtn"), saveMenu = $("#saveMenu");
  saveBtn.addEventListener("click", () => { const open = saveMenu.hidden; saveMenu.hidden = !open; saveBtn.setAttribute("aria-expanded", open); if (open) $("button", saveMenu).focus(); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu-wrap")) { saveMenu.hidden = true; saveBtn.setAttribute("aria-expanded", "false"); } });
  saveMenu.addEventListener("click", async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return;
    saveMenu.hidden = true; saveBtn.setAttribute("aria-expanded", "false");
    if (act === "save") {
      try { await draftOp("readwrite", (s) => s.put(draftData(), "current")); toast("Saved. It'll be here when you come back on this device."); }
      catch (err) { toast("Couldn't save. Your browser may be in private mode."); }
    }
    if (act === "download") download();
    if (act === "link") {
      const url = `${location.origin}${location.pathname}?garment=${state.garment}&color=${encodeURIComponent(state.color)}&method=${state.method}`;
      try { await navigator.clipboard.writeText(url); toast("Link copied. It opens this product and color."); } catch (err) { prompt("Copy this link:", url); }
    }
    if (act === "email") {
      ["front", "back"].filter((s) => state.layers[s].length).forEach((s) => download(s));
      const body = [`Design: ${state.name}`, `Item: ${C.garments[state.garment].label} (${colorName()})`, `Decoration: ${C.methods[state.method].label}`,
        `Front: ${describeSide("front") || "none"}`, `Back: ${describeSide("back") || "none"}`, rosterText(), "", "(Please attach the mockup images that just downloaded.)"].filter((x) => x !== "").join("\n");
      location.href = `mailto:${C.business.email}?subject=${encodeURIComponent("My design — " + state.name)}&body=${encodeURIComponent(body)}`;
      toast("Mockups downloaded. Attach them to the email before you send.", 4500);
    }
    if (act === "new") newDesign(true);
  });
  $("#designName").addEventListener("input", (e) => { state.name = e.target.value.trim() || "Untitled design"; scheduleSave(); });

  /* ---------------- Price dialog ---------------- */
  const dlg = $("#priceDialog");
  $("#getPriceBtn").addEventListener("click", () => {
    const front = state.layers.front.length > 0, back = state.layers.back.length > 0;
    $("#dlgFront").src = mockup("front"); $("#dlgBack").src = mockup("back");
    $("#dlgFront").hidden = !front && back; $("#dlgBack").hidden = !back;
    $("#dlgSummary").textContent = `${C.garments[state.garment].label} · ${colorName()} · ${C.methods[state.method].label}`;
    buildQty(); price();
    $("#cartStatus").textContent = ""; $("#cartStatus").className = "form-status";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    if (!front && !back) { $("#cartStatus").className = "form-status err"; $("#cartStatus").textContent = "Your design is empty. Add text, art or an image first."; }
  });
  dlg.addEventListener("click", (e) => { if (e.target.closest("[data-close]") || e.target === dlg) dlg.close(); });

  $("#orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, status = form.querySelector(".form-status");
    if (!form.reportValidity()) return;
    const p = calc();
    if (!p.count) { status.className = "form-status err"; status.textContent = "Add at least one piece above, then send again."; return; }
    if (!p.sides) { status.className = "form-status err"; status.textContent = "Add text, art or an image to the front or back, then send again."; return; }
    const sizes = Object.entries(state.qty).filter(([, n]) => n > 0).map(([s, n]) => (s === "ONE" ? n : `${s} × ${n}`)).join(", ");
    const data = Object.fromEntries(new FormData(form).entries());
    Object.assign(data, {
      _subject: `Quote request — ${p.g.label} (${p.count})`,
      design_name: state.name,
      garment: p.g.label, color: colorName(), method: C.methods[state.method].label,
      front: describeSide("front") || "none", back: describeSide("back") || "none", sizes
    });
    if (state.roster.trim()) data.roster = state.roster.trim();
    if (C.showPrices) data.estimate = money(p.total);
    const btn = form.querySelector("[type=submit]"); btn.disabled = true;
    await sendRequest(data, status, {
      okText: "Quote request sent. We'll email your price and a mockup within one business day.",
      mailText: "Your email app should open with the design details. Use Save | Share → Download mockup and attach the image before you press send."
    });
    btn.disabled = false;
  });

  /* ---------------- Cart ---------------- */
  let editId = null;
  async function loadFromCart(id) {
    const it = window.AddisCart && AddisCart.get(id);
    if (!it) return false;
    const art = (await AddisCart.art(id).catch(() => null)) || {};
    if (C.garments[it.garment]) state.garment = it.garment;
    if (C.colors.some((c) => c.hex === it.color)) state.color = it.color;
    if (C.methods[it.method]) state.method = it.method;
    state.qty = { ...(it.qty || {}) };
    if (it.designName) state.name = it.designName;
    if (it.roster) state.roster = it.roster;
    if (art.design) await loadDesign(art.design);
    editId = id;
    return { hasDesign: !!art.design };
  }

  $("#quoteBox").open = !(C.cartOn && window.AddisCart);
  if (C.cartOn && window.AddisCart) {
    $("#cartPanel").hidden = false;
    $("#labCart").hidden = false;
    AddisCart.updateBadge();
    $("#quoteHeading").textContent = "Prefer a free quote first?";
    $("#estNote").textContent = "Shipping and sales tax are added at checkout.";
    $("#addToCart").addEventListener("click", async () => {
      const status = $("#cartStatus"), btn = $("#addToCart");
      const p = calc();
      if (!p.count) { status.className = "form-status err"; status.textContent = "Add at least one piece above first."; return; }
      if (!p.sides) { status.className = "form-status err"; status.textContent = "Add text, art or an image to the front or back first."; return; }
      btn.disabled = true;
      try {
        const qty = {};
        for (const [s, n] of Object.entries(C.garments[state.garment].oneSize ? { ONE: state.qty.ONE || 0 } : state.qty)) if (n > 0) qty[s] = n;
        const front = state.layers.front.length > 0, back = state.layers.back.length > 0;
        const uploads = [];
        ["front", "back"].forEach((s) => state.layers[s].forEach((l) => {
          if (l.type !== "image" || l.art) return;
          const src = l.orig || l.img.src;
          if (!uploads.find((u) => u.dataUrl === src)) uploads.push({ name: l.name, dataUrl: src });
        }));
        const art = { mockups: {}, uploads, design: serializeDesign() };
        if (front) art.mockups.front = mockup("front");
        if (back) art.mockups.back = mockup("back");
        const roster = rosterText();
        const item = {
          garment: state.garment, color: state.color, colorName: colorName(),
          method: state.method, front, back, qty,
          frontDesc: describeSide("front"),
          backDesc: [describeSide("back"), roster].filter(Boolean).join(" — "),
          designName: state.name, roster: state.roster
        };
        if (editId) {
          await AddisCart.update(editId, item, art);
          status.className = "form-status ok";
          status.innerHTML = `Your cart is updated. <a href="cart.html">Back to cart</a>`;
        } else {
          await AddisCart.add(item, art);
          status.className = "form-status ok";
          status.innerHTML = `Added to your cart. <a href="cart.html">View cart and check out</a>, or keep designing.`;
        }
      } catch (err) {
        status.className = "form-status err";
        status.textContent = "Couldn't add this to your cart. Your browser may be in private mode or out of storage space.";
      }
      btn.disabled = false;
    });
  }

  /* ---------------- Init ---------------- */
  async function init() {
    const b = C.business;
    if (b.phone) { $("#helpPhone").href = "tel:+1" + b.phone.replace(/\D/g, "").replace(/^1/, ""); $("#helpPhoneText").textContent = b.phone; } else $("#helpPhone").hidden = true;
    $("#helpEmail").href = "mailto:" + b.email;

    let edit = null, welcome = false;
    const fresh = params.get("garment") || params.get("text") || params.get("color") || params.get("method");
    if (params.get("edit") && C.cartOn && window.AddisCart) edit = await loadFromCart(params.get("edit"));
    else if (!fresh) {
      const d = await draftOp("readonly", (s) => s.get("current")).catch(() => null);
      if (d && d.design && ((d.design.front || []).length || (d.design.back || []).length)) {
        if (C.garments[d.garment]) state.garment = d.garment;
        if (C.colors.some((c) => c.hex === d.color)) state.color = d.color;
        if (C.methods[d.method]) state.method = d.method;
        state.qty = d.qty || {}; state.name = d.name || state.name; state.roster = d.roster || "";
        await loadDesign(d.design); welcome = true;
      }
    }
    $("#designName").value = state.name;
    if (document.fonts) await Promise.race([
      Promise.all(FONTS.map(([, f]) => document.fonts.load(f.replace("{s}", 40), "Aa ሰላም").catch(() => {}))),
      new Promise((r) => setTimeout(r, 2500))
    ]);
    hist.last = snapshot(); updateHistoryBtns();
    buildQty(); updateChip();
    if (edit) {
      $("#addToCart").textContent = "Update cart item";
      openPanel("home");
      toast(edit.hasDesign ? "Editing a design from your cart. Click Get Price → Update cart item when you're done." : "Editing a cart item. Add your text or images again, then update the cart item.", 5000);
    } else if (welcome) openPanel("welcome");
    else if (params.get("text")) addText(params.get("text"));
    else openPanel("home");
    if (window.matchMedia("(max-width: 900px)").matches && !welcome && !params.get("text")) closePanel();
    if (document.fonts) document.fonts.addEventListener("loadingdone", () => render());
    renderNow(); price();
  }
  init();
})();
