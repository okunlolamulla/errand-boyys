# Errand Boys: complete project

Customer website, server (API), admin dashboard and agent dashboard, ready to run on your own VPS.

```
errandboy/
├─ README.md                  this guide
├─ install.sh                 one-command installer for the VPS (also does --update)
├─ customer/                  PUBLIC WEBSITE + SHOP (React)  ->  https://yourdomain.com
│  ├─ dist/                   the finished, ready-to-serve website (this is what nginx serves)
│  │  ├─ config.js            your settings (API address, WhatsApp, phone, email)
│  │  └─ catalog.json         the shop: categories and products (edit freely)
│  ├─ src/                    React source: pages, components, shop cart, slideshow, styles
│  ├─ public/                 images, config.js and catalog.json that are copied into dist/ on a rebuild
│  ├─ package.json, vite.config.js, index.html   build files (only needed to change the source)
│  └─ nginx-customer.conf     web-server settings
└─ admin/                     BEHIND THE SCENES
   ├─ database/supabase-setup.sql   every table, rule and storage folder (the migration)
   ├─ api/                    Node.js + Express server  ->  https://api.yourdomain.com
   ├─ dashboard/              Next.js admin (/) and agent (/agent) dashboards  ->  https://admin.yourdomain.com
   └─ deploy/                 nginx settings for api + dashboard, pm2 process file
```

## Quick install (recommended): one command
You need: a fresh **Ubuntu 22.04/24.04 VPS without cPanel**, your **domain's four A records** (`@`, `www`, `api`, `admin`) pointing at the VPS, and a **Supabase project** with the database script already run (section 8).

1. Upload `errandboy-final.zip` to the VPS (SFTP, or `scp errandboy-final.zip root@YOUR-VPS-IP:~`) and log in with SSH.
2. Run:
   ```bash
   apt-get update && apt-get install -y unzip
   unzip errandboy-final.zip
   cd errandboy
   sudo bash install.sh
   ```
3. Answer the questions (domain, email, Supabase URL and keys, Paystack key). Secret answers are not shown on screen. Leave the Paystack key blank to add it later.
4. The installer then installs Node.js, nginx and pm2, writes your private settings files, builds the dashboard, starts everything so it survives reboots, turns on the firewall (asks first) and requests free HTTPS certificates. It is safe to run again if something fails.
5. Finish the "still to do" list it prints: create your admin login in Supabase, set the Paystack webhook, and run the test in section 6, step 11.

To update later: upload the new folder and run `sudo bash install.sh --update`. It keeps your settings (`.env` files and `config.js`).
Prefer to do it by hand, or want to see what the installer does? Sections 3 to 6 below are the manual steps.

## 1. Checks before deployment, and what was done about them
| Finding | Status |
|---|---|
| The website was one hand-written HTML/JavaScript file | **Converted to React.** Same pages, forms and features: I compared the old and new site on all 31 page views at phone and desktop size (text, links, fields and screenshots matched), then ran 56 scripted browser checks on the new one |
| Pictures were embedded inside the page | **Fixed.** They are separate files in `customer/public/assets/img/` |
| No favicon file | **Added** (`favicon.png`, made from your logo) |
| New: shop with categories, cart and checkout, white top row, slideshow, new font | **Added.** The shop's products and prices in `catalog.json` are **placeholders** you must replace |
| A preview-only admin page that depends on its host's built-in storage | **Not included.** It cannot run on a VPS. The Next.js dashboard in `admin/dashboard` replaces it |
| `.env.example` defaulted the payment gateway to `mock`, which is disabled in production (no payment links would be created) | **Fixed.** Default is now `paystack` |
| An undocumented server setting (`WHATSAPP_TEMPLATE_NAME`) | **Removed.** Every setting the code reads is now in `.env.example` |
| Node version not stated for the dashboard | **Fixed.** `engines: node >= 18.17` (API: `>= 18.18`) |
| No `package-lock.json` files | **Open.** They need internet to create. Run `npm install` once, then keep the lock files and use `npm ci` for repeatable installs |
| No secret keys anywhere in the project | **Checked.** Only `.env.example` templates are included |
| Your VPS itself (OS, control panel, RAM, firewall) | **Check on your server**, see section 3 |

