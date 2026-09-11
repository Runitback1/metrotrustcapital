export default function DashboardHome({
  isMobile,
  showMenu,
  setShowMenu,
  activeTab,
  setActiveTab,
  email,
  children,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: "#1e293b",
            border: "none",
            color: "white",
            fontSize: 24,
            padding: "10px 16px",
            borderRadius: 12,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      </div>

      {(!isMobile || showMenu) && (
        <div
          style={{
            width: isMobile ? "100%" : "250px",
            position: isMobile ? "relative" : "fixed",
            left: 20,
            top: 140,
          }}
        >
          <button onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setActiveTab("transactions")}>
            Transactions
          </button>

          <button onClick={() => setActiveTab("transfers")}>
            Transfers
          </button>

          <button onClick={() => setActiveTab("profile")}>
            Profile
          </button>

          {email === "admin@metrotrust.com" && (
            <button
              onClick={() => setActiveTab("admin")}
              style={{
                background: "#f59e0b",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Admin Dashboard
            </button>
          )}
        </div>
      )}

      <div
        style={{
          background:
            "linear-gradient(135deg,#111827,#0f172a)",
          padding: 25,
          borderRadius: 20,
          marginBottom: 25,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Quick Actions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile ? "1fr" : "repeat(3,1fr)",
            gap: 20,
            marginTop: 20,
          }}
        >
          <div
            onClick={() => setActiveTab("transactions")}
            style={{
              background: "#1e293b",
              padding: 25,
              borderRadius: 18,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32 }}>📄</div>
            <h3>Transactions</h3>
          </div>

          <div
            onClick={() => setActiveTab("cards")}
            style={{
              background:
                "linear-gradient(145deg,#1e293b,#0f172a)",
              padding: 25,
              borderRadius: 22,
              border:
                "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.25)",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32 }}>💳</div>
            <h3>Cards</h3>
          </div>

          <div
            onClick={() => setActiveTab("support")}
            style={{
              background: "#1e293b",
              padding: 25,
              borderRadius: 18,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32 }}>🎧</div>
            <h3>Support</h3>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}