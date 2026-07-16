import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { tLabel } from "../utils/i18n";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
];

function Row({ icon, title, subtitle, right, onClick, disabled, colors }) {
  const clickable = Boolean(onClick) && !disabled;
  return (
    <button
      onClick={clickable ? onClick : undefined}
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        padding: "14px 12px",
        cursor: clickable ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: colors.text,
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <span style={{ width: 24, color: "#3b82f6", display: "flex", justifyContent: "center" }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {right}
    </button>
  );
}

export default function More({
  isMobile,
  onOpenProfile,
  onOpenTransactionLimits,
  onChangePassword,
  onForgotPassword,
  onSendPinResetEmail,
  appLanguage,
  setAppLanguage,
}) {
  const { colors } = useContext(ThemeContext);
  const [view, setView] = useState("menu");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmNextPassword, setConfirmNextPassword] = useState("");
  const [working, setWorking] = useState(false);

  const goBack = () => setView("menu");

  const handlePasswordUpdate = async () => {
    setWorking(true);
    const result = await onChangePassword({
      currentPassword,
      nextPassword,
      confirmNextPassword,
    });
    setWorking(false);
    alert(result.message);
    if (result.ok) {
      setCurrentPassword("");
      setNextPassword("");
      setConfirmNextPassword("");
      setView("menu");
    }
  };

  if (view === "change-password") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, margin: 0, color: colors.text }}>Change Password</h1>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder="New password"
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmNextPassword}
            onChange={(e) => setConfirmNextPassword(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, boxSizing: "border-box" }}
          />
          <button
            onClick={handlePasswordUpdate}
            disabled={working}
            style={{ padding: "12px", borderRadius: 10, border: "none", background: "#1a3a52", color: "white", fontSize: 14, fontWeight: 700, cursor: working ? "not-allowed" : "pointer", opacity: working ? 0.7 : 1 }}
          >
            {working ? "Updating..." : "Update Password"}
          </button>
          <button
            onClick={onForgotPassword}
            style={{ padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Forgot password? Send reset email
          </button>
          <button
            onClick={goBack}
            style={{ padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === "change-pin") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, margin: 0, color: colors.text }}>Change PIN</h1>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16 }}>
          <p style={{ marginTop: 0, marginBottom: 12, color: colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
            For security, PIN changes are confirmed by email. We will send a secure link to your inbox.
          </p>
          <button
            onClick={onSendPinResetEmail}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1a3a52", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Send PIN reset email
          </button>
          <button
            onClick={goBack}
            style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === "language") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, margin: 0, color: colors.text }}>App Language</h1>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
          {LANGUAGE_OPTIONS.map((language, index) => (
            <button
              key={language.code}
              onClick={() => setAppLanguage(language.code)}
              style={{
                width: "100%",
                border: "none",
                borderBottom: index < LANGUAGE_OPTIONS.length - 1 ? `1px solid ${colors.border}` : "none",
                background: "transparent",
                color: colors.text,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <span>{language.label}</span>
              <span style={{ color: appLanguage === language.code ? "#22c55e" : colors.textSecondary, fontSize: 13 }}>
                {appLanguage === language.code ? tLabel(appLanguage, "selected") : ""}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={goBack}
          style={{ padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {tLabel(appLanguage, "back")}
        </button>
      </div>
    );
  }

  if (view === "about") {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, margin: 0, color: colors.text }}>About MetroTrust Capital</h1>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16 }}>
          <p style={{ color: colors.text, fontSize: 15, lineHeight: 1.7, marginTop: 0 }}>
            MetroTrust Capital is a modern private banking institution focused on secure digital banking,
            wealth growth, and dependable global transfer services. We are committed to combining strong
            financial stewardship with advanced security controls so every client can bank with confidence,
            clarity, and peace of mind.
          </p>
          <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
            Our mission is to deliver premium client support, transparent account access, and trusted
            financial services designed for both personal and business success.
          </p>
          <div style={{ marginTop: 20, color: colors.text, fontSize: 16, fontStyle: "italic" }}>Signed,</div>
          <div style={{ marginTop: 4, color: colors.text, fontSize: 17, fontWeight: 700 }}>Admin Office</div>
          <div style={{ color: colors.textSecondary, fontSize: 13 }}>MetroTrust Capital</div>
        </div>
        <button
          onClick={goBack}
          style={{ padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {tLabel(appLanguage, "back")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, margin: 0, color: colors.text }}>{tLabel(appLanguage, "moreTitle")}</h1>
        <div style={{ background: "#1380ea", color: "white", borderRadius: 24, fontSize: 12, fontWeight: 700, padding: "8px 14px" }}>
          {tLabel(appLanguage, "moreCommunity")}
        </div>
      </div>

      <div style={{ fontSize: 13, color: colors.textSecondary, letterSpacing: 1, fontWeight: 700 }}>{tLabel(appLanguage, "sectionAccount")}</div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.9"/><path d="M4 20 Q4 14 12 14 Q20 14 20 20" fill="currentColor" opacity="0.9"/></svg>}
          title={tLabel(appLanguage, "yourProfile")}
          onClick={onOpenProfile}
          colors={colors}
        />
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.9"/><path d="M4 20 Q4 14 12 14 Q20 14 20 20" fill="currentColor" opacity="0.9"/></svg>}
          title={tLabel(appLanguage, "accountVerification")}
          right={<span style={{ background: "rgba(34,197,94,.18)", color: "#22c55e", borderRadius: 10, padding: "5px 10px", fontSize: 13, fontWeight: 700 }}>{tLabel(appLanguage, "verified")}</span>}
          disabled
          colors={colors}
        />
      </div>

      <div style={{ fontSize: 13, color: colors.textSecondary, letterSpacing: 1, fontWeight: 700 }}>{tLabel(appLanguage, "sectionFinances")}</div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="15" cy="9" r="1.6" fill="currentColor"/><circle cx="9" cy="15" r="1.6" fill="currentColor"/></svg>}
          title={tLabel(appLanguage, "transactionLimits")}
          onClick={() => onOpenTransactionLimits()}
          colors={colors}
        />
      </div>

      <div style={{ fontSize: 13, color: colors.textSecondary, letterSpacing: 1, fontWeight: 700 }}>{tLabel(appLanguage, "sectionSecurity")}</div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 10a5 5 0 1 1 10 0" stroke="currentColor" strokeWidth="2" fill="none"/><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" opacity="0.9"/></svg>}
          title={tLabel(appLanguage, "changePassword")}
          onClick={() => setView("change-password")}
          colors={colors}
        />
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3 L14 9 L21 9 L15.5 13 L17.5 20 L12 15.8 L6.5 20 L8.5 13 L3 9 L10 9 Z" fill="currentColor" opacity="0.9"/></svg>}
          title={tLabel(appLanguage, "changePin")}
          onClick={() => setView("change-pin")}
          colors={colors}
        />
      </div>

      <div style={{ fontSize: 13, color: colors.textSecondary, letterSpacing: 1, fontWeight: 700 }}>{tLabel(appLanguage, "sectionOthers")}</div>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: "hidden" }}>
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5 -3 14.5 0 18" stroke="currentColor" strokeWidth="1.7" fill="none"/></svg>}
          title={tLabel(appLanguage, "appLanguage")}
          onClick={() => setView("language")}
          colors={colors}
        />
        <Row
          icon={<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="7" r="3" fill="currentColor"/><path d="M4 20 Q12 13 20 20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>}
          title={tLabel(appLanguage, "about")}
          onClick={() => setView("about")}
          colors={colors}
        />
      </div>
    </div>
  );
}
