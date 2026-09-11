-- Run once in the Supabase SQL Editor for the MetroTrust project.
-- Keeps user-submitted approval requests visible after approval or rejection.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS account_origin text;

CREATE INDEX IF NOT EXISTS accounts_account_origin_idx
  ON public.accounts (account_origin);

-- Existing pending REQ accounts are known to have come through approval.
UPDATE public.accounts
SET account_origin = 'user_pending_approval'
WHERE account_origin IS NULL
  AND status = 'Pending Approval';