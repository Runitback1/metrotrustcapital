import { useContext, useLayoutEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
console.log("CARDS VERSION 6dc7bff");

const NAV_GRADIENT = "linear-gradient(135deg,#0d1b2a 0%,#1a2f44 100%)";
const NAV_SHADOW = "0 4px 14px rgba(13,27,42,.6)";

function LimitIcon({ type, color }) {
  const common = { width: 20, height: 20 };

  if (type === "daily") {
    return (
      <svg viewBox="0 0 24 24" style={common}>
        <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.7" fill="none" />
        <path d="M8 2v4M16 2v4M3 9h18" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M12 12v4M10 14h4" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "monthly") {
    return (
      <svg viewBox="0 0 24 24" style={common}>
        <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.7" fill="none" />
        <path d="M8 2v4M16 2v4M3 9h18" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M7 13h10M7 17h6" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "atm") {
    return (
      <svg viewBox="0 0 24 24" style={common}>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.7" fill="none" />
        <path d="M7 9h10M7 12h6M15 15h2" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "online") {
    return (
      <svg viewBox="0 0 24 24" style={common}>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7" fill="none" />
        <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2 -3 14.8 0 18" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" style={common}>
      <path d="M4 12h16M14 6l6 6-6 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8h7" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M4 16h7" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Cards({
  fullName,
  cardNumber,
  expiryDate,
  cvv,
  isMobile,
  openPaymentLimitsRequest = null,
  onPaymentLimitsRequestHandled,
  onBackToMore,
}) {
  const { isDark, colors } = useContext(ThemeContext);
  const [view, setView] = useState("main");
  const [showCVV, setShowCVV] = useState(false);
  const [showCVVSupportModal, setShowCVVSupportModal] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [cardLabel, setCardLabel] = useState("");
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const initialLimitsRequest = Boolean(openPaymentLimitsRequest?.token);
  const [showNewCard, setShowNewCard] = useState(false);
  const [whereToUse, setWhereToUse] = useState(false);
  const [showLimits, setShowLimits] = useState(initialLimitsRequest);
  const [limitsSource, setLimitsSource] = useState(
    initialLimitsRequest ? (openPaymentLimitsRequest.source || "more") : "cards"
  );

  useLayoutEffect(() => {
    if (openPaymentLimitsRequest?.token) {
      setShowLimits(true);
      setLimitsSource(openPaymentLimitsRequest.source || "more");
      setShowNewCard(false);
      setWhereToUse(false);
      setEditingLabel(false);
      setView("main");
      onPaymentLimitsRequestHandled?.();
    }
  }, [openPaymentLimitsRequest, onPaymentLimitsRequestHandled]);

  const maskedNumber = cardNumber
    ? `${cardNumber.slice(0,4)} ${cardNumber.slice(4,8)} ${cardNumber.slice(8,12)} ${cardNumber.slice(12,16)}`
    : "•••• •••• •••• 7924";

  const displayNumber = cardNumber
    ? `${cardNumber.slice(0,4)} ${cardNumber.slice(4,8)} ${cardNumber.slice(8,12)} ${cardNumber.slice(12,16)}`
    : "4872 3901 5564 7924";

  // Always show 2032 regardless of stored value
  const displayExpiry = expiryDate
    ? expiryDate.replace(/\/\d+$/, "/32")
    : "12/32";

  const handleCvvToggleRequest = () => {
    if (showCVV) {
      setShowCVV(false);
      return;
    }

    setShowCVVSupportModal(true);
  };

  const handleSupportCvvRequest = () => {
    const subject = encodeURIComponent("CVV Reveal Request - MetroTrust Card");
    const body = encodeURIComponent(
      "Hello Support,%0D%0A%0D%0APlease review my request to reveal my card CVV.%0D%0A%0D%0AThanks."
    );

    window.location.href = `mailto:support@metrotrustcapital.com?subject=${subject}&body=${body}`;
    setShowCVVSupportModal(false);
    alert("Support request prepared. Please send the email and wait for admin review.");
  };

  /* ===== NEW CARD VIEW ===== */
  if (showNewCard) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>New Card</h1>
        <div style={{
          background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)",
          borderRadius: 20, padding: isMobile ? 24 : 36,
          border: `2px dashed ${colors.border}`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 200, textAlign: "center",
          gap: 16,
        }}>
          <svg viewBox="0 0 24 24" style={{ width: 56, height: 56, color: colors.textSecondary, opacity: 0.5 }}>
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>Physical Card</div>
          <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>
            Coming soon. Your MetroTrust physical card is being prepared.
            You'll be notified when it's ready to ship.
          </div>
          <div style={{
            padding: "8px 18px", borderRadius: 20,
            background: isDark ? "rgba(104,153,200,.15)" : "rgba(37,99,235,.1)",
            color: colors.primary, fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }}>
            🚀 COMING SOON
          </div>
        </div>
        <button onClick={() => setShowNewCard(false)} style={{
          padding: "14px 20px", borderRadius: 12, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 15,
        }}>
          ← Back to Cards
        </button>
      </div>
    );
  }

  /* ===== PAYMENT LIMITS VIEW ===== */
  if (showLimits) {
    const limitRows = [
      { label: "Daily Spending Limit", value: "Unlimited", icon: "daily" },
      { label: "Monthly Spending Limit", value: "Unlimited", icon: "monthly" },
      { label: "ATM Withdrawal (Daily)", value: "Unlimited", icon: "atm" },
      { label: "Online Transactions", value: "Unlimited", icon: "online" },
      { label: "International Transactions", value: "Unlimited", icon: "international" },
    ];

    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>Payment Limits</h1>
        <div style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          {limitRows.map((item, idx, arr) => (
            <div key={idx} style={{
              padding: "18px 20px", borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LimitIcon type={item.icon} color={colors.primary} />
                </span>
                <div style={{ fontSize: 15, fontWeight: 500, color: colors.text }}>{item.label}</div>
              </div>
              <div style={{
                padding: "5px 12px", borderRadius: 20,
                background: isDark ? "rgba(34,197,94,.12)" : "rgba(34,197,94,.1)",
                color: "#22c55e", fontSize: 13, fontWeight: 700,
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => {
          if (limitsSource === "more") {
            onBackToMore?.();
            return;
          }
          setShowLimits(false);
        }} style={{
          padding: "14px 20px", borderRadius: 12, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 15,
        }}>
          {limitsSource === "more" ? "← Back" : "← Back to Cards"}
        </button>
      </div>
    );
  }

  /* ===== WHERE TO USE VIEW ===== */
  if (whereToUse) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>Where Can I Use My Card?</h1>
        <div style={{
          background: NAV_GRADIENT, borderRadius: 20, padding: isMobile ? 24 : 36,
          color: "white", textAlign: "center", boxShadow: "0 20px 40px rgba(13,27,42,.4)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌍</div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, lineHeight: 1.5 }}>
            You can use your card anywhere<br/>Visa card is accepted.
          </div>
          <div style={{ marginTop: 16, opacity: 0.75, fontSize: 14, lineHeight: 1.7 }}>
            Over 100 million merchants worldwide. Online, in-store, and internationally.
          </div>
        </div>
        <button onClick={() => setWhereToUse(false)} style={{
          padding: "14px 20px", borderRadius: 12, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 15,
        }}>
          ← Back to Cards
        </button>
      </div>
    );
  }

  /* ===== DETAILS VIEW ===== */
  if (view === "details") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: colors.textSecondary, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
              Find your virtual card details below
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: colors.text, margin: 0 }}>Card Details</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: 2, color: colors.text }}>VISA</div>
            <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>Premium</div>
          </div>
        </div>

        <div style={{
          background: NAV_GRADIENT, borderRadius: 20, padding: isMobile ? 20 : 28,
          color: "white", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(13,27,42,.5)",
        }}>
          <div style={{ position: "absolute", top: "-30%", right: "-5%", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>MetroTrust</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>VISA</div>
            </div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontFamily: "monospace", letterSpacing: 3, marginBottom: 24 }}>{displayNumber}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Card Holder</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fullName || "Johnny Saves"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Expires</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>{displayExpiry}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          {[
            { label: "Card Number", value: displayNumber, mono: true },
            { label: "Card Holder Name", value: fullName || "Johnny Saves" },
            { label: "Expiry Date", value: displayExpiry, mono: true },
            {
              label: "CVV / Security Code", value: showCVV ? (cvv || "452") : "•••", mono: true,
              action: <button onClick={handleCvvToggleRequest} style={{ border: "none", background: "transparent", color: colors.primary, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>{showCVV ? "Hide" : "Reveal"}</button>
            },
          ].map((item, idx, arr) => (
            <div key={idx} style={{
              padding: "16px 20px", borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</div>
              </div>
              {item.action && item.action}
            </div>
          ))}
        </div>

        {showCVVSupportModal && (
          <div
            onClick={() => setShowCVVSupportModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(7, 13, 29, 0.72)",
              zIndex: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxSizing: "border-box",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                borderRadius: 16,
                background: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 20px 50px rgba(0,0,0,.35)",
                padding: isMobile ? "20px 16px" : "24px 22px",
              }}
            >
              <div style={{ fontSize: isMobile ? 19 : 21, fontWeight: 800, color: colors.text, marginBottom: 10 }}>
                CVV Reveal Request
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: colors.textSecondary, marginBottom: 18 }}>
                Admin is currently checking your request. To continue, send an email to support so the team can investigate and approve access.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSupportCvvRequest}
                  style={{
                    flex: 1,
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 14px",
                    background: NAV_GRADIENT,
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Support
                </button>
                <button
                  onClick={() => setShowCVVSupportModal(false)}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    padding: "12px 14px",
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.text,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setView("main")} style={{ padding: "14px 20px", borderRadius: 12, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 15 }}>
          ← Back to Card
        </button>
      </div>
    );
  }

  /* ===== FREEZE CONFIRM VIEW ===== */
  if (view === "freeze-confirm") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>
          {isFrozen ? "Unfreeze Card" : "Freeze Card"}
        </h1>

        <div style={{ background: NAV_GRADIENT, borderRadius: 20, padding: isMobile ? 24 : 32, color: "white", textAlign: "center", boxShadow: "0 20px 40px rgba(13,27,42,.5)" }}>
          <svg viewBox="0 0 64 64" style={{ width: 64, height: 64, margin: "0 auto 16px" }}>
            {isFrozen ? (
              <>
                <circle cx="32" cy="28" r="12" stroke="rgba(147,197,253,.8)" strokeWidth="2" fill="none"/>
                <path d="M 20 40 L 20 52 Q 20 54 22 54 L 42 54 Q 44 54 44 52 L 44 40" stroke="rgba(147,197,253,.8)" strokeWidth="2" fill="none"/>
                <circle cx="32" cy="47" r="2.5" fill="rgba(147,197,253,.9)"/>
              </>
            ) : (
              <>
                <path d="M 20 28 L 20 20 Q 20 12 32 12 Q 44 12 44 20 L 44 28" stroke="rgba(147,197,253,.8)" strokeWidth="2" fill="none"/>
                <rect x="14" y="28" width="36" height="26" rx="4" stroke="rgba(147,197,253,.8)" strokeWidth="2" fill="none"/>
                <circle cx="32" cy="40" r="3" fill="rgba(147,197,253,.9)"/>
                <line x1="32" y1="43" x2="32" y2="48" stroke="rgba(147,197,253,.7)" strokeWidth="2" strokeLinecap="round"/>
              </>
            )}
          </svg>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            {isFrozen ? "Your card is currently frozen" : "Freeze your card?"}
          </div>
          <div style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.7 }}>
            {isFrozen
              ? "Unfreeze to resume all transactions and payments on this card."
              : "Freezing your card will immediately block all new transactions. You can unfreeze it at any time from this page."}
          </div>
        </div>

        <button onClick={() => { setIsFrozen(!isFrozen); setView("main"); }} style={{
          padding: "16px", borderRadius: 14, border: "none",
          background: NAV_GRADIENT, color: "white", cursor: "pointer",
          fontWeight: 700, fontSize: 16, boxShadow: NAV_SHADOW,
        }}>
          {isFrozen ? "Yes, Unfreeze My Card" : "Yes, Freeze My Card"}
        </button>
        <button onClick={() => setView("main")} style={{
          padding: "16px", borderRadius: 14, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 16,
        }}>
          Cancel
        </button>
      </div>
    );
  }

  /* ===== SHOW PIN VIEW ===== */
  if (view === "show-pin") {
    // Generate a deterministic 4-digit PIN from the card number
    const generatePIN = () => {
      if (!cardNumber) return "1234";
      const sum = cardNumber.split("").reduce((acc, d) => acc + parseInt(d || 0), 0);
      return String((sum * 73 + 4521) % 10000).padStart(4, "0");
    };
    const pin = generatePIN();
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>Card PIN</h1>
        <div style={{ background: NAV_GRADIENT, borderRadius: 20, padding: isMobile ? 24 : 36, color: "white", textAlign: "center", boxShadow: "0 20px 40px rgba(13,27,42,.5)" }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Your 4-digit PIN</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            {(showPIN ? pin : "••••").split("").map((d, i) => (
              <div key={i} style={{
                width: 52, height: 64, borderRadius: 12,
                background: "rgba(255,255,255,.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, fontFamily: "monospace",
                border: "1px solid rgba(255,255,255,.2)",
              }}>
                {d}
              </div>
            ))}
          </div>
          <button onClick={() => setShowPIN(!showPIN)} style={{
            marginTop: 20, padding: "10px 24px", borderRadius: 20,
            border: "1px solid rgba(255,255,255,.3)", background: "transparent",
            color: "white", cursor: "pointer", fontWeight: 600, fontSize: 14,
          }}>
            {showPIN ? "Hide PIN" : "Reveal PIN"}
          </button>
          <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }}>
            Never share your PIN with anyone. MetroTrust will never ask for your PIN.
          </div>
        </div>
        <button onClick={() => setView("main")} style={{
          padding: "14px 20px", borderRadius: 12, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 15,
        }}>
          ← Back to Card
        </button>
      </div>
    );
  }

  /* ===== CARD LABEL EDIT VIEW ===== */
  if (editingLabel) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>Card Label</h1>
        <div style={{ background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>Give your card a nickname to identify it easily.</div>
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="e.g. My Travel Card, Daily Wallet..."
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: `1px solid ${colors.border}`, background: colors.bg,
              color: colors.text, fontSize: 16, outline: "none", boxSizing: "border-box",
            }}
          />
          {cardLabel && (
            <div style={{ marginTop: 12, fontSize: 13, color: colors.textSecondary }}>
              Current label: <strong style={{ color: colors.text }}>{cardLabel}</strong>
            </div>
          )}
        </div>
        <button onClick={() => { setCardLabel(labelInput); setEditingLabel(false); }} style={{
          padding: "16px", borderRadius: 14, border: "none",
          background: NAV_GRADIENT, color: "white", cursor: "pointer",
          fontWeight: 700, fontSize: 16, boxShadow: NAV_SHADOW,
        }}>
          Save Label
        </button>
        <button onClick={() => setEditingLabel(false)} style={{
          padding: "16px", borderRadius: 14, border: `1px solid ${colors.border}`,
          background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 600, fontSize: 16,
        }}>
          Cancel
        </button>
      </div>
    );
  }

  /* ===== MAIN VIEW ===== */
  const actionBtnStyle = {
    padding: isMobile ? "18px 10px" : "22px 16px",
    borderRadius: 16, border: "none", background: NAV_GRADIENT, color: "white",
    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 10, boxShadow: NAV_SHADOW, flex: 1, transition: "transform 0.2s ease",
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 4 : 8 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: colors.text, margin: 0 }}>Cards</h1>
        <button
          onClick={() => setShowNewCard(true)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: NAV_GRADIENT, color: "white", fontWeight: 600, cursor: "pointer", fontSize: 12, boxShadow: NAV_SHADOW }}>
          + Add new card
        </button>
      </div>

      {/* Visa Card */}
      <div style={{
        background: "linear-gradient(135deg,#0d1b2a 0%,#1a3a5c 50%,#0d2a47 100%)",
        borderRadius: 20, padding: isMobile ? 20 : 28, boxShadow: "0 20px 40px rgba(13,27,42,.5)",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        {isFrozen && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(10,24,48,.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 20, zIndex: 5, backdropFilter: "blur(2px)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginTop: 10 }}>Card Frozen</div>
            </div>
          </div>
        )}
        {cardLabel && (
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "3px 12px", fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600, zIndex: 3 }}>
            {cardLabel}
          </div>
        )}
        <div style={{ position: "absolute", top: "-30%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>MetroTrust</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>VISA</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Platinum</div>
            </div>
          </div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontFamily: "monospace", letterSpacing: 3, marginBottom: 28 }}>{maskedNumber}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Card Holder</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{fullName || "Johnny Saves"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Expires</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "monospace" }}>{displayExpiry}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 14 }}>
        <button style={actionBtnStyle} onClick={() => setView("details")}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
            <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Details</div>
        </button>

        <button style={actionBtnStyle} onClick={() => setView("freeze-confirm")}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
            <path d="M 6 10 L 18 10 Q 19 10 19 11 L 19 18 Q 19 19 18 19 L 6 19 Q 5 19 5 18 L 5 11 Q 5 10 6 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M 8 10 L 8 6 Q 8 4 10 4 L 14 4 Q 16 4 16 6 L 16 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{isFrozen ? "Unfreeze" : "Freeze"}</div>
        </button>

        <button style={actionBtnStyle} onClick={() => setView("show-pin")}
          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Show PIN</div>
        </button>
      </div>

      {/* Apple Wallet */}
      <div style={{ background: colors.card, borderRadius: 16, padding: isMobile ? 16 : 20, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#000,#333)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, color: "white" }}>
              <path d="M6 2H18C19.1 2 20 2.9 20 4V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 3 }}>Add to Apple Wallet</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>Start spending using Apple Pay</div>
          </div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 10,
          background: isDark ? "rgba(245,158,11,.12)" : "rgba(245,158,11,.1)",
          color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0,
        }}>
          COMING SOON
        </div>
      </div>

      {/* Management Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          {
            icon: "✏️", label: "Card label",
            sublabel: cardLabel ? `Label: ${cardLabel}` : "Add a card label",
            onClick: () => { setLabelInput(cardLabel); setEditingLabel(true); },
          },
          {
            icon: "💰", label: "Payment limits",
            onClick: () => {
              setLimitsSource("cards");
              setShowLimits(true);
            },
          },
          {
            icon: "❓", label: "Where can I use my card?",
            onClick: () => setWhereToUse(true),
          },
        ].map((item, idx) => (
          <button key={idx} onClick={item.onClick} style={{
            width: "100%", padding: "16px 18px", borderRadius: 12,
            border: `1px solid ${colors.border}`, background: colors.card,
            color: colors.text, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "space-between", fontSize: 15,
            fontWeight: 500, transition: "all 0.2s ease",
          }}
            onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"}
            onMouseOut={(e) => e.currentTarget.style.background = colors.card}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>{item.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div>{item.label}</div>
                {item.sublabel && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.sublabel}</div>}
              </div>
            </div>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: colors.textSecondary }}>
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
