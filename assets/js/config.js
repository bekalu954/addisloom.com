/* =====================================================================
   ADDIS LOOM — SITE SETTINGS
   This is the one file to edit for prices, links, products and contact
   details. Every page reads from it. No coding knowledge needed: change
   the values between the quotes / numbers and save.
   ===================================================================== */
window.ADDIS_CONFIG = {

  business: {
    name: "Addis Loom",
    email: "orders@addisloom.com",          // set up free on Cloudflare: Email > Email Routing
    phone: "(804) 601-0445",
    serviceArea: "Serving Chesterfield County, Richmond and Midlothian, VA",
    instagram: "",                           // full URL, or "" to hide
    tiktok: "",
    facebook: ""
  },

  /* Where order and quote requests are sent.
     Leave "" and requests open the customer's email app instead.
     Recommended: create a free form at https://formspree.io, then paste
     its endpoint here, e.g. "https://formspree.io/f/abcdwxyz". */
  formEndpoint: "",

  /* Your marketplace storefronts. Replace with your real seller/store links. */
  stores: {
    amazon: "https://www.amazon.com/",
    walmart: "https://www.walmart.com/"
  },

  /* ---------- Custom apparel pricing (US dollars) ---------- */
  garments: {
    tee:    { label: "T-shirt",          base: 14, embroideryOk: true  },
    hoodie: { label: "Hoodie",           base: 32, embroideryOk: true  },
    polo:   { label: "Polo",             base: 24, embroideryOk: true  },
    crew:   { label: "Crewneck sweatshirt", base: 26, embroideryOk: true },
    cap:    { label: "Cap",              base: 16, embroideryOk: true, printOk: false, oneSize: true },
    tote:   { label: "Tote bag",         base: 12, embroideryOk: true, oneSize: true }
  },

  colors: [
    { name: "White",        hex: "#FFFFFF" },
    { name: "Black",        hex: "#1E1E1E" },
    { name: "Forest green", hex: "#2C5F2D" },
    { name: "Gold",         hex: "#F4CF2A" },
    { name: "Red",          hex: "#B3302A" },
    { name: "Navy",         hex: "#22304A" },
    { name: "Heather grey", hex: "#B9BDB8" },
    { name: "Natural",      hex: "#EFE7D6" }
  ],

  sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  plusSizeUpcharge: 3,          // added per item for 2XL and up

  methods: {
    print: {
      label: "Full-color print (DTF)",
      perSide: 7,               // per decorated side, per item
      setup: 0
    },
    embroidery: {
      label: "Embroidery",
      perLocation: 9,           // per stitched location, per item (up to ~8,000 stitches)
      setup: 35                 // one-time digitizing fee per new design
    }
  },

  /* Quantity discounts applied to the per-item price. */
  quantityDiscounts: [
    { min: 12,  off: 0.10 },
    { min: 24,  off: 0.15 },
    { min: 48,  off: 0.20 },
    { min: 100, off: 0.25 }
  ],

  turnaround: "7–10 business days after you approve the proof",
  rushNote: "Need it sooner? Rush orders are often possible — ask in your request.",

  /* ---------- Heritage collection ----------
     category: "clothing" | "home" | "accessories" | "custom"
     image: path to a photo in assets/img/products/ ("" shows a pattern)
     amazon / walmart: direct product links (or "" to hide that button)
     checkout: a Stripe Payment Link or similar (or "" to hide)          */
  products: [
    { name: "Habesha kemis — tibeb border", category: "clothing", price: "", image: "",
      note: "Hand-woven cotton dress with traditional border.", amazon: "", walmart: "", checkout: "" },
    { name: "Netela shawl", category: "clothing", price: "", image: "",
      note: "Lightweight gauze shawl with woven edge.", amazon: "", walmart: "", checkout: "" },
    { name: "Men's habesha shirt", category: "clothing", price: "", image: "",
      note: "Cotton shirt with embroidered placket.", amazon: "", walmart: "", checkout: "" },
    { name: "Mesob basket", category: "home", price: "", image: "",
      note: "Woven serving basket.", amazon: "", walmart: "", checkout: "" },
    { name: "Jebena coffee set", category: "home", price: "", image: "",
      note: "Clay coffee pot and cups for the traditional coffee ceremony.", amazon: "", walmart: "", checkout: "" },
    { name: "Tibeb pattern tote", category: "accessories", price: "$24", image: "",
      note: "Made in our shop — tibeb border print.", amazon: "", walmart: "", checkout: "" }
  ],

  /* ---------- Customer reviews ----------
     Only add real reviews from real customers (with their permission).
     The reviews section stays hidden until at least one is listed here.
     Example: { quote: "They had our choir shirts ready in a week.", name: "Hana T.", detail: "Church choir order" } */
  reviews: [],

  /* ---------- Your work ----------
     Photos of finished orders. Put images in assets/img/work/ and list them here.
     Until you add some, the site shows example design ideas instead.
     Example: { image: "assets/img/work/choir-tees.jpg", title: "Choir tees", caption: "40 printed tees, front and back" } */
  gallery: []
};
