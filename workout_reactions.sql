-- Workout log reactions table
-- Run this in Supabase SQL Editor to enable emoji reactions on feed entries.

CREATE TABLE IF NOT EXISTS workout_log_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (log_id, user_id, emoji)
);

-- RLS
ALTER TABLE workout_log_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
  ON workout_log_reactions FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions"
  ON workout_log_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON workout_log_reactions FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_reactions_log_id ON workout_log_reactions(log_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON workout_log_reactions(user_id);
