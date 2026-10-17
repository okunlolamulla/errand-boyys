-- 006: admin dashboard controls (safe to run more than once)
--   * services          the nine errand services, switch on/off, edit the text and the "from" fee
--   * customers         one row per customer (matched on phone number), filled automatically
--   * approval columns  approve / disapprove a customer's errand
--   * admin_overview()  totals for the dashboard home page
--   * customer_summary  customers with their order counts and spend
--   * payments          extra columns used when checking a payment with Paystack
-- New installs get all of this from supabase-setup.sql already; run this file only on a database that was
-- set up before the admin controls existed.

create extension if not exists pgcrypto;

-- ------------------------------------------------- forced password change
-- The default admin login is created with this flag on: the dashboard makes the person choose a new password at first sign-in.
alter table public.users add column if not exists must_change_password boolean not null default false;

-- ------------------------------------------------------------ services
create table if not exists public.services (
  id          int generated always as identity primary key,
  name        text not null unique,                 -- must match the service_type the website sends
  slug        text not null unique,
  description text,
  icon        text,
  base_fee    numeric(12,2) check (base_fee is null or base_fee >= 0),  -- optional "from" price shown to staff
  currency    text not null default 'NGN' check (currency in ('NGN', 'USD')),
  is_active   boolean not null default true,        -- off = the API refuses new requests for this service
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.services enable row level security;

insert into public.services (name, slug, description, icon, sort_order) values
  ('Grocery shopping',    'grocery-shopping',    'We shop your list at the market or supermarket of your choice and deliver it to your door.', '🛒', 1),
  ('Moving service',      'moving-service',      'Packing help, loading and moving of your belongings from one home or office to another.',    '🚚', 2),
  ('Pharmacy pickup',     'pharmacy-pickup',     'We collect your prescription or medicines from a pharmacy and bring them to you.',           '💊', 3),
  ('Office errand',       'office-errand',       'Document drop-offs, collections, bank runs and other office tasks done for you.',            '🏢', 4),
  ('House hunting',       'house-hunting',       'We scout and view properties that match your budget and area, and report back with photos.',  '🏠', 5),
  ('Verification errand', 'verification-errand', 'We visit an address, business or person and confirm that things are as they were described.', '✅', 6),
  ('Custom errand',       'custom-errand',       'Anything else you need done: tell us the task and we will quote you.',                       '✨', 7),
  ('Car service',         'car-service',         'We take your car for servicing, washing, inspection or paperwork and bring it back.',        '🚗', 8),
  ('Care giving services','care-giving-services','Trusted help to look after an elderly person, a child or a patient at home.',               '🤝', 9)
on conflict (name) do nothing;

drop trigger if exists services_updated on public.services;
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------- customers
create or replace function public.phone_key(p text) returns text
language sql immutable as $$ select nullif(right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10), '') $$;

