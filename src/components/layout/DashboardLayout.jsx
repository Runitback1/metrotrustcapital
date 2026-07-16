import React, { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { tLabel } from "../../utils/i18n";

export default function DashboardLayout({
  sidebar,
  header,
  children,
  isMobile,
  activeTab,
  setActiveTab,
  appLanguage,
}) {
  const { colors } = useContext(ThemeContext);

  const bottomNavItems = [
    { id: "dashboard", label: tLabel(appLanguage, "navDashboard"), icon: "dashboard" },
    { id: "transfers", label: tLabel(appLanguage, "navTransfers"), icon: "transfer" },
    { id: "transactions", label: tLabel(appLanguage, "navTransactions"), icon: "transactions" },
    { id: "cards", label: tLabel(appLanguage, "navCards"), icon: "cards" },
    { id: "more", label: tLabel(appLanguage, "navMore"), icon: "more" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
      }}
    >
      {/* Mobile drawer */}

      {isMobile && sidebar}

      {/* Desktop Sidebar */}

      {!isMobile && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: 260,
            background: colors.bgSecondary,
            borderRight: `1px solid ${colors.border}`,
            zIndex: 100,
          }}
        >
          {sidebar}
        </div>
      )}

      {/* Main */}

      <div
        style={{
          marginLeft: isMobile ? 0 : 260,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          marginBottom: isMobile ? 68 : 0,
        }}
      >
        {header}

        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: isMobile ? "100%" : 1350,
            margin: "0 auto",
            padding: isMobile ? 14 : 30,
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>

        <footer
          style={{
            borderTop: `1px solid ${colors.border}`,
            padding: isMobile ? "14px 12px" : "18px 20px",
            textAlign: "center",
            color: colors.textSecondary,
            fontSize: isMobile ? 10 : 11,
            lineHeight: 1.35,
            marginTop: 12,
          }}
        >
          <div style={{ marginBottom: 5 }}>
            © 2026 MetroTrust Capital. All rights reserved.
          </div>
          <div>
            Private Banking • Wealth Management • Secure Global Transfers
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}

      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 68,
            background: colors.bgSecondary,
            borderTop: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            zIndex: 99,
            backdropFilter: "blur(8px)",
          }}
        >
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                height: "100%",
                border: "none",
                background: "transparent",
                color: activeTab === item.id ? colors.primary : colors.textSecondary,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                fontSize: 11,
                fontWeight: activeTab === item.id ? 600 : 500,
                transition: "all 0.2s ease",
                padding: 0,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                {item.id === "dashboard" && <><rect x="3" y="3" width="8" height="8" fill="currentColor" opacity="0.8"/><rect x="13" y="3" width="8" height="8" fill="currentColor" opacity="0.6"/><rect x="3" y="13" width="8" height="8" fill="currentColor" opacity="0.6"/><rect x="13" y="13" width="8" height="8" fill="currentColor" opacity="0.4"/></>}
                {item.id === "transfers" && <><path d="M 5 12 L 15 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M 3 10 L 5 12 L 3 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 19 12 L 9 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M 21 10 L 19 12 L 21 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>}
                {item.id === "transactions" && <><line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/><line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></>}
                {item.id === "cards" && <><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="2" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/></>}
                {item.id === "more" && <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/><circle cx="8" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="16" cy="12" r="1.4" fill="currentColor"/></>}
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}