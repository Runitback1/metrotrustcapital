import dashboardBuilding from "../assets/images/dashboard-building.jpg";
import { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { formatCurrency } from "../utils/currency";

export default function Dashboard({
  fullName,
  balance,
  accountNumber,
  accountStatus,
  transactions,
  isMobile,
  setActiveTab,
}) {
  const { isDark, colors } = useContext(ThemeContext);
  const [showBalance, setShowBalance] = useState(true);
  const [liveRates, setLiveRates] = useState([
    { pair: "EUR/USD", rate: "--", numericRate: null, change: "▲", color: "#2563eb" },
    { pair: "GBP/USD", rate: "--", numericRate: null, change: "▲", color: "#2563eb" },
    { pair: "AUD/USD", rate: "--", numericRate: null, change: "▲", color: "#2563eb" },
    { pair: "GOLD", rate: "--", numericRate: null, change: "▲", color: "#2563eb" },
  ]);

  // Stream live FX prices and poll gold proxy; fall back to HTTP snapshots if stream drops.
  useEffect(() => {
    let isMounted = true;
    let fxSocket;
    const fxPairs = ["EUR/USD", "GBP/USD", "AUD/USD"];

    const updateDirection = (nextValue, prevValue, previousChange, previousColor) => {
      if (nextValue === null || nextValue === undefined) {
        return {
          change: previousChange || "▲",
          color: previousColor || "#2563eb",
        };
      }

      if (prevValue === null || prevValue === undefined) {
        return {
          change: previousChange || "▲",
          color: previousColor || "#2563eb",
        };
      }

      if (nextValue > prevValue) {
        return {
          change: "▲",
          color: colors.success,
        };
      }

      if (nextValue < prevValue) {
        return {
          change: "▼",
          color: colors.error,
        };
      }

      return {
        change: previousChange || "▲",
        color: previousColor || "#2563eb",
      };
    };

    const applyRateUpdate = (next) => {
      if (!isMounted) return;

      setLiveRates((prev) => {
        const previousByPair = prev.reduce((acc, item) => {
          acc[item.pair] = item;
          return acc;
        }, {});

        return next.map((item) => {
          const previous = previousByPair[item.pair];
          const effectiveNumericRate = item.numericRate ?? previous?.numericRate ?? null;
          const effectiveRate = item.rate !== "--" ? item.rate : previous?.rate || "--";
          const movement = updateDirection(
            effectiveNumericRate,
            previous?.numericRate ?? null,
            previous?.change,
            previous?.color
          );

          return {
            ...item,
            numericRate: effectiveNumericRate,
            rate: effectiveRate,
            change: movement.change,
            color: movement.color,
          };
        });
      });
    };

    const fetchLiveRates = async () => {
      try {
        const [eurUsdResponse, gbpUsdResponse, audUsdResponse, eurUsdFallbackResponse, gbpUsdFallbackResponse, audUsdFallbackResponse, goldResponse] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/bookTicker?symbol=EURUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/bookTicker?symbol=GBPUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/bookTicker?symbol=AUDUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/price?symbol=GBPUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/price?symbol=AUDUSDT"),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd"),
        ]);

        const [eurUsdData, gbpUsdData, audUsdData, eurUsdFallbackData, gbpUsdFallbackData, audUsdFallbackData, goldData] = await Promise.all([
          eurUsdResponse.json(),
          gbpUsdResponse.json(),
          audUsdResponse.json(),
          eurUsdFallbackResponse.json(),
          gbpUsdFallbackResponse.json(),
          audUsdFallbackResponse.json(),
          goldResponse.json(),
        ]);

        const getMidPrice = (ticker, fallbackTicker) => {
          const bid = Number(ticker?.bidPrice);
          const ask = Number(ticker?.askPrice);
          if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) {
            return (bid + ask) / 2;
          }

          const last = Number(ticker?.price);
          if (Number.isFinite(last) && last > 0) {
            return last;
          }

          const fallbackLast = Number(fallbackTicker?.price);
          return Number.isFinite(fallbackLast) && fallbackLast > 0 ? fallbackLast : null;
        };

        const eurUsd = getMidPrice(eurUsdData, eurUsdFallbackData);
        const gbpUsd = getMidPrice(gbpUsdData, gbpUsdFallbackData);
        const audUsd = getMidPrice(audUsdData, audUsdFallbackData);
        const goldUsd = Number(goldData?.["tether-gold"]?.usd);

        applyRateUpdate([
          {
            pair: "EUR/USD",
            numericRate: Number.isFinite(eurUsd) ? eurUsd : null,
            rate: Number.isFinite(eurUsd) ? eurUsd.toFixed(5) : "--",
          },
          {
            pair: "GBP/USD",
            numericRate: Number.isFinite(gbpUsd) ? gbpUsd : null,
            rate: Number.isFinite(gbpUsd) ? gbpUsd.toFixed(5) : "--",
          },
          {
            pair: "AUD/USD",
            numericRate: Number.isFinite(audUsd) ? audUsd : null,
            rate: Number.isFinite(audUsd) ? audUsd.toFixed(5) : "--",
          },
          {
            pair: "GOLD",
            numericRate: Number.isFinite(goldUsd) ? goldUsd : null,
            rate: Number.isFinite(goldUsd)
              ? `$${goldUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
              : "--",
          },
        ]);
      } catch (error) {
        // Keep last known values on intermittent API failures.
      }
    };

    const connectFxStream = () => {
      try {
        fxSocket = new WebSocket(
          "wss://stream.binance.com:9443/stream?streams=eurusdt@trade/gbpusdt@trade/audusdt@trade"
        );

        fxSocket.onmessage = (event) => {
          if (!isMounted) return;
          const payload = JSON.parse(event.data || "{}");
          const stream = payload?.stream || "";
          const tradePrice = Number(payload?.data?.p);
          if (!Number.isFinite(tradePrice)) return;

          const pair =
            stream.includes("eurusdt")
              ? "EUR/USD"
              : stream.includes("gbpusdt")
              ? "GBP/USD"
              : stream.includes("audusdt")
              ? "AUD/USD"
              : null;

          if (!pair) return;

          applyRateUpdate(
            [
              ...fxPairs.map((fxPair) => {
                if (fxPair !== pair) {
                  return { pair: fxPair, numericRate: null, rate: "--" };
                }

                return {
                  pair: fxPair,
                  numericRate: tradePrice,
                  rate: tradePrice.toFixed(5),
                };
              }),
              { pair: "GOLD", numericRate: null, rate: "--" },
            ]
          );
        };

        fxSocket.onerror = () => {
          // Snapshot polling continues as fallback.
        };
      } catch (error) {
        // Snapshot polling continues as fallback.
      }
    };

    fetchLiveRates();
    connectFxStream();
    const interval = setInterval(fetchLiveRates, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (fxSocket && fxSocket.readyState === WebSocket.OPEN) {
        fxSocket.close();
      }
    };
  }, [colors.success, colors.error]);

  const quickActions = [
    {
      title: "Transfer",
      icon: "transfer",
      color: isDark ? "#1e293b" : "#f1f5f9",
    },
    {
      title: "Transactions",
      icon: "transactions",
      color: isDark ? "#1e293b" : "#f1f5f9",
    },
    {
      title: "Cards",
      icon: "cards",
      color: isDark ? "#1e293b" : "#f1f5f9",
    },
    {
      title: "Support",
      icon: "support",
      color: isDark ? "#1e293b" : "#f1f5f9",
    },
  ];

  const formatAccountNumber = (value) => String(value || "").replace(/^ACC-\s*/i, "");

  const parseLocalDate = (dateValue) => {
    if (!dateValue) return null;
    const parts = String(dateValue).split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  };

  const getTransactionDateLabel = (tx) => {
    const transactionDate = tx?.transaction_date
      ? (String(tx.transaction_date).includes("T") ? String(tx.transaction_date).split("T")[0] : String(tx.transaction_date))
      : "";
    const createdDate = tx?.created_at
      ? (String(tx.created_at).includes("T") ? String(tx.created_at).split("T")[0] : String(tx.created_at))
      : "";
    const today = new Date().toISOString().split("T")[0];

    let effectiveDate = transactionDate || createdDate;
    if (transactionDate && createdDate && transactionDate !== createdDate && transactionDate === today) {
      effectiveDate = createdDate;
    }

    if (effectiveDate) {
      const date = parseLocalDate(effectiveDate);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
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

  const amountColor = {
    debit: isDark ? "#7fb0ea" : "#2f5f9d",
    credit: isDark ? "#9a7bb0" : "#6b3f73",
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

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 14 : 20,
      }}
    >
      {/* ================= CURRENCY RATES ================= */}

      {!isMobile && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {liveRates.map((rate) => (
            <div
              key={rate.pair}
              style={{
                padding: "12px 16px",
                background: colors.bgTertiary,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {rate.pair}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: colors.text,
                  }}
                >
                  {rate.rate}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: rate.color,
                    fontWeight: 800,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {rate.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= HERO / WELCOME CARD ================= */}

      <div
        style={{
          background: "linear-gradient(135deg,#0a1628 0%,#1a2f4a 40%,#0d2744 70%,#0a1628 100%)",
          borderRadius: isMobile ? 14 : 16,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr",
          alignItems: "center",
          minHeight: isMobile ? 140 : 160,
          boxShadow: "0 16px 48px rgba(10,22,40,.8), inset 0 1px 0 rgba(255,255,255,.1)",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            padding: isMobile ? 16 : 24,
            position: "relative",
            zIndex: 2,
            width: isMobile ? "68%" : "58%",
            maxWidth: isMobile ? 240 : 420,
            paddingRight: isMobile ? 8 : 12,
          }}
        >
          <div
            style={{
              color: "#64b5f6",
              letterSpacing: 2.5,
              fontSize: isMobile ? 9 : 11,
              marginBottom: isMobile ? 8 : 12,
              fontWeight: 800,
              opacity: 0.9,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: isMobile ? 8 : 12,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                style={{
                  width: isMobile ? 12 : 14,
                  height: isMobile ? 12 : 14,
                  color: "#64b5f6",
                  flexShrink: 0,
                }}
              >
                <path
                  d="M12 2L19 5V10C19 15 16 19 12 22C8 19 5 15 5 10V5L12 2Z"
                  fill="currentColor"
                />
              </svg>

              <span
                style={{
                  color: "#64b5f6",
                  letterSpacing: 2.5,
                  fontSize: isMobile ? 9 : 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  opacity: 0.9,
                }}
              >
                Welcome Back
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: isMobile ? 28 : 36,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: isMobile ? 8 : 12,
              color: "#ffffff",
              letterSpacing: "-0.8px",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {fullName || "Valued Client"}
          </div>

          <div
            style={{
              color: "#c5d9f1",
              fontSize: isMobile ? 12 : 14,
              lineHeight: 1.5,
              fontWeight: 500,
              opacity: 0.95,
            }}
          >
            Your trusted partner in financial success. Secure, reliable, and always by your side.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(10,22,40,0.98) 0%, rgba(13,31,53,0.95) 34%, rgba(13,31,53,0.78) 52%, rgba(13,31,53,0.32) 72%, rgba(13,31,53,0) 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: isMobile ? "48%" : "50%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
       >
          <img
            src={dashboardBuilding}
            alt="MetroTrust Capital"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "right center",
              opacity: 0.98,

              WebkitMaskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.96) 28%, rgba(0,0,0,.58) 55%, rgba(0,0,0,.16) 80%, transparent 100%)",

              maskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,.96) 28%, rgba(0,0,0,.58) 55%, rgba(0,0,0,.16) 80%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* ================= PROFESSIONAL ADVISORS TEAM ================= */}
      {!isMobile && (
<div
  style={{
    background: "linear-gradient(135deg, #1a3f5f 0%, #0f2844 50%, #1a3f5f 100%)",
          borderRadius: isMobile ? 14 : 16,
          padding: isMobile ? 16 : 24,
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: 16, position: "relative", zIndex: 2 }}>
          <h3
            style={{
              fontSize: isMobile ? 16 : 20,
              fontWeight: 800,
              color: "#ffffff",
              marginTop: 0,
              marginBottom: 6,
            }}
          >
            Professional Financial Advisors
          </h3>
          <p
            style={{
              fontSize: isMobile ? 12 : 13,
              color: "#b0c4d9",
              lineHeight: "1.5",
              marginBottom: 0,
            }}
          >
            Dedicated professionals ready to guide your financial journey
          </p>
        </div>

        {/* Advisors Grid - Mobile Only */}
        {isMobile && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            position: "relative",
            zIndex: 2,
            maxWidth: 160,
            margin: "0 auto",
          }}
        >
          {/* Advisor 1 - Female Professional */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                margin: "0 auto 10px",
                overflow: "hidden",
                border: "2px solid #3b82f6",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
              }}
            >
              <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
                <defs>
                  <linearGradient id="advisorSkin1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#f5d8b8", stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: "#e8c5a0", stopOpacity: 1}} />
                  </linearGradient>
                  <radialGradient id="blush1" cx="35%" cy="35%">
                    <stop offset="0%" style={{stopColor: "#ff9999", stopOpacity: 0.4}} />
                    <stop offset="100%" style={{stopColor: "#ff9999", stopOpacity: 0}} />
                  </radialGradient>
                </defs>
                {/* Hair */}
                <ellipse cx="120" cy="80" rx="70" ry="55" fill="#3d2817"/>
                {/* Face */}
                <ellipse cx="120" cy="100" rx="60" ry="65" fill="url(#advisorSkin1)"/>
                {/* Blush */}
                <circle cx="70" cy="110" r="16" fill="url(#blush1)"/>
                <circle cx="170" cy="110" r="16" fill="url(#blush1)"/>
                {/* Eyes with slight makeup look */}
                <ellipse cx="90" cy="90" rx="8" ry="10" fill="#1a1a1a"/>
                <ellipse cx="150" cy="90" rx="8" ry="10" fill="#1a1a1a"/>
                <circle cx="93" cy="87" r="3" fill="white"/>
                <circle cx="153" cy="87" r="3" fill="white"/>
                {/* Eyebrows */}
                <path d="M 75 78 Q 90 74 105 78" stroke="#6b5540" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 135 78 Q 150 74 165 78" stroke="#6b5540" strokeWidth="3" fill="none" strokeLinecap="round"/>
                {/* Warm smile */}
                <path d="M 85 125 Q 120 145 155 125" stroke="#b08070" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                {/* Shoulders - blouse */}
                <ellipse cx="120" cy="190" rx="75" ry="35" fill="#2a6fa1"/>
              </svg>
            </div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
              Sarah Johnson
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              Wealth Manager
            </div>
          </div>
        </div>
        )}

        {/* Note: Advisor section moved to Support page for desktop */}
      </div>
      )}

      {/* ================= QUICK ACTIONS ================= */}

      <div>
        {!isMobile && (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 12,
              marginTop: 0,
              color: colors.text,
            }}
          >
            Quick Actions
          </h3>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: isMobile ? 8 : 12,
          }}
        >
          {quickActions.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                if (item.icon === "transfer") {
                  setActiveTab("transfers");
                } else if (item.icon === "transactions") {
                  setActiveTab("transactions");
                } else if (item.icon === "cards") {
                  setActiveTab("cards");
                } else if (item.icon === "support") {
                  setActiveTab("support");
                }
              }}
              style={{
                padding: isMobile ? 10 : 14,
                border: `1px solid ${colors.border}`,
                borderRadius: isMobile ? 11 : 12,
                background: item.color,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: isMobile ? 4 : 5,
                color: colors.text,
                transition: "all 0.2s ease",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,.2)" : "0 2px 6px rgba(0,0,0,.05)",
              }}
              onMouseOver={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = isDark ? "0 4px 12px rgba(0,0,0,.3)" : "0 4px 10px rgba(0,0,0,.08)";
                }
              }}
              onMouseOut={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isDark ? "0 2px 8px rgba(0,0,0,.2)" : "0 2px 6px rgba(0,0,0,.05)";
                }
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20, color: colors.primary }}>
                {item.icon === "transfer" && <><path d="M 5 12 L 15 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 3 10 L 5 12 L 3 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 19 12 L 9 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 21 10 L 19 12 L 21 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>}
                {item.icon === "transactions" && <><line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/><line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></>}
                {item.icon === "cards" && <><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="2" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/></>}
                {item.icon === "support" && <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">?</text></>}
              </svg>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: isMobile ? 9 : 10,
                  textAlign: "center",
                  lineHeight: 1.1,
                  color: colors.text,
                }}
              >
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ================= ACCOUNT OVERVIEW ================= */}

      <div
        style={{
          background: colors.card,
          borderRadius: 16,
          padding: isMobile ? 18 : 24,
          boxShadow: `0 8px 20px ${isDark ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.05)"}`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1px 1fr" : "1.25fr 1px 0.95fr",
            gap: isMobile ? 12 : 22,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 18 }}>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Available Balance
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 800,
                  letterSpacing: "-0.7px",
                  lineHeight: 1,
                  color: colors.text,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {showBalance ? `$${formatCurrency(balance)}` : "••••••"}
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: isMobile ? 18 : 20,
                    height: isMobile ? 18 : 20,
                    color: colors.textSecondary,
                  }}
                >
                  {showBalance ? (
                    <>
                      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.8"/>
                      <path d="M 1 12 Q 5 6 12 6 Q 19 6 23 12 Q 19 18 12 18 Q 5 18 1 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
                    </>
                  ) : (
                    <>
                      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                      <path d="M 1 12 Q 5 6 12 6 Q 19 6 23 12 Q 19 18 12 18 Q 5 18 1 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    </>
                  )}
                </svg>
              </button>
            </div>

            <div>
              <div
                style={{
                  color: colors.textSecondary,
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Account Number
              </div>

              <div
                style={{
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 800,
                  letterSpacing: "1px",
                  color: colors.text,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
              >
                {formatAccountNumber(accountNumber)}
              </div>
            </div>
          </div>

          <div
            style={{
              width: 1,
              background: colors.border,
              alignSelf: "stretch",
              borderRadius: 999,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 18, textAlign: isMobile ? "right" : "left" }}>
            <div>
              <div
                style={{
                  color: colors.textSecondary,
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Account Status
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  borderRadius: 16,
                  background:
                    accountStatus === "Frozen"
                      ? isDark
                        ? "rgba(239, 68, 68, .15)"
                        : "rgba(239, 68, 68, .1)"
                      : isDark
                      ? "rgba(34, 197, 94, .15)"
                      : "rgba(34, 197, 94, .1)",
                  color:
                    accountStatus === "Frozen"
                      ? "#ef4444"
                      : "#22c55e",
                  fontWeight: 800,
                  fontSize: isMobile ? 11 : 12,
                  letterSpacing: ".5px",
                }}
              >
                {accountStatus}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: colors.textSecondary,
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Account Type
              </div>

              <div
                style={{
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 800,
                  color: colors.text,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  letterSpacing: "0.6px",
                }}
              >
                Savings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT ACTIVITY ================= */}

      <div
        style={{
          background: colors.card,
          borderRadius: 16,
          padding: isMobile ? 18 : 24,
          boxShadow: `0 8px 20px ${isDark ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.05)"}`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 18 : 20,
              fontWeight: 800,
              color: colors.text,
            }}
          >
            Recent Activity
          </div>

          <div
            onClick={() => setActiveTab("transactions")}
            style={{
              color: colors.primary,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: isMobile ? 12 : 13,
              padding: "4px 10px",
              borderRadius: 8,
              border: `1px solid ${colors.primary}40`,
              transition: "all 0.2s ease",
            }}
          >
            View All →
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {(transactions || []).slice(0, 5).map((tx, idx) => {
            const isOutgoing = tx.sender_account === accountNumber;
            const activityKind = getActivityKind(tx);
            const counterparty = isOutgoing ? (tx.receiver_name || tx.receiver_account || "Recipient") : (tx.sender_name || tx.sender_account || "Sender");
            return (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: isMobile ? "12px 0" : "14px 0",
                borderBottom:
                  idx < (transactions || []).slice(0, 5).length - 1
                    ? `1px solid ${colors.border}`
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 12,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 42 : 44,
                    height: isMobile ? 42 : 44,
                    flexShrink: 0,
                  }}
                >
                  {renderActivityIcon(activityKind, isMobile ? 42 : 44)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: isMobile ? 14 : 14,
                      marginBottom: 2,
                      color: colors.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {counterparty}
                  </div>
                  <div
                    style={{
                      color: colors.textSecondary,
                      fontSize: isMobile ? 11 : 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.description || (isOutgoing ? "Transfer sent" : "Transfer received")}
                  </div>
                  <div
                    style={{
                      color: colors.textSecondary,
                      fontSize: isMobile ? 10 : 11,
                      marginTop: 2,
                      opacity: 0.75,
                    }}
                  >
                    {getTransactionDateLabel(tx)} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: isMobile ? 14 : 14,
                    color: isOutgoing ? amountColor.debit : amountColor.credit,
                  }}
                >
                  {isOutgoing ? "-" : "+"}${formatCurrency(tx.amount)}
                </div>

                <div
                  style={{
                    color: tx.status === "Completed" || tx.status === "completed" ? "#22c55e" : colors.textSecondary,
                    fontSize: isMobile ? 10 : 11,
                    marginTop: 3,
                    fontWeight: tx.status === "Completed" || tx.status === "completed" ? 600 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {tx.status}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

    </div>
  );
}