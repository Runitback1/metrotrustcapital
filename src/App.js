import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import ThemeProvider from "./context/ThemeContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Support = lazy(() => import("./pages/Support"));
const Cards = lazy(() => import("./pages/Cards"));
const Transfers = lazy(() => import("./pages/Transfers"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const More = lazy(() => import("./pages/More"));

const INACTIVITY_LIMIT_MS = 4 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = "mt_last_activity_at";
const MAINTENANCE_MESSAGE =
  "Service is temporarily under maintenance. Please try again later or contact support.";
const AUTH_REDIRECT_BASE_URL =
  (process.env.REACT_APP_AUTH_REDIRECT_URL || "").trim() ||
  window.location.origin;
const AUTH_BOOT_TIMEOUT_MS = Number(process.env.REACT_APP_AUTH_BOOT_TIMEOUT_MS || 12000);
const LOGIN_INTRO_SHOW_MS = 2500;
const LOGIN_INTRO_SLIDE_MS = 900;

export default function App() {
  const [isMobile, setIsMobile] =
  useState(window.innerWidth < 768);
  const [externalAccount, setExternalAccount] = useState("");
  const [externalAmount, setExternalAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isPinRecoveryMode, setIsPinRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPinValue, setNewPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [externalTransfers, setExternalTransfers] = useState([]);
  const [transferPin, setTransferPin] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [, setRoutingNumberDisplay] =
    useState("");
  const [, setSwiftCodeDisplay] =
    useState("");
  const [accountType, setAccountType] =
    useState("");
  const [cardNumber, setCardNumber] =
    useState("");
  const [expiryDate, setExpiryDate] =
    useState("");
  const [cvv, setCvv] =
    useState("");
  const [, setShowAuthModal] = useState(false);
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [, setAuthMessage] = useState("");
  const [, setLoading] = useState(false);
  const [, setShowBalance] = useState(true);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [cities, setCities] = useState([]);
  const [zipCode, setZipCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("mt_active_tab");
    return savedTab || "dashboard";
  });
  const [profileBackTab, setProfileBackTab] = useState("dashboard");
  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem("mt_app_language") || "en";
  });
  const [cardsEntryRequest, setCardsEntryRequest] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitError, setAuthInitError] = useState("");
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const geoDataRef = useRef({ Country: null, State: null, City: null });
  const splashTimerRef = useRef(null);

  const startSplash = useCallback((durationMs = 3000) => {
    setIsSplashVisible(true);

    if (splashTimerRef.current) {
      clearTimeout(splashTimerRef.current);
    }

    splashTimerRef.current = setTimeout(() => {
      setIsSplashVisible(false);
      splashTimerRef.current = null;
    }, durationMs);
  }, []);

  const getRecoveryModeFromUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      return searchParams.get("mode") || hashParams.get("mode") || "";
    } catch (error) {
      return "";
    }
  };

  const hasRecoveryTypeInUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      return (
        searchParams.get("type") === "recovery" ||
        hashParams.get("type") === "recovery"
      );
    } catch (error) {
      return false;
    }
  };

  const getAuthRedirectUrl = (mode = "password-reset") => {
    return `${AUTH_REDIRECT_BASE_URL}/?mode=${encodeURIComponent(mode)}`;
  };

  const persistActivity = (timestamp = Date.now()) => {
    lastActivityRef.current = timestamp;
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(timestamp));
  };

  const syncPresence = useCallback(async (userId) => {
    if (!userId) return;

    try {
      await supabase
        .from("accounts")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", userId);
    } catch (error) {
      // Presence is best-effort only.
    }
  }, []);

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const insertTransactionWithDate = async (transaction) => {
    const payload = {
      ...transaction,
      transaction_date: transaction.transaction_date || getTodayDate(),
    };

    const { error } = await supabase
      .from("transactions")
      .insert([payload]);

    if (!error) return { error: null };

    const message = error.message || "";
    const transactionDateMissing =
      message.includes("transaction_date") ||
      message.includes("Could not find the 'transaction_date' column");

    if (transactionDateMissing) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.transaction_date;

      const { error: fallbackError } = await supabase
        .from("transactions")
        .insert([fallbackPayload]);

      return { error: fallbackError };
    }

    return { error };
  };

  // Keep a short branded splash for balanced perceived loading.
  useEffect(() => {
    startSplash(3000);

    const frame = requestAnimationFrame(() => setAppLoading(false));
    return () => {
      cancelAnimationFrame(frame);
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, [startSplash]);
  const [userExternalTransfers, setUserExternalTransfers] = useState([]);
  const [accountStatus, setAccountStatus] = useState("");
  const fetchTransactions = useCallback(async () => {
    const todayDate = new Date().toISOString().split("T")[0];
    const getDatePart = (value) => {
      if (!value) return "";
      const str = String(value);
      return str.includes("T") ? str.split("T")[0] : str;
    };

    const getEffectiveTransactionDate = (tx) => {
      const transactionDate = getDatePart(tx?.transaction_date);
      const createdDate = getDatePart(tx?.created_at);

      if (transactionDate && createdDate) {
        if (transactionDate !== createdDate && transactionDate === todayDate) {
          return createdDate;
        }
        return transactionDate;
      }

      return transactionDate || createdDate || "";
    };

    const getTransactionSortTime = (tx) => {
      if (!tx) return 0;

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

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`sender_account.eq.${accountNumber},receiver_account.eq.${accountNumber}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const sorted = [...data].sort((a, b) => getTransactionSortTime(b) - getTransactionSortTime(a));
      setTransactions(sorted);
    }
  }, [accountNumber]);

  const refreshData = useCallback(async () => {
    if (!user) return;

    await fetchAccountData(user.id);
    if (accountNumber) {
      await Promise.all([fetchTransactions(), fetchUserExternalTransfers()]);
    }
  }, [user, accountNumber, fetchTransactions]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        const recoveryMode = getRecoveryModeFromUrl();
        if (recoveryMode === "pin-reset") {
          setIsPinRecoveryMode(true);
          setIsRecoveryMode(false);
        } else {
          setIsRecoveryMode(true);
          setIsPinRecoveryMode(false);
        }
      }

      if (event === "SIGNED_OUT") {
        setIsRecoveryMode(false);
        setIsPinRecoveryMode(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        setAuthInitError("");
        const recoveryMode = getRecoveryModeFromUrl();
        if (recoveryMode === "pin-reset") {
          setIsPinRecoveryMode(true);
          setIsRecoveryMode(false);
        } else if (hasRecoveryTypeInUrl()) {
          setIsRecoveryMode(true);
          setIsPinRecoveryMode(false);
        }

        const storedLastActive = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY) || 0);
        if (storedLastActive && Date.now() - storedLastActive >= INACTIVITY_LIMIT_MS) {
          await supabase.auth.signOut();
          localStorage.removeItem("mt_active_tab");
          localStorage.removeItem(ACTIVITY_STORAGE_KEY);
          return;
        }

        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("auth-timeout")), AUTH_BOOT_TIMEOUT_MS);
          }),
        ]);

        const { data: { session } } = sessionResult;
        if (session?.user) {
          persistActivity();
          setEmail(session.user.email);
          const accountData = await fetchAccountData(session.user.id);
          if (accountData?.status === "Frozen") {
            await supabase.auth.signOut();
            alert(MAINTENANCE_MESSAGE);
            return;
          }

          await syncPresence(session.user.id);
          setUser(session.user);
        }
      } catch (error) {
        if (error?.message === "auth-timeout") {
          setAuthInitError("Network is slow or blocked on this carrier. Please retry, switch network, or use the backup domain.");
        } else {
          setAuthInitError("Unable to reach secure sign-in right now. Please check network connectivity and try again.");
        }
      } finally {
        setAuthLoading(false);
      }
    };
    getSession();
  }, [syncPresence]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem("mt_active_tab", activeTab);
  }, [activeTab, user]);

  useEffect(() => {
    localStorage.setItem("mt_app_language", appLanguage);
    document.documentElement.lang = appLanguage;
  }, [appLanguage]);

  useEffect(() => {
    if (!user || email === "admin@metrotrust.com" || !accountNumber) return;
    fetchUserExternalTransfers();
  }, [user, email, accountNumber]);

  useEffect(() => {
    if (!user || email === "admin@metrotrust.com") return;

    const interval = setInterval(() => {
      fetchAccountData(user.id);
      fetchUserExternalTransfers();
      syncPresence(user.id);
      if (accountNumber) fetchTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, email, accountNumber, fetchTransactions, syncPresence]);

  useEffect(() => {
    if (!user || email === "admin@metrotrust.com") return;

    const channel = supabase
      .channel(`account-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "accounts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload?.new || {};

          if (typeof next.status === "string") {
            setAccountStatus(next.status);
          }

          if (next.balance !== undefined && next.balance !== null) {
            setBalance(Number(next.balance));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, email]);
  useEffect(() => {
    let isMounted = true;

    const loadGeoData = async () => {
      try {
        const module = await import("country-state-city");
        if (!isMounted) return;

        geoDataRef.current = {
          Country: module.Country,
          State: module.State,
          City: module.City,
        };

        setCountries(module.Country.getAllCountries());
      } catch (error) {
        // Keep form usable even if geo helper package fails to load.
      }
    };

    loadGeoData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCountryCode) {
      return;
    }

    if (!geoDataRef.current.State || !geoDataRef.current.Country) {
      return;
    }

    setStates(geoDataRef.current.State.getStatesOfCountry(selectedCountryCode));
    setCities([]);

    const selectedCountry = geoDataRef.current.Country.getCountryByCode(selectedCountryCode);
    if (selectedCountry) {
      setCountry(selectedCountry.name);
    }
  }, [selectedCountryCode]);

  useEffect(() => {
    if (!selectedStateCode || !selectedCountryCode) {
      return;
    }

    if (!geoDataRef.current.City) {
      return;
    }

    setCities(geoDataRef.current.City.getCitiesOfState(selectedCountryCode, selectedStateCode));

    const selectedState = states.find(
      (state) => state.isoCode === selectedStateCode
    );
    if (selectedState) {
      setStateName(selectedState.name);
    }
  }, [selectedStateCode, selectedCountryCode, states]);

  useEffect(() => {
    if (!country || countries.length === 0) return;

    const existingCountry = countries.find(
      (item) => item.name === country
    );
    if (existingCountry) {
      setSelectedCountryCode(existingCountry.isoCode);
    }
  }, [country, countries]);

  useEffect(() => {
    if (!stateName || states.length === 0) return;

    const existingState = states.find(
      (item) => item.name === stateName
    );
    if (existingState) {
      setSelectedStateCode(existingState.isoCode);
    }
  }, [stateName, states]);

  useEffect(() => {
    if (!user) return;

    const stored = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY) || 0);
    if (stored) {
      lastActivityRef.current = stored;
    } else {
      persistActivity();
    }

    const markActive = () => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= INACTIVITY_LIMIT_MS) {
        logout();
        return;
      }

      persistActivity();
    };

    const enforceIfIdle = () => {
      if (!user) return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= INACTIVITY_LIMIT_MS) {
        logout();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        enforceIfIdle();
      }
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    const handleWindowFocus = () => {
      enforceIfIdle();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);

    const interval = setInterval(enforceIfIdle, 15000);

    return () => {
      clearInterval(interval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
    };
  }, [user]);

  

  useEffect(() => {
    if (accountNumber) {
      fetchTransactions();
    }
  }, [accountNumber, fetchTransactions]);

  useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  window.addEventListener(
    "resize",
    handleResize
  );

  return () => {
    window.removeEventListener(
      "resize",
      handleResize
    );
  };
}, []);
useEffect(() => {
  let startY = 0;

  const handleTouchStart = (e) => {
    startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;

    if (
      window.scrollY === 0 &&
      endY - startY > 120
    ) {
      refreshData();
    }
  };

  window.addEventListener("touchstart", handleTouchStart);
  window.addEventListener("touchend", handleTouchEnd);

  return () => {
    window.removeEventListener("touchstart", handleTouchStart);
    window.removeEventListener("touchend", handleTouchEnd);
  };
}, [refreshData]);
  const signUp = async () => {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!fullName || !normalizedEmail || !password || !transferPin) {
      alert("Please complete all fields.");
      return;
    }

    if (!/^\d{4}$/.test(transferPin)) {
      alert("Transfer PIN must be 4 digits.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const { data: existingAccounts, error: existingError } = await supabase
      .from("accounts")
      .select("id, status")
      .eq("email", normalizedEmail)
      .limit(1);

    if (existingError) {
      alert(existingError.message);
      return;
    }

    if (existingAccounts && existingAccounts.length > 0) {
      const currentStatus = String(existingAccounts[0].status || "").toLowerCase();
      if (currentStatus.includes("pending")) {
        alert("Your account request is already pending admin approval.");
        return;
      }

      alert("An account already exists for this email.");
      return;
    }

    const openingDate = new Date().toISOString().split("T")[0];
    const requestAccountNumber = `REQ-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const { error } = await supabase
      .from("accounts")
      .insert([
        {
          user_id: null,
          full_name: fullName,
          email: normalizedEmail,
          opening_date: openingDate,
          balance: 0,
          status: "Pending Approval",
          account_number: requestAccountNumber,
          routing_number: "",
          swift_code: "",
          account_type: "Savings",
          card_number: "",
          expiry_date: "",
          cvv: "",
          currency: "USD",
          transfer_pin: transferPin,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Your account request has been submitted. Admin approval is required before sign-in.");
    setPassword("");
  };

  const logout = async () => {
    if (user?.id) {
      await syncPresence(user.id);
    }

    await supabase.auth.signOut();

    setUser(null);
    setActiveTab("dashboard");
    localStorage.removeItem("mt_active_tab");
    setEmail("");
    setPassword("");
    setFullName("");
    setBalance(0);
    setAccountNumber("");
    setTransactions([]);
    setIsRecoveryMode(false);
    setIsPinRecoveryMode(false);
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  };

  const login = async () => {
    setAuthLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthLoading(false);
      alert(error.message);
      return;
    }

    startSplash(3000);

    try {
      const user = data.user;
      persistActivity();
      setActiveTab("dashboard");

      // 🔥 VERY IMPORTANT: get session properly
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("No session found");
        return;
      }

      // 🔽 CHECK IF ACCOUNT EXISTS
      const { data: existing } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id);

      if (!existing || existing.length === 0) {
        console.log(
          "OPENING DATE:",
          new Date().toISOString().split("T")[0]
        );
        const { error: insertError } = await supabase
          .from("accounts")
          .insert([
            {
              user_id: user.id,
              full_name: fullName,
              email: email,
              opening_date:
                new Date().toISOString().split("T")[0],

              balance: 5000,
              status: "Active",

              account_number: Math.floor(
                100000000 + Math.random() * 900000000
              ),

              routing_number: "021000021",

              swift_code: "MTCPUS33",

              account_type: "Savings",

              card_number:
                Math.floor(
                  1000000000000000 +
                  Math.random() * 9000000000000000
                ).toString(),

              expiry_date: "12/32",

              cvv: Math.floor(
                100 + Math.random() * 900
              ).toString(),

              currency: "USD",

              transfer_pin: transferPin,
            },
          ]);

        if (insertError) {
          alert("Insert failed: " + insertError.message);
          return;
        }
      }

      const accountData = await fetchAccountData(user.id);
      if (accountData?.status === "Frozen") {
        await supabase.auth.signOut();
        alert(MAINTENANCE_MESSAGE);
        return;
      }

      await syncPresence(user.id);

      setUser(user);
    } finally {
      setAuthLoading(false);
    }
  };
  const resetPassword = async () => {
  if (!email) {
    return alert("Enter your email first");
  }

  const { error } =
  await supabase.auth.resetPasswordForEmail(
    email,
    {
        redirectTo: getAuthRedirectUrl("password-reset")
    }
  );

  if (error) {
    alert(error.message);
  } else {
    alert(
      "Password reset email sent. Check your inbox."
    );
  }
};
const requestPinResetEmail = async () => {
  if (!email) {
    alert("No user email found");
    return false;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("pin-reset"),
  });

  if (error) {
    alert(error.message);
    return false;
  }

  alert("PIN reset link sent to your email.");
  return true;
};

const changePasswordWithCurrent = async ({
  currentPassword,
  nextPassword,
  confirmNextPassword,
}) => {
  if (!currentPassword || !nextPassword || !confirmNextPassword) {
    return { ok: false, message: "Please complete all password fields." };
  }

  if (nextPassword !== confirmNextPassword) {
    return { ok: false, message: "New passwords do not match." };
  }

  if (nextPassword.length < 6) {
    return { ok: false, message: "New password must be at least 6 characters." };
  }

  const verify = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verify.error) {
    await resetPassword();
    return { ok: false, message: "Current password was not validated. Password reset email sent." };
  }

  const update = await supabase.auth.updateUser({ password: nextPassword });
  if (update.error) {
    return { ok: false, message: update.error.message };
  }

  return { ok: true, message: "Password updated successfully." };
};

const openTransactionLimits = (source = "more") => {
  if (String(accountStatus || "").toLowerCase() === "frozen" && email !== "admin@metrotrust.com") {
    alert(MAINTENANCE_MESSAGE);
    return;
  }

  const normalizedSource = typeof source === "string" ? source : "more";
  setCardsEntryRequest({ source: normalizedSource, token: Date.now() });
  setActiveTab("cards");
};

const openProfileTab = (source = "dashboard") => {
  if (String(accountStatus || "").toLowerCase() === "frozen" && email !== "admin@metrotrust.com") {
    alert(MAINTENANCE_MESSAGE);
    return;
  }

  const normalizedSource = typeof source === "string" ? source : "dashboard";
  setProfileBackTab(normalizedSource === "more" ? "more" : "dashboard");
  setActiveTab("profile");
};

const updateTransferPinFromRecovery = async () => {
  if (!newPinValue || !confirmPinValue) {
    alert("Please fill both PIN fields");
    return;
  }

  if (!/^\d{4}$/.test(newPinValue)) {
    alert("PIN must be exactly 4 digits");
    return;
  }

  if (newPinValue !== confirmPinValue) {
    alert("PIN values do not match");
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    alert("PIN reset session is invalid. Please request a new link.");
    return;
  }

  let updateResult = await supabase
    .from("accounts")
    .update({ transfer_pin: newPinValue })
    .eq("user_id", session.user.id)
    .select("id");

  if ((!updateResult.data || updateResult.data.length === 0) && email) {
    updateResult = await supabase
      .from("accounts")
      .update({ transfer_pin: newPinValue })
      .eq("email", email)
      .select("id");
  }

  if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
    alert(updateResult.error?.message || "Unable to update transfer PIN.");
    return;
  }

  alert("Transfer PIN updated successfully.");
  setIsPinRecoveryMode(false);
  setNewPinValue("");
  setConfirmPinValue("");
  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.reload();
};
const updatePassword = async () => {
  if (!newPassword || !confirmPassword) {
    return alert("Please fill all fields");
  }

  if (newPassword !== confirmPassword) {
    return alert("Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password updated successfully");

  setIsRecoveryMode(false);
  setIsPinRecoveryMode(false);

  window.location.hash = "";
  window.history.replaceState({}, document.title, window.location.pathname);

  window.location.reload();
};
  const sendExternal = async () => {
    if (String(accountStatus || "").toLowerCase() === "frozen") {
      alert(MAINTENANCE_MESSAGE);
      return;
    }

    if (
      !bankName ||
      !beneficiaryName ||
      !externalAccount ||
      !swiftCode ||
      !routingNumber ||
      !externalAmount
    ) {
      return alert(
        "Please complete all transfer details."
      );
    }

    setAuthMessage("");
    const pendingTransfer =
  userExternalTransfers.find(
    (t) => t.status === "Pending"
  );

if (pendingTransfer) {
  return alert(
    "You already have a pending external transfer."
  );
}
    setAuthorizationCode("");
    setShowAuthModal(true);
  };

  const submitAuthorization = async () => {
    if (!authorizationCode) {
      setAuthMessage("Authorization code is required.");
      return;
    }

    setShowAuthModal(false);
    const { data, error } = await supabase
      .from("external_transfers")
      .insert([
        {
          sender_account: accountNumber,
          sender_name: fullName,

          beneficiary_name: beneficiaryName,
          bank_name: bankName,

          external_account: externalAccount,

          swift_code: swiftCode,
          routing_number: routingNumber,

          amount: Number(externalAmount),

          authorization_code: authorizationCode,

          status: "Pending",
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    fetchUserExternalTransfers();

    alert(
      "External transfer request submitted and is now pending approval."
    );

    setExternalAmount("");
    setBankName("");
    setBeneficiaryName("");
    setExternalAccount("");
    setSwiftCode("");
    setRoutingNumber("");
  };

  const sendInternal = async () => {
    if (String(accountStatus || "").toLowerCase() === "frozen") {
      alert(MAINTENANCE_MESSAGE);
      return;
    }

    setLoading(true);

    const amt = parseFloat(amount);

    const reference =
      "MTX-" + Math.floor(100000 + Math.random() * 900000);

    if (!receiver || !amt) {

      setLoading(false);
      return alert("Enter details");
    }

    const { data: senderData, error: senderError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (senderError || !senderData) {
      setLoading(false);
      alert("Sender account not found");
      return;
    }

    const senderAcc = senderData;

    const enteredPin = prompt("Enter transfer PIN");

    if (!/^\d{4}$/.test(enteredPin)) {
  setLoading(false);
  return alert("PIN must be exactly 4 digits");
}
    
    if (enteredPin !== senderAcc.transfer_pin) {
      setLoading(false);
      return alert("Incorrect transfer PIN");
    }
    if (senderAcc.status === "Frozen") {
      setLoading(false);
      return alert(MAINTENANCE_MESSAGE);
    }
    if (senderAcc.balance < amt) {
      setLoading(false);
      return alert("Insufficient funds");
    }

    const { data: receiverData } = await supabase
      .from("accounts")
      .select("*")
      .eq("account_number", receiver);

    if (!receiverData || receiverData.length === 0) {
      setLoading(false);
      return alert("Receiver not found");
    }

    const receiverAcc = receiverData[0];

    if (receiverAcc.status === "Frozen") {
      setLoading(false);
      return alert(MAINTENANCE_MESSAGE);
    }

    await supabase
      .from("accounts")
      .update({ balance: senderAcc.balance - amt })
      .eq("user_id", user.id);

    await supabase
      .from("accounts")
      .update({ balance: receiverAcc.balance + amt })
      .eq("account_number", receiver);

    const { error: insertError } = await insertTransactionWithDate({
      sender_account: accountNumber,
      sender_name: fullName,

      receiver_account: receiver,
      receiver_name: receiverAcc.full_name,

      amount: amt,

      description: description,

      reference: reference,
      type: "Transfer",

      status: "Completed",
    });

    if (insertError) {
      alert("Insert failed: " + insertError.message);
      return;
    }

    alert("Transfer successful");

    fetchBalance(user.id);
    fetchTransactions();

    setAmount("");
    setReceiver("");
    setDescription("");

    setLoading(false);
  };

  const fetchAccountData = async (userId) => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (!error && data) {
      setFullName(data.full_name);
      setBalance(data.balance);

      setAccountNumber(data.account_number);

      setRoutingNumberDisplay(
        data.routing_number || ""
      );

      setSwiftCodeDisplay(
        data.swift_code || ""
      );

      setAccountType(
        data.account_type || ""
      );

      setCardNumber(
        data.card_number || ""
      );

      setExpiryDate(
        data.expiry_date || ""
      );

      setCvv(
        data.cvv || ""
      );

      setPhone(data.phone || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setStateName(data.state || "");
      setCountry(data.country || "");
      setZipCode(data.zip_code || "");
      setProfilePicture(data.profile_picture || "");
      setAccountStatus(data.status || "");
      setDateOfBirth(data.date_of_birth || "");
      return data;
    }

    return null;
  };

  const fetchBalance = async (userId) => {
    const { data, error } = await supabase
      .from("accounts")
      .select("balance, account_number")
      .eq("user_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("No account found");
      return;
    }

    setBalance(data[0].balance);
    setAccountNumber(data[0].account_number);
  };
  const fetchExternalTransfers = async () => {
    const { data } = await supabase
      .from("external_transfers")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setExternalTransfers(data);
    }
  };

  const fetchUserExternalTransfers = async () => {
    if (!accountNumber) return;

    const { data } = await supabase
      .from("external_transfers")
      .select("*")
      .eq("sender_account", accountNumber)
      .order("created_at", { ascending: false });

    if (data) {
      setUserExternalTransfers(data);
    }
  };

  const saveProfile = async (profile) => {
    if (!user) {
      alert("No user session");
      return false;
    }

    const updatePayload = {
      full_name: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      zip_code: profile.zipCode,
      profile_picture: profile.profilePicture,
      date_of_birth: profile.dateOfBirth || null,
    };

    const primaryUpdate = await supabase
      .from("accounts")
      .update(updatePayload)
      .eq("user_id", user.id)
      .select("id");

    if (primaryUpdate.error) {
      alert(primaryUpdate.error.message);
      return false;
    }

    let updatedRows = primaryUpdate.data || [];

    if (updatedRows.length === 0 && accountNumber) {
      const fallbackUpdate = await supabase
        .from("accounts")
        .update(updatePayload)
        .eq("account_number", accountNumber)
        .select("id");

      if (fallbackUpdate.error) {
        alert(fallbackUpdate.error.message);
        return false;
      }

      updatedRows = fallbackUpdate.data || [];
    }

    if (updatedRows.length === 0) {
      alert("Profile could not be updated for this account. Please contact support.");
      return false;
    }

    setFullName(profile.fullName);
    setPhone(profile.phone);
    setAddress(profile.address);
    setCity(profile.city);
    setStateName(profile.state);
    setCountry(profile.country);
    setZipCode(profile.zipCode);
    setProfilePicture(profile.profilePicture);
    setDateOfBirth(profile.dateOfBirth);

    alert("Profile updated successfully");
    return true;
  };

if (isRecoveryMode) {
  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1>Reset Password</h1>

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(e.target.value)
        }
        style={{
          padding: 12,
          width: "100%",
          maxWidth: 350,
          marginBottom: 10,
        }}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        style={{
          padding: 12,
          width: "100%",
          maxWidth: 350,
          marginBottom: 15,
        }}
      />

      <button
        onClick={updatePassword}
        style={{
          padding: 12,
          background: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Update Password
      </button>
    </div>
  );
}

if (isPinRecoveryMode) {
  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1>Reset Transfer PIN</h1>

      <input
        type="password"
        placeholder="New 4-Digit PIN"
        value={newPinValue}
        maxLength={4}
        onChange={(e) =>
          setNewPinValue(e.target.value.replace(/[^0-9]/g, ""))
        }
        style={{
          padding: 12,
          width: "100%",
          maxWidth: 350,
          marginBottom: 10,
        }}
      />

      <input
        type="password"
        placeholder="Confirm 4-Digit PIN"
        value={confirmPinValue}
        maxLength={4}
        onChange={(e) =>
          setConfirmPinValue(e.target.value.replace(/[^0-9]/g, ""))
        }
        style={{
          padding: 12,
          width: "100%",
          maxWidth: 350,
          marginBottom: 15,
        }}
      />

      <button
        onClick={updateTransferPinFromRecovery}
        style={{
          padding: 12,
          background: "#2563eb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Update PIN
      </button>
    </div>
  );
}
  if (appLoading || authLoading || isSplashVisible) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#0a1628",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}>
        <style>{`
          @keyframes mtSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes mtPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "3px solid rgba(104,153,200,.2)",
            borderTop: "3px solid #6899c8",
            animation: "mtSpin 0.9s linear infinite",
          }} />
          <div style={{
            position: "absolute", inset: 8, borderRadius: "50%",
            background: "linear-gradient(145deg,#1e2d3d,#0d1b2a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 100 100" style={{ width: 32, height: 32, animation: "mtPulse 1.4s ease-in-out infinite" }}>
              <defs>
                <linearGradient id="loadGrad" x1="10%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#eef7ff",stopOpacity:1}}/>
                  <stop offset="42%" style={{stopColor:"#b9d6f2",stopOpacity:1}}/>
                  <stop offset="100%" style={{stopColor:"#6e9dca",stopOpacity:1}}/>
                </linearGradient>
                <linearGradient id="loadBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor:"#7ea8cf",stopOpacity:0.25}}/>
                  <stop offset="50%" style={{stopColor:"#d3e9fb",stopOpacity:0.6}}/>
                  <stop offset="100%" style={{stopColor:"#7ea8cf",stopOpacity:0.25}}/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="39" stroke="url(#loadGrad)" strokeWidth="1.1" fill="none" opacity="0.5"/>
              <circle cx="50" cy="50" r="33" stroke="url(#loadBaseGrad)" strokeWidth="0.9" fill="none" opacity="0.45"/>
              <path d="M 22 40 L 50 22 L 78 40" stroke="url(#loadGrad)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 26 42 H 74" stroke="url(#loadGrad)" strokeWidth="2.1" strokeLinecap="round" opacity="0.9"/>
              <path d="M 27 66 H 73" stroke="url(#loadGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#loadGrad)" strokeWidth="2.9" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 32 65 V 46 L 41 58 L 50 44 L 59 58 L 68 46 V 65" stroke="url(#loadGrad)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.38"/>
            </svg>
          </div>
        </div>
        <div style={{ color: "#a8c8e8", fontSize: 14, fontWeight: 600, marginTop: 20, letterSpacing: 1 }}>MetroTrust Capital</div>
        <div style={{ color: "rgba(168,200,232,.5)", fontSize: 11, marginTop: 6 }}>Secure Banking</div>
      </div>
    );
  }

  if (user) {
    return (
      <ThemeProvider>
        <AppContent 
          user={user}
          fullName={fullName}
          balance={balance}
          accountNumber={accountNumber}
          accountStatus={accountStatus}
          accountType={accountType}
          transactions={transactions}
          isMobile={isMobile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          email={email}
          phone={phone}
          address={address}
          city={city}
          stateName={stateName}
          country={country}
          zipCode={zipCode}
          profilePicture={profilePicture}
          saveProfile={saveProfile}
          setPhone={setPhone}
          setAddress={setAddress}
          setCity={setCity}
          setStateName={setStateName}
          setCountry={setCountry}
          setZipCode={setZipCode}
          cardNumber={cardNumber}
          expiryDate={expiryDate}
          cvv={cvv}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          receiver={receiver}
          amount={amount}
          description={description}
          setReceiver={setReceiver}
          setAmount={setAmount}
          setDescription={setDescription}
          sendInternal={sendInternal}
          sendExternal={sendExternal}
          userExternalTransfers={userExternalTransfers}
          logout={logout}
          bankName={bankName}
          setBankName={setBankName}
          beneficiaryName={beneficiaryName}
          setBeneficiaryName={setBeneficiaryName}
          externalAccount={externalAccount}
          setExternalAccount={setExternalAccount}
          swiftCode={swiftCode}
          setSwiftCode={setSwiftCode}
          routingNumber={routingNumber}
          setRoutingNumber={setRoutingNumber}
          externalAmount={externalAmount}
          setExternalAmount={setExternalAmount}
          appLanguage={appLanguage}
          setAppLanguage={setAppLanguage}
          openTransactionLimits={openTransactionLimits}
          openProfileTab={openProfileTab}
          changePasswordWithCurrent={changePasswordWithCurrent}
          requestPasswordResetEmail={resetPassword}
          requestPinResetEmail={requestPinResetEmail}
          cardsEntryRequest={cardsEntryRequest}
          setCardsEntryRequest={setCardsEntryRequest}
          profileBackTab={profileBackTab}
          refreshData={refreshData}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LoginContent 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        fullName={fullName}
        setFullName={setFullName}
        transferPin={transferPin}
        setTransferPin={setTransferPin}
        login={login}
        signUp={signUp}
        resetPassword={resetPassword}
        authInitError={authInitError}
      />
    </ThemeProvider>
  );
}

function AppContent({
  user,
  fullName,
  balance,
  accountNumber,
  accountStatus,
  accountType,
  transactions,
  isMobile,
  activeTab,
  setActiveTab,
  showMenu,
  setShowMenu,
  email,
  phone,
  address,
  city,
  stateName,
  country,
  zipCode,
  profilePicture,
  saveProfile,
  setPhone,
  setAddress,
  setCity,
  setStateName,
  setCountry,
  setZipCode,
  cardNumber,
  expiryDate,
  cvv,
  dateOfBirth,
  setDateOfBirth,
  receiver,
  amount,
  description,
  setReceiver,
  setAmount,
  setDescription,
  sendInternal,
  sendExternal,
  userExternalTransfers,
  logout,
  bankName,
  setBankName,
  beneficiaryName,
  setBeneficiaryName,
  externalAccount,
  setExternalAccount,
  swiftCode,
  setSwiftCode,
  routingNumber,
  setRoutingNumber,
  externalAmount,
  setExternalAmount,
  appLanguage,
  setAppLanguage,
  openTransactionLimits,
  openProfileTab,
  changePasswordWithCurrent,
  requestPasswordResetEmail,
  requestPinResetEmail,
  cardsEntryRequest,
  setCardsEntryRequest,
  profileBackTab,
  refreshData,
}) {
  const isMaintenanceLockedUser =
    email !== "admin@metrotrust.com" &&
    String(accountStatus || "").toLowerCase() === "frozen";

  const handleTabChange = useCallback((nextTab) => {
    if (isMaintenanceLockedUser) {
      alert(MAINTENANCE_MESSAGE);
      return;
    }

    setActiveTab(nextTab);
    if (isMobile && showMenu) {
      setShowMenu(false);
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    requestAnimationFrame(() => {
      resetScroll();
      requestAnimationFrame(resetScroll);
    });
  }, [isMaintenanceLockedUser, isMobile, setActiveTab, setShowMenu, showMenu]);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    requestAnimationFrame(() => {
      resetScroll();
      requestAnimationFrame(resetScroll);
    });
  }, [activeTab]);

  return (
    <div
      style={{
        background: "#070d1d",
        minHeight: "100vh",
        color: "white",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
        <DashboardLayout
            isMobile={isMobile}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            appLanguage={appLanguage}
            sidebar={
              <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                email={email}
                isMobile={isMobile}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                onLogout={logout}
                appLanguage={appLanguage}
              />
            }
            header={
              <Header
                isMobile={isMobile}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                setActiveTab={handleTabChange}
                onOpenProfile={() => openProfileTab("dashboard")}
                fullName={fullName}
              />
            }
        >
          <Suspense fallback={<PageLoadFallback isMobile={isMobile} />}>
            {activeTab === "dashboard" && (
              <Dashboard
                  fullName={fullName}
                  balance={balance}
                  accountNumber={accountNumber}
                  accountStatus={accountStatus}
                  accountType={accountType}
                  transactions={transactions}
                  isMobile={isMobile}
                  setActiveTab={handleTabChange}
              />
            )}

            {activeTab === "profile" && (
              <Profile
                fullName={fullName}
                email={email}
                phone={phone}
                address={address}
                city={city}
                stateName={stateName}
                country={country}
                zipCode={zipCode}
                profilePicture={profilePicture}
                saveProfile={saveProfile}
                setPhone={setPhone}
                setAddress={setAddress}
                setCity={setCity}
                setStateName={setStateName}
                setCountry={setCountry}
                setZipCode={setZipCode}
                dateOfBirth={dateOfBirth}
                setDateOfBirth={setDateOfBirth}
                isMobile={isMobile}
                backDestination={profileBackTab}
                onBack={() => handleTabChange(profileBackTab || "dashboard")}
              />
            )}

            {activeTab === "transfers" && (
              <Transfers
                fullName={fullName}
                balance={balance}
                isMobile={isMobile}
                accountNumber={accountNumber}
                onTransferComplete={refreshData}
              />
            )}

            {activeTab === "transactions" && (
              <Transactions
                transactions={transactions}
                userExternalTransfers={userExternalTransfers}
                accountNumber={accountNumber}
                isMobile={isMobile}
              />
            )}

            {activeTab === "cards" && (
              <Cards
                fullName={fullName}
                cardNumber={cardNumber}
                expiryDate={expiryDate}
                cvv={cvv}
                isMobile={isMobile}
                openPaymentLimitsRequest={cardsEntryRequest}
                onPaymentLimitsRequestHandled={() => setCardsEntryRequest(null)}
                onBackToMore={() => handleTabChange("more")}
              />
            )}

            {activeTab === "more" && (
              <More
                isMobile={isMobile}
                onOpenProfile={() => openProfileTab("more")}
                onOpenTransactionLimits={openTransactionLimits}
                onChangePassword={changePasswordWithCurrent}
                onForgotPassword={requestPasswordResetEmail}
                onSendPinResetEmail={requestPinResetEmail}
                appLanguage={appLanguage}
                setAppLanguage={setAppLanguage}
              />
            )}

            {activeTab === "support" && (
              <Support />
            )}

            {activeTab === "admin" && (
              <Admin isMobile={isMobile} />
            )}
          </Suspense>

          {isMaintenanceLockedUser && (
            <div
              onClick={() => alert(MAINTENANCE_MESSAGE)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 120,
                background: "rgba(10, 22, 40, 0.72)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 460,
                  borderRadius: 14,
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  boxShadow: "0 20px 50px rgba(0,0,0,.45)",
                  padding: isMobile ? "22px 18px" : "26px 24px",
                  textAlign: "center",
                  color: "#e2e8f0",
                }}
              >
                <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, marginBottom: 10 }}>
                  Temporary Service Notice
                </div>
                <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.6, color: "#cbd5e1" }}>
                  Service is temporarily under maintenance. Please try again later or contact support.
                </div>
              </div>
            </div>
          )}

        </DashboardLayout>
      </div>
    );
  }

