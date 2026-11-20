# addisloom.com

Website for Addis Loom — custom printing, embroidery and Ethiopian heritage goods.
Plain HTML/CSS/JS, no build step. Hosted on GitHub Pages with the domain on Cloudflare.

## Pages
| File | What it is |
|---|---|
| `index.html` | Home: live T-shirt try-on, services, how ordering works, pricing, FAQ |
| `services.html` | Every service: printing, embroidery, uniforms, church & event orders, gifts, design help |
| `about.html` | Story, meaning of the name, values, reviews, contact |
| `design.html` | Design Lab: full-screen studio with a tool rail (Templates, Product Details, Upload, Add Text, Add Art, Names & Numbers, Change Products), front/back views, drag/resize/rotate handles, curved and outlined text (incl. Amharic), clip art, undo/redo, autosave with "Welcome back", Save \| Share, and Get Price → add to cart or request a quote. Code: `assets/js/designer.js`, `assets/js/art-library.js` (add clip art there), `assets/css/design-lab.css` |
| `embroidery.html` | Embroidery services and quote form |
| `shop.html` | Heritage collection with category filters and Amazon / Walmart / Buy now buttons |
| `contact.html` | Bulk and group order request form |
| `404.html` | Not-found page |

## Editing prices, products and links
Everything lives in **`assets/js/config.js`**: business email and phone, store links,
garment prices, decoration prices, quantity discounts, turnaround time, and the product list.
Every page updates automatically.

Reviews and photos of finished work also live in config.js (`reviews` and `gallery`). The reviews
section stays hidden until you add a real review; the gallery shows example designs until you add photos.

Product photos: put them in `assets/img/products/` and set `image: "assets/img/products/kemis.jpg"`.

## Turning on order emails (5 minutes)
Out of the box, the order forms open the customer's email app with everything filled in.
To receive requests directly instead:
1. Create a free account at https://formspree.io and make a new form.
2. Copy the endpoint (looks like `https://formspree.io/f/abcdwxyz`).
3. Paste it into `formEndpoint` in `assets/js/config.js` and commit to `master`.

## Business email at your domain
In Cloudflare: **Email → Email Routing** → add `orders@addisloom.com` and forward it to your
personal inbox. (Or change `business.email` in config.js to whatever address you use.)

## Taking payment
Custom orders: after a customer approves the proof, send a Stripe (or Square/PayPal) invoice.
Ready-made products: create a Stripe Payment Link per product and paste it into that
product's `checkout` field in config.js — a "Buy now" button appears automatically.

## Deploy
Commit to `master`. GitHub Pages publishes it; the `CNAME` file keeps the custom domain.
In Cloudflare, keep the DNS records pointing to GitHub Pages and SSL/TLS mode on **Full**.