## 2. Does it need Node.js, a database or other server software?
| Part | Needs |
|---|---|
| `customer/` | **Nothing but a web server** (nginx or Apache): it serves the ready-built `customer/dist/`. Node.js is only needed if you change the React source and run `npm run build` |
| `admin/api/` | **Node.js 20 (18.18 minimum)** and npm. Runs as a background process (pm2) |
| `admin/dashboard/` | **Node.js 20 (18.17 minimum)**. It is built once (`npm run build`) then runs as a background process |
| Database | **Yes: Supabase** (hosted PostgreSQL + login + photo storage). It is **not installed on your VPS**. The code uses Supabase's services, so a plain MySQL/MariaDB will not work without rewriting |
| Other software on the VPS | nginx (web server and HTTPS front), certbot (free HTTPS), pm2 (keeps apps running), ufw (firewall) |

## 3. Namecheap VPS: what to confirm
- **Operating system:** this guide assumes **plain Ubuntu 22.04 or 24.04 without cPanel**. If your VPS came with cPanel/WHM, Apache already uses ports 80/443 and will clash with nginx. The easy fix is to reinstall the VPS as plain Ubuntu from your Namecheap panel.
- **Memory:** building the dashboard needs roughly 1.5 to 2 GB of RAM. With 1 GB, add swap first:
  `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`
- **Access:** you need SSH with sudo/root.
- **Network:** ports 80 and 443 must be open in any panel firewall Namecheap shows for the VPS.
- **DNS:** the four domain names in step 2 must point at the VPS IP before you request HTTPS.

## 4. External services the project depends on
| Service | Needed? | Used for |
|---|---|---|
| **Supabase** | Required (API/dashboard) | Database, staff login, photo storage |
| **Paystack** (or Flutterwave) | Required for online payment | Payment links and payment confirmation (webhook) |
| **WhatsApp links (wa.me)** | Used by the website | Opens a chat with your WhatsApp number. No account or key |
| **Google Fonts** | Cosmetic | Page fonts (Bricolage Grotesque, Figtree). If blocked, the browser's standard fonts are used |
| **Resend** | Optional | Emails to customers/agents/admin |
| **WhatsApp Cloud API (Meta)** | Optional | Automatic WhatsApp messages (needs approved templates) |
| **Let's Encrypt** (via certbot) | Required for HTTPS | Free certificates |
| **npm registry, NodeSource** | At install time | Downloading packages |
There is no dependency on any AI service, and no outside map or analytics service.

## 5. Where each key or setting goes
| Setting | File | Notes |
|---|---|---|
| **Paystack secret key** `PAYSTACK_SECRET_KEY` | `admin/api/.env` | **The only place the Paystack key goes.** Start with the test key (`sk_test_...`), switch to live later |
| `PAYMENT_PROVIDER=paystack`, `PAYMENT_CALLBACK_URL`, `PAYMENT_FALLBACK_EMAIL` | `admin/api/.env` | Callback: `https://yourdomain.com/#/paid` |
| Paystack **webhook URL** | Paystack dashboard > Settings > API Keys & Webhooks | `https://api.yourdomain.com/api/webhooks/payment` |
| Supabase URL, anon key, service-role key | `admin/api/.env` | Service-role key is secret |
| `CORS_ORIGINS`, `CUSTOMER_SITE_URL` | `admin/api/.env` | Your website and dashboard addresses |
| Email / WhatsApp keys, `ADMIN_ALERT_EMAIL` | `admin/api/.env` | Optional |
| `NEXT_PUBLIC_API_URL` | `admin/dashboard/.env.local` | Set **before** `npm run build` |
| `API_URL`, WhatsApp, phone, email, bank details | `customer/dist/config.js` (and `customer/public/config.js`) | Public values only. **Never put a secret key here** |
| The shop: categories, products, prices | `customer/dist/catalog.json` (and `customer/public/catalog.json`) | No rebuild needed |
Neither the customer website nor the dashboard contains a Paystack key. Only the server talks to Paystack.

