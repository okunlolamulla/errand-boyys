-- Only for databases that already ran the OLD 001_schema.sql.
-- (A fresh install should just run the new 001_schema.sql and skip this file.)
alter type public.errand_status add value if not exists 'Proof Uploaded' after 'In Progress';
alter type public.errand_status add value if not exists 'Closed';

alter table public.users           add column if not exists is_active boolean not null default true;
alter table public.errand_requests add column if not exists quote_currency text not null default 'NGN'
  check (quote_currency in ('NGN', 'USD'));
alter table public.errand_requests add column if not exists payment_link text;

alter table public.errand_requests drop constraint if exists paid_needs_quote;
alter table public.errand_requests drop constraint if exists work_needs_agent;
alter table public.errand_requests add constraint paid_needs_quote check
  (quote_amount is not null or status::text in ('Pending Review', 'Quoted', 'Closed'));
alter table public.errand_requests add constraint work_needs_agent check
  (assigned_agent_id is not null or status::text not in ('Assigned', 'In Progress', 'Proof Uploaded', 'Completed'));
