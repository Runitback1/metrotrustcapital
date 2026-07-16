-- Run this in Supabase SQL Editor (project: sssiuusragfwlpqpafjt)
-- Purpose: allow the admin account to update transaction dates and account opening dates.

DO $$
BEGIN
	-- Ensure required columns exist first.
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'transaction_date'
	) THEN
		EXECUTE 'ALTER TABLE public.transactions ADD COLUMN transaction_date date';
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'accounts'
			AND column_name = 'opening_date'
	) THEN
		EXECUTE 'ALTER TABLE public.accounts ADD COLUMN opening_date date';
	END IF;

	-- Backfill transaction_date from created_at when empty.
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'created_at'
	) THEN
		EXECUTE '
			UPDATE public.transactions
			SET transaction_date = created_at::date
			WHERE transaction_date IS NULL
				AND created_at IS NOT NULL
		';
	END IF;

	-- Ensure authenticated users can update available date columns.
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'transaction_date'
	) AND EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'created_at'
	) THEN
		EXECUTE 'GRANT UPDATE (transaction_date, created_at) ON TABLE public.transactions TO authenticated';
	ELSIF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'transaction_date'
	) THEN
		EXECUTE 'GRANT UPDATE (transaction_date) ON TABLE public.transactions TO authenticated';
	ELSIF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'transactions'
			AND column_name = 'created_at'
	) THEN
		EXECUTE 'GRANT UPDATE (created_at) ON TABLE public.transactions TO authenticated';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'accounts'
			AND column_name = 'opening_date'
	) THEN
		EXECUTE 'GRANT UPDATE (opening_date) ON TABLE public.accounts TO authenticated';
	END IF;
END $$;

-- Keep RLS enabled; add narrow admin-only update policies.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_update_transaction_dates ON public.transactions;
CREATE POLICY admin_update_transaction_dates
ON public.transactions
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

DROP POLICY IF EXISTS admin_update_account_opening_date ON public.accounts;
CREATE POLICY admin_update_account_opening_date
ON public.accounts
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

-- Optional: if select policies are restrictive, ensure admin can read rows to verify updates.
DROP POLICY IF EXISTS admin_select_transactions_for_date_edit ON public.transactions;
CREATE POLICY admin_select_transactions_for_date_edit
ON public.transactions
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');

DROP POLICY IF EXISTS admin_select_accounts_for_date_edit ON public.accounts;
CREATE POLICY admin_select_accounts_for_date_edit
ON public.accounts
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@metrotrust.com');
