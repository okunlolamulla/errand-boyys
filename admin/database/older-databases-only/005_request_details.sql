-- Grocery (and other) request details + customer photos. Run once on databases created before this change.
alter table public.errand_requests add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.errand_requests add column if not exists request_files text[] not null default '{}';
insert into storage.buckets (id, name, public) values ('requests', 'requests', false)
on conflict (id) do nothing;