## 6. Install and deploy
Replace `yourdomain.com` with your real domain throughout.

**Step 1. Accounts.** A Supabase project, a Paystack account (test keys are enough to start), and optionally Resend and WhatsApp Cloud API.

**Step 2. DNS.** Add four A records pointing to the VPS IP: `@`, `www`, `api`, `admin`.

**Step 3. Prepare the server** (SSH in):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

**Step 4. Upload** this whole `errandboy` folder to `/var/www/errandboy` (SFTP such as FileZilla, or `scp -r`).

**Step 5. Database.** In Supabase open SQL Editor, paste all of `admin/database/supabase-setup.sql` and run it. Then Authentication > Users > Add user (tick auto-confirm) for yourself, copy the user's UUID, and run:
```sql
insert into public.users (id, name, email, phone, role)
values ('PASTE-THE-UUID', 'Your Name', 'you@example.com', '08012345678', 'admin');
```
Add each agent the same way with role `'agent'`. Note the Supabase URL, anon key and service_role key (Project Settings > API).

**Step 6. API.**
```bash
cd /var/www/errandboy/admin/api
cp .env.example .env && nano .env      # fill it in (see section 5)
chmod 600 .env
npm install --omit=dev
```

**Step 7. Dashboard.**
```bash
cd /var/www/errandboy/admin/dashboard
cp .env.local.example .env.local && nano .env.local   # NEXT_PUBLIC_API_URL=https://api.yourdomain.com
npm install && npm run build
cd ../deploy && pm2 start ecosystem.config.cjs && pm2 save
pm2 startup        # run the one command it prints, so apps restart after a reboot
```

**Step 8. Website settings.** Edit `customer/dist/config.js` (and the same file in `customer/public/`): `API_URL: 'https://api.yourdomain.com'`, and confirm WhatsApp, phone and email. Edit `customer/dist/catalog.json` to put your real products and prices in the shop.

**Step 9. nginx and HTTPS.**
```bash
cd /var/www/errandboy
sed -i 's/yourdomain.com/YOURREALDOMAIN.com/g' customer/nginx-customer.conf admin/deploy/nginx-api.conf admin/deploy/nginx-dashboard.conf
sudo cp customer/nginx-customer.conf /etc/nginx/sites-available/errandboy-customer
sudo cp admin/deploy/nginx-api.conf /etc/nginx/sites-available/errandboy-api
sudo cp admin/deploy/nginx-dashboard.conf /etc/nginx/sites-available/errandboy-dashboard
for s in customer api dashboard; do sudo ln -s /etc/nginx/sites-available/errandboy-$s /etc/nginx/sites-enabled/; done
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d YOURREALDOMAIN.com -d www.YOURREALDOMAIN.com -d api.YOURREALDOMAIN.com -d admin.YOURREALDOMAIN.com
```

**Step 10. Paystack.** Set the webhook URL (section 5). Test mode and live mode have separate keys and separate webhook settings.

**Step 11. Test run (Paystack test key).**
1. On the website request a grocery errand with a photo. Note the Errand ID. Then add two products from the shop to the cart, go to Checkout and press REQUEST QUOTATION FEE: it appears in the admin dashboard as a **Shop order** with the items listed.
2. Sign in at `https://admin.yourdomain.com`: it appears under Incoming requests, photo link under View.
3. Send quote: the checkout link shows the quotation fee and **CHECKOUT WITH PAYSTACK**.
4. Pay with a Paystack test card. You return to the Thank you page (if not, check `PAYMENT_CALLBACK_URL`) and the errand turns **Paid** by itself.
5. Assign an agent, sign in as that agent at `/agent`, and go On the way, In progress, Completed with a proof photo.
6. Approve the proof and close the request. Track the ID on the website to see each stage.
Then put your **live** key in `admin/api/.env` and run `pm2 restart errandboy-api`.