function PageLoadFallback({ isMobile }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: isMobile ? 180 : 220,
        borderRadius: 14,
        border: "1px solid rgba(148, 163, 184, 0.2)",
        background: "linear-gradient(180deg, rgba(15,23,42,0.68) 0%, rgba(15,23,42,0.42) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#cbd5e1",
        fontSize: isMobile ? 13 : 14,
      }}
    >
      Loading page...
    </div>
  );
}

function LoginContent({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  fullName, 
  setFullName, 
  transferPin, 
  setTransferPin, 
  login, 
  signUp, 
  resetPassword,
  authInitError,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [introStage, setIntroStage] = useState("show");
  const isMobile = window.innerWidth < 768;
  
  const images = [
  {
    title: "Welcome to MetroTrust",
    subtitle: "Private Banking Redefined",
    description:
      "Experience secure international banking with personalized wealth management.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=60&fm=webp"
  },
  {
    title: "Professional Financial Experts",
    subtitle: "Trusted Around The World",
    description:
      "Our experienced advisors help individuals and businesses achieve financial success.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=60&fm=webp"
  },
  {
    title: "Secure Digital Banking",
    subtitle: "Bank Anywhere",
    description:
      "Modern technology backed by enterprise-grade security for every transaction.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=60&fm=webp"
  },
  {
    title: "Global Wealth Management",
    subtitle: "Growing Your Future",
    description:
      "Investment strategies and premium banking solutions tailored for you.",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60&fm=webp"
  },
];
const mobileImages = [
  images[0],
  images[1],
];

const displayImages = isMobile ? mobileImages : images;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayImages.length]);

  useEffect(() => {
    const beginSlide = setTimeout(() => {
      setIntroStage("slide-out");
    }, LOGIN_INTRO_SHOW_MS);

    const finishIntro = setTimeout(() => {
      setIntroStage("done");
    }, LOGIN_INTRO_SHOW_MS + LOGIN_INTRO_SLIDE_MS);

    return () => {
      clearTimeout(beginSlide);
      clearTimeout(finishIntro);
    };
  }, []);

  const handleLoginKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        overflowX: "hidden",
      }}
    >
      {introStage !== "done" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "0 18px" : "0 26px",
            background: "linear-gradient(160deg, rgba(7,16,33,0.97) 0%, rgba(12,27,49,0.95) 55%, rgba(18,44,79,0.93) 100%)",
            backdropFilter: "blur(4px)",
            transform: introStage === "slide-out" ? "translateY(-110%)" : "translateY(0)",
            opacity: introStage === "slide-out" ? 0 : 1,
            transition: `transform ${LOGIN_INTRO_SLIDE_MS}ms cubic-bezier(.22,.8,.2,1), opacity ${Math.max(300, LOGIN_INTRO_SLIDE_MS - 180)}ms ease`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 12 : 18,
              color: "#e2ecf8",
              maxWidth: 760,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: isMobile ? 68 : 84,
                height: isMobile ? 68 : 84,
                borderRadius: 20,
                background: "radial-gradient(circle at 45% 32%, #0f2a4b 0%, #06162f 52%, #040f25 100%)",
                border: "1px solid rgba(141, 169, 206, 0.24)",
                boxShadow: "0 14px 34px rgba(2, 12, 30, 0.62), inset 0 1px 0 rgba(196, 223, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: isMobile ? 44 : 54, height: isMobile ? 44 : 54 }}>
                <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(168, 196, 232, 0.52)" strokeWidth="2" />
                <path d="M24 43 L50 25 L76 43" stroke="#d9e8ff" strokeWidth="6.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M29 65 V49 L40 61 L50 47 L60 61 L71 49 V65" stroke="#e8f1ff" strokeWidth="6.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: isMobile ? 24 : 42,
                  letterSpacing: isMobile ? "0.02em" : "0.04em",
                  lineHeight: 1.06,
                  fontWeight: 600,
                  color: "#edf5ff",
                  textShadow: "0 2px 18px rgba(4, 12, 27, 0.45)",
                }}
              >
                Welcome to MetroTrust Banking
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: isMobile ? 11 : 13,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "rgba(191, 219, 254, 0.88)",
                  fontWeight: 600,
                }}
              >
                Where banking is simplified
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile &&
displayImages.map((img, index) => (
  <img
    key={index}
    src={img.image}
    alt=""
    style={{
      position: "fixed",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: currentImageIndex === index ? 1 : 0,
      transition: "opacity 1s ease",
      zIndex: 0,
    }}
  />
))}

