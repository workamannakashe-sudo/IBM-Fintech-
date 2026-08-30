// BudgetMitra Financial Context Provider (FinancialContext.tsx)
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { autoCategorizeExpense, explainAnomaly } from "../services/gemini";
import { calculateHealthScore } from "../utils/health";
import type { HealthBreakdown } from "../utils/health";
import { syncTransactionsToGoogleSheets } from "../services/sheetsSync";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import {
  DEFAULT_PROFILE_USD_STUDENT,
  DEFAULT_BUDGETS_USD_STUDENT,
  SEED_TRANSACTIONS_USD_STUDENT,
  DEFAULT_GOALS_USD_STUDENT,
  DEFAULT_LOANS_USD_STUDENT,
  DEFAULT_PROFILE_INR_STUDENT,
  DEFAULT_BUDGETS_INR_STUDENT,
  SEED_TRANSACTIONS_INR_STUDENT,
  DEFAULT_GOALS_INR_STUDENT,
  DEFAULT_LOANS_INR_STUDENT,
  DEFAULT_PROFILE_USD_PROFESSIONAL,
  DEFAULT_BUDGETS_USD_PROFESSIONAL,
  SEED_TRANSACTIONS_USD_PROFESSIONAL,
  DEFAULT_GOALS_USD_PROFESSIONAL,
  DEFAULT_LOANS_USD_PROFESSIONAL,
  DEFAULT_PROFILE_INR_PROFESSIONAL,
  DEFAULT_BUDGETS_INR_PROFESSIONAL,
  SEED_TRANSACTIONS_INR_PROFESSIONAL,
  DEFAULT_GOALS_INR_PROFESSIONAL,
  DEFAULT_LOANS_INR_PROFESSIONAL,
} from "../services/financialSeeds";
import { loadUserSupabaseData } from "../services/supabaseFinancial";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  isAnomaly: boolean;
  anomalyExplanation?: string;
}

export interface StudentProfile {
  name: string;
  major: string;
  gpa: number;
  academicYear: string;
  incomeTier: string;
  firstGen: boolean;
  interests: string[];
  monthlyAllowance: number;
  course?: string;
  year?: number;
  state?: string;
  income_bracket?: "below_1L" | "1-3L" | "3-8L" | "above_8L";
  category?: "Gen" | "OBC" | "SC" | "ST" | "EWS";
  preferred_language?: "en" | "hi" | "mr";
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
}

export interface StudentLoan {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  extraPayment: number;
  type: "Subsidized" | "Unsubsidized" | "Personal" | "Home";
}

interface FinancialContextType {
  profile: StudentProfile;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loans: StudentLoan[];
  budgets: Record<string, number>;
  currency: "USD" | "INR";
  userType: "Student" | "Professional";
  syncUrl: string;
  syncStatus: "synced" | "pending" | "offline" | "unconfigured";
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthBreakdown;
  dailyBurnRate: number;
  totalSpentThisMonth: number;
  projectedBurnoutDay: string;
  burnRateMultiplier: number;
  isAuthenticated: boolean;
  isGuest: boolean;
  supabaseStatus: "connected" | "local" | "syncing" | "error";
  preferredLanguage: "en" | "hi" | "mr";
  setPreferredLanguage: (lang: "en" | "hi" | "mr") => void;
  setBurnRateMultiplier: (val: number) => void;
  setCurrency: (curr: "USD" | "INR") => void;
  setUserType: (type: "Student" | "Professional") => void;
  setSyncUrl: (url: string) => void;
  triggerSync: () => Promise<boolean>;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  addTransaction: (description: string, amount: number, date?: string, category?: string) => Promise<Transaction>;
  addCSVTransactions: (rawList: Array<{ date: string; description: string; amount: number; category?: string }>) => Promise<number>;
  deleteTransaction: (id: string) => void;
  updateBudgetLimit: (category: string, limit: number) => void;
  addSavingsGoal: (name: string, target: number, current: number) => void;
  updateGoalSavings: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string) => void;
  updateLoanExtraPayment: (id: string, extraPayment: number) => void;
  resetDemoData: () => void;
  login: (email: string, password: string, userType: "Student" | "Professional", currency: "USD" | "INR", monthlyAllowance?: number) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string, name: string, userType: "Student" | "Professional", currency: "USD" | "INR", monthlyAllowance?: number, additionalDetails?: Partial<StudentProfile>) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (userType: "Student" | "Professional", currency: "USD" | "INR", monthlyAllowance?: number) => void;
  logout: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export interface UserAccount {
  email: string;
  password: string;
  name: string;
  userType: "Student" | "Professional";
  currency: "USD" | "INR";
  profile: StudentProfile;
  budgets: Record<string, number>;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loans: StudentLoan[];
  dbProfileId?: string | null;
  createdAt: string;
}

