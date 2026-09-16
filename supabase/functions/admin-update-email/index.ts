import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json({ error: "Function configuration is incomplete" }, 500);
  }

  // Verify the caller and retain the project's existing admin authorization rule.
  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || callerData.user?.email?.toLowerCase() !== "admin@metrotrust.com") {
    return json({ error: "Administrator access is required" }, 403);
  }

  let payload: { accountId?: string; email?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const accountId = String(payload.accountId || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  if (!accountId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid account and email address are required" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: account, error: accountError } = await adminClient
    .from("accounts")
    .select("id, user_id, email")
    .eq("id", accountId)
    .single();

  if (accountError || !account) return json({ error: "Account not found" }, 404);
  if (!account.user_id) return json({ error: "This account does not have a login profile yet" }, 400);

  const { data: duplicateAccount } = await adminClient
    .from("accounts")
    .select("id")
    .eq("email", email)
    .neq("id", accountId)
    .maybeSingle();
  if (duplicateAccount) return json({ error: "That email is already assigned to another account" }, 409);

  const { error: authError } = await adminClient.auth.admin.updateUserById(account.user_id, {
    email,
    email_confirm: true,
  });
  if (authError) return json({ error: authError.message }, 400);

  const { data: updatedAccount, error: updateError } = await adminClient
    .from("accounts")
    .update({ email })
    .eq("id", accountId)
    .select("id, user_id, full_name, email, account_number, balance, status, opening_date, card_number, expiry_date, cvv, last_seen_at")
    .single();

  if (updateError || !updatedAccount) {
    // Avoid leaving an Auth/profile mismatch if the profile update fails.
    await adminClient.auth.admin.updateUserById(account.user_id, {
      email: account.email,
      email_confirm: true,
    });
    return json({ error: updateError?.message || "Account email update failed" }, 500);
  }

  return json({ account: updatedAccount });
});
