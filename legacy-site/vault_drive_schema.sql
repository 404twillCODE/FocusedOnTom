-- Private drive-style vault schema for arbitrary files.
-- Run this in the Supabase SQL Editor.

do $$
begin
  create type public.vault_permission_level as enum (
    'view',
    'download',
    'upload',
    'edit',
    'manage'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vault_upload_status as enum ('pending', 'ready', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.vault_folders(id) on delete cascade,
  name text not null,
  color text,
  sort_order integer not null default 0,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_folders_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.vault_folders(id) on delete set null,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  r2_key text not null unique,
  upload_status public.vault_upload_status not null default 'pending',
  checksum text,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_files_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.vault_folder_permissions (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.vault_folders(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  grantee_email text not null,
  grantee_user_id uuid references auth.users(id) on delete set null,
  permission public.vault_permission_level not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_folder_permissions_email_lower check (grantee_email = lower(grantee_email))
);

create table if not exists public.vault_file_permissions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.vault_files(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  grantee_email text not null,
  grantee_user_id uuid references auth.users(id) on delete set null,
  permission public.vault_permission_level not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_file_permissions_email_lower check (grantee_email = lower(grantee_email))
);

create table if not exists public.vault_share_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  grantee_email text not null,
  item_type text not null check (item_type in ('folder', 'file')),
  folder_id uuid references public.vault_folders(id) on delete cascade,
  file_id uuid references public.vault_files(id) on delete cascade,
  permission public.vault_permission_level not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint vault_share_invites_target check (
    (item_type = 'folder' and folder_id is not null and file_id is null)
    or (item_type = 'file' and file_id is not null and folder_id is null)
  ),
  constraint vault_share_invites_email_lower check (grantee_email = lower(grantee_email))
);

create table if not exists public.vault_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  action text not null,
  item_type text not null check (item_type in ('folder', 'file', 'share', 'system')),
  folder_id uuid references public.vault_folders(id) on delete set null,
  file_id uuid references public.vault_files(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_vault_folders_owner_parent
  on public.vault_folders (owner_id, parent_id, trashed_at, name);
create index if not exists idx_vault_files_owner_folder
  on public.vault_files (owner_id, folder_id, trashed_at, name);
create index if not exists idx_vault_files_created_at
  on public.vault_files (created_at desc);
create unique index if not exists idx_vault_folder_permissions_unique_email
  on public.vault_folder_permissions (folder_id, grantee_email);
create unique index if not exists idx_vault_file_permissions_unique_email
  on public.vault_file_permissions (file_id, grantee_email);
create index if not exists idx_vault_folder_permissions_email
  on public.vault_folder_permissions (grantee_email, folder_id);
create index if not exists idx_vault_file_permissions_email
  on public.vault_file_permissions (grantee_email, file_id);
create index if not exists idx_vault_activity_owner_created
  on public.vault_activity_log (owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vault_folders_updated_at on public.vault_folders;
create trigger trg_vault_folders_updated_at
before update on public.vault_folders
for each row execute function public.set_updated_at();

drop trigger if exists trg_vault_files_updated_at on public.vault_files;
create trigger trg_vault_files_updated_at
before update on public.vault_files
for each row execute function public.set_updated_at();

drop trigger if exists trg_vault_folder_permissions_updated_at on public.vault_folder_permissions;
create trigger trg_vault_folder_permissions_updated_at
before update on public.vault_folder_permissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_vault_file_permissions_updated_at on public.vault_file_permissions;
create trigger trg_vault_file_permissions_updated_at
before update on public.vault_file_permissions
for each row execute function public.set_updated_at();

alter table public.vault_folders enable row level security;
alter table public.vault_files enable row level security;
alter table public.vault_folder_permissions enable row level security;
alter table public.vault_file_permissions enable row level security;
alter table public.vault_share_invites enable row level security;
alter table public.vault_activity_log enable row level security;

drop policy if exists "Vault folders owner read" on public.vault_folders;
create policy "Vault folders owner read"
on public.vault_folders for select
using (auth.uid() = owner_id);

drop policy if exists "Vault folders shared read" on public.vault_folders;
create policy "Vault folders shared read"
on public.vault_folders for select
using (
  exists (
    select 1 from public.vault_folder_permissions fp
    where fp.folder_id = vault_folders.id
      and (
        fp.grantee_user_id = auth.uid()
        or fp.grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Vault folders owner write" on public.vault_folders;
create policy "Vault folders owner write"
on public.vault_folders for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Vault files owner read" on public.vault_files;
create policy "Vault files owner read"
on public.vault_files for select
using (auth.uid() = owner_id);

drop policy if exists "Vault files shared read" on public.vault_files;
create policy "Vault files shared read"
on public.vault_files for select
using (
  exists (
    select 1 from public.vault_file_permissions fp
    where fp.file_id = vault_files.id
      and (
        fp.grantee_user_id = auth.uid()
        or fp.grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  or exists (
    select 1 from public.vault_folder_permissions fp
    where fp.folder_id = vault_files.folder_id
      and (
        fp.grantee_user_id = auth.uid()
        or fp.grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Vault files owner write" on public.vault_files;
create policy "Vault files owner write"
on public.vault_files for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Vault folder permission relevant read" on public.vault_folder_permissions;
create policy "Vault folder permission relevant read"
on public.vault_folder_permissions for select
using (
  auth.uid() = owner_id
  or grantee_user_id = auth.uid()
  or grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Vault folder permission owner write" on public.vault_folder_permissions;
create policy "Vault folder permission owner write"
on public.vault_folder_permissions for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Vault file permission relevant read" on public.vault_file_permissions;
create policy "Vault file permission relevant read"
on public.vault_file_permissions for select
using (
  auth.uid() = owner_id
  or grantee_user_id = auth.uid()
  or grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Vault file permission owner write" on public.vault_file_permissions;
create policy "Vault file permission owner write"
on public.vault_file_permissions for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Vault share invite relevant read" on public.vault_share_invites;
create policy "Vault share invite relevant read"
on public.vault_share_invites for select
using (
  auth.uid() = owner_id
  or grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Vault share invite owner write" on public.vault_share_invites;
create policy "Vault share invite owner write"
on public.vault_share_invites for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Vault activity relevant read" on public.vault_activity_log;
create policy "Vault activity relevant read"
on public.vault_activity_log for select
using (auth.uid() = owner_id or auth.uid() = actor_id);

drop policy if exists "Vault activity actor insert" on public.vault_activity_log;
create policy "Vault activity actor insert"
on public.vault_activity_log for insert
with check (auth.uid() = actor_id);
