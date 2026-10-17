# Errand Boys database (Supabase / PostgreSQL)

One database serves the **customer website** (through the API), the **admin dashboard**, the **agent dashboard** and the **payment webhook**.
Nothing here runs on your VPS: it runs in your Supabase project.

| File | When to use it |
|---|---|
| `supabase-setup.sql` | **Fresh install. Run this once.** Creates every table, rule, function and photo folder |
| `verify-install.sql` | Run right after, to confirm everything exists. Each query says what you should see |
| `create-staff-users.sql` | Template to give your admin and agent logins their roles |
| `older-databases-only/` | Skip this unless you already ran an **older version** of the setup file (see the end) |

## Install (about 5 minutes)
1. Create a project at supabase.com and wait until it is ready.
2. Open **SQL Editor > New query**, paste all of `supabase-setup.sql`, press **Run**. It should finish without errors.
3. Open a new query, paste `verify-install.sql`, run it, and compare with the "expect" notes.
4. Create the default admin login by running `npm run create-admin` in `admin/api` (see `../README.md`), or create your logins by hand: **Authentication > Users > Add user** (tick *Auto confirm user*), then run `create-staff-users.sql` with the user's UUID filled in.
5. Copy three values from **Project Settings > API** into `admin/api/.env`: the project URL, the `anon` key and the `service_role` key.

## Tables
Statuses of an errand, in order: Pending Review → Quoted → Paid → Assigned → On the way → In Progress → Proof Uploaded → Completed → Closed.
Roles: customer, agent, admin.

### `users`
Staff and customers with a role. Each row matches a login created in Supabase Authentication.

| Column | Type and rules | Notes |
|---|---|---|
| `id` | uuid primary key references auth.users(id) on delete cascade |  |
| `name` | text not null check (length(trim(name)) between 2 and 100) |  |
| `email` | text not null |  |
| `phone` | text |  |
| `role` | public.user_role not null default 'customer' |  |
| `is_active` | boolean not null default true | inactive agents are hidden from the assign dropdown |
| `created_at` | timestamptz not null default now() |  |
| `updated_at` | timestamptz not null default now() |  |

### `errand_requests`
One row per errand: what the customer asked for, price, payment, agent, proof and photos.

| Column | Type and rules | Notes |
|---|---|---|
| `errand_id` | text primary key default public.generate_errand_id() |  |
| `service_type` | text not null |  |
| `task_description` | text not null check (length(trim(task_description)) >= 5) |  |
| `pickup_location` | text |  |
| `delivery_location` | text |  |
| `date_time` | timestamptz | when the customer wants it done |
| `contact_info` | jsonb not null | {"name": "...", "phone": "...", "email": "..."} |
| `status` | public.errand_status not null default 'Pending Review' |  |
| `quote_amount` | numeric(12,2) check (quote_amount is null or quote_amount > 0) |  |
| `quote_currency` | text not null default 'NGN' check (quote_currency in ('NGN', 'USD')) |  |
| `payment_link` | text | Paystack checkout link sent to the customer |
| `assigned_agent_id` | uuid references public.users(id) on delete restrict |  |
| `proof_notes` | text |  |
| `proof_urls` | text[] not null default '{}' | private Storage paths in the "proofs" bucket |
| `details` | jsonb not null default '{}'::jsonb | extra form answers, e.g. grocery: shopping_list, brands, budget, supermarket, landmark, instructions |
| `request_files` | text[] not null default '{}' | customer photos (e.g. shopping list), private "requests" bucket |
| `payment_reference` | text unique | Paystack reference (manual for now) |
| `paid_at` | timestamptz |  |
| `created_at` | timestamptz not null default now() |  |
| `updated_at` | timestamptz not null default now() |  |

### `errand_status_history`
Audit trail: every status change, who made it and when.

| Column | Type and rules | Notes |
|---|---|---|
| `id` | bigint generated always as identity primary key |  |
| `errand_id` | text not null references public.errand_requests(errand_id) on delete cascade |  |
| `from_status` | public.errand_status |  |
| `to_status` | public.errand_status not null |  |
| `actor_id` | uuid references public.users(id) on delete set null |  |
| `note` | text |  |
| `created_at` | timestamptz not null default now() |  |

### `payments`
Every checkout link created for an errand and what happened to it.

| Column | Type and rules | Notes |
|---|---|---|
| `id` | bigint generated always as identity primary key |  |
| `errand_id` | text not null references public.errand_requests(errand_id) on delete cascade |  |
| `provider` | text not null check (provider in ('paystack', 'flutterwave', 'mock')) |  |
| `reference` | text not null unique | our reference, sent to the gateway |
| `amount` | numeric(12,2) not null check (amount > 0) |  |
| `currency` | text not null check (currency in ('NGN', 'USD')) |  |
| `checkout_url` | text |  |
| `status` | text not null default 'pending' check (status in ('pending', 'paid', 'stale', 'mismatch', 'resolved')) |  |
| `provider_txn_id` | text |  |
| `paid_at` | timestamptz |  |
| `created_at` | timestamptz not null default now() |  |

