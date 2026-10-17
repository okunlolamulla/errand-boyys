# customer/: the public website (React)

A React 19 app built with Vite. The finished website is already built in **`dist/`**, so you can serve it as plain files with no Node.js on the server.
Node.js is only needed if you want to change the source code.

| Path | What it is |
|---|---|
| `dist/` | **The finished website. This is what the web server serves** |
| `public/config.js` | Settings: API address, WhatsApp, phone, email, bank details (copied into `dist/`) |
| `product-photos-checklist.csv` | The list of pictures to add, with file names |
| `public/catalog.json` | **The shop**: categories and products. Edit it, no rebuild needed (see below) |
| `public/assets/img/` | Logo, favicon, service photos |
| `src/` | The React source: `pages/`, `components/`, `data/`, `lib/`, `context/` (cart), `hooks/`, `styles.css` |
| `src/data/slides.js` | The home page slideshow (pictures and wording) |
| `nginx-customer.conf` | Web-server settings for the VPS |

## Change settings and the shop without rebuilding
Edit these two files **inside `dist/`** on the server (and the same files in `public/` so a later rebuild keeps your changes):
- `config.js`: `API_URL`, WhatsApp number, phone, email, bank details.
- `catalog.json`: the shop. Each product has `id`, `cat` (a category id), `name`, `size`, `price` (naira). Optional: `was` (the old price: shows a Sale badge and lists it under Hot Deals), `featured`, `new`, `img` (for example `/assets/products/rice.jpg`, a file you add under `dist/assets/products/`), `e` (an emoji). A category with `"age18": true` asks buyers to confirm they are 18 or older at checkout. Set `"sample": false` to remove the "sample catalogue" line. **The products and prices in the file are placeholders.**

## Real pictures for categories and products
Each category tile and product card shows a picture when it has one, and its emoji when it does not (no broken images).
1. Take or collect a picture for each item. **`product-photos-checklist.csv`** lists all 108 (14 categories + 94 products) and the exact file name each needs. Aim for 600 x 450 px, JPG, under 150 KB.
2. Put the files in `dist/assets/products/` and `dist/assets/categories/` (and the same in `public/assets/...`), named like `groceries-1.jpg` and `groceries.jpg`.
3. In `catalog.json` set `"photo_folders": true`. Pictures appear at once; items without a file keep the emoji.
You can also give any product or category its own `"img"` address (a file path or web address) instead.
Only use pictures you took or are licensed to use.

## Rebuild after changing the source
```bash
cd customer
npm install
npm run build      # writes a fresh dist/ (keeps config.js and catalog.json from public/)
npm run dev        # optional: live preview while you edit
```

## How the shop works
Customers browse **Shop by Category** (A to Z) or search, add items to the cart (kept on their device), and press **REQUEST QUOTATION FEE** at checkout.
The order goes to WhatsApp and, when `API_URL` is set, to the admin dashboard as a "Shop order". The admin adds the delivery/service fee and sends the payment link,
and the customer pays on the same checkout page as for errands.

Preview on your own computer: `python3 -m http.server 8080 --directory dist` then open http://localhost:8080.
Full setup: `../README.md`.

**Fonts and colours:** the font is set once, in `src/styles.css` (`--font` at the very top); colours are the variables at the top of the same file.
