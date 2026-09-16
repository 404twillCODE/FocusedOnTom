-- App admins table: grants full admin control based on email.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS app_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (only service-role / server can read/write)
ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;

-- No public policies: only the service role (server-side) can query this table.
-- This means client-side code cannot read or modify the admin list.

-- Seed your admin email (change to your actual email):
INSERT INTO app_admins (email)
VALUES ('twj2390@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_app_admins_email ON app_admins (email);