Rules the database enforces by itself: an errand ID looks like `EB-` plus 6 letters/numbers and is unique; a quote must be above zero; an errand cannot be Paid or later without a quote, nor Assigned or later without an agent; a payment reference can only be used once; every row's `updated_at` refreshes automatically.

### `services`
The nine errand services (plus anything you add). Columns: `name` (must match what the website sends), `slug`, `description`, `icon`, `base_fee` + `currency` (optional "from" price), `is_active` (off = new requests for it are refused), `sort_order`. Edited from **Services management** in the admin dashboard.

### `customers`
One row per customer, matched on the last 10 digits of their phone number, so a repeat customer is one row however they write the number. Created automatically by a trigger whenever an errand is submitted (`errand_requests.customer_id` points to it). `notes` holds staff notes.

### `product_categories` and `products`
The customer shop. A product has `name`, `size`, `price`, optional `was_price` (shows as a Sale), `featured`, `is_new`, `img`, `in_stock`, and `stock_qty` (empty = quantity not counted; a counted product turns out of stock by itself at zero). The 14 starting categories and 94 products are loaded by the setup file; edit them in **Stock management**.

### `order_items` and `carts`
`order_items`: the items inside each shop order, with the price at the time. `carts`: what customers currently have in their baskets (`open`) and carts that became orders (`ordered`).

### `users.must_change_password`
True for the default admin account until its password is changed. While it is true the API refuses every request except changing the password.

### New columns on `errand_requests` and `payments`
- `errand_requests.approval_status` (`pending` / `approved` / `disapproved`), `approval_note`, `approval_by`, `approval_at`: the approve / disapprove decision made in **Errand tracking**. Disapproving also closes the errand (only before it is paid).
- `payments.gateway_status`, `payments.verified_at`: what Paystack itself reported when staff pressed **Check with Paystack**.

### View `customer_summary`
Each customer with their order count, paid orders, total spent and last order date. Used by **Customer management**.

## Functions
- `admin_overview()`: all the numbers on the dashboard home page in one call (customers, orders, revenue, status and service breakdowns, last 14 days). Only the server can call it.
- `place_order_items(errand_id, items)`: saves a shop order's items and takes them off the stock in one safe step; it refuses if anything is out of stock. Only the server can call it.
- `phone_key(text)` and `link_customer()`: build the customer match key and attach each new errand to its customer.
- `generate_errand_id()`: creates the unique `EB-XXXXXX` ID for new errands.
- `confirm_payment(...)`: applies a payment that Paystack has confirmed, in one safe step. It handles repeated notifications, wrong amounts and payments for an out-of-date quote, and only the server can call it.
- `set_updated_at()`: keeps `updated_at` current.

## Photo storage
- `shop` (public): product pictures uploaded from the admin dashboard.
- `requests`: photos customers attach when requesting an errand (shopping lists, items, prescriptions).
- `proofs`: proof photos agents upload when they finish.
Both are private. Staff see them through links that expire after one hour.

## Security model
- **Row-level security is on for every table, with no public policies.** Supabase's public keys can read and write nothing.
- Only the Errand Boys server, using the secret `service_role` key, reads and writes data. Keep that key only in `admin/api/.env`.
- `confirm_payment` is locked so that only the server key can run it.
- Prescription photos are health information: they stay in the private `requests` folder and are shared only through expiring links.

## Who uses what
| Part | Reads / writes |
|---|---|
| Customer website (via the API) | creates `errand_requests` (with `details` and photos); reads status for tracking |
| Admin dashboard | reads everything; writes quotes, payments, assignments, status, history, approvals, services, customer notes |
| Agent dashboard | reads its own jobs; writes status and proof |
| Payment webhook | runs `confirm_payment` and writes `payments` |

## If you ran an older version of the setup file
Only then, run the files in `older-databases-only/` in order: `002_upgrade.sql`, `003_payments.sql`, `004_agent_flow.sql`, `005_request_details.sql`, `006_admin_controls.sql`, `007_stock_and_carts.sql`. If your database was set up before the admin controls existed (you have no `services` table), run just `006_admin_controls.sql` and then `007_stock_and_carts.sql`: it is safe to repeat, and it fills in customers and approval for errands you already have. A new install never needs them.

## Good to know
- Backups depend on your Supabase plan. Check what yours includes before real customers arrive, and download a copy of the data regularly.
- To start over during testing, the simplest way is a new Supabase project and running the setup file again.
- These scripts were checked for ordering and consistency, but **have not been run on a live Supabase project here**. Step 3 above is the real test.
