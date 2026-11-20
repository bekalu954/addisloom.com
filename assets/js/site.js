/* Addis Loom — shared page behaviour: header, footer, forms, garment drawing */
(function () {
  const C = window.ADDIS_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------------- Apparel catalog ----------------
     Categories and styles shown in the Apparel menu and on apparel.html.
     garment: a design-studio product key from config.js (opens the studio);
     leave it out and the style gets a "Request a quote" button instead.
     shape/color/place only control the picture on apparel.html. */
  const CATALOG = [
    { slug: "t-shirts", name: "T-shirts", blurb: "Classic tees for events, teams, families and everyday wear.", items: [
      { slug: "short-sleeve", name: "Short Sleeve", shape: "tee", color: "#FFFFFF", garment: "tee", desc: "Soft cotton crew-neck tees. Our most popular pick for events, teams and reunions." },
      { slug: "long-sleeve", name: "Long Sleeve", shape: "longtee", color: "#22304A", desc: "Full-length sleeves for cooler days, with room for a sleeve print too." },
      { slug: "pocket", name: "Pocket T-Shirts", shape: "pockettee", color: "#B9BDB8", place: "chest", desc: "A chest pocket adds a classic touch. Great for small logos above the pocket." },
      { slug: "tall", name: "Tall Sizes", shape: "talltee", color: "#1E1E1E", desc: "Extra body length for taller builds, in tall sizes LT through 4XLT." }] },
    { slug: "hoodies-sweatshirts", name: "Hoodies & Sweatshirts", blurb: "Warm layers for schools, crews, reunions and cold-weather teams.", items: [
      { slug: "pullover-hoodies", name: "Pullover Hoodies", shape: "hoodie", color: "#2C5F2D", garment: "hoodie", desc: "Cozy fleece pullovers with a front pouch pocket and lined hood." },
      { slug: "zip-hoodies", name: "Zip-Up Hoodies", shape: "ziphoodie", color: "#1E1E1E", place: "chest", desc: "Full-zip hoodies. Left-chest logo on the front, big design on the back." },
      { slug: "crewneck-sweatshirts", name: "Crewneck Sweatshirts", shape: "crew", color: "#B9BDB8", garment: "crew", desc: "A clean, classic sweatshirt for classes, clubs and families." },
      { slug: "quarter-zips", name: "Quarter-Zip Pullovers", shape: "quarterzip", color: "#22304A", place: "chest", desc: "A polished pullover that works for the office, the sideline and travel." }] },
    { slug: "hats", name: "Hats", blurb: "Embroidered caps and beanies that carry your logo everywhere.", items: [
      { slug: "baseball-caps", name: "Baseball Caps", shape: "cap", color: "#22304A", garment: "cap", desc: "Structured six-panel caps with a curved bill. Embroidered front logo." },
      { slug: "trucker-hats", name: "Trucker Hats", shape: "trucker", color: "#1E1E1E", desc: "Foam or cotton front with a breathable mesh back and snap closure." },
      { slug: "dad-hats", name: "Dad Hats", shape: "cap", color: "#EFE7D6", desc: "Relaxed, unstructured cotton caps with an adjustable strap." },
      { slug: "beanies", name: "Beanies", shape: "beanie", color: "#B3302A", desc: "Knit beanies with a fold-over cuff, perfect for an embroidered logo." },
      { slug: "bucket-hats", name: "Bucket Hats", shape: "bucket", color: "#EFE7D6", desc: "Soft cotton bucket hats for summer events, festivals and outdoor crews." }] },
    { slug: "jackets-vests", name: "Jackets & Vests", blurb: "Outerwear for staff, coaches and teams, finished with embroidery.", items: [
      { slug: "fleece-jackets", name: "Fleece Jackets", shape: "jacket", color: "#22304A", place: "chest", desc: "Warm full-zip fleece with a stand-up collar." },
      { slug: "soft-shell-jackets", name: "Soft Shell Jackets", shape: "softshell", color: "#1E1E1E", place: "chest", desc: "Wind- and water-resistant shells with a smooth face that shows logos well." },
      { slug: "windbreakers", name: "Windbreakers", shape: "windbreaker", color: "#2C5F2D", place: "chest", desc: "Lightweight hooded jackets for sidelines, travel and events." },
      { slug: "vests", name: "Vests", shape: "vest", color: "#1E1E1E", place: "chest", desc: "Fleece and puffer vests. A favorite for business teams." },
      { slug: "work-jackets", name: "Work Jackets", shape: "workjacket", color: "#7A5A3A", place: "chest", desc: "Tough canvas and lined jackets built for job sites." }] },
    { slug: "polo-shirts", name: "Polo Shirts", blurb: "Sharp, embroidered polos for staff, golf outings and church events.", items: [
      { slug: "classic-polos", name: "Classic Polos", shape: "polo", color: "#FFFFFF", garment: "polo", place: "chest", desc: "Pique cotton polos with a three-button placket and knit collar." },
      { slug: "performance-polos", name: "Performance Polos", shape: "polo", color: "#22304A", place: "chest", desc: "Moisture-wicking, wrinkle-resistant polos that stay sharp all day." },
      { slug: "long-sleeve-polos", name: "Long Sleeve Polos", shape: "longpolo", color: "#2C5F2D", place: "chest", desc: "Polo styling with full sleeves for cooler seasons." },
      { slug: "womens-polos", name: "Women's Polos", shape: "polo", color: "#B3302A", place: "chest", desc: "Polos cut for a tailored women's fit." }] },
    { slug: "activewear", name: "Activewear", blurb: "Performance gear for teams, races, gyms and fun runs.", items: [
      { slug: "performance-shirts", name: "Performance Shirts", shape: "perftee", color: "#1E66C5", desc: "Lightweight, moisture-wicking shirts for races, practices and summer events." },
      { slug: "team-jerseys", name: "Team Jerseys", shape: "jersey", color: "#B3302A", desc: "Jerseys with team names on the front and player names and numbers on the back." },
      { slug: "tank-tops", name: "Tank Tops", shape: "tank", color: "#FFFFFF", desc: "Sleeveless tops for the gym, beach and hot-weather events." },
      { slug: "athletic-quarter-zips", name: "Athletic Quarter-Zips", shape: "quarterzip", color: "#1E1E1E", place: "chest", desc: "Stretchy performance quarter-zips for coaches and warm-ups." },
      { slug: "shorts", name: "Shorts", shape: "shorts", color: "#22304A", place: "leg", desc: "Athletic and fleece shorts with a small logo on the leg." }] },
    { slug: "business-apparel", name: "Business Apparel", blurb: "Professional looks with your logo, for offices, front desks and events.", items: [
      { slug: "business-polos", name: "Polos", shape: "polo", color: "#1E1E1E", garment: "polo", place: "chest", desc: "The easiest way to put your whole team in a branded look." },
      { slug: "dress-shirts", name: "Dress Shirts", shape: "dressshirt", color: "#FFFFFF", place: "chest", desc: "Button-down shirts with a neat embroidered logo on the chest." },
      { slug: "business-quarter-zips", name: "Quarter-Zip Pullovers", shape: "quarterzip", color: "#B9BDB8", place: "chest", desc: "Smart layers for client meetings and trade shows." },
      { slug: "business-vests", name: "Vests", shape: "vest", color: "#22304A", place: "chest", desc: "Layer over a dress shirt or polo for a polished team look." },
      { slug: "sweaters", name: "Sweaters", shape: "sweater", color: "#2C5F2D", place: "chest", desc: "Knit sweaters and cardigans with a subtle stitched logo." }] },
    { slug: "workwear-uniforms", name: "Workwear & Uniforms", blurb: "Durable uniforms for crews, kitchens, clinics and service teams.", items: [
      { slug: "work-shirts", name: "Work Shirts", shape: "workshirt", color: "#22304A", place: "chest", desc: "Tough button-up shirts with chest pockets and a name or logo patch." },
      { slug: "safety-apparel", name: "Safety Apparel", shape: "safetyvest", color: "#D9F20B", place: "back", desc: "High-visibility vests and shirts with your company name on the back." },
      { slug: "aprons", name: "Aprons", shape: "apron", color: "#1E1E1E", desc: "Kitchen, cafe and shop aprons with your logo front and center." },
      { slug: "scrubs", name: "Scrubs", shape: "scrubs", color: "#0E8F8A", place: "chest", desc: "Comfortable scrub tops with an embroidered name or practice logo." },
      { slug: "uniform-work-jackets", name: "Work Jackets", shape: "workjacket", color: "#1E1E1E", place: "chest", desc: "Lined work jackets that keep your crew warm and recognizable." }] }
  ];

  /* ---------------- Header & footer ---------------- */
  const page = document.body.dataset.page || "";
  const chevron = '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const apparelMenu = `
    <div class="nav-drop">
      <a class="nav-drop-link" href="apparel.html"${page === "apparel" ? ' aria-current="page"' : ""} aria-haspopup="true">Apparel ${chevron}</a>
      <div class="mega" aria-label="Apparel categories">
        <div class="wrap mega-grid">
          ${CATALOG.map((c) => `<div class="mega-col">
            <a class="mega-cat" href="apparel.html#${c.slug}">${c.name}</a>
            <ul>
              <li><a href="apparel.html#${c.slug}">Shop All</a></li>
              ${c.items.map((i) => `<li><a href="apparel.html#${c.slug}/${i.slug}">${i.name}</a></li>`).join("")}
            </ul>
          </div>`).join("")}
        </div>
        <div class="wrap mega-foot"><a href="apparel.html">Shop all apparel →</a><a href="design.html">Start a design →</a></div>
      </div>
    </div>`;
  const links = [
    ["embroidery", "embroidery.html", "Embroidery"],
    ["contact", "contact.html", "Bulk orders"],
    ["about", "about.html", "About"]
  ];
  const cartCount = () => { try { return (JSON.parse(localStorage.getItem("al_cart_v1")) || []).length; } catch (e) { return 0; } };
  const header = $("#site-header");
  const b0 = C.business;
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <div class="wrap bar">
        <a class="brand" href="/" aria-label="Addis Loom home">
          <img src="logo.svg" alt="" width="46" height="37">
          <span class="brand-name">Addis Loom<small>Custom Apparel &amp; Embroidery</small></span>
        </a>
        <button class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>
        <nav class="nav" id="primary-nav" aria-label="Main">
          ${apparelMenu}
          ${links.map(([k, href, label]) => `<a href="${href}"${k === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
          ${C.cartOn ? `<a class="cart-link" href="cart.html" aria-label="Cart"${page === "cart" ? ' aria-current="page"' : ""}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21.5 7H6"/></svg><span class="nav-cart-text">Cart</span><span class="cart-count" data-cart-count${cartCount() ? "" : " hidden"}>${cartCount()}</span></a>` : ""}
          <a class="btn small gold" href="design.html">Start a design</a>
        </nav>
      </div>
      <div class="tibeb thin" aria-hidden="true"></div>`;
    const t = $(".menu-toggle", header), n = $("#primary-nav", header);
    t.addEventListener("click", () => {
      const open = n.classList.toggle("open");
      t.setAttribute("aria-expanded", open);
      t.textContent = open ? "Close" : "Menu";
    });
    // Close the Apparel menu after a choice (same-page links only change the #hash) or on Escape.
    const drop = $(".nav-drop", header);
    drop.addEventListener("click", (e) => { if (e.target.closest(".mega a")) drop.classList.add("closed"); });
    drop.addEventListener("mouseleave", () => drop.classList.remove("closed"));
    drop.addEventListener("keydown", (e) => { if (e.key === "Escape") { drop.classList.add("closed"); $(".nav-drop-link", drop).focus(); } });
    drop.addEventListener("focusin", (e) => { if (e.target.classList.contains("nav-drop-link")) drop.classList.remove("closed"); });
  }

  const footer = $("#site-footer");
  if (footer) {
    const b = C.business;
    const social = [["Instagram", b.instagram], ["TikTok", b.tiktok], ["Facebook", b.facebook]].filter((s) => s[1]);
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <img src="logo.svg" alt="Addis Loom" width="90" style="filter:brightness(1.6)">
            <p style="margin-top:14px">Custom printing and embroidery.</p>
          </div>
          <div>
            <h4>Make something</h4>
            <ul>
              <li><a href="apparel.html">Apparel</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="design.html">Design studio</a></li>
              <li><a href="embroidery.html">Embroidery &amp; logos</a></li>
              <li><a href="contact.html">Bulk &amp; group orders</a></li>
              <li><a href="about.html">About Addis Loom</a></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
              ${b.phone ? `<li><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a></li>` : ""}
              ${social.map((s) => `<li><a href="${esc(s[1])}" rel="noopener" target="_blank">${s[0]}</a></li>`).join("")}
              <li><a href="https://billing.stripe.com/p/login/cNiaEX9mq7lvgcl8T6ffy00" rel="noopener">Order receipts</a></li>
            </ul>
          </div>
        </div>
        <div class="foot-legal">
          <span>© ${new Date().getFullYear()} Addis Loom. All rights reserved.</span>
          ${b.serviceArea ? `<span class="foot-area">${esc(b.serviceArea)}${b.phone ? ` &nbsp;|&nbsp; <a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a>` : ""}</span>` : ""}
        </div>
      </div>`;
  }

  /* ---------------- Store links ---------------- */
  document.querySelectorAll("[data-store]").forEach((a) => {
    const url = C.stores[a.dataset.store];
    if (url) a.href = url;
  });
  document.querySelectorAll("[data-email]").forEach((a) => {
    a.href = "mailto:" + C.business.email;
    if (!a.textContent.trim()) a.textContent = C.business.email;
  });

  /* ---------------- Garment drawing (shared by home + studio) ---------------- */
  // All shapes are drawn in a 500 × 560 coordinate space.
  const SHAPES = {
    tee: (p) => { p.moveTo(178, 42); p.quadraticCurveTo(250, 100, 322, 42); p.lineTo(420, 78); p.lineTo(494, 182); p.lineTo(424, 222); p.lineTo(398, 190); p.lineTo(400, 532); p.lineTo(100, 532); p.lineTo(102, 190); p.lineTo(76, 222); p.lineTo(6, 182); p.lineTo(80, 78); p.closePath(); },
    longsleeve: (p) => { p.moveTo(178, 42); p.quadraticCurveTo(250, 100, 322, 42); p.lineTo(420, 78); p.lineTo(486, 470); p.lineTo(432, 482); p.lineTo(398, 230); p.lineTo(400, 532); p.lineTo(100, 532); p.lineTo(102, 230); p.lineTo(68, 482); p.lineTo(14, 470); p.lineTo(80, 78); p.closePath(); },
    cap: (p) => { p.moveTo(70, 340); p.bezierCurveTo(70, 130, 430, 130, 430, 340); p.lineTo(470, 352); p.bezierCurveTo(500, 420, 380, 440, 250, 420); p.bezierCurveTo(140, 412, 60, 400, 70, 340); p.closePath(); },
    tote: (p) => { p.rect(70, 150, 360, 380); }
  };
  const AREAS = {
    tee:    { front: [165, 125, 170, 260], back: [160, 95, 180, 300] },
    hoodie: { front: [170, 150, 160, 170], back: [160, 110, 180, 290] },
    polo:   { front: [172, 145, 156, 240], back: [160, 95, 180, 300] },
    crew:   { front: [165, 125, 170, 250], back: [160, 95, 180, 300] },
    cap:    { front: [170, 200, 160, 110], back: [190, 270, 120, 60] },
    tote:   { front: [110, 200, 280, 290], back: [110, 200, 280, 290] }
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 120;
  }

  function drawGarment(ctx, type, color, side = "front") {
    const dark = isDark(color);
    const edge = dark ? shade(color, 45) : shade(color, -60);
    const shapeKey = type === "tee" || type === "polo" ? "tee" : type === "cap" ? "cap" : type === "tote" ? "tote" : "longsleeve";
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

    // hood behind the body
    if (type === "hoodie") {
      ctx.beginPath();
      ctx.moveTo(160, 70); ctx.bezierCurveTo(150, -10, 350, -10, 340, 70); ctx.closePath();
      ctx.fillStyle = shade(color, dark ? 15 : -18); ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
    }
    // tote handles
    if (type === "tote") {
      ctx.beginPath(); ctx.lineWidth = 18; ctx.strokeStyle = shade(color, dark ? 25 : -30);
      ctx.moveTo(150, 152); ctx.bezierCurveTo(150, 30, 230, 30, 230, 152);
      ctx.moveTo(270, 152); ctx.bezierCurveTo(270, 30, 350, 30, 350, 152); ctx.stroke(); ctx.lineWidth = 3;
    }

    ctx.beginPath(); SHAPES[shapeKey](ctx);
    const g = ctx.createLinearGradient(0, 0, 500, 0);
    g.addColorStop(0, shade(color, dark ? 10 : -14));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, dark ? 10 : -14));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = edge; ctx.stroke();

    ctx.strokeStyle = edge; ctx.lineWidth = 2;
    if (shapeKey === "tee" || shapeKey === "longsleeve") {
      // collar / neckline
      ctx.beginPath();
      if (side === "front") { ctx.moveTo(178, 42); ctx.quadraticCurveTo(250, 112, 322, 42); }
      else { ctx.moveTo(178, 42); ctx.quadraticCurveTo(250, 64, 322, 42); }
      ctx.lineWidth = 7; ctx.strokeStyle = shade(color, dark ? 20 : -25); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = edge;
      // hem stitching
      ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(104, 516); ctx.lineTo(396, 516); ctx.stroke(); ctx.setLineDash([]);
    }
    if (type === "polo" && side === "front") {
      ctx.fillStyle = shade(color, dark ? 18 : -10);
      ctx.beginPath(); ctx.moveTo(178, 42); ctx.lineTo(250, 92); ctx.lineTo(205, 108); ctx.lineTo(166, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(322, 42); ctx.lineTo(250, 92); ctx.lineTo(295, 108); ctx.lineTo(334, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeRect(240, 92, 20, 70);
      ctx.fillStyle = edge; [110, 135].forEach((y) => { ctx.beginPath(); ctx.arc(250, y, 3.5, 0, 7); ctx.fill(); });
    }
    if (type === "hoodie" && side === "front") {
      ctx.beginPath(); ctx.moveTo(150, 400); ctx.lineTo(350, 400); ctx.lineTo(375, 500); ctx.lineTo(125, 500); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(232, 80); ctx.lineTo(228, 160); ctx.moveTo(268, 80); ctx.lineTo(272, 160); ctx.stroke();
    }
    if (type === "cap") {
      ctx.beginPath(); ctx.moveTo(250, 160); ctx.lineTo(250, 345); ctx.stroke();
      ctx.beginPath(); ctx.arc(250, 160, 7, 0, 7); ctx.fillStyle = shade(color, dark ? 25 : -25); ctx.fill();
    }
    ctx.restore();
  }

  /* Draw a finished mockup: garment + text lines + optional tibeb stripe.
     spec = { garment, color, items: [{ text, font, color, x, y, max }], stripe: { x, y } } */
  function drawMockup(canvas, spec) {
    const ctx = canvas.getContext("2d");
    const s = canvas.width / 500;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawGarment(ctx, spec.garment, spec.color, "front");
    for (const it of spec.items || []) {
      let size = it.size;
      const font = () => `${it.weight || 800} ${size}px "${it.font || "Bricolage Grotesque"}", sans-serif`;
      ctx.font = font();
      while (it.max && ctx.measureText(it.text).width > it.max && size > 8) { size -= 1; ctx.font = font(); }
      ctx.fillStyle = it.color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (it.stitch) { ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowOffsetY = 1; ctx.shadowBlur = 1.2; }
      ctx.fillText(it.text, it.x, it.y);
      ctx.shadowColor = "transparent";
    }
    if (spec.stripe) {
      const { x, y, n = 9, d = 7 } = spec.stripe;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = ["#B3302A", "#FCDC04", "#2C5F2D"][i % 3];
        const cx = x - ((n - 1) * d * 2.2) / 2 + i * d * 2.2;
        ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + d, y + d); ctx.lineTo(cx, y + 2 * d); ctx.lineTo(cx - d, y + d); ctx.closePath(); ctx.fill();
      }
    }
  }

  /* Example designs shown until real project photos are added in config.js */
  const IDEAS = {
    habesha: { garment: "tee", color: "#FFFFFF", items: [
      { text: "✝", font: "Source Sans 3", weight: 700, size: 30, color: "#2C5F2D", x: 250, y: 200, max: 60, stitch: true }],
      stripe: { x: 250, y: 150, n: 7, d: 6 } },
    choir: { garment: "tee", color: "#FFFFFF", items: [
      { text: "St. Mary Choir", size: 34, color: "#2C5F2D", x: 250, y: 185, max: 165 },
      { text: "Christmas Concert 2026", font: "Source Sans 3", weight: 700, size: 20, color: "#B3302A", x: 250, y: 228, max: 160 }],
      stripe: { x: 250, y: 262 } },
    polo: { garment: "polo", color: "#1E1E1E", items: [
      { text: "Riverside", size: 15, color: "#FCDC04", x: 318, y: 172, max: 70, stitch: true },
      { text: "café & grill", font: "Source Sans 3", weight: 600, size: 9, color: "#FFFFFF", x: 318, y: 188, max: 70, stitch: true }] },
    reunion: { garment: "hoodie", color: "#2C5F2D", items: [
      { text: "Johnson Family", size: 30, color: "#FCDC04", x: 250, y: 205, max: 155 },
      { text: "Reunion 2027", font: "Source Sans 3", weight: 700, size: 22, color: "#FFFFFF", x: 250, y: 245, max: 150 }],
      stripe: { x: 250, y: 272, n: 7, d: 6 } },
    team: { garment: "tee", color: "#B3302A", items: [
      { text: "LIONS FC", size: 38, color: "#FCDC04", x: 250, y: 175, max: 165 },
      { text: "10", size: 110, color: "#FFFFFF", x: 250, y: 285, max: 165 }] },
    cap: { garment: "cap", color: "#22304A", items: [
      { text: "YOUR LOGO", size: 30, color: "#FCDC04", x: 250, y: 238, max: 140, stitch: true },
      { text: "est. 2026", font: "Source Sans 3", weight: 700, size: 15, color: "#FFFFFF", x: 250, y: 272, max: 120, stitch: true }] },
    tote: { garment: "tote", color: "#EFE7D6", items: [
      { text: "Sarah", font: "Playfair Display", weight: 700, size: 64, color: "#2C5F2D", x: 250, y: 310, max: 240 },
      { text: "Class of 2026", font: "Source Sans 3", weight: 700, size: 26, color: "#B3302A", x: 250, y: 372, max: 200 }],
      stripe: { x: 250, y: 410, n: 11, d: 7 } }
  };
  /* Simple garment previews for the "What we decorate" section */
  Object.assign(IDEAS, {
    "cat-tee": { garment: "tee", color: "#FFFFFF", items: [{ text: "Your design", size: 34, color: "#2C5F2D", x: 250, y: 200, max: 160 }], stripe: { x: 250, y: 236 } },
    "cat-hoodie": { garment: "hoodie", color: "#22304A", items: [{ text: "RVA", size: 54, color: "#FCDC04", x: 250, y: 225, max: 150 }] },
    "cat-crew": { garment: "crew", color: "#B9BDB8", items: [{ text: "Class of 2027", size: 30, color: "#B3302A", x: 250, y: 195, max: 160 }], stripe: { x: 250, y: 230, n: 7, d: 6 } },
    "cat-polo": { garment: "polo", color: "#2C5F2D", items: [{ text: "Logo", size: 18, color: "#FCDC04", x: 318, y: 178, max: 70, stitch: true }] },
    "cat-cap": { garment: "cap", color: "#1E1E1E", items: [{ text: "YOUR NAME", size: 28, color: "#FFFFFF", x: 250, y: 245, max: 140, stitch: true }] },
    "cat-tote": { garment: "tote", color: "#EFE7D6", items: [{ text: "Hello", font: "Playfair Display", weight: 700, size: 60, color: "#B3302A", x: 250, y: 320, max: 240 }], stripe: { x: 250, y: 380, n: 11, d: 7 } }
  });
  function paintIdeas(root = document) {
    const run = () => root.querySelectorAll("canvas[data-idea]").forEach((c) => {
      const spec = IDEAS[c.dataset.idea]; if (spec) drawMockup(c, spec);
    });
    run();
    if (document.fonts) { document.fonts.ready.then(run); document.fonts.addEventListener("loadingdone", run); }
  }

  const IDEA_CARDS = [
    ["choir", "Church choir tees", "Full-color print, front and back"],
    ["polo", "Restaurant staff polos", "Embroidered left-chest logo"],
    ["reunion", "Family reunion hoodies", "Printed front, names on the back"],
    ["team", "Team jerseys", "Team name with player numbers"],
    ["cap", "Embroidered caps", "Front logo, any thread color"],
    ["tote", "Gift totes", "Personal names and dates"]
  ];

  /* Fills a .work-grid with real project photos, or example ideas if none yet. */
  function renderWork(el, limit = 6) {
    if (!el) return;
    const real = (C.gallery || []).filter((g) => g.image);
    const head = document.getElementById(el.dataset.headId || "");
    if (real.length) {
      if (head) head.textContent = "Recent orders";
      el.innerHTML = real.slice(0, limit).map((g) => `<figure class="work-card">
        <div class="work-media"><img src="${esc(g.image)}" alt="${esc(g.title || "Finished order")}" loading="lazy"></div>
        <figcaption><strong>${esc(g.title || "")}</strong>${g.caption ? `<span>${esc(g.caption)}</span>` : ""}</figcaption></figure>`).join("");
    } else {
      el.innerHTML = IDEA_CARDS.slice(0, limit).map(([k, t, c]) => `<figure class="work-card">
        <div class="work-media"><canvas data-idea="${k}" width="500" height="560" role="img" aria-label="Example design: ${esc(t)}"></canvas></div>
        <figcaption><strong>${esc(t)}</strong><span>${esc(c)}</span></figcaption></figure>`).join("");
      paintIdeas(el);
    }
  }

  /* Fills a reviews block, or hides its section when there are none. */
  function renderReviews(el) {
    if (!el) return;
    const list = (C.reviews || []).filter((r) => r.quote);
    const section = el.closest("[data-reviews-section]");
    if (!list.length) { if (section) section.hidden = true; return; }
    el.innerHTML = list.map((r) => `<blockquote class="review">
      <p>${esc(r.quote)}</p>
      <footer><strong>${esc(r.name || "Customer")}</strong>${r.detail ? `<span>${esc(r.detail)}</span>` : ""}</footer></blockquote>`).join("");
  }

  window.Addis = { config: C, catalog: CATALOG, money, esc, drawGarment, AREAS, isDark, drawMockup, paintIdeas, renderWork, renderReviews };
  renderWork(document.querySelector("[data-work]"), +(document.querySelector("[data-work]")?.dataset.work || 6));
  renderReviews(document.querySelector("[data-reviews]"));
  paintIdeas(document);

  /* ---------------- Quote / contact forms ---------------- */
  async function sendRequest(payload, statusEl, opts = {}) {
    const subject = payload._subject || "Addis Loom request";
    if (C.formEndpoint) {
      try {
        const res = await fetch(C.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.status);
        statusEl.className = "form-status ok";
        statusEl.textContent = opts.okText || "Request sent. We'll reply by email within one business day with your proof and final price.";
        return true;
      } catch (e) {
        statusEl.className = "form-status err";
        statusEl.innerHTML = `Your request didn't go through. Check your connection and try again, or email us at <a href="mailto:${esc(C.business.email)}">${esc(C.business.email)}</a>.`;
        return false;
      }
    }
    // No endpoint configured: hand off to the customer's email app.
    const body = Object.entries(payload).filter(([k]) => !k.startsWith("_"))
      .map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:${C.business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    statusEl.className = "form-status ok";
    statusEl.textContent = opts.mailText || "Your email app should open with the request filled in. Press send there to finish.";
    return true;
  }
  window.Addis.sendRequest = sendRequest;

  document.querySelectorAll("form[data-request]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      data._subject = form.dataset.request;
      const btn = form.querySelector("[type=submit]");
      const status = form.querySelector(".form-status");
      btn.disabled = true;
      const ok = await sendRequest(data, status);
      btn.disabled = false;
      if (ok && C.formEndpoint) form.reset();
    });
  });
})();
