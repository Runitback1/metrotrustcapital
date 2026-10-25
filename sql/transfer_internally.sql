-- Run in the Supabase SQL Editor after secure_rls_core_tables.sql.
-- Internal transfers run atomically without exposing recipient account records.
CREATE OR REPLACE FUNCTION public.transfer_internally(
  p_sender_account text,
  p_recipient_account text,
  p_amount numeric,
  p_transfer_pin text,
  p_description text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_sender public.accounts%ROWTYPE;
  v_receiver public.accounts%ROWTYPE;
  v_sender_id public.accounts.id%TYPE;
  v_receiver_id public.accounts.id%TYPE;
  v_sender_account text;
  v_recipient_account text;
  v_match_count integer;
  v_reference text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR round(p_amount, 2) <> p_amount THEN
    RAISE EXCEPTION 'Please enter a valid transfer amount';
  END IF;

  v_sender_account := upper(regexp_replace(
    btrim(COALESCE(p_sender_account, '')),
    '^(ACC-|REQ-)\s*',
    '',
    'i'
  ));
  v_recipient_account := upper(regexp_replace(
    btrim(COALESCE(p_recipient_account, '')),
    '^(ACC-|REQ-)\s*',
    '',
    'i'
  ));

  IF v_sender_account = '' OR v_recipient_account = '' THEN
    RAISE EXCEPTION 'Account number not found';
  END IF;

  SELECT count(*), min(account_number::text)
    INTO v_match_count, v_sender_account
    FROM public.accounts
    WHERE user_id = auth.uid()
      AND upper(regexp_replace(
        btrim(COALESCE(account_number::text, '')),
        '^(ACC-|REQ-)\s*',
        '',
        'i'
      )) = v_sender_account;

  IF v_match_count = 0 THEN
    RAISE EXCEPTION 'Sender account not found';
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'Sender account number is ambiguous';
  END IF;

  SELECT id
    INTO v_sender_id
    FROM public.accounts
    WHERE user_id = auth.uid()
      AND account_number::text = v_sender_account;

  SELECT count(*), min(account_number::text)
    INTO v_match_count, v_recipient_account
    FROM public.accounts
    WHERE upper(regexp_replace(
      btrim(COALESCE(account_number::text, '')),
      '^(ACC-|REQ-)\s*',
      '',
      'i'
    )) = v_recipient_account;

  IF v_match_count = 0 THEN
    RAISE EXCEPTION 'Recipient account not found';
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'Recipient account number is ambiguous';
  END IF;

  SELECT id
    INTO v_receiver_id
    FROM public.accounts
    WHERE account_number::text = v_recipient_account;

  IF v_sender_id = v_receiver_id THEN
    RAISE EXCEPTION 'You cannot transfer to the same account';
  END IF;

  PERFORM id
    FROM public.accounts
    WHERE id IN (v_sender_id, v_receiver_id)
    ORDER BY id
    FOR UPDATE;

  SELECT * INTO v_sender
    FROM public.accounts
    WHERE id = v_sender_id;
  SELECT * INTO v_receiver
    FROM public.accounts
    WHERE id = v_receiver_id;

  IF v_sender.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Sender account not found';
  END IF;
  IF v_sender.transfer_pin IS DISTINCT FROM p_transfer_pin THEN
    RAISE EXCEPTION 'Incorrect PIN';
  END IF;
  IF lower(btrim(COALESCE(v_sender.status, ''))) = 'frozen'
    OR lower(btrim(COALESCE(v_receiver.status, ''))) = 'frozen' THEN
    RAISE EXCEPTION 'Service is temporarily under maintenance. Please try again later or contact support.';
  END IF;
  IF v_sender.balance IS NULL OR v_sender.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  IF v_receiver.balance IS NULL THEN
    RAISE EXCEPTION 'Unable to verify recipient balance';
  END IF;

  PERFORM pg_catalog.set_config('metrotrust.internal_transfer', 'on', true);

  UPDATE public.accounts
    SET balance = v_sender.balance - p_amount
    WHERE id = v_sender_id;
  UPDATE public.accounts
    SET balance = v_receiver.balance + p_amount
    WHERE id = v_receiver_id;

  PERFORM pg_catalog.set_config('metrotrust.internal_transfer', 'off', true);

  v_reference := 'INT-' || upper(substr(
    md5(random()::text || clock_timestamp()::text),
    1,
    16
  ));

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.pg_attribute
      WHERE attrelid = 'public.transactions'::regclass
        AND attname = 'transaction_date'
        AND NOT attisdropped
  ) THEN
    INSERT INTO public.transactions (
      sender_account,
      sender_name,
      receiver_account,
      receiver_name,
      amount,
      description,
      reference,
      status,
      transaction_date
    ) VALUES (
      v_sender.account_number::text,
      v_sender.full_name,
      v_receiver.account_number::text,
      v_receiver.full_name,
      p_amount,
      COALESCE(NULLIF(btrim(p_description), ''), 'Internal Transfer'),
      v_reference,
      'Completed',
      CURRENT_DATE
    );
  ELSE
    INSERT INTO public.transactions (
      sender_account,
      sender_name,
      receiver_account,
      receiver_name,
      amount,
      description,
      reference,
      status
    ) VALUES (
      v_sender.account_number::text,
      v_sender.full_name,
      v_receiver.account_number::text,
      v_receiver.full_name,
      p_amount,
      COALESCE(NULLIF(btrim(p_description), ''), 'Internal Transfer'),
      v_reference,
      'Completed'
    );
  END IF;

  RETURN v_reference;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_internally(text, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_internally(text, text, numeric, text, text) TO authenticated;
