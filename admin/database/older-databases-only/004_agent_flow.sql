-- Adds the "On the way" status for agents. Run once on databases created before this change.
-- (A fresh install already has it in 001_schema.sql.)
alter type public.errand_status add value if not exists 'On the way' after 'Assigned';

alter table public.errand_requests drop constraint if exists work_needs_agent;
alter table public.errand_requests add constraint work_needs_agent check
  (assigned_agent_id is not null or status::text not in ('Assigned', 'On the way', 'In Progress', 'Proof Uploaded', 'Completed'));