create table if not exists public.customers (
  id          bigint generated always as identity primary key,
  phone_key   text not null unique,                 -- last 10 digits of the phone number: how repeat customers are recognised
  name        text not null,
  phone       text not null,
  email       text,
  notes       text,                                 -- staff notes
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.customers enable row level security;
drop trigger if exists customers_updated on public.customers;
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.errand_requests add column if not exists customer_id bigint references public.customers(id) on delete set null;
create index if not exists errand_requests_customer_idx on public.errand_requests (customer_id);

-- Every new errand finds or creates its customer.
create or replace function public.link_customer() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; cid bigint;
begin
  k := public.phone_key(new.contact_info->>'phone');
  if k is null then return new; end if;
  insert into public.customers (phone_key, name, phone, email)
    values (k, new.contact_info->>'name', new.contact_info->>'phone', nullif(new.contact_info->>'email', ''))
  on conflict (phone_key) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into cid;
  new.customer_id := cid;
  return new;
end $$;
drop trigger if exists errand_requests_link_customer on public.errand_requests;
create trigger errand_requests_link_customer before insert on public.errand_requests
  for each row execute function public.link_customer();

-- Fill in customers for errands that already exist (newest details win).
insert into public.customers (phone_key, name, phone, email)
select distinct on (public.phone_key(contact_info->>'phone'))
       public.phone_key(contact_info->>'phone'), contact_info->>'name', contact_info->>'phone', nullif(contact_info->>'email', '')
  from public.errand_requests
 where public.phone_key(contact_info->>'phone') is not null
 order by public.phone_key(contact_info->>'phone'), created_at desc
on conflict (phone_key) do nothing;

update public.errand_requests e set customer_id = c.id
  from public.customers c
 where e.customer_id is null and c.phone_key = public.phone_key(e.contact_info->>'phone');

-- ------------------------------------------------------------ approval
alter table public.errand_requests
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approval_note   text,
  add column if not exists approval_by     uuid references public.users(id) on delete set null,
  add column if not exists approval_at     timestamptz;
do $$ begin
  alter table public.errand_requests add constraint approval_status_values
    check (approval_status in ('pending', 'approved', 'disapproved'));
exception when duplicate_object then null; end $$;
create index if not exists errand_requests_approval_idx on public.errand_requests (approval_status);

-- Errands that were already moving before this feature existed count as approved.
update public.errand_requests set approval_status = 'approved', approval_at = coalesce(approval_at, updated_at)
 where approval_status = 'pending' and status::text not in ('Pending Review', 'Closed');

-- ------------------------------------------------------------ payments
alter table public.payments
  add column if not exists gateway_status text,        -- what the gateway itself said when staff pressed "Check with Paystack"
  add column if not exists verified_at timestamptz;

-- ------------------------------------------------- dashboard overview
create or replace view public.customer_summary as
select c.id, c.name, c.phone, c.email, c.notes, c.created_at,
       count(e.errand_id)                                                        as orders,
       count(e.errand_id) filter (where e.paid_at is not null)                   as paid_orders,
       coalesce(sum(e.quote_amount) filter (where e.paid_at is not null and e.quote_currency = 'NGN'), 0) as spent_ngn,
       coalesce(sum(e.quote_amount) filter (where e.paid_at is not null and e.quote_currency = 'USD'), 0) as spent_usd,
       max(e.created_at)                                                         as last_order_at
  from public.customers c
  left join public.errand_requests e on e.customer_id = c.id
 group by c.id;
revoke all on public.customer_summary from public, anon, authenticated;
grant select on public.customer_summary to service_role;

create or replace function public.admin_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'customers',         (select count(*) from customers),
    'orders',            (select count(*) from errand_requests),
    'paid_orders',       (select count(*) from errand_requests where paid_at is not null),
    'awaiting_approval', (select count(*) from errand_requests where approval_status = 'pending' and status::text <> 'Closed'),
    'active_orders',     (select count(*) from errand_requests where status::text not in ('Completed', 'Closed')),
    'completed_orders',  (select count(*) from errand_requests where status::text in ('Completed', 'Closed') and approval_status <> 'disapproved'),
    'payment_issues',    (select count(*) from payments where status in ('stale', 'mismatch')),
    'revenue',           coalesce((select jsonb_object_agg(quote_currency, total)
                                     from (select quote_currency, sum(quote_amount) total from errand_requests
                                            where paid_at is not null group by quote_currency) r), '{}'::jsonb),
    'revenue_30d',       coalesce((select jsonb_object_agg(quote_currency, total)
                                     from (select quote_currency, sum(quote_amount) total from errand_requests
                                            where paid_at >= now() - interval '30 days' group by quote_currency) r), '{}'::jsonb),
    'by_status',         coalesce((select jsonb_object_agg(status, n) from (select status::text status, count(*) n from errand_requests group by 1) s), '{}'::jsonb),
    'by_service',        coalesce((select jsonb_agg(jsonb_build_object('service', service_type, 'orders', n, 'revenue_ngn', rev) order by n desc)
                                     from (select service_type, count(*) n,
                                                  coalesce(sum(quote_amount) filter (where paid_at is not null and quote_currency = 'NGN'), 0) rev
                                             from errand_requests group by 1) s), '[]'::jsonb),
    'daily',             coalesce((select jsonb_agg(jsonb_build_object('day', d::date,
                                        'orders',  (select count(*) from errand_requests where created_at::date = d::date),
                                        'revenue', (select coalesce(sum(quote_amount), 0) from errand_requests where paid_at::date = d::date and quote_currency = 'NGN')) order by d)
                                     from generate_series(current_date - 13, current_date, interval '1 day') d), '[]'::jsonb)
  )
$$;
revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;
