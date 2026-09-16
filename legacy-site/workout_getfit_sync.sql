-- GetFit cross-device sync table
-- Run this in Supabase SQL editor.

create table if not exists public.workout_getfit_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_workout_getfit_sync_updated_at
  on public.workout_getfit_sync (updated_at desc);

alter table public.workout_getfit_sync enable row level security;

drop policy if exists "Users can read own getfit sync" on public.workout_getfit_sync;
create policy "Users can read own getfit sync"
  on public.workout_getfit_sync
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own getfit sync" on public.workout_getfit_sync;
create policy "Users can insert own getfit sync"
  on public.workout_getfit_sync
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own getfit sync" on public.workout_getfit_sync;
create policy "Users can update own getfit sync"
  on public.workout_getfit_sync
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own getfit sync" on public.workout_getfit_sync;
create policy "Users can delete own getfit sync"
  on public.workout_getfit_sync
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_workout_getfit_sync_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workout_getfit_sync_updated_at on public.workout_getfit_sync;
create trigger workout_getfit_sync_updated_at
before update on public.workout_getfit_sync
for each row
execute function public.set_workout_getfit_sync_updated_at();

