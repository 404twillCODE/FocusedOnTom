-- Unified photography commerce schema.
-- Run this in the Supabase SQL Editor.

create table if not exists public.photos (
  id text primary key,
  photo_id text generated always as (id) stored,
  gallery_slug text not null,
  category_slug text,
  event_slug text,
  filename text not null,
  original_key text not null unique,
  public_key text not null unique,
  public_url text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  original_size bigint not null default 0 check (original_size >= 0),
  public_size bigint not null default 0 check (public_size >= 0),
  price_cents integer not null default 500 check (price_cents >= 0),
  is_for_sale boolean not null default true,
  taken_at timestamptz,
  exif jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  buyer_email text,
  user_id uuid references auth.users(id) on delete set null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'usd',
  license text not null default 'personal',
  status text not null default 'paid',
  download_token text,
  download_count integer not null default 0 check (download_count >= 0),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  photo_id text not null references public.photos(id) on delete restrict,
  unit_amount_cents integer not null default 0 check (unit_amount_cents >= 0),
  license text not null default 'personal',
  created_at timestamptz not null default now(),
  unique (purchase_id, photo_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_photos_gallery_created on public.photos (gallery_slug, created_at desc);
create index if not exists idx_photos_sale on public.photos (is_for_sale, gallery_slug);
create index if not exists idx_purchases_user_created on public.purchases (user_id, created_at desc);
create index if not exists idx_purchases_email_created on public.purchases (lower(buyer_email), created_at desc);
create index if not exists idx_purchase_items_photo on public.purchase_items (photo_id);
create index if not exists idx_purchase_items_purchase on public.purchase_items (purchase_id);
create index if not exists idx_subscriptions_user_status on public.subscriptions (user_id, status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at
before update on public.photos
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.photos enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own purchases" on public.purchases;
create policy "Users can read own purchases"
on public.purchases
for select
using (
  auth.uid() = user_id
  or lower(coalesce(buyer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "Users can read own purchase items" on public.purchase_items;
create policy "Users can read own purchase items"
on public.purchase_items
for select
using (
  exists (
    select 1
    from public.purchases p
    where p.id = purchase_items.purchase_id
      and (
        p.user_id = auth.uid()
        or lower(coalesce(p.buyer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can read accessible photos" on public.photos;
create policy "Users can read accessible photos"
on public.photos
for select
using (
  exists (
    select 1
    from public.purchase_items pi
    join public.purchases p on p.id = pi.purchase_id
    where pi.photo_id = photos.id
      and p.status in ('paid', 'delivered')
      and (
        p.user_id = auth.uid()
        or lower(coalesce(p.buyer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  or exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  )
);

-- Writes are intentionally server-only through the service role:
-- sync script upserts photos, Stripe webhooks insert purchases/items/subscriptions.