{isMobile && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(5,15,30,.72)",
      zIndex: 1,
    }}
  />
)}
      {/* Left Side */}
{!isMobile && (
<div
style={{
flex:1,
position:"relative",
overflow:"hidden",
minHeight:"100vh"
}}
>

{displayImages.map((img,index)=>(
  <img
    key={index}
    src={img.image}
    alt={img.title}
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "opacity .9s ease",
      opacity: currentImageIndex === index ? 1 : 0
    }}
  />
))}

<div
style={{
position:"absolute",
inset:0,
background:
"linear-gradient(rgba(7,18,38,.55),rgba(7,18,38,.82))"
}}
/>

<div
style={{
position:"absolute",
left:70,
bottom:80,
right:70,
zIndex:5
}}
>

<div
style={{
fontSize:50,
fontWeight:800,
lineHeight:1.1,
marginBottom:18
}}
>
Premium Digital
<br/>
Banking
</div>

<div
style={{
fontSize:18,
lineHeight:1.8,
opacity:.9,
maxWidth:520
}}
>
Secure savings, wealth management,
international transfers and private banking
solutions built for modern global clients.
</div>

<div
style={{
marginTop:45,
display:"flex",
gap:12
}}
>

{displayImages.map((_, index) => (
  <div
    key={index}
    style={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      transition: ".3s",
      background:
        currentImageIndex === index
          ? "#fff"
          : "rgba(255,255,255,.35)"
    }}
  />
))}

