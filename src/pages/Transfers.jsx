import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../utils/currency";

const MAINTENANCE_MESSAGE =
  "Service is temporarily under maintenance. Please try again later or contact support.";

export default function Transfers({
  fullName,
  balance,
  isMobile,
  accountNumber,
  onTransferComplete,
}) {
  const { colors } = useContext(ThemeContext);
  const [transferType, setTransferType] = useState("internal");
  const [loading, setLoading] = useState(false);
  
  // Internal transfer state
  const [internalAmount, setInternalAmount] = useState("");
  const [internalRecipient, setInternalRecipient] = useState("");
  const [internalDescription, setInternalDescription] = useState("");

  // External transfer state
  const [externalAmount, setExternalAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  const [externalAccount, setExternalAccount] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  
  // External transfer flow states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [externalPin, setExternalPin] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [transferCode, setTransferCode] = useState("");

  const isMissingTransactionDateColumnError = (error) => {
    const message = error?.message || "";
    return (
      message.includes("transaction_date") ||
      message.includes("Could not find the 'transaction_date' column")
    );
  };

  const sanitizeAmountInput = (value) => {
    const cleaned = String(value || "")
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    const [whole, decimal = ""] = cleaned.split(".");
    if (!cleaned.includes(".")) return whole;
    return `${whole}.${decimal.slice(0, 2)}`;
  };

  const parseAmount = (value) => {
    const normalized = sanitizeAmountInput(value);
    if (!normalized) return NaN;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return NaN;
    return Math.round(parsed * 100) / 100;
  };

  const formatAmountInput = (value) => {
    const parsed = parseAmount(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
  };

  const insertTransactionRecord = async (payload) => {
    const withDatePayload = {
      ...payload,
      transaction_date: new Date().toISOString().split("T")[0],
    };

    const firstAttempt = await supabase
      .from("transactions")
      .insert([withDatePayload]);

    if (!firstAttempt.error) return firstAttempt;
    if (!isMissingTransactionDateColumnError(firstAttempt.error)) {
      return firstAttempt;
    }

    const fallbackPayload = { ...withDatePayload };
    delete fallbackPayload.transaction_date;

    return supabase
      .from("transactions")
      .insert([fallbackPayload]);
  };

  const handleInternalTransfer = async () => {
    const amt = parseAmount(internalAmount);

    if (!internalRecipient.trim() || !Number.isFinite(amt) || amt <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    if (internalRecipient.trim() === accountNumber) {
      alert("You cannot transfer to the same account");
      return;
    }

    const pinPrompt = prompt("Enter your 4-digit transfer PIN:");
    if (!pinPrompt || !/^\d{4}$/.test(pinPrompt)) {
      alert("Invalid PIN");
      return;
    }

    setLoading(true);
    try {
      const [senderResult, receiverResult] = await Promise.all([
        supabase
          .from("accounts")
          .select("balance, transfer_pin, status")
          .eq("account_number", accountNumber)
          .single(),
        supabase
          .from("accounts")
          .select("balance, full_name, status")
          .eq("account_number", internalRecipient)
          .single(),
      ]);
      const { data: senderData, error: senderError } = senderResult;
      const { data: receiverData, error: receiverError } = receiverResult;

      if (senderError || !senderData) {
        alert("Sender account not found");
        setLoading(false);
        return;
      }

      if (senderData.transfer_pin !== pinPrompt) {
        alert("Incorrect PIN");
        setLoading(false);
        return;
      }

      if (String(senderData.status || "").toLowerCase() === "frozen") {
        alert(MAINTENANCE_MESSAGE);
        setLoading(false);
        return;
      }

      if (String(receiverData.status || "").toLowerCase() === "frozen") {
        alert(MAINTENANCE_MESSAGE);
        setLoading(false);
        return;
      }

      const senderBalance = Number(senderData.balance || 0);
      const receiverBalance = Number(receiverData?.balance || 0);

      if (!Number.isFinite(senderBalance)) {
        alert("Unable to verify sender balance");
        setLoading(false);
        return;
      }

      if (senderBalance + 0.000001 < amt) {
        alert("Insufficient funds");
        setLoading(false);
        return;
      }

      if (receiverError || !receiverData) {
        alert("Recipient account not found");
        setLoading(false);
        return;
      }

      const [senderUpdate, receiverUpdate] = await Promise.all([
        supabase
          .from("accounts")
          .update({ balance: senderBalance - amt })
          .eq("account_number", accountNumber),
        supabase
          .from("accounts")
          .update({ balance: (Number.isFinite(receiverBalance) ? receiverBalance : 0) + amt })
          .eq("account_number", internalRecipient),
      ]);

      if (senderUpdate.error || receiverUpdate.error) {
        throw senderUpdate.error || receiverUpdate.error;
      }

      const { error: transactionError } = await insertTransactionRecord({
        sender_account: accountNumber,
        sender_name: fullName,
        receiver_account: internalRecipient,
        receiver_name: receiverData.full_name,
        amount: amt,
        description: internalDescription || "Internal Transfer",
        reference: "INT-" + Math.floor(100000 + Math.random() * 900000),
        status: "Completed",
      });

      if (transactionError) throw transactionError;

      alert("Internal transfer completed successfully!");
      setInternalAmount("0.00");
      setInternalRecipient("");
      setInternalDescription("");
      await onTransferComplete?.();
      setLoading(false);
    } catch (error) {
      alert("Transfer failed: " + error.message);
      setLoading(false);
    }
  };

  const handleExternalTransferStart = () => {
    const amt = parseAmount(externalAmount);

    if (!beneficiaryName || !bankName || !externalAccount || !routingNumber || !swiftCode || !Number.isFinite(amt) || amt <= 0) {
      alert("Please fill in all external transfer details");
      return;
    }

    setExternalAmount(amt.toFixed(2));
    setShowPinPrompt(true);
  };

  const handleExternalPinSubmit = async () => {
    if (!externalPin || !/^\d{4}$/.test(externalPin)) {
      alert("Please enter a valid 4-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const amt = parseAmount(externalAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        alert("Please enter a valid amount");
        setLoading(false);
        return;
      }

      const { data: senderData, error: senderError } = await supabase
        .from("accounts")
        .select("balance, transfer_pin, status")
        .eq("account_number", accountNumber)
        .single();

      if (senderError || !senderData) {
        alert("Sender account not found");
        setLoading(false);
        return;
      }

      if (senderData.transfer_pin !== externalPin) {
        alert("Incorrect PIN");
        setExternalPin("");
        setLoading(false);
        return;
      }

      if (String(senderData.status || "").toLowerCase() === "frozen") {
        alert(MAINTENANCE_MESSAGE);
        setLoading(false);
        return;
      }

      const senderBalance = Number(senderData.balance || 0);
      if (!Number.isFinite(senderBalance)) {
        alert("Unable to verify sender balance");
        setLoading(false);
        return;
      }

      if (senderBalance + 0.000001 < amt) {
        alert("Insufficient funds");
        setLoading(false);
        return;
      }

      setShowPinPrompt(false);
      setExternalPin("");
      setShowConfirmation(true);
      setLoading(false);
    } catch (error) {
      alert("PIN verification failed: " + error.message);
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!transferCode || transferCode.length < 4) {
      alert("Please enter a valid 4-digit code");
      return;
    }

    setLoading(true);
    try {
      const amt = parseAmount(externalAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        alert("Please enter a valid amount");
        setLoading(false);
        return;
      }

      const { data: senderData, error: senderError } = await supabase
        .from("accounts")
        .select("balance, status")
        .eq("account_number", accountNumber)
        .single();

      if (senderError || !senderData) {
        alert("Sender account not found");
        setLoading(false);
        return;
      }

      if (String(senderData.status || "").toLowerCase() === "frozen") {
        alert(MAINTENANCE_MESSAGE);
        setLoading(false);
        return;
      }

      const senderBalance = Number(senderData.balance || 0);
      if (!Number.isFinite(senderBalance)) {
        alert("Unable to verify sender balance");
        setLoading(false);
        return;
      }

      if (senderBalance + 0.000001 < amt) {
        alert("Insufficient funds");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("external_transfers")
        .insert([
          {
            sender_account: accountNumber,
            sender_name: fullName,
            beneficiary_name: beneficiaryName,
            bank_name: bankName,
            external_account: externalAccount,
            routing_number: routingNumber,
            swift_code: swiftCode,
            amount: amt,
            authorization_code: transferCode,
            status: "Pending",
          },
        ]);

      if (error) throw error;

      alert("External transfer submitted and is now pending admin approval");
      setShowCodePrompt(false);
      setShowConfirmation(false);
      setExternalAmount("");
      setBeneficiaryName("");
      setBankName("");
      setExternalAccount("");
      setRoutingNumber("");
      setSwiftCode("");
      setTransferCode("");
      await onTransferComplete?.();
      setLoading(false);
    } catch (error) {
      alert("Transfer failed: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 14 : 20,
      }}
    >
      {/* PIN Entry Modal - External Transfer */}
      {showPinPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              border: `1px solid ${colors.border}`,
              maxWidth: 400,
              width: "100%",
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4)`,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: colors.text,
                margin: "0 0 8px 0",
                textAlign: "center",
              }}
            >
              Verify PIN
            </h2>
            <p
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                margin: "0 0 20px 0",
              }}
            >
              Enter your 4-digit transfer PIN to proceed
            </p>

            <input
              type="password"
              maxLength="4"
              value={externalPin}
              onChange={(e) => setExternalPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="••••"
              disabled={loading}
              autoFocus
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: `2px solid ${colors.primary}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 8,
                boxSizing: "border-box",
                marginBottom: 20,
                opacity: loading ? 0.6 : 1,
              }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowPinPrompt(false);
                  setExternalPin("");
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.text,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExternalPinSubmit}
                disabled={loading || externalPin.length !== 4}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: colors.primary,
                  color: "white",
                  fontWeight: 700,
                  cursor: loading || externalPin.length !== 4 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: loading || externalPin.length !== 4 ? 0.6 : 1,
                }}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - After PIN */}
      {showConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              border: `1px solid ${colors.border}`,
              maxWidth: 400,
              width: "100%",
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4)`,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: colors.text,
                margin: "0 0 12px 0",
                textAlign: "center",
              }}
            >
              External Transfer Initiated
            </h2>
            <p
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                margin: "0 0 6px 0",
                lineHeight: "1.5",
              }}
            >
              You have attempted to initiate an external transfer. An authorization code is required to complete this transaction.
            </p>
            <p
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                margin: "0 0 24px 0",
              }}
            >
              Please enter your authorization code on the next screen to proceed.
            </p>

            <button
              onClick={() => {
                setShowConfirmation(false);
                setShowCodePrompt(true);
              }}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "none",
                background: colors.primary,
                color: "white",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Processing..." : "Continue to Authorization"}
            </button>

            <button
              onClick={() => {
                setShowConfirmation(false);
                setExternalAmount("");
                setBeneficiaryName("");
                setBankName("");
                setExternalAccount("");
                setRoutingNumber("");
                setSwiftCode("");
              }}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                marginTop: 10,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Code Entry Prompt - External Transfer */}
      {showCodePrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: colors.card,
              borderRadius: 16,
              padding: isMobile ? 20 : 28,
              border: `1px solid ${colors.border}`,
              maxWidth: 400,
              width: "100%",
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4)`,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: colors.text,
                margin: "0 0 20px 0",
                textAlign: "center",
              }}
            >
              Enter Authorization Code
            </h2>

            <input
              type="text"
              maxLength="4"
              value={transferCode}
              onChange={(e) => setTransferCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0000"
              disabled={loading}
              autoFocus
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: `2px solid ${colors.primary}`,
                background: colors.bg,
                color: colors.text,
                fontSize: 24,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 8,
                boxSizing: "border-box",
                marginBottom: 20,
                opacity: loading ? 0.6 : 1,
              }}
            />

            {/* Bottom Section - Need Help | Support */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: `1px solid ${colors.border}`,
                paddingTop: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Need help?
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: colors.primary,
                    fontWeight: 700,
                  }}
                >
                  →
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  height: 30,
                  background: colors.border,
                }}
              ></div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Support
                </div>
                <a
                  href="mailto:support@metrotrustcapital.com"
                  style={{
                    color: colors.primary,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Contact Now →
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowCodePrompt(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "transparent",
                  color: colors.text,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: colors.primary,
                  color: "white",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Type Selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => setTransferType("internal")}
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            background:
              transferType === "internal" ? colors.primary : colors.bgTertiary,
            color: transferType === "internal" ? "white" : colors.text,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.2s ease",
          }}
        >
          Internal Transfer
        </button>
        <button
          onClick={() => setTransferType("external")}
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            background:
              transferType === "external" ? colors.primary : colors.bgTertiary,
            color: transferType === "external" ? "white" : colors.text,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.2s ease",
          }}
        >
          External Transfer
        </button>
      </div>

      {/* Form Container */}
      <div
        style={{
          background: colors.card,
          borderRadius: 16,
          padding: isMobile ? 16 : 24,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight: 800,
            color: colors.text,
            margin: "0 0 20px 0",
          }}
        >
          {transferType === "internal"
            ? "Internal Transfer"
            : "External Transfer"}
        </h2>

        {/* Current Balance */}
        <div
          style={{
            background: colors.bgTertiary,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
            Available Balance
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: colors.success,
            }}
          >
            ${formatCurrency(balance || 0)}
          </div>
        </div>

        {transferType === "internal" ? (
          <>
            {/* Internal Transfer Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Recipient Account Number
                </label>
                <input
                  type="text"
                  value={internalRecipient}
                  onChange={(e) => setInternalRecipient(e.target.value)}
                  placeholder="Enter recipient account number"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 14,
                    boxSizing: "border-box",
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Amount
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: colors.text,
                      marginRight: 8,
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={internalAmount}
                    onChange={(e) => setInternalAmount(sanitizeAmountInput(e.target.value))}
                    onBlur={() => setInternalAmount(formatAmountInput(internalAmount))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                      opacity: loading ? 0.6 : 1,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Description (Optional)
                </label>
                <textarea
                  value={internalDescription}
                  onChange={(e) => setInternalDescription(e.target.value)}
                  placeholder="Add a note for this transfer"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 14,
                    boxSizing: "border-box",
                    minHeight: 80,
                    fontFamily: "inherit",
                    resize: "vertical",
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>

              <button
                onClick={handleInternalTransfer}
                disabled={loading}
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: colors.primary,
                  color: "white",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Processing..." : "Transfer Now"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* External Transfer Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Full name of recipient"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 14,
                    boxSizing: "border-box",
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Name of recipient's bank"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 14,
                    boxSizing: "border-box",
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  External Account Number
                </label>
                <input
                  type="text"
                  value={externalAccount}
                  onChange={(e) => setExternalAccount(e.target.value)}
                  placeholder="Recipient's account number"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 14,
                    boxSizing: "border-box",
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Routing number"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                      opacity: loading ? 0.6 : 1,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="SWIFT code"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                      opacity: loading ? 0.6 : 1,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Amount
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: colors.text,
                      marginRight: 8,
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={externalAmount}
                    onChange={(e) => setExternalAmount(sanitizeAmountInput(e.target.value))}
                    onBlur={() => setExternalAmount(formatAmountInput(externalAmount))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                      opacity: loading ? 0.6 : 1,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleExternalTransferStart}
                disabled={loading}
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: colors.primary,
                  color: "white",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Processing..." : "Transfer Now"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
