import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import { formatCurrency } from "../utils/currency";

const ACCOUNT_FIELDS = "id, user_id, full_name, email, account_number, balance, status, opening_date, card_number, expiry_date, cvv, last_seen_at";
const TRANSACTION_FIELDS = "id, sender_account, sender_name, receiver_account, receiver_name, amount, description, reference, status, created_at, transaction_date";
const ACCOUNTS_PAGE_SIZE = 25;
const AUTH_REDIRECT_BASE_URL =
  (process.env.REACT_APP_AUTH_REDIRECT_URL || "").trim() ||
  window.location.origin;
const PASSWORD_RESET_REDIRECT_URL = `${AUTH_REDIRECT_BASE_URL}/?mode=password-reset`;

const adminAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default function Admin({ isMobile }) {
  const { colors } = useContext(ThemeContext);
  const [adminTab, setAdminTab] = useState("accounts");
  const [accounts, setAccounts] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [externalTransfers, setExternalTransfers] = useState([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editBalance, setEditBalance] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editOpeningDate, setEditOpeningDate] = useState("");
  const [newAccountForm, setNewAccountForm] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newPin, setNewPin] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [hasMoreAccounts, setHasMoreAccounts] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState("");

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editTransactionDate, setEditTransactionDate] = useState("");

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const normalizeEmail = (value) =>
    (String(value || "")
      .trim()
      .replace(/^['"]+|['"]+$/g, "")
      .replace(/\s+/g, "")
      .toLowerCase()
      .match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)?.[0] || "");
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const formatAccountNumber = (value) => String(value || "").replace(/^ACC-\s*/i, "");
  const isAccountOnline = (account) => {
    if (!account?.last_seen_at) return false;
    const lastSeen = new Date(account.last_seen_at).getTime();
    if (Number.isNaN(lastSeen)) return false;
    return Date.now() - lastSeen < 2 * 60 * 1000;
  };
  const formatLastSeen = (value) => {
    if (!value) return "No activity";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No activity";
    return parsed.toLocaleString();
  };
  const formatDateLabel = (dateValue) => {
    if (!dateValue) return "Not set";
    const parsed = new Date(dateValue);
    if (isNaN(parsed)) return dateValue;
    return parsed.toLocaleDateString();
  };
  const getTransactionDate = (tx) => {
    if (tx.transaction_date) return tx.transaction_date;
    if (tx.created_at) return tx.created_at.split("T")[0];
    return "";
  };
  const normalizeSearch = (value) => String(value || "").trim().toLowerCase();
  const matchesSearch = (source, fields) => {
    const query = normalizeSearch(source);
    if (!query) return true;
    return fields.some((field) => normalizeSearch(field).includes(query));
  };
  const filteredAccounts = accounts.filter((account) =>
    matchesSearch(accountSearch, [
      account.full_name,
      account.email,
      account.account_number,
      formatAccountNumber(account.account_number),
      account.status,
      account.opening_date,
      account.balance,
    ])
  );
  const sortedFilteredAccounts = [...filteredAccounts].sort((a, b) => {
    const aOnline = isAccountOnline(a) ? 1 : 0;
    const bOnline = isAccountOnline(b) ? 1 : 0;

    if (aOnline !== bOnline) {
      return bOnline - aOnline;
    }

    const aLastSeen = new Date(a?.last_seen_at || 0).getTime() || 0;
    const bLastSeen = new Date(b?.last_seen_at || 0).getTime() || 0;
    if (aLastSeen !== bLastSeen) {
      return bLastSeen - aLastSeen;
    }

    return String(a?.full_name || "").localeCompare(String(b?.full_name || ""));
  });
  const filteredTransactions = allTransactions.filter((tx) =>
    matchesSearch(transactionSearch, [
      tx.sender_name,
      tx.sender_account,
      tx.receiver_name,
      tx.receiver_account,
      tx.description,
      tx.reference,
      tx.status,
      tx.amount,
      getTransactionDate(tx),
    ])
  );
  const pendingExternalTransferCount = externalTransfers.filter(
    (transfer) => transfer.status === "Pending"
  ).length;
  const isMissingTransactionDateColumnError = (error) => {
    const message = error?.message || "";
    return (
      message.includes("transaction_date") ||
      message.includes("Could not find the 'transaction_date' column")
    );
  };

  const insertTransactionRecord = async (payload, shouldReturnRow = false) => {
    const withDatePayload = {
      ...payload,
      transaction_date: payload.transaction_date || getTodayDate(),
    };

    let query = supabase
      .from("transactions")
      .insert([withDatePayload]);

    if (shouldReturnRow) {
      query = query
        .select(TRANSACTION_FIELDS)
        .single();
    }

    const firstAttempt = await query;

    if (!firstAttempt.error) return firstAttempt;
    if (!isMissingTransactionDateColumnError(firstAttempt.error)) {
      return firstAttempt;
    }

    const fallbackPayload = { ...withDatePayload };
    delete fallbackPayload.transaction_date;

    let fallbackQuery = supabase
      .from("transactions")
      .insert([fallbackPayload]);

    if (shouldReturnRow) {
      fallbackQuery = fallbackQuery
        .select("id, sender_account, sender_name, receiver_account, receiver_name, amount, description, reference, status, created_at")
        .single();
    }

    const fallbackResult = await fallbackQuery;

    if (shouldReturnRow && fallbackResult.data) {
      return {
        ...fallbackResult,
        data: {
          ...fallbackResult.data,
          transaction_date: null,
        },
      };
    }

    return fallbackResult;
  };

  const fetchAccounts = async (loadMore = false) => {
    setLoading(true);
    setAccountLoadError("");
    try {
      const from = loadMore ? accounts.length : 0;
      const { data, error } = await supabase
        .from("accounts")
        .select(ACCOUNT_FIELDS)
        .range(from, from + ACCOUNTS_PAGE_SIZE - 1);

      if (error) throw error;
      const nextAccounts = data || [];
      setAccounts((current) => (loadMore ? [...current, ...nextAccounts] : nextAccounts));
      setHasMoreAccounts(nextAccounts.length === ACCOUNTS_PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccountLoadError(error.message || "Unable to load accounts.");
      if (!loadMore) setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(TRANSACTION_FIELDS)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error) {
        setAllTransactions(data || []);
      } else if (isMissingTransactionDateColumnError(error)) {
        const fallback = await supabase
          .from("transactions")
          .select("id, sender_account, sender_name, receiver_account, receiver_name, amount, description, reference, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        if (fallback.error) throw fallback.error;

        setAllTransactions(
          (fallback.data || []).map((tx) => ({
            ...tx,
            transaction_date: null,
          }))
        );
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setAllTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalTransfers = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from("external_transfers")
        .select("id, sender_account, sender_name, beneficiary_name, bank_name, external_account, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setExternalTransfers(data || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setExternalTransfers([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchApprovalRequests = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select(ACCOUNT_FIELDS)
        .eq("status", "Pending Approval")
        .order("opening_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setApprovalRequests(data || []);
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      setApprovalRequests([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchApprovalRequests({ silent: true });
    fetchExternalTransfers({ silent: true });
    const interval = setInterval(() => {
      fetchApprovalRequests({ silent: true });
      fetchExternalTransfers({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (adminTab === "accounts") {
      if (accounts.length === 0) fetchAccounts();
    } else if (adminTab === "approvals" && approvalRequests.length === 0) {
      fetchApprovalRequests();
    } else if (adminTab === "transactions" && allTransactions.length === 0) {
      fetchAllTransactions();
    } else if (adminTab === "transfers" && externalTransfers.length === 0) {
      fetchExternalTransfers();
    }
  }, [adminTab, accounts.length, approvalRequests.length, allTransactions.length, externalTransfers.length]);

  const handleApproveAccountRequest = async (requestAccount) => {
    try {
      if (!requestAccount?.email) {
        alert("Missing requester email");
        return;
      }

      setLoading(true);
      const randomPassword = `${Math.random().toString(36).slice(-8)}Aa1!`;
      const signUpResult = await adminAuthClient.auth.signUp({
        email: normalizeEmail(requestAccount.email),
        password: randomPassword,
        options: {
          data: {
            full_name: requestAccount.full_name,
          },
        },
      });

      if (signUpResult.error) throw signUpResult.error;
      if (!signUpResult.data?.user?.id) {
        throw new Error("Unable to create login profile for this request");
      }

      const generatedAccountNumber = String(
        Math.floor(100000000 + Math.random() * 900000000)
      );
      const generatedCardNumber =
        "4" + Math.floor(100000000000000 + Math.random() * 900000000000000);
      const generatedCvv = String(Math.floor(100 + Math.random() * 900));
      const generatedExpiry = (() => {
        const now = new Date();
        const future = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
        return `${String(future.getMonth() + 1).padStart(2, "0")}/${String(future.getFullYear()).slice(-2)}`;
      })();

      const { data: updatedRows, error: updateError } = await supabase
        .from("accounts")
        .update({
          user_id: signUpResult.data.user.id,
          status: "Active",
          opening_date: requestAccount.opening_date || getTodayDate(),
          account_number:
            String(requestAccount.account_number || "").startsWith("REQ-")
              ? generatedAccountNumber
              : requestAccount.account_number,
          routing_number: requestAccount.routing_number || "021000021",
          swift_code: requestAccount.swift_code || "MTCPUS33",
          account_type: requestAccount.account_type || "Savings",
          card_number: requestAccount.card_number || generatedCardNumber,
          expiry_date: requestAccount.expiry_date || generatedExpiry,
          cvv: requestAccount.cvv || generatedCvv,
          balance: Number(requestAccount.balance || 0),
        })
        .eq("id", requestAccount.id)
        .select(ACCOUNT_FIELDS);

      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Account approval update did not return a row");
      }

      await supabase.auth.resetPasswordForEmail(normalizeEmail(requestAccount.email), {
        redirectTo: PASSWORD_RESET_REDIRECT_URL,
      });

      setApprovalRequests((current) =>
        current.filter((item) => item.id !== requestAccount.id)
      );
      setAccounts((current) => [updatedRows[0], ...current]);
      alert("Account request approved. A password setup/reset email has been sent to the requester.");
    } catch (error) {
      alert("Error approving request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAccountRequest = async (requestAccountId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("accounts")
        .update({ status: "Rejected" })
        .eq("id", requestAccountId);

      if (error) throw error;

      setApprovalRequests((current) =>
        current.filter((item) => item.id !== requestAccountId)
      );
      alert("Account request rejected.");
    } catch (error) {
      alert("Error rejecting request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (accountId) => {
    if (!editBalance || isNaN(editBalance)) {
      alert("Enter a valid balance");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .update({ balance: parseFloat(editBalance) })
        .eq("id", accountId)
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No account row was updated");
      }

      alert("Balance updated successfully");
      setEditingAccount(null);
      setEditBalance("");
      setEditOpeningDate("");
      setAccounts((current) => current.map((account) => (account.id === accountId ? data[0] : account)));
      await fetchAccounts();
    } catch (error) {
      alert("Error updating balance: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (accountId) => {
    if (!editName) {
      alert("Enter a name");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .update({ full_name: editName })
        .eq("id", accountId)
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No account row was updated");
      }

      alert("Name updated successfully");
      setEditingAccount(null);
      setEditName("");
      setEditOpeningDate("");
      setAccounts((current) => current.map((account) => (account.id === accountId ? data[0] : account)));
      await fetchAccounts();
    } catch (error) {
      alert("Error updating name: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (accountId) => {
    const normalizedEmail = normalizeEmail(editEmail);
    if (!isValidEmail(normalizedEmail)) {
      alert("Enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .update({ email: normalizedEmail })
        .eq("id", accountId)
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No account row was updated");
      }

      alert("Email updated successfully");
      setAccounts((current) => current.map((account) => (account.id === accountId ? data[0] : account)));
      await fetchAccounts();
    } catch (error) {
      alert("Error updating email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOpeningDate = async (accountId) => {
    if (!editOpeningDate) {
      alert("Select a valid opening date");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .update({ opening_date: editOpeningDate })
        .eq("id", accountId)
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No account row was updated");
      }

      alert("Opening date updated successfully");
      setEditingAccount(null);
      setEditName("");
      setEditBalance("");
      setEditOpeningDate("");
      setAccounts((current) => current.map((account) => (account.id === accountId ? data[0] : account)));
      await fetchAccounts();
    } catch (error) {
      alert("Error updating opening date: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccountFreeze = async (account) => {
    if (!account?.id) return;

    const currentStatus = String(account.status || "");
    const canToggle = currentStatus === "Active" || currentStatus === "Frozen";
    if (!canToggle) {
      alert("Only active or frozen accounts can be updated.");
      return;
    }

    const nextStatus = currentStatus === "Frozen" ? "Active" : "Frozen";

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accounts")
        .update({ status: nextStatus })
        .eq("id", account.id)
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No account row was updated");
      }

      setAccounts((current) =>
        current.map((item) => (item.id === account.id ? data[0] : item))
      );
      alert(`Account ${nextStatus === "Frozen" ? "frozen" : "unfrozen"} successfully.`);
    } catch (error) {
      alert("Error updating account status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newFullName || !newEmail || !newPassword || !newBalance || !newPin || !/^\d{4}$/.test(newPin)) {
      alert("Fill all fields. Password is required and PIN must be 4 digits.");
      return;
    }

    const normalizedEmail = normalizeEmail(newEmail);
    if (!isValidEmail(normalizedEmail)) {
      alert("Enter a valid email address");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const openingBalance = Number(newBalance);
    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      alert("Enter a valid non-negative initial balance");
      return;
    }

    try {
      const accountNum = String(Math.floor(100000000 + Math.random() * 900000000));
      const cardNumber = "4" + Math.floor(100000000000000 + Math.random() * 900000000000000);
      const expiryDate = (() => {
        const today = new Date();
        const futureDate = new Date(today.getFullYear() + 3, today.getMonth(), today.getDate());
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const year = String(futureDate.getFullYear()).slice(-2);
        return `${month}/${year}`;
      })();
      const cvv = String(Math.floor(100 + Math.random() * 900));

      setLoading(true);
      const signUpResult = await adminAuthClient.auth.signUp({
        email: normalizedEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newFullName,
          },
        },
      });

      if (signUpResult.error) throw signUpResult.error;
      if (!signUpResult.data?.user?.id) {
        throw new Error("Login profile could not be created");
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert([
          {
            user_id: signUpResult.data.user.id,
            full_name: newFullName,
            email: normalizedEmail,
            account_number: accountNum,
            balance: openingBalance,
            transfer_pin: newPin,
            status: "Active",
            opening_date: getTodayDate(),
            card_number: cardNumber.toString(),
            expiry_date: expiryDate,
            cvv,
          },
        ])
        .select(ACCOUNT_FIELDS);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Account was not created");
      }

      alert("Account created successfully with card details (Visa ending in " + cardNumber.toString().slice(-4) + ")");
      setNewAccountForm(false);
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setNewBalance("");
      setNewPin("");
      setAccounts((current) => [data[0], ...current]);
      await fetchAccounts();
    } catch (error) {
      alert("Error creating account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetOrResetPassword = async (account) => {
    if (!editPassword || editPassword.length < 6) {
      alert("Enter a password with at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = normalizeEmail(editEmail || account.email);
      if (!isValidEmail(normalizedEmail)) {
        throw new Error("Unable to validate email address: invalid format. Enter a valid email in Edit Account, then try again.");
      }

      let workingAccount = account;

      if (normalizedEmail !== normalizeEmail(account.email)) {
        const { data: updatedAccounts, error: emailUpdateError } = await supabase
          .from("accounts")
          .update({ email: normalizedEmail })
          .eq("id", account.id)
          .select(ACCOUNT_FIELDS);

        if (emailUpdateError) throw emailUpdateError;
        if (!updatedAccounts || updatedAccounts.length === 0) {
          throw new Error("Account email could not be updated before password setup");
        }

        workingAccount = updatedAccounts[0];
        setAccounts((current) => current.map((item) => (item.id === account.id ? workingAccount : item)));
      }

      if (!workingAccount.user_id) {
        const signUpResult = await adminAuthClient.auth.signUp({
          email: normalizedEmail,
          password: editPassword,
          options: {
            data: {
              full_name: workingAccount.full_name,
            },
          },
        });

        if (signUpResult.error) throw signUpResult.error;
        if (!signUpResult.data?.user?.id) {
          throw new Error("Login profile could not be created");
        }

        const { data, error } = await supabase
          .from("accounts")
          .update({
            user_id: signUpResult.data.user.id,
            email: normalizedEmail,
          })
          .eq("id", workingAccount.id)
          .select(ACCOUNT_FIELDS);

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Account was not linked to the new login profile");
        }

        setAccounts((current) => current.map((item) => (item.id === workingAccount.id ? data[0] : item)));
        await fetchAccounts();
        alert("Login password created successfully. User can now sign in with email and password.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: PASSWORD_RESET_REDIRECT_URL,
        });

        if (error) throw error;
        alert("Password reset email sent. User should use the link to set a new password.");
      }

      setEditPassword("");
      setEditEmail(normalizedEmail);
    } catch (error) {
      alert("Password update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransfer = async (transferId, transfer) => {
    try {
      setLoading(true);
      const { data: senderData, error: senderError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("account_number", transfer.sender_account)
        .single();

      if (senderError || !senderData) {
        alert("Sender account not found");
        return;
      }

      if (Number(senderData.balance) < Number(transfer.amount)) {
        alert("Insufficient funds in the sender account");
        return;
      }

      const [balanceUpdate, transferUpdate] = await Promise.all([
        supabase
          .from("accounts")
          .update({ balance: Number(senderData.balance) - Number(transfer.amount) })
          .eq("account_number", transfer.sender_account),
        supabase
          .from("external_transfers")
          .update({ status: "Approved" })
          .eq("id", transferId),
      ]);

      if (balanceUpdate.error || transferUpdate.error) {
        throw balanceUpdate.error || transferUpdate.error;
      }

      const { error: transactionError } = await insertTransactionRecord({
        sender_account: transfer.sender_account,
        sender_name: transfer.sender_name,
        receiver_account: transfer.external_account,
        receiver_name: transfer.beneficiary_name,
        amount: transfer.amount,
        description: `External transfer to ${transfer.bank_name}`,
        reference: "EXT-" + Math.floor(100000 + Math.random() * 900000),
        status: "Completed",
      });

      if (transactionError) throw transactionError;

      alert("Transfer approved");
      setExternalTransfers((current) =>
        current.map((item) => (item.id === transferId ? { ...item, status: "Approved" } : item))
      );
      setAccounts((current) =>
        current.map((account) =>
          account.account_number === transfer.sender_account
            ? { ...account, balance: Number(senderData.balance) - Number(transfer.amount) }
            : account
        )
      );
      fetchAllTransactions();
    } catch (error) {
      alert("Error approving transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("external_transfers")
        .update({ status: "Rejected" })
        .eq("id", transferId);

      if (error) throw error;

      alert("Transfer rejected");
      setExternalTransfers((current) =>
        current.map((item) => (item.id === transferId ? { ...item, status: "Rejected" } : item))
      );
    } catch (error) {
      alert("Error rejecting transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount || isNaN(transferAmount)) {
      alert("Fill all fields correctly");
      return;
    }

    try {
      setLoading(true);
      const [fromResult, toResult] = await Promise.all([
        supabase.from("accounts").select("balance, full_name").eq("account_number", transferFrom).single(),
        supabase.from("accounts").select("balance, full_name").eq("account_number", transferTo).single(),
      ]);
      const { data: fromData, error: fromError } = fromResult;
      const { data: toData, error: toError } = toResult;

      if (fromError || toError || !fromData || !toData) {
        alert("One or both accounts not found");
        return;
      }

      const amt = parseFloat(transferAmount);

      if (fromData.balance < amt) {
        alert("Insufficient funds in source account");
        return;
      }

      const [fromUpdate, toUpdate] = await Promise.all([
        supabase.from("accounts").update({ balance: Number(fromData.balance) - amt }).eq("account_number", transferFrom),
        supabase.from("accounts").update({ balance: Number(toData.balance) + amt }).eq("account_number", transferTo),
      ]);

      if (fromUpdate.error || toUpdate.error) {
        throw fromUpdate.error || toUpdate.error;
      }

      const { data: transaction, error: transactionError } = await insertTransactionRecord(
        {
          sender_account: transferFrom,
          sender_name: fromData.full_name,
          receiver_account: transferTo,
          receiver_name: toData.full_name,
          amount: amt,
          description: "Admin initiated transfer",
          reference: "ADMIN-" + Math.floor(100000 + Math.random() * 900000),
          status: "Completed",
        },
        true
      );

      if (transactionError) throw transactionError;

      alert("Transfer completed successfully");
      setShowTransferModal(false);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
      setAccounts((current) =>
        current.map((account) => {
          if (account.account_number === transferFrom) {
            return { ...account, balance: Number(fromData.balance) - amt };
          }
          if (account.account_number === transferTo) {
            return { ...account, balance: Number(toData.balance) + amt };
          }
          return account;
        })
      );
      setAllTransactions((current) => [transaction, ...current].slice(0, 100));
    } catch (error) {
      alert("Error initiating transfer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditTransactionDate = (tx) => {
    setEditingTransactionId(tx.id);
    setEditTransactionDate(getTransactionDate(tx));
  };

  const handleUpdateTransactionDate = async (transactionId) => {
    if (!editTransactionDate) {
      alert("Select a valid date");
      return;
    }

    try {
      setLoading(true);
      let usedCreatedAtFallback = false;
      const updateResult = await supabase
        .from("transactions")
        .update({ transaction_date: editTransactionDate })
        .eq("id", transactionId)
        .select("id, transaction_date, created_at");

      const { error } = updateResult;

      let nextData = null;

      if (error) {
        if (!isMissingTransactionDateColumnError(error)) {
          throw error;
        }

        const currentTransaction = allTransactions.find((tx) => tx.id === transactionId);
        const currentTime = currentTransaction?.created_at
          ? currentTransaction.created_at.split("T")[1]
          : "00:00:00.000Z";
        const fallbackCreatedAt = `${editTransactionDate}T${currentTime}`;

        const fallbackUpdate = await supabase
          .from("transactions")
          .update({ created_at: fallbackCreatedAt })
          .eq("id", transactionId)
          .select("id, created_at");

        if (fallbackUpdate.error) throw fallbackUpdate.error;
        usedCreatedAtFallback = true;
      }

      const rowFetch = await supabase
        .from("transactions")
        .select(TRANSACTION_FIELDS)
        .eq("id", transactionId)
        .limit(1);

      if (rowFetch.error && !isMissingTransactionDateColumnError(rowFetch.error)) {
        throw rowFetch.error;
      }

      if (rowFetch.error && isMissingTransactionDateColumnError(rowFetch.error)) {
        const fallbackRowFetch = await supabase
          .from("transactions")
          .select("id, sender_account, sender_name, receiver_account, receiver_name, amount, description, reference, status, created_at")
          .eq("id", transactionId)
          .limit(1);

        if (fallbackRowFetch.error) throw fallbackRowFetch.error;

        nextData = (fallbackRowFetch.data && fallbackRowFetch.data[0])
          ? {
              ...fallbackRowFetch.data[0],
              transaction_date: null,
            }
          : null;
      } else {
        nextData = (rowFetch.data && rowFetch.data[0])
          ? rowFetch.data[0]
          : null;
      }

      if (!nextData) {
        throw new Error("Updated transaction not found");
      }

      const savedDate = getTransactionDate(nextData);
      if (savedDate !== editTransactionDate) {
        // Some schemas block transaction_date writes; try aligning created_at as a last fallback.
        const currentTime = nextData.created_at
          ? nextData.created_at.split("T")[1]
          : "00:00:00.000Z";
        const fallbackCreatedAt = `${editTransactionDate}T${currentTime}`;

        const createdAtFallbackUpdate = await supabase
          .from("transactions")
          .update({ created_at: fallbackCreatedAt })
          .eq("id", transactionId)
          .select("id, created_at");

        if (!createdAtFallbackUpdate.error) {
          const fallbackFetch = await supabase
            .from("transactions")
            .select(TRANSACTION_FIELDS)
            .eq("id", transactionId)
            .limit(1);

          if (!fallbackFetch.error && fallbackFetch.data && fallbackFetch.data[0]) {
            nextData = fallbackFetch.data[0];
          }
        }

        const finalSavedDate = getTransactionDate(nextData);
        if (finalSavedDate !== editTransactionDate) {
          if (usedCreatedAtFallback) {
            throw new Error("Transaction date update is blocked by database permissions. Run sql/allow_admin_date_updates.sql in Supabase SQL Editor.");
          }
          throw new Error("Transaction date update is blocked by database permissions. Run sql/allow_admin_date_updates.sql in Supabase SQL Editor.");
        }
      }

      // Keep both date fields aligned so user-facing pages stay consistent.
      const createdTime = nextData.created_at
        ? (nextData.created_at.split("T")[1] || "00:00:00.000Z")
        : "00:00:00.000Z";
      const synchronizedCreatedAt = `${editTransactionDate}T${createdTime}`;

      const syncUpdate = await supabase
        .from("transactions")
        .update({
          transaction_date: editTransactionDate,
          created_at: synchronizedCreatedAt,
        })
        .eq("id", transactionId)
        .select("id");

      if (syncUpdate.error && isMissingTransactionDateColumnError(syncUpdate.error)) {
        const createdAtOnlySync = await supabase
          .from("transactions")
          .update({ created_at: synchronizedCreatedAt })
          .eq("id", transactionId)
          .select("id");

        if (createdAtOnlySync.error) {
          console.warn("Could not synchronize created_at after transaction date update:", createdAtOnlySync.error);
        }
      } else if (syncUpdate.error) {
        console.warn("Could not synchronize transaction timestamps:", syncUpdate.error);
      }

      const finalFetch = await supabase
        .from("transactions")
        .select(TRANSACTION_FIELDS)
        .eq("id", transactionId)
        .limit(1);

      if (!finalFetch.error && finalFetch.data && finalFetch.data[0]) {
        nextData = finalFetch.data[0];
      }

      setAllTransactions((current) =>
        current.map((tx) => (tx.id === transactionId ? nextData : tx))
      );
      await fetchAllTransactions();
      setEditingTransactionId(null);
      setEditTransactionDate("");
      alert("Transaction date updated");
    } catch (error) {
      alert("Error updating transaction date: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
        {["accounts", "approvals", "transactions", "transfers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              border: "none",
              background: adminTab === tab ? colors.primary : colors.bgTertiary,
              color: adminTab === tab ? "white" : colors.text,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              textTransform: "capitalize",
              transition: "all 0.2s ease",
            }}
          >
            {tab === "accounts" && "Accounts"}
            {tab === "approvals" && `Approval Requests${approvalRequests.length > 0 ? ` (${approvalRequests.length})` : ""}`}
            {tab === "transactions" && "All Transactions"}
            {tab === "transfers" && `External Transfers${pendingExternalTransferCount > 0 ? ` (${pendingExternalTransferCount})` : ""}`}
          </button>
        ))}
      </div>

      {adminTab === "approvals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {approvalRequests.length === 0 ? (
            <div style={{ textAlign: "center", color: colors.textSecondary, padding: "40px 20px" }}>
              No pending account requests.
            </div>
          ) : (
            approvalRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 14,
                  alignItems: isMobile ? "stretch" : "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: colors.text, marginBottom: 6 }}>
                    {req.full_name || "New User Request"}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                    {req.email}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>
                    Requested: {formatDateLabel(req.opening_date)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleApproveAccountRequest(req)}
                    disabled={loading}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#1a3a52",
                      color: "white",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: 13,
                    }}
                  >
                    {loading ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleRejectAccountRequest(req.id)}
                    disabled={loading}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: colors.bgTertiary,
                      color: colors.text,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: 13,
                    }}
                  >
                    {loading ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === "accounts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 18,
                height: 18,
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.textSecondary,
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Search accounts by name, email, account number, or status"
              style={{
                width: "100%",
                padding: "13px 16px 13px 42px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={() => setNewAccountForm(!newAccountForm)}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: "#1a3a52",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {newAccountForm ? "Cancel" : "+ Create Account"}
          </button>

          {newAccountForm && (
            <div style={{ background: colors.card, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: colors.text, marginBottom: 16 }}>New Account</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="password"
                  placeholder="Login Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="number"
                  placeholder="Initial Balance"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  placeholder="4-Digit PIN"
                  maxLength="4"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={loading}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          )}

          {loading && accounts.length === 0 && (
            <div style={{ textAlign: "center", color: colors.textSecondary, padding: "32px 20px" }}>
              Loading accounts...
            </div>
          )}

          {accountLoadError && (
            <div style={{ color: colors.error, background: colors.bgTertiary, borderRadius: 8, padding: 12, fontSize: 13 }}>
              Unable to load accounts: {accountLoadError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            {sortedFilteredAccounts.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", color: colors.textSecondary, padding: "28px 20px", background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                {accountSearch ? "No matching accounts found." : "No accounts yet."}
              </div>
            ) : sortedFilteredAccounts.map((acc) => (
              <div key={acc.id} style={{ background: colors.card, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>{acc.full_name}</div>
                    <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, letterSpacing: 1, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                      {formatAccountNumber(acc.account_number)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    <div style={{ padding: "4px 12px", borderRadius: 20, background: acc.status === "Active" ? colors.success : colors.error, color: "white", fontSize: 11, fontWeight: 700 }}>
                      {acc.status}
                    </div>
                    <div style={{ padding: "4px 12px", borderRadius: 20, background: isAccountOnline(acc) ? colors.primary : colors.bgTertiary, color: isAccountOnline(acc) ? "white" : colors.textSecondary, fontSize: 10, fontWeight: 700, border: `1px solid ${colors.border}` }}>
                      {isAccountOnline(acc) ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 800, color: colors.primary, marginBottom: 12 }}>
                  ${formatCurrency(acc.balance || 0)}
                </div>

                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12 }}>{acc.email}</div>

                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12 }}>
                  Last Seen: {formatLastSeen(acc.last_seen_at)}
                </div>

                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12 }}>
                  Opening Date: {formatDateLabel(acc.opening_date)}
                </div>

                {acc.card_number && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: colors.textSecondary }}>
                      <div style={{ marginBottom: 3 }}>Card</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>....{acc.card_number.slice(-4)}</div>
                    </div>
                    <div style={{ fontSize: 10, color: colors.textSecondary }}>
                      <div style={{ marginBottom: 3 }}>Exp/CVV</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{acc.expiry_date}/{acc.cvv}</div>
                    </div>
                  </div>
                )}

                {editingAccount === acc.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="New Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <input
                      type="email"
                      placeholder="New Email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <input
                      type="number"
                      placeholder="New Balance"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <input
                      type="date"
                      value={editOpeningDate}
                      onChange={(e) => setEditOpeningDate(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <input
                      type="password"
                      placeholder={acc.user_id ? "Reset password (sends email)" : "Create login password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleUpdateName(acc.id)}
                        disabled={loading}
                        style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                      >
                        {loading ? "Saving..." : "Update Name"}
                      </button>
                      <button
                        onClick={() => handleUpdateBalance(acc.id)}
                        disabled={loading}
                        style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                      >
                        {loading ? "Saving..." : "Update Balance"}
                      </button>
                    </div>
                    <button
                      onClick={() => handleUpdateEmail(acc.id)}
                      disabled={loading}
                      style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                    >
                      {loading ? "Saving..." : "Update Email"}
                    </button>
                    <button
                      onClick={() => handleUpdateOpeningDate(acc.id)}
                      disabled={loading}
                      style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                    >
                      {loading ? "Saving..." : "Update Opening Date"}
                    </button>
                    <button
                      onClick={() => handleSetOrResetPassword(acc)}
                      disabled={loading}
                      style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                    >
                      {loading ? "Saving..." : (acc.user_id ? "Send Password Reset" : "Create Login Password")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAccount(null);
                        setEditPassword("");
                        setEditEmail("");
                      }}
                      style={{ padding: "8px", borderRadius: 6, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        setEditingAccount(acc.id);
                        setEditName(acc.full_name);
                        setEditEmail(acc.email || "");
                        setEditBalance(acc.balance);
                        setEditOpeningDate(acc.opening_date || "");
                        setEditPassword("");
                      }}
                      style={{ flex: 1, padding: "10px", borderRadius: 6, border: "1px solid #1a3a52", background: "transparent", color: "#1a3a52", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                    >
                      Edit Account
                    </button>
                    {(acc.status === "Active" || acc.status === "Frozen") && (
                      <button
                        onClick={() => handleToggleAccountFreeze(acc)}
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 6,
                          border: "none",
                          background: acc.status === "Frozen" ? colors.success : colors.error,
                          color: "white",
                          fontWeight: 700,
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: 13,
                          opacity: loading ? 0.65 : 1,
                        }}
                      >
                        {loading ? "Updating..." : acc.status === "Frozen" ? "Unfreeze" : "Freeze"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMoreAccounts && (
            <button
              onClick={() => fetchAccounts(true)}
              disabled={loading}
              style={{ alignSelf: "center", padding: "10px 18px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgTertiary, color: colors.text, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Loading..." : "Load more accounts"}
            </button>
          )}
        </div>
      )}

      {adminTab === "transactions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 18,
                height: 18,
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: colors.textSecondary,
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search transactions by name, account, reference, status, amount, or date"
              style={{
                width: "100%",
                padding: "13px 16px 13px 42px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={() => setShowTransferModal(!showTransferModal)}
            style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            {showTransferModal ? "Cancel" : "+ Initiate Transfer"}
          </button>

          {showTransferModal && (
            <div style={{ background: colors.card, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: colors.text, marginBottom: 16 }}>Admin Initiated Transfer</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="From Account Number"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  placeholder="To Account Number"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={handleInitiateTransfer}
                disabled={loading}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                {loading ? "Processing..." : "Execute Transfer"}
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: "center", color: colors.textSecondary, padding: "40px 20px" }}>
                {transactionSearch ? "No matching transactions found" : "No transactions yet"}
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    background: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    border: `1px solid ${colors.border}`,
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>From</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{tx.sender_name}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{tx.sender_account}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>To</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{tx.receiver_name}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{tx.receiver_account}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Amount</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: colors.success }}>${formatCurrency(tx.amount || 0)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Status</div>
                    <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: tx.status === "Completed" ? colors.success : colors.error, color: "white", fontSize: 11, fontWeight: 700 }}>
                      {tx.status}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Date</div>
                    {editingTransactionId === tx.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          type="date"
                          value={editTransactionDate}
                          onChange={(e) => setEditTransactionDate(e.target.value)}
                          style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 12, boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleUpdateTransactionDate(tx.id)}
                            disabled={loading}
                            style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 11 }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransactionId(null);
                              setEditTransactionDate("");
                            }}
                            style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, fontWeight: 700, cursor: "pointer", fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>
                          {getTransactionDate(tx) || "N/A"}
                        </div>
                        <button
                          onClick={() => startEditTransactionDate(tx)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontWeight: 700, cursor: "pointer", fontSize: 11 }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {adminTab === "transfers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {externalTransfers.length === 0 ? (
            <div style={{ textAlign: "center", color: colors.textSecondary, padding: "40px 20px" }}>
              No external transfers
            </div>
          ) : (
            externalTransfers.map((tx) => (
              <div
                key={tx.id}
                style={{
                  background: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                  alignItems: isMobile ? "stretch" : "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                    {tx.sender_name}{" -> "}{tx.beneficiary_name}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {tx.bank_name} | {tx.external_account}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: colors.primary, marginTop: 8 }}>
                    ${formatCurrency(tx.amount || 0)}
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 20,
                    background:
                      tx.status === "Pending"
                        ? colors.primary
                        : tx.status === "Approved"
                        ? colors.success
                        : colors.error,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {tx.status}
                </div>

                {tx.status === "Pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleApproveTransfer(tx.id, tx)}
                      disabled={loading}
                      style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                    >
                      {loading ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRejectTransfer(tx.id)}
                      disabled={loading}
                      style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#1a3a52", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                    >
                      {loading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
