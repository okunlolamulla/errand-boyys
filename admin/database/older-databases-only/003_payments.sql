-- Payment records + the function that applies a confirmed payment.
-- Fresh installs: this is already appended to 001_schema.sql. Existing databases: run this file once.

create table if not exists public.payments (
  id               bigint generated always as identity primary key,
  errand_id        text not null references public.errand_requests(errand_id) on delete cascade,
  provider         text not null check (provider in ('paystack', 'flutterwave', 'mock')),
  reference        text not null unique,                 -- our reference, sent to the gateway
  amount           numeric(12,2) not null check (amount > 0),
  currency         text not null check (currency in ('NGN', 'USD')),
  checkout_url     text,
  -- pending : link created, not paid yet
  -- paid    : confirmed and applied to the errand
  -- stale   : money arrived but the quote changed / the errand moved on (needs a human)
  -- mismatch: amount or currency differed from what we asked for (needs a human)
  -- resolved: a human reviewed a stale/mismatch payment
  status           text not null default 'pending' check (status in ('pending', 'paid', 'stale', 'mismatch', 'resolved')),
  provider_txn_id  text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists payments_errand_idx on public.payments (errand_id);
create index if not exists payments_status_idx on public.payments (status);
alter table public.payments enable row level security;   -- no policies: only the API (service role) can touch it

-- Applies a confirmed payment in ONE transaction, so a webhook that arrives twice
-- (gateways retry) or two at once can never pay an errand twice.
-- Returns: 'paid' | 'already_processed' | 'unknown_reference' | 'mismatch' | 'stale'
create or replace function public.confirm_payment(
  p_provider text, p_reference text, p_amount_minor bigint, p_currency text, p_txn_id text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
  err public.errand_requests;
begin
  select * into pay from public.payments
   where reference = p_reference and provider = p_provider for update;
  if not found then return 'unknown_reference'; end if;
  if pay.status <> 'pending' then return 'already_processed'; end if;

  if round(pay.amount * 100)::bigint <> p_amount_minor or pay.currency <> p_currency then
    update public.payments set status = 'mismatch', provider_txn_id = p_txn_id, paid_at = now() where id = pay.id;
    return 'mismatch';
  end if;

  select * into err from public.errand_requests where errand_id = pay.errand_id for update;
  if err.status::text <> 'Quoted' or err.payment_reference is distinct from pay.reference then
    update public.payments set status = 'stale', provider_txn_id = p_txn_id, paid_at = now() where id = pay.id;
    return 'stale';
  end if;

  update public.payments set status = 'paid', provider_txn_id = p_txn_id, paid_at = now() where id = pay.id;
  update public.errand_requests set status = 'Paid', paid_at = now() where errand_id = err.errand_id;
  insert into public.errand_status_history (errand_id, from_status, to_status, note)
    values (err.errand_id, 'Quoted', 'Paid', 'Paid via ' || p_provider || ' (' || p_reference || ')');
  return 'paid';
end $$;

-- PostgREST exposes public functions as /rpc/... Only the server may call this one.
revoke all on function public.confirm_payment(text, text, bigint, text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, text, bigint, text, text) to service_role;