## 7. Routing, authentication and API
**Website pages** (hash routes, so no server rewrites are needed): `#/` Home, `#/services`, `#/service?s=1..8`, `#/shop` (also `?cat=`, `?q=`, `?list=`), `#/cart`, `#/request`, `#/verify`, `#/live`, `#/track`, `#/checkout`, `#/paid`, `#/about`, `#/contact`, `#/terms`, `#/privacy`, `#/refunds`, `#/compliance`.
**Dashboards:** `https://admin.yourdomain.com/` (admin) and `/agent` (agents). Each accepts only its own role.
**Authentication:** staff sign in with the email and password created in Supabase. The API checks it (`POST /api/auth/login`), returns a short-lived token, and every protected call sends `Authorization: Bearer <token>`. Roles (`admin`, `agent`) live in the `users` table. Customers need no account.
**Main API routes:** public `POST /api/errands`, `GET /api/errands/track/:id`; payment webhook `POST /api/webhooks/payment`; admin `GET/PUT /api/admin/...` (errands, quote, payment, assign, complete, close, agents, payment issues); agent `GET /api/agent/errands`, `PUT /api/agent/errands/:id/status`. Full table: `admin/api/README.md`.

## 8. Database and migrations
Everything is in `admin/database/`, with its own guide (`admin/database/README.md`): `supabase-setup.sql` is the complete schema (users, errand requests, status history, payments, the atomic payment function, private photo folders, security rules). Run it once on a new Supabase project, then `verify-install.sql` to confirm, then `create-staff-users.sql` for your admin and agent logins. Later changes will arrive as separate numbered SQL files to run in the same SQL Editor. `older-databases-only/` is only for databases created from an earlier version.

## 9. Updating and troubleshooting
- **Website:** upload the new `customer/dist/` files. If you changed the React source: `cd customer && npm install && npm run build` first. Edits to `config.js` and `catalog.json` need no build.
- **API:** upload, then `cd admin/api && npm ci --omit=dev && pm2 restart errandboy-api`.
- **Dashboard:** upload, then `cd admin/dashboard && npm ci && npm run build && pm2 restart errandboy-dashboard`.
- **Logs:** `pm2 logs errandboy-api`, `pm2 logs errandboy-dashboard`, `sudo tail -n 50 /var/log/nginx/error.log`.
- **"Cannot reach the server" on the website or dashboard:** `CORS_ORIGINS` is missing your address, or `API_URL` / `NEXT_PUBLIC_API_URL` is wrong (the dashboard one needs a rebuild after changing).
- **502 Bad Gateway:** the app is not running: `pm2 status`.
- **Payment made but errand not Paid:** check the webhook URL in Paystack, that the key is the right mode (test vs live), and the API log.

## 10. Before real customers
- Have a Nigerian lawyer review the Terms, Privacy, Refund and Compliance pages (drafts).
- The Contact page's "Successful errands delivered" cards are **samples**: replace or remove them.
- The Nigeria map is illustrative: confirm the cities you serve.
- Add your registered business name/number to Compliance and your social links to Contact.
- Test everything in step 11 with test keys first.

## 11. Honest limits
This code has been syntax-checked, and the website's pages, forms and message formats were tested with scripts. **It has not been run against live Supabase, Paystack, email or WhatsApp accounts**, and it has no automated test suite. Treat step 11 as the real acceptance test. Not built yet: a "create errand" form for staff, agent screens for shopping lists/photos, refund automation.
