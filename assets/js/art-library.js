/* Addis Loom — clip art for the design studio.
   Every piece is an original drawing on a 100 × 100 grid. "currentColor" is
   swapped for the customer's chosen color; pieces marked multi keep their own
   colors. To add art: add an entry { key, name, cat, tags, svg } below. */
(function () {
  const F = 'fill="currentColor"';
  const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const star = (cx, cy, r1, r2, n = 5, rot = -90) => {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = ((rot + (i * 180) / n) * Math.PI) / 180;
      p.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(" ");
  };

  const CATS = [
    ["popular", "Most popular"],
    ["shapes", "Shapes & symbols"],
    ["faith", "Faith & church"],
    ["celebrate", "Celebrations"],
    ["sports", "Sports & games"],
    ["nature", "Nature"],
    ["animals", "Animals"],
    ["frames", "Frames & banners"],
    ["heritage", "Heritage & coffee"],
    ["school", "School & work"]
  ];

  const ART = [
    // ---- Shapes & symbols
    { key: "star", name: "Star", cat: "shapes", pop: 1, tags: "star rating", svg: `<polygon ${F} points="${star(50, 53, 46, 19)}"/>` },
    { key: "star-outline", name: "Star outline", cat: "shapes", tags: "star", svg: `<polygon ${S} stroke-width="6" points="${star(50, 53, 42, 18)}"/>` },
    { key: "heart", name: "Heart", cat: "shapes", pop: 1, tags: "love heart valentine", svg: `<path ${F} d="M50 88 12 50C-2 34 8 10 28 10c10 0 17 6 22 14 5-8 12-14 22-14 20 0 30 24 16 40Z"/>` },
    { key: "heart-outline", name: "Heart outline", cat: "shapes", tags: "love heart", svg: `<path ${S} stroke-width="6" d="M50 84 15 49C3 36 11 15 29 15c9 0 16 6 21 13 5-7 12-13 21-13 18 0 26 21 14 34Z"/>` },
    { key: "circle", name: "Circle", cat: "shapes", tags: "circle dot", svg: `<circle ${F} cx="50" cy="50" r="44"/>` },
    { key: "ring", name: "Ring", cat: "shapes", tags: "circle ring", svg: `<circle ${S} stroke-width="7" cx="50" cy="50" r="40"/>` },
    { key: "diamond", name: "Diamond", cat: "shapes", tags: "diamond gem", svg: `<path ${F} d="M50 4 92 50 50 96 8 50Z"/>` },
    { key: "hexagon", name: "Hexagon", cat: "shapes", tags: "hexagon", svg: `<polygon ${F} points="50,4 90,27 90,73 50,96 10,73 10,27"/>` },
    { key: "bolt", name: "Lightning bolt", cat: "shapes", pop: 1, tags: "lightning bolt energy", svg: `<path ${F} d="M58 2 16 58h28l-8 40 48-60H54Z"/>` },
    { key: "arrow", name: "Arrow", cat: "shapes", tags: "arrow right", svg: `<path ${F} d="M6 40h56V18l34 32-34 32V60H6Z"/>` },
    { key: "sparkle", name: "Sparkle", cat: "shapes", tags: "sparkle shine star", svg: `<path ${F} d="M50 2c4 30 18 44 48 48-30 4-44 18-48 48-4-30-18-44-48-48C32 46 46 32 50 2Z"/>` },
    { key: "check", name: "Check mark", cat: "shapes", tags: "check yes", svg: `<path ${S} stroke-width="12" d="M14 52 38 76 86 24"/>` },
    { key: "peace", name: "Peace", cat: "shapes", tags: "peace", svg: `<g ${S} stroke-width="7"><circle cx="50" cy="50" r="42"/><path d="M50 8v84M50 50 21 79M50 50l29 29"/></g>` },
    { key: "smile", name: "Smiley", cat: "shapes", pop: 1, tags: "smile happy emoji face", svg: `<circle ${S} stroke-width="6" cx="50" cy="50" r="43"/><circle ${F} cx="35" cy="40" r="6"/><circle ${F} cx="65" cy="40" r="6"/><path ${S} stroke-width="6" d="M30 60c10 14 30 14 40 0"/>` },

    // ---- Faith
    { key: "cross", name: "Cross", cat: "faith", pop: 1, tags: "cross christian church jesus", svg: `<path ${F} d="M42 4h16v26h22v16H58v50H42V46H20V30h22Z"/>` },
    { key: "cross-ornate", name: "Ornate cross", cat: "faith", pop: 1, tags: "cross orthodox ethiopian meskel church", svg: `<g ${F}><path d="M45 18h10v64H45zM18 45h64v10H18z"/><circle cx="50" cy="12" r="9"/><circle cx="50" cy="88" r="9"/><circle cx="12" cy="50" r="9"/><circle cx="88" cy="50" r="9"/><circle cx="50" cy="50" r="12"/></g><g ${S} stroke-width="3"><circle cx="50" cy="50" r="22"/><path d="M36 22l14 8 14-8M36 78l14-8 14 8M22 36l8 14-8 14M78 36l-8 14 8 14"/></g>` },
    { key: "cross-outline", name: "Cross outline", cat: "faith", tags: "cross", svg: `<path ${S} stroke-width="6" d="M42 6h16v26h22v14H58v48H42V46H20V32h22Z"/>` },
    { key: "church", name: "Church", cat: "faith", tags: "church building chapel", svg: `<g ${F}><path d="M47 2h6v8h7v6h-7v8l17 18v52H30V42l17-18v-8h-7v-6h7Z"/><path d="M12 62 30 50v46H12z M88 62 70 50v46h18z" opacity=".75"/></g><path fill="#fff" d="M43 96V78a7 7 0 0 1 14 0v18Z"/>` },
    { key: "dove", name: "Dove", cat: "faith", tags: "dove peace bird spirit", svg: `<path ${F} d="M8 56c14-2 24-10 30-22 4-8 12-14 22-14 6 0 10 4 12 8l14 2-12 6c0 18-14 34-36 36l-10 18-4-16C16 74 10 66 8 56Z"/><path ${F} d="M40 40C30 20 36 6 52 2c-4 10-2 20 6 28Z" opacity=".8"/>` },
    { key: "praying", name: "Praying hands", cat: "faith", tags: "pray prayer hands", svg: `<path ${F} d="M48 6c-6 0-8 8-8 14v30l-14 18 8 8-8 8 8 10 24-24V20c0-8-4-14-10-14Zm4 0c6 0 8 8 8 14v30l14 18-8 8 8 8-8 10-24-24V20c0-8 4-14 10-14Z"/>` },
    { key: "candle", name: "Candle", cat: "faith", tags: "candle light advent", svg: `<g ${F}><path d="M50 4c8 10 10 18 0 26-10-8-8-16 0-26Z"/><rect x="38" y="36" width="24" height="54" rx="3"/><rect x="28" y="88" width="44" height="8" rx="3"/></g>` },
    { key: "bible", name: "Open book", cat: "faith", tags: "bible book read scripture", svg: `<g ${F}><path d="M48 24C36 16 20 14 4 16v64c16-2 32 0 44 8Z"/><path d="M52 24c12-8 28-10 44-8v64c-16-2-32 0-44 8Z"/></g>` },

    // ---- Celebrations
    { key: "crown", name: "Crown", cat: "celebrate", pop: 1, tags: "crown king queen royal birthday", svg: `<g ${F}><path d="M8 30 28 52 50 18 72 52 92 30 84 78H16Z"/><rect x="16" y="82" width="68" height="10" rx="2"/></g>` },
    { key: "cake", name: "Birthday cake", cat: "celebrate", tags: "cake birthday party", svg: `<g ${F}><rect x="12" y="56" width="76" height="36" rx="4"/><rect x="20" y="36" width="60" height="22" rx="4" opacity=".85"/><rect x="47" y="18" width="6" height="16"/><path d="M50 2c5 6 6 10 0 14-6-4-5-8 0-14Z"/></g>` },
    { key: "gift", name: "Gift", cat: "celebrate", tags: "gift present christmas birthday", svg: `<g ${F}><rect x="10" y="40" width="80" height="18" rx="2"/><rect x="16" y="58" width="68" height="38" rx="2"/></g><g fill="#fff"><rect x="45" y="40" width="10" height="56"/></g><path ${S} stroke-width="6" d="M50 38c-8-18-30-22-28-8 1 8 18 8 28 8Zm0 0c8-18 30-22 28-8-1 8-18 8-28 8Z"/>` },
    { key: "balloons", name: "Balloons", cat: "celebrate", tags: "balloon party birthday", svg: `<g ${F}><ellipse cx="34" cy="32" rx="20" ry="24"/><ellipse cx="66" cy="40" rx="20" ry="24" opacity=".8"/></g><path ${S} stroke-width="2.5" d="M34 56c4 12-6 20 12 40M66 64c-4 10 4 18-14 32"/>` },
    { key: "grad-cap", name: "Graduation cap", cat: "celebrate", pop: 1, tags: "graduation grad cap class school senior", svg: `<g ${F}><path d="M50 14 98 36 50 58 2 36Z"/><path d="M24 48v20c14 12 38 12 52 0V48L50 60Z"/></g><path ${S} stroke-width="3" d="M90 40v26"/><circle ${F} cx="90" cy="70" r="5"/>` },
    { key: "music", name: "Music notes", cat: "celebrate", tags: "music note song choir band", svg: `<g ${F}><path d="M36 14 90 4v62a12 10 0 1 1-8-9V22L44 29v47a12 10 0 1 1-8-9Z"/></g>` },
    { key: "glasses", name: "Cheers", cat: "celebrate", tags: "cheers toast wedding party", svg: `<g ${S} stroke-width="5"><path d="M18 10h24l-4 30a8 8 0 0 1-16 0ZM30 48v34M20 84h20"/><path d="M58 10h24l-4 30a8 8 0 0 1-16 0ZM70 48v34M60 84h20"/></g>` },
    { key: "rings", name: "Wedding rings", cat: "celebrate", tags: "wedding rings marriage love", svg: `<g ${S} stroke-width="7"><circle cx="36" cy="58" r="24"/><circle cx="64" cy="58" r="24"/></g><path ${F} d="M58 14l6-10 6 10-6 8Z"/>` },

    // ---- Sports
    { key: "soccer", name: "Soccer ball", cat: "sports", pop: 1, tags: "soccer football ball", svg: `<circle ${S} stroke-width="5" cx="50" cy="50" r="44"/><polygon ${F} points="50,32 67,44 61,64 39,64 33,44"/><path ${S} stroke-width="4" d="M50 32V8M67 44l22-8M61 64l14 20M39 64 25 84M33 44l-22-8"/>` },
    { key: "basketball", name: "Basketball", cat: "sports", pop: 1, tags: "basketball ball", svg: `<circle ${F} cx="50" cy="50" r="44"/><g fill="none" stroke="#fff" stroke-width="4"><path d="M6 50h88M50 6v88"/><path d="M20 18c14 16 14 48 0 64M80 18c-14 16-14 48 0 64"/></g>` },
    { key: "football", name: "Football", cat: "sports", tags: "american football ball", svg: `<path ${F} d="M10 90C6 50 50 6 90 10c4 40-40 84-80 80Z"/><path fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M36 64 64 36M44 48l8 8M52 40l8 8M36 56l8 8"/>` },
    { key: "baseball", name: "Baseball", cat: "sports", tags: "baseball softball ball", svg: `<circle ${S} stroke-width="5" cx="50" cy="50" r="44"/><path ${S} stroke-width="4" d="M24 14c14 20 14 52 0 72M76 14c-14 20-14 52 0 72"/>` },
    { key: "trophy", name: "Trophy", cat: "sports", pop: 1, tags: "trophy winner champion cup", svg: `<g ${F}><path d="M26 6h48v26a24 24 0 0 1-48 0Z"/><rect x="44" y="54" width="12" height="20"/><rect x="28" y="74" width="44" height="8" rx="2"/><rect x="22" y="84" width="56" height="10" rx="2"/></g><path ${S} stroke-width="6" d="M26 14H12c0 16 6 24 16 26M74 14h14c0 16-6 24-16 26"/>` },
    { key: "medal", name: "Medal", cat: "sports", tags: "medal award winner first", svg: `<g ${F}><path d="M24 4h16l14 30H38ZM76 4H60L46 34h16Z" opacity=".8"/><circle cx="50" cy="64" r="30"/></g><polygon fill="#fff" points="${star(50, 65, 16, 7)}"/>` },
    { key: "running", name: "Running shoe", cat: "sports", tags: "run running 5k race shoe track", svg: `<path ${F} d="M6 70c0-10 4-16 10-18l14-34c6 4 14 6 22 4l4 14c10 6 22 10 34 12 6 2 8 8 4 14l-4 6H10c-2 0-4-2-4-4Z"/><path fill="none" stroke="#fff" stroke-width="3" d="M36 36l8-2M32 46l9-2M8 76h86"/>` },
    { key: "dumbbell", name: "Dumbbell", cat: "sports", tags: "gym fitness weights workout", svg: `<g ${F}><rect x="4" y="34" width="10" height="32" rx="3"/><rect x="16" y="24" width="12" height="52" rx="3"/><rect x="28" y="45" width="44" height="10"/><rect x="72" y="24" width="12" height="52" rx="3"/><rect x="86" y="34" width="10" height="32" rx="3"/></g>` },

    // ---- Nature
    { key: "sun", name: "Sun", cat: "nature", pop: 1, tags: "sun summer", svg: `<circle ${F} cx="50" cy="50" r="22"/><g ${S} stroke-width="7"><path d="M50 4v12M50 84v12M4 50h12M84 50h12M17 17l9 9M74 74l9 9M83 17l-9 9M26 74l-9 9"/></g>` },
    { key: "moon", name: "Moon", cat: "nature", tags: "moon night", svg: `<path ${F} d="M62 6a44 44 0 1 0 32 66A38 38 0 0 1 62 6Z"/>` },
    { key: "mountains", name: "Mountains", cat: "nature", pop: 1, tags: "mountain outdoors hiking adventure", svg: `<path ${F} d="M2 88 36 26l16 28 12-18 34 52Z"/><path fill="#fff" d="M36 26 28 41l8 5 7-3Z"/>` },
    { key: "tree", name: "Pine tree", cat: "nature", tags: "tree pine forest christmas", svg: `<path ${F} d="M50 2 22 40h12L14 66h18L8 90h84L68 66h18L66 40h12Z"/><rect ${F} x="44" y="88" width="12" height="10"/>` },
    { key: "leaf", name: "Leaf", cat: "nature", tags: "leaf plant eco green", svg: `<path ${F} d="M90 8C40 8 10 30 12 70l-6 22 6 2 8-18c40 2 70-28 70-68Z"/><path fill="none" stroke="#fff" stroke-width="3" d="M20 74C40 50 56 36 76 22"/>` },
    { key: "flower", name: "Flower", cat: "nature", tags: "flower daisy spring", svg: `<g ${F}>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="50" cy="24" rx="12" ry="22" transform="rotate(${a} 50 50)"/>`).join("")}</g><circle fill="#fff" cx="50" cy="50" r="12"/>` },
    { key: "wave", name: "Wave", cat: "nature", tags: "wave ocean beach surf", svg: `<path ${F} d="M4 70c10-30 30-48 54-48 20 0 34 14 34 30-10-10-26-10-32 2 8-2 16 2 18 10-20 8-46 8-74 6Z"/>` },
    { key: "paw", name: "Paw print", cat: "animals", pop: 1, tags: "paw dog cat pet", svg: `<g ${F}><ellipse cx="50" cy="66" rx="24" ry="20"/><ellipse cx="20" cy="40" rx="10" ry="13"/><ellipse cx="38" cy="20" rx="10" ry="13"/><ellipse cx="62" cy="20" rx="10" ry="13"/><ellipse cx="80" cy="40" rx="10" ry="13"/></g>` },
    { key: "lion", name: "Lion", cat: "animals", tags: "lion mascot team king", svg: `<g ${F}>${Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="14" rx="11" ry="16" transform="rotate(${i * 30} 50 50)"/>`).join("")}</g><circle fill="#fff" cx="50" cy="52" r="26"/><g ${F}><circle cx="41" cy="48" r="4"/><circle cx="59" cy="48" r="4"/><path d="M44 58h12l-6 7Z"/></g><path ${S} stroke-width="3" d="M50 65v4M42 70c4 3 12 3 16 0"/>` },
    { key: "eagle", name: "Bird", cat: "animals", tags: "bird eagle hawk mascot", svg: `<path ${F} d="M2 34c16 0 30 6 40 16l6-12c4-6 12-8 18-4l10-2-8 8c2 14-4 30-18 40l4 16-14-10-8 10 2-18C22 70 10 54 2 34Z"/>` },
    { key: "fish", name: "Fish", cat: "animals", tags: "fish fishing", svg: `<path ${F} d="M4 50c16-22 44-30 66-14l24-14-8 28 8 28-24-14C48 80 20 72 4 50Z"/><circle fill="#fff" cx="24" cy="46" r="4"/>` },
    { key: "butterfly", name: "Butterfly", cat: "animals", tags: "butterfly spring", svg: `<g ${F}><path d="M48 46C38 20 10 8 6 22s10 30 42 28ZM52 46c10-26 38-38 42-24s-10 30-42 28ZM48 54C30 56 14 70 22 82s22 0 26-22ZM52 54c18 2 34 16 26 28s-22 0-26-22Z"/><rect x="47" y="30" width="6" height="44" rx="3"/></g>` },

    // ---- Frames & banners
    { key: "banner", name: "Ribbon banner", cat: "frames", pop: 1, tags: "banner ribbon label", svg: `<g ${F}><path d="M2 40h16v34H2l8-17Z M98 40H82v34h16l-8-17Z" opacity=".75"/><rect x="12" y="30" width="76" height="34" rx="2"/></g>` },
    { key: "badge", name: "Seal badge", cat: "frames", tags: "badge seal award starburst", svg: `<polygon ${F} points="${star(50, 50, 48, 40, 16)}"/><circle fill="none" stroke="#fff" stroke-width="3" cx="50" cy="50" r="32"/>` },
    { key: "shield", name: "Shield", cat: "frames", pop: 1, tags: "shield crest team security", svg: `<path ${F} d="M50 4 88 16v30c0 26-16 42-38 50C28 88 12 72 12 46V16Z"/>` },
    { key: "circle-frame", name: "Circle frame", cat: "frames", tags: "frame circle emblem", svg: `<g ${S}><circle stroke-width="6" cx="50" cy="50" r="44"/><circle stroke-width="2.5" cx="50" cy="50" r="36"/></g>` },
    { key: "laurel", name: "Laurel wreath", cat: "frames", tags: "laurel wreath winner award", svg: `<g ${S} stroke-width="4"><path d="M38 92C10 80 4 48 18 20M62 92c28-12 34-44 20-72"/></g><g ${F}>${[[14, 34, -40], [10, 50, -10], [14, 66, 20], [24, 80, 45], [86, 34, 40], [90, 50, 10], [86, 66, -20], [76, 80, -45]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="10" transform="rotate(${r} ${x} ${y})"/>`).join("")}</g>` },
    { key: "brackets", name: "Corner frame", cat: "frames", tags: "frame corners border", svg: `<path ${S} stroke-width="7" d="M6 28V6h22M72 6h22v22M94 72v22H72M28 94H6V72"/>` },
    { key: "divider", name: "Divider", cat: "frames", tags: "line divider ornament", svg: `<path ${S} stroke-width="4" d="M4 50h34M62 50h34"/><path ${F} d="M50 38l12 12-12 12-12-12Z"/>` },

    // ---- Heritage & coffee (multi-color pieces keep the woven-border colors)
    { key: "tibeb", name: "Woven border", cat: "heritage", pop: 1, multi: true, tags: "tibeb border pattern ethiopian habesha", w: 300, h: 40,
      svg: (() => { let s = ""; for (let i = 0; i < 14; i++) { const x = 4 + i * 21.4; s += `<path fill="${["#B3302A", "#FCDC04", "#2C5F2D"][i % 3]}" d="M${x} 20 ${x + 10} 6 ${x + 20} 20 ${x + 10} 34Z"/>`; } return `<rect width="300" height="40" fill="none"/>${s}<path stroke="#B3302A" stroke-width="2" d="M0 2h300M0 38h300"/>`; })() },
    { key: "jebena", name: "Coffee pot", cat: "heritage", pop: 1, tags: "jebena coffee ceremony ethiopian buna", svg: `<g ${F}><path d="M40 6h20v10h-4v18c14 6 22 18 22 32 0 16-12 28-28 28S22 82 22 66c0-14 8-26 22-32V16h-4Z"/><path d="M24 58 6 40l4-3 18 14Z"/></g><path ${S} stroke-width="6" d="M76 50c14-2 16 22 0 24"/>` },
    { key: "coffee", name: "Coffee cup", cat: "heritage", tags: "coffee cup cafe buna", svg: `<g ${F}><path d="M12 38h60v20c0 20-14 34-30 34S12 78 12 58Z"/></g><path ${S} stroke-width="6" d="M72 46h6a10 10 0 0 1 0 20h-8M32 8c-4 6 4 10 0 18M46 8c-4 6 4 10 0 18"/>` },
    { key: "coffee-bean", name: "Coffee bean", cat: "heritage", tags: "coffee bean", svg: `<ellipse ${F} cx="50" cy="50" rx="30" ry="44" transform="rotate(30 50 50)"/><path fill="none" stroke="#fff" stroke-width="4" d="M66 16C40 30 60 70 34 84"/>` },
    { key: "diamond-band", name: "Diamond band", cat: "heritage", tags: "pattern band border diamonds", w: 300, h: 40,
      svg: (() => { let s = ""; for (let i = 0; i < 14; i++) { const x = 4 + i * 21.4; s += `<path ${F} d="M${x} 20 ${x + 10} 6 ${x + 20} 20 ${x + 10} 34Z"/>`; } return s; })() },

    // ---- School & work
    { key: "apple", name: "Apple", cat: "school", tags: "apple teacher school", svg: `<path ${F} d="M50 28c-10-6-34-6-38 20-4 24 14 48 28 46 4 0 6-2 10-2s6 2 10 2c14 2 32-22 28-46-4-26-28-26-38-20Z"/><path ${F} d="M52 26c0-10 6-18 16-20-2 10-8 18-16 20Z"/>` },
    { key: "pencil", name: "Pencil", cat: "school", tags: "pencil school write teacher", svg: `<path ${F} d="M70 6 94 30 34 90 6 94l4-28Z"/><path fill="#fff" d="M10 66 34 90l-6 1-19-19Z"/>` },
    { key: "wrench", name: "Wrench", cat: "school", tags: "wrench tool mechanic work crew construction", svg: `<path ${F} d="M88 12 74 26l-8-2-2-8L78 2C64-2 50 10 54 26L8 72a10 10 0 0 0 14 14l46-46c16 4 28-10 24-24Z"/>` },
    { key: "hammer", name: "Hammer", cat: "school", tags: "hammer tool construction crew", svg: `<g ${F}><path d="M30 8h34l10 10v14H52l-10-8H22Z"/><rect x="48" y="30" width="12" height="64" rx="4"/></g>` },
    { key: "house", name: "House", cat: "school", tags: "house home real estate family", svg: `<path ${F} d="M50 6 4 46h12v46h26V66h16v26h26V46h12Z"/>` },
    { key: "chef", name: "Chef hat", cat: "school", tags: "chef cook restaurant kitchen food", svg: `<g ${F}><path d="M24 56C8 54 6 28 24 26c2-14 18-22 30-12 12-12 34-4 32 14 14 4 12 28-4 28Z"/><rect x="24" y="62" width="56" height="26" rx="3"/></g>` },
    { key: "stethoscope", name: "Medical cross", cat: "school", tags: "medical nurse health care", svg: `<path ${F} d="M36 6h28v30h30v28H64v30H36V64H6V36h30Z"/>` }
  ];

  function svgFor(a, color) {
    const w = a.w || 100, h = a.h || 100;
    const body = (a.svg || "").replace(/currentColor/g, a.multi ? "currentColor" : color || "#1B2A1C");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">${body}</svg>`;
  }
  window.AddisArt = { CATS, ART, svgFor };
})();
