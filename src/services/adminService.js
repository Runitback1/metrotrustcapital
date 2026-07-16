import { supabase } from "../lib/supabase";

export const adminAddBalance = async (adminAccount, adminAmount) => {
  const amt = parseFloat(adminAmount);

  if (!adminAccount || !amt) {
    throw new Error("Enter account and amount");
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("account_number", adminAccount)
    .single();

  if (error || !data) {
    throw new Error("Account not found");
  }

  const newBalance = data.balance + amt;

  const { error: updateError } = await supabase
    .from("accounts")
    .update({
      balance: newBalance,
    })
    .eq("account_number", adminAccount);

  if (updateError) {
    throw new Error("Update failed");
  }

  return true;
};

export const toggleFreezeAccount = async (
  accountNumber,
  currentStatus
) => {

  const newStatus =
    currentStatus === "Frozen"
      ? "Active"
      : "Frozen";

  const { error } = await supabase
    .from("accounts")
    .update({
      status: newStatus,
    })
    .eq("account_number", accountNumber);

  if (error) {
    throw error;
  }

  return newStatus;
};

export const updateOpeningDate = async (
  id,
  openingDate
) => {

  const { error } = await supabase
    .from("accounts")
    .update({
      opening_date: openingDate,
    })
    .eq("id", id);

  if (error) throw error;

  return true;
};

export const fetchAllTransactions = async () => {

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
};