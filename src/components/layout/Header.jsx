import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export default function Header({
  isMobile,
  showMenu,
  setShowMenu,
  setActiveTab,
  onOpenProfile,
  fullName,
}) {
  const { isDark, toggleTheme, colors } = useContext(ThemeContext);

const initials = (fullName || "Metro Trust")
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((n) => n[0].toUpperCase())
  .join("");
  

  return (
    <header
      style={{
        height: isMobile ? 70 : 80,
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "0 16px" : "0 30px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 14 : 18,
        }}
      >
        {isMobile && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              border: "none",
              background: "transparent",
              color: colors.text,
              fontSize: 24,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ☰
          </button>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 12,
            cursor: "pointer",
          }}
          onClick={() => setActiveTab && setActiveTab("dashboard")}
        >
          <div
            style={{
              width: isMobile ? 44 : 52,
              height: isMobile ? 44 : 52,
              borderRadius: 12,
              background: "linear-gradient(145deg,#1e2d3d 0%,#0d1b2a 60%,#050e17 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)",
              position: "relative",
              border: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <svg
              viewBox="0 0 100 100"
              style={{
                width: isMobile ? 26 : 31,
                height: isMobile ? 26 : 31,
              }}
            >
              <defs>
                <linearGradient id="mHeaderGrad" x1="10%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#eef7ff", stopOpacity: 1}} />
                  <stop offset="42%" style={{stopColor: "#b9d6f2", stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: "#6e9dca", stopOpacity: 1}} />
                </linearGradient>
                <linearGradient id="mHeaderBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: "#7ea8cf", stopOpacity: 0.25}} />
                  <stop offset="50%" style={{stopColor: "#d3e9fb", stopOpacity: 0.6}} />
                  <stop offset="100%" style={{stopColor: "#7ea8cf", stopOpacity: 0.25}} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.1" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
              </defs>
              <circle cx="50" cy="50" r="39" stroke="url(#mHeaderGrad)" strokeWidth="1.1" fill="none" opacity="0.5"/>
              <circle cx="50" cy="50" r="33" stroke="url(#mHeaderBaseGrad)" strokeWidth="0.9" fill="none" opacity="0.45"/>
              <path d="M 22 40 L 50 22 L 78 40" stroke="url(#mHeaderGrad)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
              <path d="M 26 42 H 74" stroke="url(#mHeaderGrad)" strokeWidth="2.1" strokeLinecap="round" opacity="0.9"/>
              <path d="M 27 66 H 73" stroke="url(#mHeaderGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#mHeaderGrad)" strokeWidth="2.9" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
              <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#mHeaderGrad)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.38"/>
            </svg>
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 16 : 18,
                color: colors.text,
              }}
            >
              MetroTrust
            </div>

            <div
              style={{
                color: colors.textSecondary,
                fontSize: isMobile ? 11 : 12,
              }}
            >
              Capital
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            width: isMobile ? 40 : 44,
            height: isMobile ? 40 : 44,
            borderRadius: "50%",
            border: `1px solid ${colors.border}`,
            background: colors.bgTertiary,
            color: colors.text,
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all 0.2s ease",
            padding: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = "white";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = colors.bgTertiary;
            e.currentTarget.style.color = colors.text;
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              width: isMobile ? 18 : 20,
              height: isMobile ? 18 : 20,
            }}
          >
            {isDark ? (
              <>
                <circle cx="12" cy="12" r="4.5" fill="currentColor"/>
                <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="5" y1="5" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="17" y1="17" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="17" y1="7" x2="19" y2="5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="5" y1="19" x2="7" y2="17" stroke="currentColor" strokeWidth="1.5"/>
              </>
            ) : (
              <>
                <path
                  d="M16.5 12a4.5 4.5 0 1 1-4.5-4.5 5.5 5.5 0 0 0 4.5 4.5z"
                  fill="currentColor"
                />
              </>
            )}
          </svg>
        </button>

        <div
          onClick={() => onOpenProfile ? onOpenProfile() : (setActiveTab && setActiveTab("profile"))}
          style={{
            width: isMobile ? 40 : 44,
            height: isMobile ? 40 : 44,
            borderRadius: "50%",
            background: colors.bgTertiary,
            border: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            color: colors.text,
            fontWeight: 800,
            fontSize: isMobile ? 14 : 15,
            letterSpacing: "0.5px",
            transition: "all .2s ease",
            userSelect: "none",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = colors.bgTertiary;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}