import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { formatCurrency } from "../utils/currency";

export default function Transactions({ transactions, userExternalTransfers, accountNumber, isMobile }) {
  const { colors, isDark } = useContext(ThemeContext);
  const [activeFilter, setActiveFilter] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");

  const getDatePart = (value) => {
    if (!value) return "";
    const str = String(value);
    return str.includes("T") ? str.split("T")[0] : str;
  };

  const parseLocalDate = (dateValue) => {
    if (!dateValue) return null;
    const parts = String(dateValue).split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  };

  const getEffectiveTransactionDate = (tx) => {
    const transactionDate = getDatePart(tx?.transaction_date);
    const createdDate = getDatePart(tx?.created_at);
    const today = new Date().toISOString().split("T")[0];

    if (transactionDate && createdDate) {
      if (transactionDate !== createdDate && transactionDate === today) {
        return createdDate;
      }
      return transactionDate;
    }

    return transactionDate || createdDate || "";
  };

  const getTransactionDateLabel = (tx) => {
    const effectiveDate = getEffectiveTransactionDate(tx);
    if (effectiveDate) {
      const localDate = parseLocalDate(effectiveDate);
      if (!localDate || Number.isNaN(localDate.getTime())) return "N/A";
      return localDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return "N/A";
  };

  const getActivityKind = (tx) => {
    const descriptionText = String(tx?.description || "").toLowerCase();
    const typeText = String(tx?.type || "").toLowerCase();
    const isOutgoing = tx?.sender_account === accountNumber;
    const isCardPurchase = /\b(card|purchase|pos|visa|mastercard|debit)\b/.test(
      `${descriptionText} ${typeText}`
    );

    if (isCardPurchase) return "card";
    return isOutgoing ? "debit" : "credit";
  };

  const getActivityIconPalette = (kind) => {
    if (kind === "credit") {
      return {
        ring: "rgba(134, 239, 172, 0.75)",
        background: "rgba(34, 197, 94, 0.08)",
        color: "#86efac",
        shadow: "0 0 0 1px rgba(34,197,94,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
      };
    }

    return {
      ring: "rgba(96, 165, 250, 0.72)",
      background: "rgba(37, 99, 235, 0.07)",
      color: "#60a5fa",
      shadow: "0 0 0 1px rgba(37,99,235,0.16), inset 0 1px 0 rgba(255,255,255,0.04)",
    };
  };

  const renderActivityIcon = (kind, size) => {
    const palette = getActivityIconPalette(kind);

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `1.5px solid ${palette.ring}`,
          background: palette.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: palette.color,
          flexShrink: 0,
          boxShadow: palette.shadow,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          style={{
            width: size * 0.48,
            height: size * 0.48,
            color: palette.color,
          }}
        >
          {kind === "credit" && (
            <>
              <path d="M12 18V6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M7 11L12 6L17 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          )}
          {kind === "debit" && (
            <>
              <path d="M12 6V18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
              <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          )}
          {kind === "card" && (
            <>
              <rect x="4" y="6.5" width="16" height="11" rx="2.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
              <path d="M4 10.3H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.85" />
              <path d="M7 14.2H10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
            </>
          )}
        </svg>
      </div>
    );
  };

  const amountColor = {
    debit: isDark ? "#7fb0ea" : "#2f5f9d",
    credit: isDark ? "#9a7bb0" : "#6b3f73",
  };

  const getTransactionSortTime = (tx) => {
    const createdAt = tx.created_at ? new Date(tx.created_at) : null;
    const hasValidCreatedAt = createdAt && !isNaN(createdAt.getTime());
    const effectiveDate = getEffectiveTransactionDate(tx);

    if (effectiveDate) {
      const timePart = hasValidCreatedAt
        ? `${String(createdAt.getHours()).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}:${String(createdAt.getSeconds()).padStart(2, "0")}`
        : "00:00:00";
      const combined = new Date(`${effectiveDate}T${timePart}`);
      if (!isNaN(combined.getTime())) return combined.getTime();
    }

    if (hasValidCreatedAt) return createdAt.getTime();
    return 0;
  };

  const allTx = [...(transactions || [])].sort((a, b) => getTransactionSortTime(b) - getTransactionSortTime(a));
  const filtered = activeFilter === "all" ? allTx
    : activeFilter === "in" ? allTx.filter(tx => tx.sender_account !== accountNumber)
    : allTx.filter(tx => tx.sender_account === accountNumber);
  const normalizeSearch = (value) => String(value || "").trim().toLowerCase();
  const matchesSearch = (source, fields) => {
    const query = normalizeSearch(source);
    if (!query) return true;
    return fields.some((field) => normalizeSearch(field).includes(query));
  };
  const searchedTransactions = filtered.filter((tx) =>
    matchesSearch(transactionSearch, [
      tx.sender_name,
      tx.sender_account,
      tx.receiver_name,
      tx.receiver_account,
      tx.description,
      tx.reference,
      tx.status,
      tx.amount,
      getTransactionDateLabel(tx),
    ])
  );

  const getMatchingExternalTransaction = (ext) => {
    if (!ext) return null;

    const extAmount = Number(ext.amount);
    return allTx.find((tx) => {
      const txAmount = Number(tx.amount);
      const isExternalLike = /external transfer/i.test(tx.description || "");

      return (
        isExternalLike &&
        tx.sender_account === ext.sender_account &&
        (tx.receiver_account === ext.external_account || tx.receiver_name === ext.beneficiary_name) &&
        Number.isFinite(extAmount) &&
        Number.isFinite(txAmount) &&
        txAmount === extAmount
      );
    }) || null;
  };

  const getExternalTransferDateLabel = (ext) => {
    const matchedTx = getMatchingExternalTransaction(ext);
    if (matchedTx) {
      return getTransactionDateLabel(matchedTx);
    }

    if (ext?.created_at) {
      return new Date(ext.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return "N/A";
  };

  const searchedExternalTransfers = (userExternalTransfers || []).filter((ext) =>
    matchesSearch(transactionSearch, [
      ext.beneficiary_name,
      ext.bank_name,
      ext.external_account,
      ext.sender_account,
      ext.status,
      ext.amount,
      getExternalTransferDateLabel(ext),
    ])
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>
          Transactions
        </h1>
        <div style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>
          {allTx.length} record{allTx.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search */}
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
          placeholder="Search by name, account, reference, status, amount, or date"
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

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, background: colors.card, borderRadius: 12, padding: 4, border: `1px solid ${colors.border}` }}>
        {[
          { id: "all", label: "All" },
          { id: "in", label: "Received" },
          { id: "out", label: "Sent" },
        ].map((f) => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
            flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
            background: activeFilter === f.id ? "linear-gradient(135deg,#0d1b2a,#1a2f44)" : "transparent",
            color: activeFilter === f.id ? "white" : colors.textSecondary,
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeFilter === f.id ? "0 2px 8px rgba(13,27,42,.5)" : "none",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
        {searchedTransactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: colors.textSecondary }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {transactionSearch ? "No matching transactions found" : "No transactions yet"}
            </div>
          </div>
        ) : searchedTransactions.map((tx, idx) => {
          const isOutgoing = tx.sender_account === accountNumber;
          const activityKind = getActivityKind(tx);
          const counterparty = isOutgoing
            ? (tx.receiver_name || tx.receiver_account || "Recipient")
            : (tx.sender_name || tx.sender_account || "Sender");
          return (
            <div key={tx.id} style={{
              padding: isMobile ? "14px 16px" : "16px 20px",
              borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.border}` : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: isMobile ? 42 : 46,
                  height: isMobile ? 42 : 46,
                  flexShrink: 0,
                }}>
                  {renderActivityIcon(activityKind, isMobile ? 42 : 46)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                    {counterparty}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                    {tx.description || (isOutgoing ? "Transfer sent" : "Transfer received")}
                  </div>
                  <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textSecondary, opacity: 0.7 }}>
                    {getTransactionDateLabel(tx)} • {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {tx.reference && !isMobile && (
                    <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, opacity: 0.6 }}>
                      Ref: {tx.reference}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: isOutgoing ? amountColor.debit : amountColor.credit }}>
                  {isOutgoing ? "-" : "+"}${formatCurrency(tx.amount)}
                </div>
                <div style={{
                  marginTop: 4, fontSize: isMobile ? 10 : 11,
                  color: (tx.status === "Completed" || tx.status === "completed") ? "#22c55e" : colors.textSecondary,
                  fontWeight: (tx.status === "Completed" || tx.status === "completed") ? 600 : 400,
                  textTransform: "capitalize",
                }}>
                  {tx.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* External transfers */}
      {searchedExternalTransfers.length > 0 && (
        <div>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: colors.text, marginBottom: 12, marginTop: 0 }}>
            External Transfers
          </h2>
          <div style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            {searchedExternalTransfers.map((ext, idx, arr) => (
              <div key={ext.id} style={{
                padding: isMobile ? "14px 16px" : "16px 20px",
                borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : "none",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: colors.text, marginBottom: 2 }}>
                    {ext.beneficiary_name}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
                    {ext.bank_name} • {ext.external_account}
                  </div>
                  <div style={{ fontSize: 10, color: colors.textSecondary, opacity: 0.7 }}>
                    {getExternalTransferDateLabel(ext)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#ef4444" }}>
                    -${formatCurrency(ext.amount)}
                  </div>
                  <div style={{
                    marginTop: 4, fontSize: 11,
                    color: ext.status === "Approved" ? "#22c55e" : ext.status === "Rejected" ? "#ef4444" : "#f59e0b",
                    fontWeight: 600,
                  }}>
                    {ext.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}