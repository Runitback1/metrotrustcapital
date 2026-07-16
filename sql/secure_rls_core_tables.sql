-- Run in Supabase SQL Editor
-- Purpose: lock down core tables so users only access their own records,
-- while admin@metrotrust.com can manage all records.

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_transfers ENABLE ROW LEVEL SECURITY;

-- Clean existing broad policies (if they exist)
DROP POLICY IF EXISTS admin_all_accounts ON public.accounts;
DROP POLICY IF EXISTS user_select_own_account ON public.accounts;
DROP POLICY IF EXISTS user_update_own_account_profile ON public.accounts;

DROP POLICY IF EXISTS admin_all_transactions ON public.transactions;
DROP POLICY IF EXISTS user_select_own_transactions ON public.transactions;
DROP POLICY IF EXISTS user_insert_own_transactions ON public.transactions;

DROP POLICY IF EXISTS admin_all_external_transfers ON public.external_transfers;
DROP POLICY IF EXISTS user_select_own_external_transfers ON public.external_transfers;
DROP POLICY IF EXISTS user_insert_own_external_transfers ON public.external_transfers;

-- ACCOUNTS
CREATE POLICY admin_all_accounts
ON public.accounts
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

CREATE POLICY user_select_own_account
ON public.accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to edit only personal profile-like fields on their own account.
CREATE POLICY user_update_own_account_profile
ON public.accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (auth.jwt() ->> 'email') <> 'admin@metrotrust.com'
);

-- TRANSACTIONS
CREATE POLICY admin_all_transactions
ON public.transactions
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

CREATE POLICY user_select_own_transactions
ON public.transactions
FOR SELECT
TO authenticated
USING (
  sender_account IN (
    SELECT account_number FROM public.accounts WHERE user_id = auth.uid()
  )
  OR receiver_account IN (
    SELECT account_number FROM public.accounts WHERE user_id = auth.uid()
  )
);

CREATE POLICY user_insert_own_transactions
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  sender_account IN (
    SELECT account_number FROM public.accounts WHERE user_id = auth.uid()
  )
);

-- EXTERNAL TRANSFERS
CREATE POLICY admin_all_external_transfers
ON public.external_transfers
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

CREATE POLICY user_select_own_external_transfers
ON public.external_transfers
FOR SELECT
TO authenticated
USING (
  sender_account IN (
    SELECT account_number FROM public.accounts WHERE user_id = auth.uid()
  )
);

CREATE POLICY user_insert_own_external_transfers
ON public.external_transfers
FOR INSERT
TO authenticated
WITH CHECK (
  sender_account IN (
    SELECT account_number FROM public.accounts WHERE user_id = auth.uid()
  )
);

-- Optional: keep updates/deletes admin-only by omission of user UPDATE/DELETE policies.
