-- Explore New York — Phase 2A schema
-- Safe to re-run. Does not drop data. Does not modify photography/workout tables
-- except unused-name tables (places, trips, etc. do not currently exist).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create table if not exists public.explore_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function private.is_explore_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.explore_admins where user_id = auth.uid()
  );
$$;

revoke all on function private.is_explore_admin() from public;
grant execute on function private.is_explore_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Official sources + imported government fields
-- ---------------------------------------------------------------------------

create table if not exists public.official_sources (
  id text primary key,
  name text not null,
  agency text,
  dataset_name text,
  source_url text,
  license text,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists official_sources_updated_at on public.official_sources;
create trigger official_sources_updated_at before update on public.official_sources for each row execute function public.set_updated_at();

create table if not exists public.geo_boundaries (
  id text primary key,
  name text not null,
  source_url text,
  geojson jsonb not null,
  fetched_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key,
  slug text not null unique,
  name text not null,
  place_type text not null,
  latitude double precision not null,
  longitude double precision not null,
  county text,
  region text,
  description text,
  personal_status text not null default 'unvisited'
    check (personal_status in ('unvisited', 'want_to_visit', 'visited')),
  last_personally_verified date,
  official_source_id text references public.official_sources (id),
  official_source_record_id text,
  managing_agency text,
  official_website text,
  access_info text,
  amenities text[],
  regulations text,
  cover_image text,
  parent_place_id text references public.places (id) on delete set null,
  merge_into_place_id text references public.places (id) on delete set null,
  is_hidden boolean not null default false,
  seed_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists places_official_record_uidx
  on public.places (official_source_id, official_source_record_id)
  where official_source_id is not null and official_source_record_id is not null;

create index if not exists places_type_idx on public.places (place_type);
create index if not exists places_status_idx on public.places (personal_status);
create index if not exists places_source_idx on public.places (official_source_id);
create index if not exists places_hidden_idx on public.places (is_hidden);
create index if not exists places_lat_lng_idx on public.places (latitude, longitude);
create index if not exists places_name_idx on public.places (name);

drop trigger if exists places_updated_at on public.places;
create trigger places_updated_at before update on public.places for each row execute function public.set_updated_at();

create table if not exists public.official_place_data (
  id text primary key default gen_random_uuid()::text,
  place_id text not null references public.places (id) on delete cascade,
  source_id text not null references public.official_sources (id) on delete cascade,
  source_record_id text not null,
  official_name text,
  official_type text,
  official_description text,
  facility text,
  asset text,
  unit text,
  accessibility text,
  official_url text,
  raw_properties_json jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  last_imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_record_id)
);

create index if not exists official_place_data_place_idx on public.official_place_data (place_id);
create index if not exists official_place_data_source_idx on public.official_place_data (source_id);

drop trigger if exists official_place_data_updated_at on public.official_place_data;
create trigger official_place_data_updated_at before update on public.official_place_data for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Personal / editorial records
-- ---------------------------------------------------------------------------

create table if not exists public.trips (
  id text primary key,
  slug text not null unique,
  title text not null,
  start_date date not null,
  end_date date,
  description text,
  cover_image text,
  miles_traveled numeric,
  activities text[],
  highlights text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at before update on public.trips for each row execute function public.set_updated_at();

create table if not exists public.trip_stops (
  id text primary key,
  trip_id text not null references public.trips (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  stop_order integer not null,
  notes text,
  unique (trip_id, stop_order)
);

create index if not exists trip_stops_trip_idx on public.trip_stops (trip_id);
create index if not exists trip_stops_place_idx on public.trip_stops (place_id);

create table if not exists public.collections (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists collections_updated_at on public.collections;
create trigger collections_updated_at before update on public.collections for each row execute function public.set_updated_at();

create table if not exists public.collection_places (
  collection_id text not null references public.collections (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  primary key (collection_id, place_id)
);

create index if not exists collection_places_place_idx on public.collection_places (place_id);

create table if not exists public.visits (
  id text primary key,
  place_id text not null references public.places (id) on delete cascade,
  visited_at date not null,
  trip_id text references public.trips (id) on delete set null,
  notes text,
  weather text,
  activities text[],
  rating integer check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visits_place_idx on public.visits (place_id);
create index if not exists visits_trip_idx on public.visits (trip_id);

drop trigger if exists visits_updated_at on public.visits;
create trigger visits_updated_at before update on public.visits for each row execute function public.set_updated_at();

create table if not exists public.field_reports (
  id text primary key default gen_random_uuid()::text,
  place_id text not null unique references public.places (id) on delete cascade,
  visit_id text references public.visits (id) on delete set null,
  access_difficulty text,
  road_condition text,
  walk_from_vehicle text,
  site_condition text,
  privacy_rating text,
  shade_rating text,
  ground_condition text,
  water_nearby text,
  cell_service text,
  tent_suitability text,
  rv_suitability text,
  fishing_notes text,
  photography_notes text,
  wildlife_notes text,
  general_notes text,
  overall_rating integer check (overall_rating is null or overall_rating between 1 and 5),
  verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists field_reports_updated_at on public.field_reports;
create trigger field_reports_updated_at before update on public.field_reports for each row execute function public.set_updated_at();

create table if not exists public.goals (
  id text primary key,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  place_id text references public.places (id) on delete cascade,
  trip_id text references public.trips (id) on delete cascade,
  completed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_place_idx on public.goals (place_id);
create index if not exists goals_trip_idx on public.goals (trip_id);

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();

create table if not exists public.media (
  id text primary key,
  place_id text references public.places (id) on delete set null,
  visit_id text references public.visits (id) on delete set null,
  trip_id text references public.trips (id) on delete set null,
  media_type text not null check (media_type in ('photo', 'video', 'youtube')),
  storage_path text,
  external_url text,
  caption text,
  alt text,
  taken_at date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_place_idx on public.media (place_id);
create index if not exists media_trip_idx on public.media (trip_id);
create index if not exists media_visit_idx on public.media (visit_id);

drop trigger if exists media_updated_at on public.media;
create trigger media_updated_at before update on public.media for each row execute function public.set_updated_at();

create table if not exists public.park_campsites (
  id text primary key,
  place_id text not null references public.places (id) on delete cascade,
  loop text,
  site_number text not null,
  site_type text,
  tent_suitable boolean,
  rv_suitable boolean,
  privacy text,
  shade text,
  electric boolean,
  waterfront boolean,
  notes text,
  photos text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists park_campsites_place_idx on public.park_campsites (place_id);

drop trigger if exists park_campsites_updated_at on public.park_campsites;
create trigger park_campsites_updated_at before update on public.park_campsites for each row execute function public.set_updated_at();

create table if not exists public.community_submissions (
  id text primary key default gen_random_uuid()::text,
  place_id text references public.places (id) on delete set null,
  submission_type text not null default 'comment',
  submitted_by_user_id uuid references auth.users (id) on delete set null,
  submitter_label text,
  visit_date date,
  content text not null,
  photo_reference text,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index if not exists community_submissions_status_idx
  on public.community_submissions (moderation_status);
create index if not exists community_submissions_place_idx
  on public.community_submissions (place_id);

create table if not exists public.import_logs (
  id text primary key default gen_random_uuid()::text,
  source_id text references public.official_sources (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  records_received integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_skipped integer not null default 0,
  records_failed integer not null default 0,
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb
);

create index if not exists import_logs_started_idx on public.import_logs (started_at desc);

-- ---------------------------------------------------------------------------
-- Seed official source rows (upsert)
-- ---------------------------------------------------------------------------

insert into public.official_sources (id, name, agency, dataset_name, source_url, license)
values
  (
    'nys-dec-backcountry',
    'NYS DEC Backcountry Features',
    'NYS DEC',
    'dec_backcountry_features',
    'https://gisservices.dec.ny.gov/arcgis/rest/services/dec_backcountry_features/MapServer/0',
    'NYS DEC GIS'
  ),
  (
    'nys-parks',
    'New York State Parks',
    'NYS OPRHP',
    'state_parks',
    'https://parks.ny.gov/',
    'NYS Parks'
  ),
  (
    'nys-apa-blueline',
    'Adirondack Park Boundary (Blueline)',
    'NYS Adirondack Park Agency',
    'BluelinePolygon',
    'https://services2.arcgis.com/8krRUWgifzA4cgL3/ArcGIS/rest/services/BluelinePolygon/FeatureServer/0',
    'NYS APA'
  ),
  (
    'phase1-seed',
    'Focused on Tom Phase 1 seed',
    'Focused on Tom',
    'manual_seed',
    null,
    null
  )
on conflict (id) do update set
  name = excluded.name,
  agency = excluded.agency,
  dataset_name = excluded.dataset_name,
  source_url = excluded.source_url,
  license = excluded.license;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.explore_admins enable row level security;
alter table public.official_sources enable row level security;
alter table public.geo_boundaries enable row level security;
alter table public.places enable row level security;
alter table public.official_place_data enable row level security;
alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.visits enable row level security;
alter table public.field_reports enable row level security;
alter table public.goals enable row level security;
alter table public.media enable row level security;
alter table public.park_campsites enable row level security;
alter table public.community_submissions enable row level security;
alter table public.import_logs enable row level security;

-- explore_admins: no public read
drop policy if exists explore_admins_admin_all on public.explore_admins;
create policy explore_admins_admin_all on public.explore_admins
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists official_sources_public_read on public.official_sources;
create policy official_sources_public_read on public.official_sources
  for select using (true);
drop policy if exists official_sources_admin_write on public.official_sources;
create policy official_sources_admin_write on public.official_sources
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists geo_boundaries_public_read on public.geo_boundaries;
create policy geo_boundaries_public_read on public.geo_boundaries
  for select using (true);
drop policy if exists geo_boundaries_admin_write on public.geo_boundaries;
create policy geo_boundaries_admin_write on public.geo_boundaries
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists places_public_read on public.places;
create policy places_public_read on public.places
  for select using (is_hidden = false or private.is_explore_admin());
drop policy if exists places_admin_write on public.places;
create policy places_admin_write on public.places
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists official_place_data_public_read on public.official_place_data;
create policy official_place_data_public_read on public.official_place_data
  for select using (
    exists (
      select 1 from public.places p
      where p.id = official_place_data.place_id
        and (p.is_hidden = false or private.is_explore_admin())
    )
  );
drop policy if exists official_place_data_admin_write on public.official_place_data;
create policy official_place_data_admin_write on public.official_place_data
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists trips_public_read on public.trips;
create policy trips_public_read on public.trips for select using (true);
drop policy if exists trips_admin_write on public.trips;
create policy trips_admin_write on public.trips
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists trip_stops_public_read on public.trip_stops;
create policy trip_stops_public_read on public.trip_stops for select using (true);
drop policy if exists trip_stops_admin_write on public.trip_stops;
create policy trip_stops_admin_write on public.trip_stops
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections for select using (true);
drop policy if exists collections_admin_write on public.collections;
create policy collections_admin_write on public.collections
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists collection_places_public_read on public.collection_places;
create policy collection_places_public_read on public.collection_places for select using (true);
drop policy if exists collection_places_admin_write on public.collection_places;
create policy collection_places_admin_write on public.collection_places
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists visits_public_read on public.visits;
create policy visits_public_read on public.visits for select using (
  exists (
    select 1 from public.places p
    where p.id = visits.place_id and (p.is_hidden = false or private.is_explore_admin())
  )
);
drop policy if exists visits_admin_write on public.visits;
create policy visits_admin_write on public.visits
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists field_reports_public_read on public.field_reports;
create policy field_reports_public_read on public.field_reports for select using (
  exists (
    select 1 from public.places p
    where p.id = field_reports.place_id and (p.is_hidden = false or private.is_explore_admin())
  )
);
drop policy if exists field_reports_admin_write on public.field_reports;
create policy field_reports_admin_write on public.field_reports
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists goals_public_read on public.goals;
create policy goals_public_read on public.goals for select using (true);
drop policy if exists goals_admin_write on public.goals;
create policy goals_admin_write on public.goals
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (true);
drop policy if exists media_admin_write on public.media;
create policy media_admin_write on public.media
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists park_campsites_public_read on public.park_campsites;
create policy park_campsites_public_read on public.park_campsites for select using (true);
drop policy if exists park_campsites_admin_write on public.park_campsites;
create policy park_campsites_admin_write on public.park_campsites
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists community_submissions_public_read on public.community_submissions;
create policy community_submissions_public_read on public.community_submissions
  for select using (
    moderation_status = 'approved' or private.is_explore_admin()
  );
drop policy if exists community_submissions_admin_write on public.community_submissions;
create policy community_submissions_admin_write on public.community_submissions
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

drop policy if exists import_logs_admin_all on public.import_logs;
create policy import_logs_admin_all on public.import_logs
  for all using (private.is_explore_admin())
  with check (private.is_explore_admin());

grant select on
  public.official_sources,
  public.geo_boundaries,
  public.places,
  public.official_place_data,
  public.trips,
  public.trip_stops,
  public.collections,
  public.collection_places,
  public.visits,
  public.field_reports,
  public.goals,
  public.media,
  public.park_campsites,
  public.community_submissions
to anon, authenticated;

grant select, insert, update, delete on
  public.explore_admins,
  public.official_sources,
  public.geo_boundaries,
  public.places,
  public.official_place_data,
  public.trips,
  public.trip_stops,
  public.collections,
  public.collection_places,
  public.visits,
  public.field_reports,
  public.goals,
  public.media,
  public.park_campsites,
  public.community_submissions,
  public.import_logs
to authenticated;
