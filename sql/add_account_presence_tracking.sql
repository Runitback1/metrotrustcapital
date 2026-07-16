-- Run in Supabase SQL Editor
-- Purpose: add lightweight account presence tracking so admin can see who is active.

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

GRANT SELECT (last_seen_at) ON TABLE public.accounts TO authenticated;
GRANT UPDATE (last_seen_at) ON TABLE public.accounts TO authenticated;

-- Optional backfill
UPDATE public.accounts
SET last_seen_at = COALESCE(last_seen_at, now())
WHERE last_seen_at IS NULL;