</div>

</div>

</div>
)}

      {/* Right Side - Login Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 16 : 22,
          padding: isMobile ? "20px 16px" : "40px 30px",
          background: isMobile ? "transparent" : "#0f172a",
          width: "100%",
          maxWidth: 520,
        }}
      >
        {/* Form Container - Glossy Professional Style */}
        <div
          style={{
            width: window.innerWidth < 768 ? "calc(100% - 32px)" : "100%",
            maxWidth: window.innerWidth < 768 ? 320 : 360,
            display: "flex",
            flexDirection: "column",
            gap: window.innerWidth < 768 ? 12 : 16,
            padding: window.innerWidth < 768 ? "24px 20px" : "32px 28px",
            background: "rgba(30, 41, 59, 0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: window.innerWidth < 768 ? 12 : 16,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
            position: "relative",
            zIndex: 5,
            margin: "0 auto",
          }}
        >
          {/* Logo and Title */}
          <div style={{ textAlign: "center", marginBottom: window.innerWidth < 768 ? 4 : 10 }}>
            <div style={{ fontSize: window.innerWidth < 768 ? 22 : 28, fontWeight: 800, marginBottom: 2, color: "white" }}>
              MetroTrust Capital
            </div>
            <div style={{ fontSize: window.innerWidth < 768 ? 12 : 14, color: "#94a3b8" }}>
              Secure Banking & Wealth Management
            </div>
          </div>

          {authInitError && (
            <div
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1px solid rgba(248, 113, 113, 0.5)",
                background: "rgba(127, 29, 29, 0.35)",
                color: "#fecaca",
                fontSize: window.innerWidth < 768 ? 12 : 13,
                lineHeight: 1.45,
                padding: "10px 12px",
                boxSizing: "border-box",
              }}
            >
              {authInitError}
            </div>
          )}

          {/* Form Fields */}
          <input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              padding: window.innerWidth < 768 ? "12px 14px" : "14px 16px",
              width: "100%",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: window.innerWidth < 768 ? 14 : 15,
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              backdropFilter: "blur(4px)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.background = "rgba(15, 23, 42, 0.8)";
              e.target.style.boxShadow = "0 0 12px rgba(59, 130, 246, 0.3)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.target.style.background = "rgba(15, 23, 42, 0.6)";
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            placeholder="4-Digit Transfer PIN"
            type="password"
            maxLength={4}
            value={transferPin}
            onChange={(e) => setTransferPin(e.target.value)}
            style={{
              padding: window.innerWidth < 768 ? "12px 14px" : "14px 16px",
              width: "100%",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: window.innerWidth < 768 ? 14 : 15,
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              backdropFilter: "blur(4px)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.background = "rgba(15, 23, 42, 0.8)";
              e.target.style.boxShadow = "0 0 12px rgba(59, 130, 246, 0.3)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.target.style.background = "rgba(15, 23, 42, 0.6)";
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleLoginKeyPress}
            style={{
              padding: window.innerWidth < 768 ? "12px 14px" : "14px 16px",
              width: "100%",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: window.innerWidth < 768 ? 14 : 15,
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              backdropFilter: "blur(4px)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.background = "rgba(15, 23, 42, 0.8)";
              e.target.style.boxShadow = "0 0 12px rgba(59, 130, 246, 0.3)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.target.style.background = "rgba(15, 23, 42, 0.6)";
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleLoginKeyPress}
            style={{
              padding: window.innerWidth < 768 ? "12px 14px" : "14px 16px",
              width: "100%",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: window.innerWidth < 768 ? 14 : 15,
              boxSizing: "border-box",
              transition: "all 0.3s ease",
              backdropFilter: "blur(4px)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.background = "rgba(15, 23, 42, 0.8)";
              e.target.style.boxShadow = "0 0 12px rgba(59, 130, 246, 0.3)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
              e.target.style.background = "rgba(15, 23, 42, 0.6)";
              e.target.style.boxShadow = "none";
            }}
          />

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, flexDirection: "column", marginTop: window.innerWidth < 768 ? 0 : 4 }}>
            <button
              onClick={login}
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "white",
                border: "none",
                padding: window.innerWidth < 768 ? "12px 16px" : "14px 20px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "700",
                fontSize: window.innerWidth < 768 ? 14 : 15,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(22, 163, 74, 0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Login
            </button>

            <button
              onClick={signUp}
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "white",
                border: "none",
                padding: window.innerWidth < 768 ? "12px 16px" : "14px 20px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "700",
                fontSize: window.innerWidth < 768 ? 14 : 15,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(37, 99, 235, 0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Create Account
            </button>
          </div>

          {/* Forgot Password */}
          <p
            onClick={resetPassword}
            style={{
              marginTop: window.innerWidth < 768 ? 2 : 5,
              color: "#60a5fa",
              cursor: "pointer",
              textDecoration: "none",
              fontSize: window.innerWidth < 768 ? 12 : 14,
              fontWeight: 500,
              textAlign: "center",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = "underline";
              e.currentTarget.style.color = "#93c5fd";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = "none";
              e.currentTarget.style.color = "#60a5fa";
            }}
          >
            Forgot Password?
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: window.innerWidth < 768 ? 286 : 304,
            padding: isMobile ? "0 2px" : 0,
            color: "rgba(226, 232, 240, 0.62)",
            fontSize: window.innerWidth < 768 ? 9 : 10,
            lineHeight: 1.35,
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                height: 1,
                flex: 1,
                maxWidth: 72,
                background: "linear-gradient(90deg, rgba(148,163,184,0), rgba(148,163,184,0.55))",
              }}
            />
            <span
              style={{
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(191, 219, 254, 0.74)",
                fontWeight: 600,
                fontSize: window.innerWidth < 768 ? 8 : 9,
              }}
            >
              MetroTrust Capital
            </span>
            <div
              style={{
                height: 1,
                flex: 1,
                maxWidth: 72,
                background: "linear-gradient(90deg, rgba(148,163,184,0.55), rgba(148,163,184,0))",
              }}
            />
          </div>

          <div>
            Secure access to your accounts, global transfers, and private banking services.
          </div>
          <div style={{ marginTop: 2 }}>
            Copyright {new Date().getFullYear()} MetroTrust Capital. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
