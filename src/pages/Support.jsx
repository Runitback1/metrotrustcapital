import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function Support() {
  const { isDark, colors } = useContext(ThemeContext);
  const isMobile = window.innerWidth < 768;

  const serviceHighlights = [
    {
      title: "Account Assistance",
      detail: "Support for account access, balance reviews, and profile guidance.",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
          <path d="M5 20c1.4-3.8 4-5.5 7-5.5s5.6 1.7 7 5.5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Transfer Support",
      detail: "Guidance on internal and external transfers, limits, and pending reviews.",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M4 8h11" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M12 5l3 3-3 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 16H9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M12 13l-3 3 3 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Security & Verification",
      detail: "Assistance with password resets, PIN flow, and account verification matters.",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M12 3l7 3v5c0 4.7-2.6 8.1-7 10-4.4-1.9-7-5.3-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.7" fill="none" />
          <path d="M9.5 12.2l1.7 1.7 3.6-3.8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];
  
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background: "linear-gradient(135deg,#0a1628 0%,#16324f 48%,#0d2744 100%)",
          borderRadius: 20,
          padding: isMobile ? 22 : 30,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 40px rgba(10,22,40,.45)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <div style={{ color: "#8eb7e0", fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 10 }}>
            MetroTrust Client Care
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? 28 : 36,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.8px",
              lineHeight: 1.05,
            }}
          >
            Professional customer support for secure banking assistance
          </h2>
          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              fontSize: isMobile ? 13 : 15,
              lineHeight: 1.7,
              color: "#c4d7ea",
              maxWidth: 620,
            }}
          >
            Our support team handles account assistance, transfer guidance, and security-related requests with a banking-first service standard focused on clarity, discretion, and timely response.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            padding: isMobile ? 18 : 24,
            boxShadow: `0 8px 22px ${isDark ? "rgba(0,0,0,.22)" : "rgba(0,0,0,.05)"}`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.text, marginBottom: 6 }}>
            How We Can Help
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7, marginBottom: 18 }}>
            Use support for genuine account-related assistance. For the fastest response, contact the support desk directly through the official email channel below.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {serviceHighlights.map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: isDark ? "rgba(37,99,235,.12)" : "rgba(37,99,235,.08)",
                    color: colors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `1px solid ${isDark ? "rgba(37,99,235,.18)" : "rgba(37,99,235,.12)"}`,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7 }}>
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 18,
            padding: isMobile ? 18 : 24,
            boxShadow: `0 8px 22px ${isDark ? "rgba(0,0,0,.22)" : "rgba(0,0,0,.05)"}`,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.text, marginBottom: 14 }}>
            Contact Support
          </div>

          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              background: colors.bgTertiary,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              Official Support Channel
            </div>
            <a
              href="mailto:support@metrotrustcapital.com"
              style={{
                color: colors.primary,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: isMobile ? 15 : 16,
                wordBreak: "break-word",
              }}
            >
              support@metrotrustcapital.com
            </a>
            <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7, marginTop: 10 }}>
              This is the primary support link for users who need direct assistance.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Availability</span>
              <span style={{ fontSize: 13, color: colors.text, fontWeight: 700 }}>24/7 Client Support</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Scope</span>
              <span style={{ fontSize: 13, color: colors.text, fontWeight: 700, textAlign: "right" }}>Accounts, transfers, and security matters</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Service Standard</span>
              <span style={{ fontSize: 13, color: colors.text, fontWeight: 700 }}>Professional and confidential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meet Our Expert Advisors - Desktop Only */}
      {!isMobile && (
      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          padding: 24,
          borderRadius: 16,
          maxWidth: 500,
          marginTop: 30,
          boxShadow: `0 4px 12px ${isDark ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.05)"}`,
        }}
      >
        <h3 style={{ color: colors.text, marginTop: 0, marginBottom: 10, fontSize: 18, fontWeight: 800 }}>
          Senior Client Advisor
        </h3>
        <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 13 }}>
          Dedicated banking guidance for service, account review, and financial coordination.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            maxWidth: 140,
            margin: "0 auto",
          }}
        >
          {/* Advisor 1 - Female Professional */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: "50%",
                margin: "0 auto 10px",
                overflow: "hidden",
                border: "2px solid #3b82f6",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
              }}
            >
              <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
                <defs>
                  <linearGradient id="advisorSkinSupport" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#f5d8b8", stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: "#e8c5a0", stopOpacity: 1}} />
                  </linearGradient>
                  <radialGradient id="blushSupport" cx="35%" cy="35%">
                    <stop offset="0%" style={{stopColor: "#ff9999", stopOpacity: 0.4}} />
                    <stop offset="100%" style={{stopColor: "#ff9999", stopOpacity: 0}} />
                  </radialGradient>
                </defs>
                {/* Hair */}
                <ellipse cx="120" cy="80" rx="70" ry="55" fill="#3d2817"/>
                {/* Face */}
                <ellipse cx="120" cy="100" rx="60" ry="65" fill="url(#advisorSkinSupport)"/>
                {/* Blush */}
                <circle cx="70" cy="110" r="16" fill="url(#blushSupport)"/>
                <circle cx="170" cy="110" r="16" fill="url(#blushSupport)"/>
                {/* Eyes */}
                <ellipse cx="90" cy="90" rx="8" ry="10" fill="#1a1a1a"/>
                <ellipse cx="150" cy="90" rx="8" ry="10" fill="#1a1a1a"/>
                <circle cx="93" cy="87" r="3" fill="white"/>
                <circle cx="153" cy="87" r="3" fill="white"/>
                {/* Eyebrows */}
                <path d="M 75 78 Q 90 74 105 78" stroke="#6b5540" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 135 78 Q 150 74 165 78" stroke="#6b5540" strokeWidth="3" fill="none" strokeLinecap="round"/>
                {/* Smile */}
                <path d="M 85 125 Q 120 145 155 125" stroke="#b08070" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                {/* Shoulders */}
                <ellipse cx="120" cy="190" rx="75" ry="35" fill="#2a6fa1"/>
              </svg>
            </div>
            <div style={{ color: colors.text, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
              Sarah Johnson
            </div>
            <div style={{ color: colors.textSecondary, fontSize: 11 }}>
              Client Services Advisor
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}