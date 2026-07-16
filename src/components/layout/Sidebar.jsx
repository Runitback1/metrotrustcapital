import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { tLabel } from "../../utils/i18n";

export default function Sidebar({
  activeTab,
  setActiveTab,
  email,
  isMobile,
  showMenu,
  setShowMenu,
  onLogout,
  appLanguage,
}) {
  const { colors } = useContext(ThemeContext);

  const menu = [
    { id: "dashboard", icon: "dashboard", label: tLabel(appLanguage, "navDashboard") },
    { id: "transactions", icon: "transactions", label: tLabel(appLanguage, "navTransactions") },
    { id: "transfers", icon: "transfer", label: tLabel(appLanguage, "navTransfers") },
    { id: "cards", icon: "cards", label: tLabel(appLanguage, "navCards") },
    { id: "more", icon: "more", label: tLabel(appLanguage, "navMore") },
    { id: "support", icon: "support", label: tLabel(appLanguage, "navSupport") },
  ];

  const sidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: colors.bg,
        color: colors.text,
      }}
    >
      {/* Logo */}

      <div
        style={{
          padding: "30px 25px",
          borderBottom: `1px solid ${colors.border}`,
          cursor: "pointer",
        }}
        onClick={() => setActiveTab("dashboard")}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
            borderRadius: 14,
            background: "linear-gradient(145deg,#1e2d3d 0%,#0d1b2a 60%,#050e17 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)",
            position: "relative",
            border: "1px solid rgba(255,255,255,.12)",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.12)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)";
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: 30, height: 30 }}>
            <defs>
              <linearGradient id="mLogoGrad" x1="10%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#eef7ff", stopOpacity: 1}} />
                <stop offset="42%" style={{stopColor: "#b9d6f2", stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: "#6e9dca", stopOpacity: 1}} />
              </linearGradient>
              <linearGradient id="mLogoBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: "#7ea8cf", stopOpacity: 0.25}} />
                <stop offset="50%" style={{stopColor: "#d3e9fb", stopOpacity: 0.6}} />
                <stop offset="100%" style={{stopColor: "#7ea8cf", stopOpacity: 0.25}} />
              </linearGradient>
              <filter id="sidebarGlow">
                <feGaussianBlur stdDeviation="1.1" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <circle cx="50" cy="50" r="39" stroke="url(#mLogoGrad)" strokeWidth="1.1" fill="none" opacity="0.5"/>
            <circle cx="50" cy="50" r="33" stroke="url(#mLogoBaseGrad)" strokeWidth="0.9" fill="none" opacity="0.45"/>
            <path d="M 22 40 L 50 22 L 78 40" stroke="url(#mLogoGrad)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#sidebarGlow)"/>
            <path d="M 26 42 H 74" stroke="url(#mLogoGrad)" strokeWidth="2.1" strokeLinecap="round" opacity="0.9"/>
            <path d="M 27 66 H 73" stroke="url(#mLogoGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
            <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#mLogoGrad)" strokeWidth="2.9" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#sidebarGlow)"/>
            <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#mLogoGrad)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>
          </svg>
        </div>

        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0.3,
            }}
          >
            MetroTrust
          </div>

          <div
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginTop: 3,
            }}
          >
            Capital
          </div>
          <div
            style={{
              color: colors.textSecondary,
              fontSize: 10,
              marginTop: 4,
              letterSpacing: 0.2,
              opacity: 0.65,
              lineHeight: 1.5,
            }}
          >
            Secure Savings • Wealth<br/>Management • Banking
          </div>
        </div>
      </div>
      </div>

      {/* Navigation */}

      <div
        style={{
          flex: 1,
          padding: 20,
        }}
      >
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);

              if (isMobile) {
                setShowMenu(false);
              }
            }}
            style={{
              width: "100%",
              border: "none",
              marginBottom: 12,
              padding: "16px 18px",
              borderRadius: 16,
              background:
                activeTab === item.id
                  ? "linear-gradient(135deg,#0d1b2a 0%,#1a2f44 100%)"
                  : "transparent",
              color: activeTab === item.id ? "#ffffff" : colors.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 17,
              textAlign: "left",
              boxShadow: activeTab === item.id ? "0 4px 14px rgba(13,27,42,.6)" : "none",
            }}
          >
            <span style={{ fontSize: 22 }}>
              {item.id === "dashboard" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><rect x="3" y="3" width="8" height="8" fill="currentColor" opacity="0.8"/><rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.6"/><rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.6"/><rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.4"/></svg>}
              {item.id === "transactions" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/><line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></svg>}
              {item.id === "transfers" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><path d="M 5 12 L 15 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M 3 10 L 5 12 L 3 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 19 12 L 9 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M 21 10 L 19 12 L 21 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {item.id === "cards" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="2" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/></svg>}
              {item.id === "more" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/><circle cx="8" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="16" cy="12" r="1.4" fill="currentColor"/></svg>}
              {item.id === "support" && <svg viewBox="0 0 24 24" style={{width: 22, height: 22, display: "inline"}}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">?</text></svg>}
            </span>

            {item.label}
          </button>
        ))}

        {email === "admin@metrotrust.com" && (
          <button
            onClick={() => {
              setActiveTab("admin");

              if (isMobile) {
                setShowMenu(false);
              }
            }}
            style={{
              width: "100%",
              marginTop: 25,
              padding: 16,
              borderRadius: 16,
              border: "none",
              background: "#f59e0b",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⚙ {tLabel(appLanguage, "navAdmin")}
          </button>
        )}
      </div>
      {/* Footer */}

      <div
        style={{
          padding: 22,
          borderTop: `1px solid ${colors.border}`,
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <button
          onClick={() => onLogout ? onLogout() : (supabase.auth.signOut(), window.location.reload())}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: "transparent",
            color: colors.error,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = colors.error;
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = colors.error;
          }}
        >
          <svg viewBox="0 0 24 24" style={{width: 18, height: 18}}><path d="M 3 13 L 3 6 Q 3 4 5 4 L 15 4 Q 17 4 17 6 L 17 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="13" width="13" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="10.5" cy="15.5" r="1" fill="currentColor" opacity="0.7"/></svg>
          Logout
        </button>
        
        <div
          style={{
            color: colors.text,
            fontWeight: 600,
            marginBottom: 0,
          }}
        >
          MetroTrust Capital
        </div>

        Secure Banking
      </div>
    </div>
  );

  /* ================= MOBILE ================= */

  if (isMobile) {
    return (
      <>
        {/* Dark overlay */}

        {showMenu && (
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              zIndex: 998,
            }}
          />
        )}

        {/* Sliding drawer */}

        <div
          style={{
            position: "fixed",
            top: 0,
            left: showMenu ? 0 : -280,
            width: 260,
            height: "100vh",
            transition: "left .28s ease",
            zIndex: 999,
            boxShadow: "0 20px 40px rgba(0,0,0,.45)",
          }}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  /* ================= DESKTOP ================= */

  return sidebarContent;
}