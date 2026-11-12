/* Addis Loom — design studio */
(function () {
  const { config: C, money, esc, drawGarment, AREAS, isDark, sendRequest } = window.Addis;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);

  const state = {
    garment: params.get("garment") && C.garments[params.get("garment")] ? params.get("garment") : "tee",
    color: C.colors.find((c) => c.hex.toLowerCase() === (params.get("color") || "").toLowerCase())?.hex || C.colors[0].hex,
    method: params.get("method") === "embroidery" ? "embroidery" : "print",
    side: "front",
    layers: { front: [], back: [] },
    selected: null,
    qty: {}
  };
  let uid = 0;

  const cv = $("#studioCanvas"), ctx = cv.getContext("2d");
  const S = cv.width / 500; // canvas pixel scale

  /* ---------------- Rendering ---------------- */
  function fontFor(layer) { return layer.font.replace("{s}", Math.round(layer.size * layer.scale)); }

  function layerBox(l) {
    if (l.type === "text") {
      ctx.save(); ctx.font = fontFor(l); const w = ctx.measureText(l.text).width; ctx.restore();
      const h = l.size * l.scale * 1.15;
      return { x: l.x - w / 2, y: l.y - h / 2, w, h };
    }
    const w = l.w * l.scale, h = l.h * l.scale;
    return { x: l.x - w / 2, y: l.y - h / 2, w, h };
  }

  function render(forExport = false, side = state.side) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (forExport) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    drawGarment(ctx, state.garment, state.color, side);

    const [ax, ay, aw, ah] = AREAS[state.garment][side];
    ctx.save();
    ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
    for (const l of state.layers[side]) {
      ctx.save();
      if (state.method === "embroidery") { ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowOffsetY = 1.2; ctx.shadowBlur = 1.5; }
      if (l.type === "text") {
        ctx.font = fontFor(l); ctx.fillStyle = l.color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(l.text, l.x, l.y);
        if (state.method === "embroidery") {
          ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = .6; ctx.setLineDash([1.5, 1.5]);
          ctx.strokeText(l.text, l.x, l.y);
        }
      } else {
        const b = layerBox(l); ctx.drawImage(l.img, b.x, b.y, b.w, b.h);
      }
      ctx.restore();
    }
    ctx.restore();

    if (!forExport) {
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
      ctx.strokeStyle = isDark(state.color) ? "rgba(255,255,255,.55)" : "rgba(27,42,28,.45)";
      ctx.strokeRect(ax, ay, aw, ah);
      const sel = state.layers[side].find((l) => l.id === state.selected);
      if (sel) {
        const b = layerBox(sel); ctx.setLineDash([]); ctx.strokeStyle = "#B3302A"; ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
      }
      ctx.restore();
    }
  }

  /* ---------------- Controls: garment, color, method ---------------- */
  function buildGarments() {
    $("#garmentPick").innerHTML = Object.entries(C.garments).map(([k, g]) =>
      `<label><input type="radio" name="garment" value="${k}"${k === state.garment ? " checked" : ""}> ${esc(g.label)}</label>`).join("");
    $("#garmentPick").addEventListener("change", (e) => {
      state.garment = e.target.value;
      if (C.garments[state.garment].printOk === false) state.method = "embroidery";
      buildMethods(); buildQty(); clampAll(); render(); price();
    });
  }
  function buildColors() {
    const box = $("#colorPick"); box.innerHTML = "";
    C.colors.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "swatch"; b.style.background = c.hex;
      b.setAttribute("aria-label", c.name); b.setAttribute("aria-pressed", c.hex === state.color);
      b.onclick = () => {
        state.color = c.hex;
        box.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", s === b));
        $("#colorName").textContent = "Color: " + c.name; autoInk(); render();
      };
      box.appendChild(b);
    });
    $("#colorName").textContent = "Color: " + (C.colors.find((c) => c.hex === state.color) || {}).name;
  }
  function buildMethods() {
    const g = C.garments[state.garment];
    const opts = Object.entries(C.methods).filter(([k]) => (k === "print" ? g.printOk !== false : g.embroideryOk));
    if (!opts.find(([k]) => k === state.method)) state.method = opts[0][0];
    $("#methodPick").innerHTML = opts.map(([k, m]) =>
      `<label><input type="radio" name="method" value="${k}"${k === state.method ? " checked" : ""}> ${esc(m.label)}</label>`).join("");
    $("#methodNote").textContent = state.method === "embroidery"
      ? (C.showPrices
          ? `Best for logos and names. Up to about 8,000 stitches per spot is included; a one-time ${money(C.methods.embroidery.setup)} digitizing fee turns your design into stitches. Fine detail and gradients are simplified.`
          : "Best for logos and names. We convert your design into stitches; very fine detail and gradients are simplified.")
      : "Best for photos, gradients and many colors. Soft to the touch and machine washable.";
  }
  $("#methodPick").addEventListener("change", (e) => { state.method = e.target.value; buildMethods(); render(); price(); });

  /* ---------------- Layers ---------------- */
  function addText(text) {
    text = (text || "").trim(); if (!text) { $("#textInput").focus(); return; }
    const [ax, ay, aw, ah] = AREAS[state.garment][state.side];
    const l = { id: ++uid, type: "text", text, font: $("#fontPick").value, color: $("#textColor").value, size: 44, scale: 1, x: ax + aw / 2, y: ay + Math.min(70, ah / 2) + state.layers[state.side].length * 50 };
    // fit width
    ctx.save(); ctx.font = fontFor(l); const w = ctx.measureText(text).width; ctx.restore();
    if (w > aw * 0.95) l.scale = (aw * 0.95) / w;
    state.layers[state.side].push(l); state.selected = l.id;
    clamp(l); $("#textInput").value = ""; refreshLayers(); render(); price();
  }
  function addImage(file) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 15 * 1024 * 1024) { alert("That file is over 15 MB. Try a smaller version — you can send the full file with your request."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const [ax, ay, aw, ah] = AREAS[state.garment][state.side];
        const w = img.naturalWidth || 300, h = img.naturalHeight || 300;
        const fit = Math.min((aw * 0.8) / w, (ah * 0.6) / h);
        const l = { id: ++uid, type: "image", name: file.name, img, w: w * fit, h: h * fit, scale: 1, x: ax + aw / 2, y: ay + ah / 2 };
        state.layers[state.side].push(l); state.selected = l.id; refreshLayers(); render(); price();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function clamp(l) {
    const [ax, ay, aw, ah] = AREAS[state.garment][state.side];
    l.x = Math.max(ax, Math.min(ax + aw, l.x)); l.y = Math.max(ay, Math.min(ay + ah, l.y));
  }
  function clampAll() {
    ["front", "back"].forEach((s) => state.layers[s].forEach((l) => {
      const [ax, ay, aw, ah] = AREAS[state.garment][s];
      l.x = Math.max(ax, Math.min(ax + aw, l.x)); l.y = Math.max(ay, Math.min(ay + ah, l.y));
    }));
  }
  function refreshLayers() {
    const list = state.layers[state.side];
    $("#emptyLayers").hidden = list.length > 0;
    $("#layerList").innerHTML = list.map((l) => `
      <li class="${l.id === state.selected ? "active" : ""}">
        <button class="pick" type="button" data-id="${l.id}">${l.type === "text" ? "Text: " + esc(l.text) : "Image: " + esc(l.name)}</button>
        <button class="icon-btn" type="button" data-del="${l.id}" aria-label="Remove ${l.type}">Remove</button>
      </li>`).join("");
    const sel = list.find((l) => l.id === state.selected);
    $("#sizeCtl").hidden = !sel;
    if (sel) $("#scaleRange").value = sel.scale;
  }
  $("#layerList").addEventListener("click", (e) => {
    const id = +(e.target.dataset.id || e.target.dataset.del);
    if (!id) return;
    if (e.target.dataset.del) {
      state.layers[state.side] = state.layers[state.side].filter((l) => l.id !== id);
      if (state.selected === id) state.selected = null;
      price();
    } else state.selected = id;
    refreshLayers(); render();
  });
  $("#scaleRange").addEventListener("input", (e) => {
    const l = state.layers[state.side].find((x) => x.id === state.selected);
    if (l) { l.scale = +e.target.value; render(); }
  });
  $("#addText").addEventListener("click", () => addText($("#textInput").value));
  $("#textInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addText(e.target.value); } });
  $("#textColor").addEventListener("input", (e) => {
    const l = state.layers[state.side].find((x) => x.id === state.selected && x.type === "text");
    if (l) { l.color = e.target.value; l.inkSet = true; render(); }
  });
  $("#fontPick").addEventListener("change", (e) => {
    const l = state.layers[state.side].find((x) => x.id === state.selected && x.type === "text");
    if (l) { l.font = e.target.value; render(); }
  });
  $("#fileInput").addEventListener("change", (e) => { addImage(e.target.files[0]); e.target.value = ""; });
  const dz = $("#dropzone");
  ["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", (e) => addImage(e.dataTransfer.files[0]));

  document.querySelectorAll(".side-toggle button").forEach((b) => b.addEventListener("click", () => {
    state.side = b.dataset.side; state.selected = null;
    document.querySelectorAll(".side-toggle button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    refreshLayers(); render();
  }));
  $("#centerBtn").addEventListener("click", () => {
    const l = state.layers[state.side].find((x) => x.id === state.selected); if (!l) return;
    const [ax, , aw] = AREAS[state.garment][state.side]; l.x = ax + aw / 2; render();
  });

  /* Dragging on the canvas */
  let drag = null;
  function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (500 / r.width), y: (e.clientY - r.top) * (560 / r.height) }; }
  cv.addEventListener("pointerdown", (e) => {
    const p = pt(e); const list = state.layers[state.side];
    for (let i = list.length - 1; i >= 0; i--) {
      const b = layerBox(list[i]);
      if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 6) {
        drag = { l: list[i], dx: p.x - list[i].x, dy: p.y - list[i].y };
        state.selected = list[i].id; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
        refreshLayers(); render(); return;
      }
    }
    state.selected = null; refreshLayers(); render();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drag) return; const p = pt(e);
    drag.l.x = p.x - drag.dx; drag.l.y = p.y - drag.dy; clamp(drag.l); render();
  });
  cv.addEventListener("pointerup", () => { drag = null; cv.style.cursor = "grab"; });
  // Arrow keys nudge the selected item
  cv.tabIndex = 0;
  cv.addEventListener("keydown", (e) => {
    const l = state.layers[state.side].find((x) => x.id === state.selected); if (!l) return;
    const d = e.shiftKey ? 10 : 2;
    const m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (m) { e.preventDefault(); l.x += m[0]; l.y += m[1]; clamp(l); render(); }
    if (e.key === "Delete" || e.key === "Backspace") { state.layers[state.side] = state.layers[state.side].filter((x) => x !== l); state.selected = null; refreshLayers(); render(); price(); }
  });

  /* ---------------- Quantity + price ---------------- */
  function buildQty() {
    const g = C.garments[state.garment];
    if (g.oneSize) {
      $("#qtyBox").innerHTML = `<div class="field" style="max-width:160px"><label for="qtyOne">How many?</label><input id="qtyOne" type="number" min="0" max="5000" value="${state.qty.ONE || 1}" data-size="ONE"></div>`;
      $("#plusNote").textContent = "";
    } else {
      $("#qtyBox").innerHTML = `<div class="size-grid">${C.sizes.map((s) =>
        `<div><label for="q${s}">${s}</label><input id="q${s}" type="number" min="0" max="5000" value="${state.qty[s] || 0}" data-size="${s}"></div>`).join("")}</div>`;
      if (!Object.values(state.qty).some((v) => v > 0)) { state.qty = { M: 1 }; $("#qM").value = 1; }
      $("#plusNote").textContent = C.showPrices ? `2XL and larger add ${money(C.plusSizeUpcharge)} each.` : "";
    }
    $("#qtyBox").querySelectorAll("input").forEach((i) => i.addEventListener("input", () => {
      state.qty[i.dataset.size] = Math.max(0, parseInt(i.value, 10) || 0); price();
    }));
    if (g.oneSize) state.qty = { ONE: +$("#qtyOne").value };
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
      $("#estLabel").textContent = "Your order";
      $("#estTotal").textContent = p.count ? `${p.count} piece${p.count > 1 ? "s" : ""}` : "No pieces yet";
      $("#estEach").textContent = p.count ? "Free quote within one business day" : "Add a quantity above";
      const colorName = (C.colors.find((c) => c.hex === state.color) || {}).name || "";
      const lines = [["Item", p.g.label], ["Color", colorName], ["Decoration", C.methods[state.method].label],
        ["Decorated sides", p.sides ? String(p.sides) : "None yet"]];
      $("#estLines").innerHTML = lines.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("");
      $("#estNote").textContent = "Larger orders cost less per piece. We'll email your price and a mockup before anything is made.";
      return;
    }
    $("#estTotal").textContent = money(p.total);
    $("#estEach").textContent = p.count ? `${p.count} piece${p.count > 1 ? "s" : ""} · about ${money((p.total) / p.count)} each` : "Add a quantity to see your price";
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
  }

  /* ---------------- Export + request ---------------- */
  function snapshot(side) {
    render(true, side);
    const url = cv.toDataURL("image/png");
    render(false);
    return url;
  }
  $("#downloadBtn").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = snapshot(state.side); a.download = `addis-loom-${state.garment}-${state.side}.png`; a.click();
  });

  $("#orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, status = form.querySelector(".form-status");
    if (!form.reportValidity()) return;
    const p = calc();
    if (!p.count) { status.className = "form-status err"; status.textContent = "Add at least one piece under Quantity, then send again."; return; }
    if (!p.sides) { status.className = "form-status err"; status.textContent = "Add text or an image to the front or back, then send again."; return; }
    const describe = (s) => state.layers[s].map((l) => l.type === "text"
      ? `text "${l.text}" (${l.font.match(/"(.+)"/)[1]}, ${l.color})` : `image "${l.name}"`).join("; ") || "none";
    const sizes = Object.entries(state.qty).filter(([, n]) => n > 0).map(([s, n]) => (s === "ONE" ? n : `${s} × ${n}`)).join(", ");
    const data = Object.fromEntries(new FormData(form).entries());
    Object.assign(data, {
      _subject: `Quote request — ${p.g.label} (${p.count})`,
      garment: p.g.label,
      color: (C.colors.find((c) => c.hex === state.color) || {}).name,
      method: C.methods[state.method].label,
      front: describe("front"),
      back: describe("back"),
      sizes,
    });
    if (C.showPrices) data.estimate = money(p.total);
    const btn = form.querySelector("[type=submit]"); btn.disabled = true;
    const ok = await sendRequest(data, status, {
      okText: "Quote request sent. We'll email your price and a mockup within one business day.",
      mailText: "Your email app should open with the design details. Click Download mockup above and attach the image before you press send."
    });
    btn.disabled = false;
  });

  // Keep the default text color readable on the chosen garment until the customer picks their own.
  let inkTouched = false;
  $("#textColor").addEventListener("input", () => { inkTouched = true; });
  function autoInk() {
    if (inkTouched) return;
    const ink = isDark(state.color) ? "#FCDC04" : (state.color.toUpperCase() === "#F4CF2A" ? "#1B2A1C" : "#2C5F2D");
    $("#textColor").value = ink;
    // also recolor untouched text layers so they stay visible
    ["front", "back"].forEach((s) => state.layers[s].forEach((l) => { if (l.type === "text" && !l.inkSet) l.color = ink; }));
  }

  /* ---------------- Init ---------------- */
  buildGarments(); buildColors(); buildMethods(); buildQty(); autoInk(); refreshLayers();
  if (params.get("text")) { $("#textInput").value = params.get("text"); }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    if (params.get("text")) addText(params.get("text"));
    render(); price();
  });
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => render());
  render(); price();
})();
