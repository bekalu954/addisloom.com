/* Addis Loom — Apparel page: categories → styles, drawn as simple garment
   pictures with "YOUR DESIGN HERE". Data lives in site.js (CATALOG).
   URLs: apparel.html, apparel.html#t-shirts, apparel.html#t-shirts/long-sleeve */
(function () {
  const { config: C, catalog: CAT, money, esc, drawGarment, isDark } = window.Addis;
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------------- Drawing (500 × 560 grid, same as the studio) ---------------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + amt));
    return "#" + ((1 << 24) + (c(n >> 16) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
  }
  const P = {
    tee: (p) => { p.moveTo(178, 42); p.quadraticCurveTo(250, 100, 322, 42); p.lineTo(420, 78); p.lineTo(494, 182); p.lineTo(424, 222); p.lineTo(398, 190); p.lineTo(400, 532); p.lineTo(100, 532); p.lineTo(102, 190); p.lineTo(76, 222); p.lineTo(6, 182); p.lineTo(80, 78); p.closePath(); },
    long: (p) => { p.moveTo(178, 42); p.quadraticCurveTo(250, 100, 322, 42); p.lineTo(420, 78); p.lineTo(486, 470); p.lineTo(432, 482); p.lineTo(398, 230); p.lineTo(400, 532); p.lineTo(100, 532); p.lineTo(102, 230); p.lineTo(68, 482); p.lineTo(14, 470); p.lineTo(80, 78); p.closePath(); },
    tank: (p) => { p.moveTo(160, 42); p.quadraticCurveTo(250, 125, 340, 42); p.lineTo(362, 44); p.bezierCurveTo(366, 130, 385, 175, 402, 195); p.lineTo(402, 532); p.lineTo(98, 532); p.lineTo(98, 195); p.bezierCurveTo(115, 175, 134, 130, 138, 44); p.closePath(); },
    vest: (p) => { p.moveTo(180, 42); p.lineTo(214, 28); p.quadraticCurveTo(250, 58, 286, 28); p.lineTo(320, 42); p.bezierCurveTo(330, 120, 372, 170, 404, 192); p.lineTo(404, 532); p.lineTo(96, 532); p.lineTo(96, 192); p.bezierCurveTo(128, 170, 170, 120, 180, 42); p.closePath(); },
    shorts: (p) => { p.moveTo(105, 70); p.lineTo(395, 70); p.lineTo(438, 480); p.lineTo(272, 500); p.lineTo(250, 250); p.lineTo(228, 500); p.lineTo(62, 480); p.closePath(); },
    apron: (p) => { p.moveTo(185, 70); p.lineTo(315, 70); p.lineTo(315, 175); p.bezierCurveTo(345, 182, 400, 194, 420, 218); p.lineTo(420, 530); p.lineTo(80, 530); p.lineTo(80, 218); p.bezierCurveTo(100, 194, 155, 182, 185, 175); p.closePath(); },
    cap: (p) => { p.moveTo(70, 340); p.bezierCurveTo(70, 130, 430, 130, 430, 340); p.lineTo(470, 352); p.bezierCurveTo(500, 420, 380, 440, 250, 420); p.bezierCurveTo(140, 412, 60, 400, 70, 340); p.closePath(); },
    beanieTop: (p) => { p.moveTo(108, 360); p.bezierCurveTo(108, 120, 392, 120, 392, 360); p.closePath(); },
    bucketBrim: (p) => { p.moveTo(56, 350); p.bezierCurveTo(120, 300, 380, 300, 444, 350); p.bezierCurveTo(390, 402, 110, 402, 56, 350); p.closePath(); },
    bucketCrown: (p) => { p.moveTo(150, 330); p.lineTo(172, 185); p.bezierCurveTo(205, 148, 295, 148, 328, 185); p.lineTo(350, 330); p.closePath(); }
  };
  function fillShape(ctx, pathFn, color) {
    const dark = isDark(color);
    ctx.beginPath(); pathFn(ctx);
    const g = ctx.createLinearGradient(0, 0, 500, 0);
    g.addColorStop(0, shade(color, dark ? 10 : -14)); g.addColorStop(0.5, color); g.addColorStop(1, shade(color, dark ? 10 : -14));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = dark ? shade(color, 45) : shade(color, -60); ctx.stroke();
  }
  function line(ctx, color, w, pts, dash) {
    ctx.save(); ctx.beginPath(); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = "round"; if (dash) ctx.setLineDash(dash);
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
  }
  function details(ctx, color) {
    const dark = isDark(color);
    return { edge: dark ? shade(color, 45) : shade(color, -60), trim: shade(color, dark ? 20 : -25), fillDk: shade(color, dark ? 18 : -12) };
  }
  const neck = (ctx, d) => { ctx.save(); ctx.beginPath(); ctx.moveTo(178, 42); ctx.quadraticCurveTo(250, 112, 322, 42); ctx.lineWidth = 7; ctx.strokeStyle = d.trim; ctx.stroke(); ctx.restore(); };
  const hem = (ctx, d) => line(ctx, d.edge, 2, [[104, 516], [396, 516]], [6, 5]);
  const zipper = (ctx, d, from = 50, to = 528) => { line(ctx, d.edge, 4, [[250, from], [250, to]]); ctx.fillStyle = d.edge; ctx.fillRect(244, from + 16, 12, 22); };
  const standCollar = (ctx, d) => { ctx.save(); ctx.beginPath(); ctx.moveTo(176, 44); ctx.lineTo(182, 14); ctx.quadraticCurveTo(250, 34, 318, 14); ctx.lineTo(324, 44); ctx.quadraticCurveTo(250, 70, 176, 44); ctx.fillStyle = d.fillDk; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = d.edge; ctx.stroke(); ctx.restore(); };
  const pocket = (ctx, d, x, y, w, h) => { ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = d.edge; ctx.strokeRect(x, y, w, h); line(ctx, d.edge, 1.5, [[x + 4, y + 8], [x + w - 4, y + 8]], [4, 3]); ctx.restore(); };
  const shirtCollar = (ctx, d) => {
    ctx.save(); ctx.fillStyle = d.fillDk; ctx.strokeStyle = d.edge; ctx.lineWidth = 2.5;
    [[[178, 40], [250, 82], [210, 104], [168, 58]], [[322, 40], [250, 82], [290, 104], [332, 58]]].forEach((pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  };
  const buttons = (ctx, d, from, to, step) => { line(ctx, d.edge, 2, [[244, from], [244, to]]); ctx.fillStyle = d.edge; for (let y = from + 18; y < to; y += step) { ctx.beginPath(); ctx.arc(250, y, 3.5, 0, 7); ctx.fill(); } };
  const vneck = (ctx, d) => { ctx.save(); ctx.beginPath(); ctx.moveTo(196, 44); ctx.lineTo(250, 118); ctx.lineTo(304, 44); ctx.lineWidth = 8; ctx.strokeStyle = d.trim; ctx.lineJoin = "round"; ctx.stroke(); ctx.restore(); };
  const hood = (ctx, color) => { const d = details(ctx, color); ctx.save(); ctx.beginPath(); ctx.moveTo(160, 70); ctx.bezierCurveTo(150, -10, 350, -10, 340, 70); ctx.closePath(); ctx.fillStyle = shade(color, isDark(color) ? 15 : -18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = d.edge; ctx.stroke(); ctx.restore(); };

  const SHAPES = {
    tee: (ctx, c) => drawGarment(ctx, "tee", c, "front"),
    longtee: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); neck(ctx, d); hem(ctx, d); },
    pockettee: (ctx, c) => { drawGarment(ctx, "tee", c, "front"); pocket(ctx, details(ctx, c), 282, 190, 64, 72); },
    talltee: (ctx, c) => { ctx.save(); ctx.translate(30, 0); ctx.scale(0.88, 1); drawGarment(ctx, "tee", c, "front"); ctx.restore(); },
    hoodie: (ctx, c) => drawGarment(ctx, "hoodie", c, "front"),
    ziphoodie: (ctx, c) => { hood(ctx, c); const d = details(ctx, c); fillShape(ctx, P.long, c); zipper(ctx, d, 54); ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = d.edge; ctx.beginPath(); ctx.moveTo(150, 400); ctx.lineTo(236, 400); ctx.lineTo(236, 500); ctx.lineTo(125, 500); ctx.closePath(); ctx.moveTo(350, 400); ctx.lineTo(264, 400); ctx.lineTo(264, 500); ctx.lineTo(375, 500); ctx.closePath(); ctx.stroke(); ctx.restore(); },
    crew: (ctx, c) => drawGarment(ctx, "crew", c, "front"),
    sweater: (ctx, c) => { drawGarment(ctx, "crew", c, "front"); const d = details(ctx, c); for (let y = 500; y < 530; y += 7) line(ctx, d.edge, 1.5, [[104, y], [396, y]]); },
    quarterzip: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); standCollar(ctx, d); zipper(ctx, d, 20, 170); hem(ctx, d); },
    jacket: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); standCollar(ctx, d); zipper(ctx, d, 20, 528); },
    softshell: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); standCollar(ctx, d); zipper(ctx, d, 20, 528); line(ctx, d.edge, 2, [[140, 330], [200, 330]]); line(ctx, d.edge, 2, [[300, 330], [360, 330]]); },
    windbreaker: (ctx, c) => { hood(ctx, c); const d = details(ctx, c); fillShape(ctx, P.long, c); zipper(ctx, d, 54); line(ctx, d.edge, 2, [[102, 300], [398, 300]], [5, 4]); },
    workjacket: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); shirtCollar(ctx, d); zipper(ctx, d, 82, 528); pocket(ctx, d, 140, 330, 70, 80); pocket(ctx, d, 290, 330, 70, 80); },
    vest: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.vest, c); zipper(ctx, d, 40, 528); },
    safetyvest: (ctx, c) => {
      const d = details(ctx, c); fillShape(ctx, P.vest, c);
      ctx.save(); ctx.beginPath(); P.vest(ctx); ctx.clip();
      ctx.fillStyle = "#C9CED1"; [[300, 26], [400, 26]].forEach(([y, h]) => ctx.fillRect(90, y, 320, h));
      ctx.fillRect(184, 40, 26, 262); ctx.fillRect(290, 40, 26, 262); ctx.restore();
      ctx.save(); ctx.beginPath(); P.vest(ctx); ctx.lineWidth = 3; ctx.strokeStyle = d.edge; ctx.stroke(); ctx.restore();
    },
    polo: (ctx, c) => drawGarment(ctx, "polo", c, "front"),
    longpolo: (ctx, c) => {
      const d = details(ctx, c); fillShape(ctx, P.long, c);
      ctx.save(); ctx.fillStyle = d.fillDk; ctx.strokeStyle = d.edge; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(178, 42); ctx.lineTo(250, 92); ctx.lineTo(205, 108); ctx.lineTo(166, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(322, 42); ctx.lineTo(250, 92); ctx.lineTo(295, 108); ctx.lineTo(334, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeRect(240, 92, 20, 70); ctx.fillStyle = d.edge; [110, 135].forEach((y) => { ctx.beginPath(); ctx.arc(250, y, 3.5, 0, 7); ctx.fill(); }); ctx.restore();
    },
    dressshirt: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.long, c); shirtCollar(ctx, d); buttons(ctx, d, 84, 528, 54); },
    workshirt: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.tee, c); shirtCollar(ctx, d); buttons(ctx, d, 84, 528, 54); pocket(ctx, d, 150, 170, 62, 70); pocket(ctx, d, 288, 170, 62, 70); },
    perftee: (ctx, c) => { drawGarment(ctx, "tee", c, "front"); const d = details(ctx, c); line(ctx, d.edge, 2, [[196, 48], [104, 196]], [6, 4]); line(ctx, d.edge, 2, [[304, 48], [396, 196]], [6, 4]); },
    jersey: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.tee, c); vneck(ctx, d); ctx.save(); ctx.beginPath(); P.tee(ctx); ctx.clip(); ctx.fillStyle = isDark(c) ? "rgba(255,255,255,.85)" : "#1B2A1C"; ctx.fillRect(100, 200, 18, 340); ctx.fillRect(382, 200, 18, 340); ctx.restore(); },
    tank: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.tank, c); hem(ctx, d); },
    shorts: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.shorts, c); line(ctx, d.edge, 2.5, [[105, 100], [395, 100]]); line(ctx, d.edge, 2, [[230, 72], [226, 98]]); line(ctx, d.edge, 2, [[270, 72], [274, 98]]); },
    apron: (ctx, c) => {
      const d = details(ctx, c);
      line(ctx, d.trim, 10, [[192, 72], [190, 20], [250, -6], [310, 20], [308, 72]]);
      line(ctx, d.trim, 8, [[86, 230], [26, 300]]); line(ctx, d.trim, 8, [[414, 230], [474, 300]]);
      fillShape(ctx, P.apron, c); pocket(ctx, d, 160, 400, 180, 80); line(ctx, d.edge, 2, [[250, 400], [250, 480]]);
    },
    cap: (ctx, c) => drawGarment(ctx, "cap", c, "front"),
    trucker: (ctx, c) => {
      drawGarment(ctx, "cap", c, "front");
      ctx.save(); ctx.beginPath(); P.cap(ctx); ctx.clip();
      ctx.fillStyle = isDark(c) ? "#3a3a3a" : "#e9e9e9"; ctx.fillRect(330, 120, 160, 228);
      ctx.strokeStyle = isDark(c) ? "#5a5a5a" : "#c9c9c9"; ctx.lineWidth = 1.5;
      for (let x = 330; x < 500; x += 10) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x + 40, 348); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 40, 120); ctx.lineTo(x, 348); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.beginPath(); P.cap(ctx); ctx.lineWidth = 3; ctx.strokeStyle = details(ctx, c).edge; ctx.stroke(); ctx.restore();
    },
    beanie: (ctx, c) => {
      const d = details(ctx, c);
      ctx.save(); ctx.beginPath(); ctx.arc(250, 132, 38, 0, 7); ctx.fillStyle = d.fillDk; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = d.edge; ctx.stroke(); ctx.restore();
      fillShape(ctx, P.beanieTop, c);
      ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(94, 330, 312, 110, 18) : ctx.rect(94, 330, 312, 110); ctx.fillStyle = d.fillDk; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = d.edge; ctx.stroke(); ctx.restore();
      for (let x = 112; x < 400; x += 14) line(ctx, d.edge, 1.2, [[x, 336], [x, 434]]);
    },
    bucket: (ctx, c) => { const d = details(ctx, c); fillShape(ctx, P.bucketBrim, c); fillShape(ctx, P.bucketCrown, c); for (let i = 1; i < 5; i++) line(ctx, d.edge, 1.4, [[56 + i * 8, 350 + i * 0.5], [444 - i * 8, 350 + i * 0.5]], [3, 4]); }
  };

  // Where "YOUR DESIGN HERE" goes for each shape: [x, y, w, h]
  const SPOTS = {
    tee: [168, 140, 164, 150], longtee: [168, 140, 164, 150], pockettee: [168, 140, 100, 90], talltee: [176, 140, 148, 150],
    hoodie: [175, 160, 150, 120], crew: [168, 140, 164, 150], sweater: [168, 140, 164, 150],
    perftee: [168, 140, 164, 150], jersey: [170, 150, 160, 160], tank: [170, 160, 160, 150],
    shorts: [104, 300, 112, 70], apron: [150, 230, 200, 130], cap: [178, 220, 144, 76], trucker: [170, 218, 150, 80],
    beanie: [140, 352, 220, 66], bucket: [184, 220, 132, 70], safetyvest: [150, 180, 200, 100]
  };
  const CHEST = [286, 128, 74, 56];

  function designText(ctx, box, garmentColor) {
    const [x, y, w, h] = box;
    const ink = isDark(garmentColor) ? "#FCDC04" : (/^#(F4CF2A|D9F20B)$/i.test(garmentColor) ? "#1B2A1C" : "#2C5F2D");
    const lines = w / h > 2.2 ? ["YOUR DESIGN", "HERE"] : ["YOUR", "DESIGN", "HERE"];
    ctx.save(); ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    let size = 60;
    const font = (s) => `800 ${s}px "Bricolage Grotesque", "Segoe UI", sans-serif`;
    for (; size > 6; size--) {
      ctx.font = font(size);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest <= w && size * 1.05 * lines.length <= h) break;
    }
    ctx.font = font(size);
    const lh = size * 1.05, top = y + h / 2 - (lh * (lines.length - 1)) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x + w / 2, top + i * lh));
    ctx.restore();
  }

  function paint(canvas, item) {
    const ctx = canvas.getContext("2d"), s = canvas.width / 500;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    (SHAPES[item.shape] || SHAPES.tee)(ctx, item.color);
    const box = item.place === "chest" ? CHEST : SPOTS[item.shape] || SPOTS.tee;
    designText(ctx, box, item.color);
  }
  function paintAll(root = document) {
    const run = () => root.querySelectorAll("canvas[data-cat]").forEach((c) => {
      const cat = CAT.find((x) => x.slug === c.dataset.cat);
      const item = cat && (cat.items.find((i) => i.slug === c.dataset.item) || cat.items[0]);
      if (item) paint(c, item);
    });
    run();
    if (document.fonts) document.fonts.ready.then(run);
  }

  /* ---------------- Page ---------------- */
  function priceFrom(item) {
    if (!C.showPrices || !item.garment || !C.garments[item.garment]) return "";
    const g = C.garments[item.garment];
    const deco = g.printOk === false ? C.methods.embroidery.perLocation : C.methods.print.perSide;
    return `From ${money(g.base + deco)} each, decorated`;
  }
  const quoteLink = (item, cat) => `contact.html?item=${encodeURIComponent(item.name + " (" + cat.name + ")")}`;

  function sidebar(catSlug, itemSlug) {
    $("#apparelSide").innerHTML = `<h2 class="sr-only">Shop by category</h2>` + CAT.map((c) => `
      <details${c.slug === catSlug ? " open" : ""}>
        <summary>${esc(c.name)}</summary>
        <ul>
          <li><a href="#${c.slug}"${c.slug === catSlug && !itemSlug ? ' aria-current="true"' : ""}>Shop All</a></li>
          ${c.items.map((i) => `<li><a href="#${c.slug}/${i.slug}"${c.slug === catSlug && i.slug === itemSlug ? ' aria-current="true"' : ""}>${esc(i.name)}</a></li>`).join("")}
        </ul>
      </details>`).join("");
  }

  function route() {
    const [catSlug, itemSlug] = decodeURIComponent(location.hash.slice(1)).split("/");
    const cat = CAT.find((c) => c.slug === catSlug);
    const grid = $("#apparelGrid"), chips = $("#subChips");
    sidebar(cat ? cat.slug : "", cat ? itemSlug : "");

    if (!cat) {
      document.title = "Custom Apparel | T-shirts, Hoodies, Hats, Polos & Uniforms | Addis Loom";
      $("#crumbs").innerHTML = `<a href="/">Home</a> › Apparel`;
      $("#apparelTitle").textContent = "Apparel";
      $("#apparelLede").textContent = "Pick a category to see every style we decorate. Every order starts with a free proof you approve.";
      chips.hidden = true;
      grid.className = "apparel-grid";
      grid.innerHTML = CAT.map((c) => `
        <a class="apparel-card" href="#${c.slug}">
          <div class="work-media"><canvas width="500" height="560" data-cat="${c.slug}" role="img" aria-label="${esc(c.name)} with your design"></canvas></div>
          <strong>${esc(c.name)}</strong>
          <span class="sub">${c.items.length} styles</span>
        </a>`).join("");
      paintAll(grid);
      return;
    }

    const item = cat.items.find((i) => i.slug === itemSlug);
    document.title = `${item ? item.name + " · " : ""}${cat.name} | Custom Apparel | Addis Loom`;
    $("#crumbs").innerHTML = `<a href="/">Home</a> › <a href="#">Apparel</a> › ${item ? `<a href="#${cat.slug}">${esc(cat.name)}</a> › ${esc(item.name)}` : esc(cat.name)}`;
    $("#apparelTitle").textContent = item ? item.name : cat.name;
    $("#apparelLede").textContent = item ? item.desc : cat.blurb;
    chips.hidden = false;
    chips.innerHTML = `<a class="chip" href="#${cat.slug}"${item ? "" : ' aria-current="true"'}>Shop All</a>` +
      cat.items.map((i) => `<a class="chip" href="#${cat.slug}/${i.slug}"${item === i ? ' aria-current="true"' : ""}>${esc(i.name)}</a>`).join("");

    // Selected style first, then the rest of the category.
    const list = item ? [item, ...cat.items.filter((i) => i !== item)] : cat.items;
    grid.className = "apparel-grid styles";
    grid.innerHTML = list.map((i) => {
      const studio = i.garment && C.garments[i.garment];
      return `
      <article class="style-card${i === item ? " hit" : ""}" id="style-${i.slug}">
        <div class="work-media"><canvas width="500" height="560" data-cat="${cat.slug}" data-item="${i.slug}" role="img" aria-label="${esc(i.name)} with your design"></canvas></div>
        <h3>${esc(i.name)}</h3>
        <span class="tag">${studio ? "Design online" : "Custom quote"}</span>
        <p>${esc(i.desc)}</p>
        ${priceFrom(i) ? `<div class="price">${priceFrom(i)}</div>` : ""}
        <div class="actions">
          ${studio ? `<a class="btn small" href="design.html?garment=${i.garment}&color=${encodeURIComponent(i.color)}">Design yours</a><a class="btn small ghost" href="${quoteLink(i, cat)}">Get a quote</a>`
                   : `<a class="btn small" href="${quoteLink(i, cat)}">Request a quote</a>`}
        </div>
      </article>`;
    }).join("");
    paintAll(grid);
    if (item && window.scrollY > 300) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.addEventListener("hashchange", route);
  route();
})();
