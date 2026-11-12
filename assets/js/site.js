/* Addis Loom — shared page behaviour: header, footer, forms, garment drawing */
(function () {
  const C = window.ADDIS_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------------- Header & footer ---------------- */
  const page = document.body.dataset.page || "";
  const links = [
    ["design", "design.html", "Design studio"],
    ["embroidery", "embroidery.html", "Embroidery"],
    ["shop", "shop.html", "Heritage shop"],
    ["contact", "contact.html", "Bulk orders"]
  ];
  const header = $("#site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <div class="wrap bar">
        <a class="brand" href="index.html" aria-label="Addis Loom home">
          <img src="logo.svg" alt="" width="46" height="37">
          <span class="brand-name">Addis Loom<small>አዲስ ሉም</small></span>
        </a>
        <button class="menu-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button>
        <nav class="nav" id="primary-nav" aria-label="Main">
          ${links.map(([k, href, label]) => `<a href="${href}"${k === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
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
            <p style="margin-top:14px">Ethiopian heritage goods, custom printing and embroidery.</p>
            ${b.serviceArea ? `<p>${esc(b.serviceArea)}</p>` : ""}
          </div>
          <div>
            <h4>Make something</h4>
            <ul>
              <li><a href="design.html">Design studio</a></li>
              <li><a href="embroidery.html">Embroidery &amp; logos</a></li>
              <li><a href="contact.html">Bulk &amp; group orders</a></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
              ${b.phone ? `<li><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a></li>` : ""}
              ${social.map((s) => `<li><a href="${esc(s[1])}" rel="noopener" target="_blank">${s[0]}</a></li>`).join("")}
              <li><a href="${esc(C.stores.amazon)}" rel="noopener" target="_blank">Addis Loom on Amazon</a></li>
              <li><a href="${esc(C.stores.walmart)}" rel="noopener" target="_blank">Addis Loom on Walmart</a></li>
            </ul>
          </div>
        </div>
        <div class="foot-legal">© ${new Date().getFullYear()} Addis Loom. All rights reserved.</div>
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

  window.Addis = { config: C, money, esc, drawGarment, AREAS, isDark };

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