const getStoredUserAccounts = (): Record<string, UserAccount> => {
  try {
    const raw = localStorage.getItem("bm_user_accounts");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveUserAccountToRegistry = (account: UserAccount) => {
  try {
    const accounts = getStoredUserAccounts();
    accounts[account.email.toLowerCase().trim()] = account;
    localStorage.setItem("bm_user_accounts", JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save user account to local registry:", e);
  }
};

const findUserAccountInRegistry = (email: string): UserAccount | undefined => {
  const accounts = getStoredUserAccounts();
  return accounts[email.toLowerCase().trim()];
};

const ensureDemoAccount = (): UserAccount => {
  const demoEmail = "rahul@budgetmitra.in";
  let demo = findUserAccountInRegistry(demoEmail);
  if (!demo) {
    demo = {
      email: demoEmail,
      password: "demo1234",
      name: "Rahul Sharma (Demo)",
      userType: "Student",
      currency: "INR",
      profile: DEFAULT_PROFILE_INR_STUDENT,
      budgets: DEFAULT_BUDGETS_INR_STUDENT,
      transactions: SEED_TRANSACTIONS_INR_STUDENT,
      goals: DEFAULT_GOALS_INR_STUDENT,
      loans: DEFAULT_LOANS_INR_STUDENT,
      createdAt: new Date().toISOString(),
    };
    saveUserAccountToRegistry(demo);
  }
  return demo;
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Mode State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("bm_authenticated") === "true";
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem("bm_is_guest") === "true";
  });

  const [userType, setUserTypeState] = useState<"Student" | "Professional">(() => {
    return (localStorage.getItem("bm_user_type") as "Student" | "Professional") || "Student";
  });

  const [currency, setCurrencyState] = useState<"USD" | "INR">(() => {
    return (localStorage.getItem("bm_currency") as "USD" | "INR") || "INR";
  });

  const [preferredLanguage, setPreferredLanguageState] = useState<"en" | "hi" | "mr">(() => {
    return (localStorage.getItem("bm_language") as "en" | "hi" | "mr") || "en";
  });

  const supabaseStatus: "connected" | "local" | "syncing" | "error" =
    isSupabaseConfigured() ? "connected" : "local";
  const [dbProfileId, setDbProfileId] = useState<string | null>(null);

  // Core Ledger State
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem("bm_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_PROFILE_INR_STUDENT;
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("bm_budgets");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_BUDGETS_INR_STUDENT;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("bm_transactions");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return SEED_TRANSACTIONS_INR_STUDENT;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem("bm_goals");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_GOALS_INR_STUDENT;
  });

  const [loans, setLoans] = useState<StudentLoan[]>(() => {
    const saved = localStorage.getItem("bm_loans");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_LOANS_INR_STUDENT;
  });

  // Burn Rate & Cloud Sync
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1.0);
  const [syncUrl, setSyncUrlState] = useState<string>(() => localStorage.getItem("bm_sync_url") || "");
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline" | "unconfigured">(
    syncUrl ? "synced" : "unconfigured"
  );

  // Persistence to LocalStorage and Active User Account
  useEffect(() => {
    localStorage.setItem("bm_profile", JSON.stringify(profile));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({ ...existing, profile });
      }
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("bm_budgets", JSON.stringify(budgets));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({ ...existing, budgets });
      }
    }
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("bm_transactions", JSON.stringify(transactions));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({ ...existing, transactions });
      }
    }
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("bm_goals", JSON.stringify(goals));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({ ...existing, goals });
      }
    }
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("bm_loans", JSON.stringify(loans));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({ ...existing, loans });
      }
    }
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("bm_currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("bm_user_type", userType);
  }, [userType]);

  useEffect(() => {
    localStorage.setItem("bm_language", preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    localStorage.setItem("bm_authenticated", String(isAuthenticated));
    localStorage.setItem("bm_is_guest", String(isGuest));
  }, [isAuthenticated, isGuest]);

  // Hydrate Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      const session = data?.session;
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuest(false);
        loadUserSupabaseData(session.user.email).then((data) => {
          if (data) {
            setProfile(data.profile);
            setTransactions(data.transactions);
            setBudgets(data.budgets);
            setGoals(data.goals);
            setLoans(data.loans);
            setDbProfileId(data.profileId);
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuest(false);
        loadUserSupabaseData(session.user.email).then((data) => {
          if (data) {
            setProfile(data.profile);
            setTransactions(data.transactions);
            setBudgets(data.budgets);
            setGoals(data.goals);
            setLoans(data.loans);
            setDbProfileId(data.profileId);
          }
        });
      } else if (!isGuest) {
        setIsAuthenticated(false);
        setDbProfileId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isGuest]);

  // Total spent this month
  const totalSpentThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Daily Burn Rate Calculation
  const dailyBurnRate = useMemo(() => {
    const now = new Date();
    const currentDay = Math.max(1, now.getDate());
    const rawBurnRate = totalSpentThisMonth / currentDay;
    return rawBurnRate * burnRateMultiplier;
  }, [totalSpentThisMonth, burnRateMultiplier]);

  // Projected Burnout Day
  const projectedBurnoutDay = useMemo(() => {
    const totalBudget = profile.monthlyAllowance > 0
      ? profile.monthlyAllowance
      : Object.values(budgets).reduce((a, b) => a + b, 0);

    const remainingBudget = Math.max(0, totalBudget - totalSpentThisMonth);
    if (dailyBurnRate <= 0) return "End of Month";

    const daysRemainingOfRunway = Math.floor(remainingBudget / dailyBurnRate);
    const now = new Date();
    const burnoutDate = new Date(now.getTime() + daysRemainingOfRunway * 24 * 60 * 60 * 1000);

    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (burnoutDate.getDate() > lastDayOfMonth || burnoutDate.getMonth() !== now.getMonth()) {
      return "End of Month (Safe)";
    }
    return burnoutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [profile.monthlyAllowance, budgets, totalSpentThisMonth, dailyBurnRate]);

  // Financial Health Score Calculation (4 Pillars)
  const healthBreakdown: HealthBreakdown = useMemo(() => {
    const totalBudget = profile.monthlyAllowance > 0
      ? profile.monthlyAllowance
      : Object.values(budgets).reduce((a, b) => a + b, 0);

    const totalSavingsTarget = goals.reduce((acc, g) => acc + g.target, 0);
    const totalActualSavings = goals.reduce((acc, g) => acc + g.current, 0);

    const anomalyCount = transactions.filter((t) => t.isAnomaly).length;

    // Categories over budget count
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    let overBudgetCount = 0;
    Object.keys(budgets).forEach((cat) => {
      if (budgets[cat] > 0 && (categoryTotals[cat] || 0) > budgets[cat]) {
        overBudgetCount++;
      }
    });

    const now = new Date();
    const daysInMonth = now.getDate();
    const uniqueLoggingDays = new Set(transactions.map((t) => t.date.split("T")[0])).size;

    return calculateHealthScore({
      monthlyIncome: profile.monthlyAllowance,
      totalExpenses: totalSpentThisMonth,
      totalBudget,
      savingsGoalTarget: totalSavingsTarget,
      actualSavings: totalActualSavings,
      anomalyCount,
      categoriesOverBudgetCount: overBudgetCount,
      activeLoggingDays: uniqueLoggingDays,
      elapsedDaysInMonth: daysInMonth,
    });
  }, [profile.monthlyAllowance, budgets, goals, transactions, totalSpentThisMonth]);

  const healthScore = healthBreakdown.score;
  const healthGrade = healthBreakdown.grade;

  // Actions
  const setPreferredLanguage = (lang: "en" | "hi" | "mr") => {
    setPreferredLanguageState(lang);
    setProfile((prev) => ({ ...prev, preferred_language: lang }));
  };

  const setCurrency = (curr: "USD" | "INR") => {
    setCurrencyState(curr);
  };

  const setUserType = (type: "Student" | "Professional") => {
    setUserTypeState(type);
  };

  const setSyncUrl = (url: string) => {
    setSyncUrlState(url);
    localStorage.setItem("bm_sync_url", url);
    setSyncStatus(url ? "synced" : "unconfigured");
  };

  const triggerSync = async (): Promise<boolean> => {
    if (!syncUrl) return false;
    setSyncStatus("pending");
    try {
      const success = await syncTransactionsToGoogleSheets(syncUrl, transactions);
      setSyncStatus(success ? "synced" : "offline");
      return success;
    } catch {
      setSyncStatus("offline");
      return false;
    }
  };

  const updateProfile = (updated: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("profiles").update(updated).eq("id", dbProfileId).then();
    }
  };

  const addTransaction = async (
    description: string,
    amount: number,
    date?: string,
    category?: string
  ): Promise<Transaction> => {
    const txDate = date || new Date().toISOString().split("T")[0];
    const parsedCategory = category || (await autoCategorizeExpense(description));

    // Check Anomaly threshold
    const categoryTx = transactions.filter((t) => t.category === parsedCategory);
    const avgCategorySpend = categoryTx.length > 0
      ? categoryTx.reduce((sum, t) => sum + t.amount, 0) / categoryTx.length
      : 20;

    const isAnomaly = categoryTx.length >= 2 && amount > avgCategorySpend * 2.0 && amount > 25;
    let anomalyExplanation: string | undefined;

    if (isAnomaly) {
      anomalyExplanation = await explainAnomaly(parsedCategory, amount, avgCategorySpend);
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: txDate,
      description,
      amount,
      category: parsedCategory,
      isAnomaly,
      anomalyExplanation,
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("transactions").insert({
        profile_id: dbProfileId,
        date: newTx.date,
        description: newTx.description,
        amount: newTx.amount,
        category: newTx.category,
        is_anomaly: newTx.isAnomaly,
        anomaly_explanation: newTx.anomalyExplanation,
      }).then();
    }

    return newTx;
  };

  const addCSVTransactions = async (
    rawList: Array<{ date: string; description: string; amount: number; category?: string }>
  ): Promise<number> => {
    const processed: Transaction[] = [];
    for (const item of rawList) {
      const cat = item.category || (await autoCategorizeExpense(item.description));
      processed.push({
        id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: item.date,
        description: item.description,
        amount: item.amount,
        category: cat,
        isAnomaly: false,
      });
    }

    setTransactions((prev) => [...processed, ...prev]);
    return processed.length;
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("transactions").delete().eq("id", id).then();
    }
  };

  const updateBudgetLimit = (category: string, limit: number) => {
    setBudgets((prev) => ({ ...prev, [category]: Math.max(0, limit) }));
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("budgets").upsert({
        profile_id: dbProfileId,
        category,
        monthly_limit: Math.max(0, limit),
      }).then();
    }
  };

  const addSavingsGoal = (name: string, target: number, current: number) => {
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      name,
      target: Math.max(1, target),
      current: Math.max(0, current),
    };
    setGoals((prev) => [...prev, newGoal]);
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("savings_goals").insert({
        profile_id: dbProfileId,
        name: newGoal.name,
        target_amount: newGoal.target,
        current_amount: newGoal.current,
      }).then();
    }
  };

  const updateGoalSavings = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.max(0, g.current + amount) } : g))
    );
  };

  const deleteSavingsGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("savings_goals").delete().eq("id", id).then();
    }
  };

  const updateLoanExtraPayment = (id: string, extraPayment: number) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, extraPayment: Math.max(0, extraPayment) } : l))
    );
  };

  const resetDemoData = () => {
    if (currency === "INR") {
      setProfile(userType === "Student" ? DEFAULT_PROFILE_INR_STUDENT : DEFAULT_PROFILE_INR_PROFESSIONAL);
      setBudgets(userType === "Student" ? DEFAULT_BUDGETS_INR_STUDENT : DEFAULT_BUDGETS_INR_PROFESSIONAL);
      setTransactions(userType === "Student" ? SEED_TRANSACTIONS_INR_STUDENT : SEED_TRANSACTIONS_INR_PROFESSIONAL);
      setGoals(userType === "Student" ? DEFAULT_GOALS_INR_STUDENT : DEFAULT_GOALS_INR_PROFESSIONAL);
      setLoans(userType === "Student" ? DEFAULT_LOANS_INR_STUDENT : DEFAULT_LOANS_INR_PROFESSIONAL);
    } else {
      setProfile(userType === "Student" ? DEFAULT_PROFILE_USD_STUDENT : DEFAULT_PROFILE_USD_PROFESSIONAL);
      setBudgets(userType === "Student" ? DEFAULT_BUDGETS_USD_STUDENT : DEFAULT_BUDGETS_USD_PROFESSIONAL);
      setTransactions(userType === "Student" ? SEED_TRANSACTIONS_USD_STUDENT : SEED_TRANSACTIONS_USD_PROFESSIONAL);
      setGoals(userType === "Student" ? DEFAULT_GOALS_USD_STUDENT : DEFAULT_GOALS_USD_PROFESSIONAL);
      setLoans(userType === "Student" ? DEFAULT_LOANS_USD_STUDENT : DEFAULT_LOANS_USD_PROFESSIONAL);
    }
  };

  const login = async (
    email: string,
    password: string,
    selectedUserType: "Student" | "Professional",
    selectedCurrency: "USD" | "INR",
    monthlyAllowance?: number
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    setUserTypeState(selectedUserType);
    setCurrencyState(selectedCurrency);

    // 1. Try Supabase Authentication if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: trimmedPassword,
        });

        if (!error && authData?.user) {
          setIsAuthenticated(true);
          setIsGuest(false);
          localStorage.setItem("bm_current_user_email", normalizedEmail);

          const data = await loadUserSupabaseData(normalizedEmail);
          if (data) {
            setProfile(data.profile);
            setTransactions(data.transactions);
            setBudgets(data.budgets);
            setGoals(data.goals);
            setLoans(data.loans);
            setDbProfileId(data.profileId);

            // Sync to local account storage
            saveUserAccountToRegistry({
              email: normalizedEmail,
              password: trimmedPassword,
              name: data.profile.name,
              userType: selectedUserType,
              currency: selectedCurrency,
              profile: data.profile,
              budgets: data.budgets,
              transactions: data.transactions,
              goals: data.goals,
              loans: data.loans,
              dbProfileId: data.profileId,
              createdAt: new Date().toISOString(),
            });
          }
          return { success: true };
        }
      } catch (err: any) {
        console.warn("Supabase sign-in attempted, falling back to local user registry:", err);
      }
    }

    // 2. Fallback / Local user account verification
    const existingAccount = findUserAccountInRegistry(normalizedEmail);

    if (existingAccount) {
      if (existingAccount.password === trimmedPassword) {
        setIsAuthenticated(true);
        setIsGuest(false);
        localStorage.setItem("bm_current_user_email", normalizedEmail);

        setProfile(existingAccount.profile);
        setBudgets(
          existingAccount.budgets ||
            (existingAccount.currency === "INR" ? DEFAULT_BUDGETS_INR_STUDENT : DEFAULT_BUDGETS_USD_STUDENT)
        );
        setTransactions(
          existingAccount.transactions ||
            (existingAccount.currency === "INR" ? SEED_TRANSACTIONS_INR_STUDENT : SEED_TRANSACTIONS_USD_STUDENT)
        );
        setGoals(
          existingAccount.goals ||
            (existingAccount.currency === "INR" ? DEFAULT_GOALS_INR_STUDENT : DEFAULT_GOALS_USD_STUDENT)
        );
        setLoans(
          existingAccount.loans ||
            (existingAccount.currency === "INR" ? DEFAULT_LOANS_INR_STUDENT : DEFAULT_LOANS_USD_STUDENT)
        );
        if (existingAccount.currency) setCurrencyState(existingAccount.currency);
        if (existingAccount.userType) setUserTypeState(existingAccount.userType);
        if (existingAccount.dbProfileId) setDbProfileId(existingAccount.dbProfileId);

        return { success: true };
      } else {
        return { success: false, error: "Incorrect password. Please verify your password and try again." };
      }
    }

    // 3. Check if it's the demo account
    if (normalizedEmail === "rahul@budgetmitra.in" && trimmedPassword === "demo1234") {
      const demo = ensureDemoAccount();
      setIsAuthenticated(true);
      setIsGuest(false);
      localStorage.setItem("bm_current_user_email", normalizedEmail);
      setProfile(demo.profile);
      setBudgets(demo.budgets);
      setTransactions(demo.transactions);
      setGoals(demo.goals);
      setLoans(demo.loans);
      setCurrencyState("INR");
      setUserTypeState("Student");
      return { success: true };
    }

    return {
      success: false,
      error: "No account found with this email. Please check your email or Sign Up first.",
    };
  };

  const registerUser = async (
    email: string,
    password: string,
    name: string,
    selectedUserType: "Student" | "Professional",
    selectedCurrency: "USD" | "INR",
    monthlyAllowance?: number,
    additionalDetails?: Partial<StudentProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const cleanName = name.trim();

    setUserTypeState(selectedUserType);
    setCurrencyState(selectedCurrency);

    const allowanceValue = monthlyAllowance || (selectedCurrency === "INR" ? 15000 : 650);

    const newProfile: StudentProfile = {
      name: cleanName,
      major: additionalDetails?.major || additionalDetails?.course || "B.Tech Computer Science",
      gpa: 8.5,
      academicYear: `${additionalDetails?.year || 1}st Year`,
      incomeTier: additionalDetails?.income_bracket || "1-3L",
      firstGen: false,
      interests: ["FinTech", "Academics", "Student Life"],
      monthlyAllowance: allowanceValue,
      course: additionalDetails?.course || "B.Tech",
      year: additionalDetails?.year || 1,
      state: additionalDetails?.state || "Maharashtra",
      income_bracket: additionalDetails?.income_bracket || "1-3L",
      category: additionalDetails?.category || "Gen",
      preferred_language: (additionalDetails?.preferred_language as "en" | "hi" | "mr") || preferredLanguage || "en",
    };

    const initialBudgets =
      selectedCurrency === "INR" ? { ...DEFAULT_BUDGETS_INR_STUDENT } : { ...DEFAULT_BUDGETS_USD_STUDENT };
    const initialTransactions =
      selectedCurrency === "INR" ? [...SEED_TRANSACTIONS_INR_STUDENT] : [...SEED_TRANSACTIONS_USD_STUDENT];
    const initialGoals =
      selectedCurrency === "INR" ? [...DEFAULT_GOALS_INR_STUDENT] : [...DEFAULT_GOALS_USD_STUDENT];
    const initialLoans =
      selectedCurrency === "INR" ? [...DEFAULT_LOANS_INR_STUDENT] : [...DEFAULT_LOANS_USD_STUDENT];

    let registeredProfileId: string | null = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: trimmedPassword,
          options: { data: { name: cleanName, userType: selectedUserType } },
        });
        if (!error && signUpData?.user) {
          registeredProfileId = signUpData.user.id;
          setDbProfileId(registeredProfileId);
        }
      } catch (err: any) {
        console.warn("Supabase registration warning:", err);
      }
    }

    // Save to local registry so login ALWAYS works immediately
    const userAccount: UserAccount = {
      email: normalizedEmail,
      password: trimmedPassword,
      name: cleanName,
      userType: selectedUserType,
      currency: selectedCurrency,
      profile: newProfile,
      budgets: initialBudgets,
      transactions: initialTransactions,
      goals: initialGoals,
      loans: initialLoans,
      dbProfileId: registeredProfileId,
      createdAt: new Date().toISOString(),
    };

    saveUserAccountToRegistry(userAccount);

    localStorage.setItem("bm_current_user_email", normalizedEmail);
    setIsAuthenticated(true);
    setIsGuest(false);
    setProfile(newProfile);
    setBudgets(initialBudgets);
    setTransactions(initialTransactions);
    setGoals(initialGoals);
    setLoans(initialLoans);

    return { success: true };
  };

  const loginAsGuest = (
    selectedUserType: "Student" | "Professional",
    selectedCurrency: "USD" | "INR",
    monthlyAllowance?: number
  ) => {
    setUserTypeState(selectedUserType);
    setCurrencyState(selectedCurrency);
    setIsAuthenticated(true);
    setIsGuest(true);

    const guestProfile: StudentProfile = {
      name: "Guest Student",
      major: "General Academics",
      gpa: 3.5,
      academicYear: "1st Year",
      incomeTier: "1-3L",
      firstGen: false,
      interests: ["Campus Life", "Smart Budgeting"],
      monthlyAllowance: monthlyAllowance || (selectedCurrency === "INR" ? 12000 : 500),
      course: "B.Tech",
      year: 1,
      state: "All India",
      income_bracket: "1-3L",
      category: "Gen",
      preferred_language: "en",
    };

    setProfile(guestProfile);
  };

  const logout = async () => {
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) {
        saveUserAccountToRegistry({
          ...existing,
          profile,
          budgets,
          transactions,
          goals,
          loans,
          currency,
          userType,
        });
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    setIsAuthenticated(false);
    setIsGuest(false);
    setDbProfileId(null);
    localStorage.removeItem("bm_authenticated");
    localStorage.removeItem("bm_is_guest");
    localStorage.removeItem("bm_current_user_email");
  };

  return (
    <FinancialContext.Provider
      value={{
        profile,
        transactions,
        goals,
        loans,
        budgets,
        currency,
        userType,
        syncUrl,
        syncStatus,
        healthScore,
        healthGrade,
        healthBreakdown,
        dailyBurnRate,
        totalSpentThisMonth,
        projectedBurnoutDay,
        burnRateMultiplier,
        isAuthenticated,
        isGuest,
        supabaseStatus,
        preferredLanguage,
        setPreferredLanguage,
        setBurnRateMultiplier,
        setCurrency,
        setUserType,
        setSyncUrl,
        triggerSync,
        updateProfile,
        addTransaction,
        addCSVTransactions,
        deleteTransaction,
        updateBudgetLimit,
        addSavingsGoal,
        updateGoalSavings,
        deleteSavingsGoal,
        updateLoanExtraPayment,
        resetDemoData,
        login,
        registerUser,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error("useFinancial must be used within a FinancialProvider");
  }
  return context;
};
