-- Admin CRM schema for /websites/admin
-- Run in Supabase SQL editor.

create table if not exists public.admin_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  website_url text,
  pipeline_stage text not null default 'new_lead' check (pipeline_stage in ('new_lead', 'in_progress', 'completed', 'paused')),
  preferred_method text not null default 'call' check (preferred_method in ('text', 'call', 'email')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  next_follow_up date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_notepad (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_leads_user_updated on public.admin_leads (user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_admin_leads_updated_at on public.admin_leads;
create trigger trg_admin_leads_updated_at
before update on public.admin_leads
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_notepad_updated_at on public.admin_notepad;
create trigger trg_admin_notepad_updated_at
before update on public.admin_notepad
for each row execute function public.set_updated_at();

alter table public.admin_leads enable row level security;
alter table public.admin_notepad enable row level security;

drop policy if exists "Users can read own admin leads" on public.admin_leads;
create policy "Users can read own admin leads"
on public.admin_leads
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own admin leads" on public.admin_leads;
create policy "Users can insert own admin leads"
on public.admin_leads
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own admin leads" on public.admin_leads;
create policy "Users can update own admin leads"
on public.admin_leads
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own admin leads" on public.admin_leads;
create policy "Users can delete own admin leads"
on public.admin_leads
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own notepad" on public.admin_notepad;
create policy "Users can read own notepad"
on public.admin_notepad
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notepad" on public.admin_notepad;
create policy "Users can insert own notepad"
on public.admin_notepad
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notepad" on public.admin_notepad;
create policy "Users can update own notepad"
on public.admin_notepad
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notepad" on public.admin_notepad;
create policy "Users can delete own notepad"
on public.admin_notepad
for delete
using (auth.uid() = user_id);
