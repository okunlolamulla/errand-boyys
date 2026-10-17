# errandboy/admin: everything behind the scenes

| Folder | What it is |
|---|---|
| `database/supabase-setup.sql` | Run once in Supabase. Creates every table, rule and storage folder |
| `api/` | The Errand Boys server (Node.js + Express): requests, quotes, payments, webhooks, notifications, agent jobs |
| `dashboard/` | The Next.js app: **admin dashboard** at `/` and **agent dashboard** at `/agent` |
| `deploy/` | Server files: nginx settings for the API and dashboard, and the pm2 file that keeps them running |

Setup, in order, is in **`../README.md`**. Each of `api/` and `dashboard/` also has its own README with details.

## What the admin dashboard does
Sign in at the dashboard address. The side menu has:

| Section | What you do there |
|---|---|
| **Dashboard overview** | Total customers, orders and revenue, a 14-day chart, orders by status and by service |
| **Order management** | Search and filter every order, open it, send a quote, record a manual payment, export to CSV |
| **Customer management** | See every customer, their orders and total spent, and keep private notes |
| **Services management** | Edit, reorder or switch off any of the nine errand services (off = the website stops taking new requests for it) |
| **Payments & transactions** | Every Paystack payment with its status; **Check with Paystack** asks Paystack directly and applies a payment the webhook missed |
| **Errand tracking** | See each errand's progress and **approve or disapprove** it (a reason is required to disapprove; this closes it before payment) |
| **Stock management** | Add, edit and remove products and categories in the customer shop, upload pictures, set prices and quantities, mark items out of stock. Products sell out by themselves when the count reaches zero |
| **Customer carts** | What shoppers have in their carts right now (and carts that became orders). Each shop order also lists its items inside the order |
| **Workflow board** | The original three-tab board: incoming, paid & assignment, status monitor |

Set `REQUIRE_APPROVAL=true` in `api/.env` if you want quotes blocked until an order has been approved.

## First sign-in, and forgotten passwords
**Default admin login** (created by one command, after `api/.env` has your Supabase keys):

```
cd admin/api
npm run create-admin
```
| | |
|---|---|
| Email | `admin@errandboys.com` |
| Password | `ErrandBoys@2026` |

The dashboard makes you choose a new password the first time you sign in, and nothing else works until you do. To use your own email as the first admin, set `ADMIN_EMAIL` (and optionally `ADMIN_PASSWORD`, `ADMIN_NAME`) before running the command. Locked out? `npm run create-admin -- --reset` puts the default password back.

**Forgot password:** the sign-in page has a "Forgot password?" link. It emails a link that opens `/reset-password` on the dashboard, where the person chooses a new password. Signed-in staff can also use **Change password** at the bottom of the side menu. For the emailed link to work:
1. Put your dashboard address in `api/.env` as `DASHBOARD_URL` (for example `https://admin.yourdomain.com`).
2. In Supabase, **Authentication > URL Configuration**, add `https://admin.yourdomain.com/reset-password` under *Redirect URLs*.
3. The reset email must go to an address that can receive mail. The default `admin@errandboys.com` only receives mail if you own that domain: otherwise create your first admin with `ADMIN_EMAIL` set to your own email.
4. Supabase's built-in email sender is limited to a few emails an hour. For real use, add your own SMTP under **Authentication > Emails > SMTP Settings**.

## How the shop and stock connect
Put your API address in `customer/public/config.js` (and `customer/dist/config.js`) as `API_URL`. The website then loads its products from the API, so everything you change in **Stock management** shows on the shop within about 30 seconds. If the API cannot be reached the site falls back to `catalog.json`, so the shop never goes blank. When a customer places a shop order the server checks the stock, takes the items off it, and refuses the order (with a clear message) if something has just run out. Prices are always taken from your stock list, never from the customer's browser.

New product pictures are uploaded to a public Supabase folder named `shop`. Set `NEXT_PUBLIC_SITE_URL` in `dashboard/.env.local` to your website address so the original product photos also show in the stock table.
