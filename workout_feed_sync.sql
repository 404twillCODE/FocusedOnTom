-- Feed sync requirements for GetFit tracker completions.
-- Run in Supabase SQL editor.

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  workout_type text not null,
  workout_name text,
  reps integer,
  sets integer,
  lbs numeric,
  duration_min integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_logs_created_at
  on public.workout_logs (created_at desc);

create index if not exists idx_workout_logs_user_date
  on public.workout_logs (user_id, date desc);

alter table public.workout_logs enable row level security;

drop policy if exists "Anyone can read workout logs" on public.workout_logs;
create policy "Anyone can read workout logs"
  on public.workout_logs
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert own logs" on public.workout_logs;
create policy "Users can insert own logs"
  on public.workout_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own logs" on public.workout_logs;
create policy "Users can update own logs"
  on public.workout_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own logs" on public.workout_logs;
create policy "Users can delete own logs"
  on public.workout_logs
  for delete
  using (auth.uid() = user_id);

-- Feed joins profiles. Make sure authenticated users can read profile basics.
alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

