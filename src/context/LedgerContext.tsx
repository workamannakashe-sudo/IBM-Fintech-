// LedgerContext.tsx — BudgetMitra Ledger Sub-Context
// ====================================================
// Owns: transactions, goals, loans, budgets, profile, and their mutations.
// Decoupled from auth — components that only read/write financial data never
// re-render due to auth state changes.
// ====================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { autoCategorizeExpense, explainAnomaly } from "../services/gemini";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import { syncTransactionsToGoogleSheets } from "../services/sheetsSync";
import { calculateHealthScore } from "../utils/health";
import type { HealthBreakdown } from "../utils/health";
import type {
  Transaction,
  StudentProfile,
  SavingsGoal,
  StudentLoan,
} from "./FinancialContext";
import {
  DEFAULT_PROFILE_INR_STUDENT,
  DEFAULT_BUDGETS_INR_STUDENT,
  SEED_TRANSACTIONS_INR_STUDENT,
  DEFAULT_GOALS_INR_STUDENT,
  DEFAULT_LOANS_INR_STUDENT,
  DEFAULT_PROFILE_USD_STUDENT,
  DEFAULT_BUDGETS_USD_STUDENT,
  SEED_TRANSACTIONS_USD_STUDENT,
  DEFAULT_GOALS_USD_STUDENT,
  DEFAULT_LOANS_USD_STUDENT,
  DEFAULT_PROFILE_INR_PROFESSIONAL,
  DEFAULT_BUDGETS_INR_PROFESSIONAL,
  SEED_TRANSACTIONS_INR_PROFESSIONAL,
  DEFAULT_GOALS_INR_PROFESSIONAL,
  DEFAULT_LOANS_INR_PROFESSIONAL,
  DEFAULT_PROFILE_USD_PROFESSIONAL,
  DEFAULT_BUDGETS_USD_PROFESSIONAL,
  SEED_TRANSACTIONS_USD_PROFESSIONAL,
  DEFAULT_GOALS_USD_PROFESSIONAL,
  DEFAULT_LOANS_USD_PROFESSIONAL,
} from "../services/financialSeeds";

export interface LedgerContextType {
  profile: StudentProfile;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loans: StudentLoan[];
  budgets: Record<string, number>;
  syncUrl: string;
  syncStatus: "synced" | "pending" | "offline" | "unconfigured";
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthBreakdown;
  dailyBurnRate: number;
  totalSpentThisMonth: number;
  projectedBurnoutDay: string;
  burnRateMultiplier: number;
  setBurnRateMultiplier: (val: number) => void;
  setSyncUrl: (url: string) => void;
  triggerSync: () => Promise<boolean>;
  updateProfile: (updates: Partial<StudentProfile>, dbProfileId?: string | null) => void;
  addTransaction: (description: string, amount: number, date?: string, category?: string, dbProfileId?: string | null) => Promise<Transaction>;
  addCSVTransactions: (rawList: Array<{ date: string; description: string; amount: number; category?: string }>) => Promise<number>;
  deleteTransaction: (id: string, dbProfileId?: string | null) => void;
  updateBudgetLimit: (category: string, limit: number, dbProfileId?: string | null) => void;
  addSavingsGoal: (name: string, target: number, current: number, dbProfileId?: string | null) => void;
  updateGoalSavings: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string, dbProfileId?: string | null) => void;
  updateLoanExtraPayment: (id: string, extraPayment: number) => void;
  resetDemoData: (currency: "USD" | "INR", userType: "Student" | "Professional") => void;
  seedLedger: (seed: { profile: StudentProfile; budgets: Record<string, number>; transactions: Transaction[]; goals: SavingsGoal[]; loans: StudentLoan[] }) => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try { const s = localStorage.getItem("bm_profile"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_PROFILE_INR_STUDENT;
  });
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem("bm_budgets"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_BUDGETS_INR_STUDENT;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try { const s = localStorage.getItem("bm_transactions"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return SEED_TRANSACTIONS_INR_STUDENT;
  });
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try { const s = localStorage.getItem("bm_goals"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_GOALS_INR_STUDENT;
  });
  const [loans, setLoans] = useState<StudentLoan[]>(() => {
    try { const s = localStorage.getItem("bm_loans"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    return DEFAULT_LOANS_INR_STUDENT;
  });
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1.0);
  const [syncUrl, setSyncUrlState] = useState<string>(() => localStorage.getItem("bm_sync_url") || "");
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline" | "unconfigured">(
    syncUrl ? "synced" : "unconfigured"
  );

  // ── Persist ledger slices to localStorage + user registry ──────────────────
  const persistSlice = <T,>(key: string, value: T, registryKey: keyof UserAccountSlice) => {
    localStorage.setItem(key, JSON.stringify(value));
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (!currentEmail) return;
    try {
      const raw = localStorage.getItem("bm_user_accounts");
      if (!raw) return;
      const all = JSON.parse(raw);
      if (all[currentEmail]) {
        all[currentEmail][registryKey] = value;
        localStorage.setItem("bm_user_accounts", JSON.stringify(all));
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { persistSlice("bm_profile", profile, "profile"); }, [profile]);
  useEffect(() => { persistSlice("bm_budgets", budgets, "budgets"); }, [budgets]);
  useEffect(() => { persistSlice("bm_transactions", transactions, "transactions"); }, [transactions]);
  useEffect(() => { persistSlice("bm_goals", goals, "goals"); }, [goals]);
  useEffect(() => { persistSlice("bm_loans", loans, "loans"); }, [loans]);

  // ── Seed ledger (called by AuthContext after login/register/guest) ──────────
  const seedLedger: LedgerContextType["seedLedger"] = ({ profile, budgets, transactions, goals, loans }) => {
    setProfile(profile);
    setBudgets(budgets);
    setTransactions(transactions);
    setGoals(goals);
    setLoans(loans);
  };

  // ── Computed values ─────────────────────────────────────────────────────────
  const totalSpentThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => { const d = new Date(t.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const dailyBurnRate = useMemo(() => {
    const day = Math.max(1, new Date().getDate());
    return (totalSpentThisMonth / day) * burnRateMultiplier;
  }, [totalSpentThisMonth, burnRateMultiplier]);

  const projectedBurnoutDay = useMemo(() => {
    const totalBudget = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : Object.values(budgets).reduce((a, b) => a + b, 0);
    const remaining = Math.max(0, totalBudget - totalSpentThisMonth);
    if (dailyBurnRate <= 0) return "End of Month";
    const daysLeft = Math.floor(remaining / dailyBurnRate);
    const now = new Date();
    const burnout = new Date(now.getTime() + daysLeft * 86_400_000);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (burnout.getDate() > lastDay || burnout.getMonth() !== now.getMonth()) return "End of Month (Safe)";
    return burnout.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [profile.monthlyAllowance, budgets, totalSpentThisMonth, dailyBurnRate]);

  const healthBreakdown: HealthBreakdown = useMemo(() => {
    const totalBudget = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : Object.values(budgets).reduce((a, b) => a + b, 0);
    const totalSavingsTarget = goals.reduce((a, g) => a + g.target, 0);
    const totalActualSavings = goals.reduce((a, g) => a + g.current, 0);
    const anomalyCount = transactions.filter((t) => t.isAnomaly).length;
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    const overBudgetCount = Object.keys(budgets).filter((c) => budgets[c] > 0 && (categoryTotals[c] || 0) > budgets[c]).length;
    const uniqueLoggingDays = new Set(transactions.map((t) => t.date.split("T")[0])).size;
    return calculateHealthScore({ monthlyIncome: profile.monthlyAllowance, totalExpenses: totalSpentThisMonth, totalBudget, savingsGoalTarget: totalSavingsTarget, actualSavings: totalActualSavings, anomalyCount, categoriesOverBudgetCount: overBudgetCount, activeLoggingDays: uniqueLoggingDays, elapsedDaysInMonth: new Date().getDate() });
  }, [profile.monthlyAllowance, budgets, goals, transactions, totalSpentThisMonth]);

  const healthScore = healthBreakdown.score;
  const healthGrade = healthBreakdown.grade;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const setSyncUrl = (url: string) => {
    setSyncUrlState(url);
    localStorage.setItem("bm_sync_url", url);
    setSyncStatus(url ? "synced" : "unconfigured");
  };

  const triggerSync = async (): Promise<boolean> => {
    if (!syncUrl) return false;
    setSyncStatus("pending");
    try {
      const ok = await syncTransactionsToGoogleSheets(syncUrl, transactions);
      setSyncStatus(ok ? "synced" : "offline");
      return ok;
    } catch { setSyncStatus("offline"); return false; }
  };

  const updateProfile = (updates: Partial<StudentProfile>, dbProfileId?: string | null) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("profiles").update(updates).eq("id", dbProfileId).then();
    }
  };

  const addTransaction = async (description: string, amount: number, date?: string, category?: string, dbProfileId?: string | null): Promise<Transaction> => {
    const txDate = date || new Date().toISOString().split("T")[0];
    const parsedCategory = category || (await autoCategorizeExpense(description));
    const categoryTx = transactions.filter((t) => t.category === parsedCategory);
    const avgCategorySpend = categoryTx.length > 0 ? categoryTx.reduce((s, t) => s + t.amount, 0) / categoryTx.length : 20;
    const isAnomaly = categoryTx.length >= 2 && amount > avgCategorySpend * 2.0 && amount > 25;
    let anomalyExplanation: string | undefined;
    if (isAnomaly) anomalyExplanation = await explainAnomaly(parsedCategory, amount, avgCategorySpend);
    const newTx: Transaction = { id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, date: txDate, description, amount, category: parsedCategory, isAnomaly, anomalyExplanation };
    setTransactions((prev) => [newTx, ...prev]);
    if (isSupabaseConfigured() && dbProfileId) {
      supabase.from("transactions").insert({ profile_id: dbProfileId, date: newTx.date, description: newTx.description, amount: newTx.amount, category: newTx.category, is_anomaly: newTx.isAnomaly, anomaly_explanation: newTx.anomalyExplanation }).then();
    }
    return newTx;
  };

  const addCSVTransactions = async (rawList: Array<{ date: string; description: string; amount: number; category?: string }>): Promise<number> => {
    const processed: Transaction[] = [];
    for (const item of rawList) {
      const cat = item.category || (await autoCategorizeExpense(item.description));
      processed.push({ id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, date: item.date, description: item.description, amount: item.amount, category: cat, isAnomaly: false });
    }
    setTransactions((prev) => [...processed, ...prev]);
    return processed.length;
  };

  const deleteTransaction = (id: string, dbProfileId?: string | null) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured() && dbProfileId) supabase.from("transactions").delete().eq("id", id).then();
  };

  const updateBudgetLimit = (category: string, limit: number, dbProfileId?: string | null) => {
    setBudgets((prev) => ({ ...prev, [category]: Math.max(0, limit) }));
    if (isSupabaseConfigured() && dbProfileId) supabase.from("budgets").upsert({ profile_id: dbProfileId, category, monthly_limit: Math.max(0, limit) }).then();
  };

  const addSavingsGoal = (name: string, target: number, current: number, dbProfileId?: string | null) => {
    const newGoal: SavingsGoal = { id: `goal_${Date.now()}`, name, target: Math.max(1, target), current: Math.max(0, current) };
    setGoals((prev) => [...prev, newGoal]);
    if (isSupabaseConfigured() && dbProfileId) supabase.from("savings_goals").insert({ profile_id: dbProfileId, name: newGoal.name, target_amount: newGoal.target, current_amount: newGoal.current }).then();
  };

  const updateGoalSavings = (id: string, amount: number) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: Math.max(0, g.current + amount) } : g));
  };

  const deleteSavingsGoal = (id: string, dbProfileId?: string | null) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (isSupabaseConfigured() && dbProfileId) supabase.from("savings_goals").delete().eq("id", id).then();
  };

  const updateLoanExtraPayment = (id: string, extraPayment: number) => {
    setLoans((prev) => prev.map((l) => l.id === id ? { ...l, extraPayment: Math.max(0, extraPayment) } : l));
  };

  const resetDemoData = (currency: "USD" | "INR", userType: "Student" | "Professional") => {
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

  return (
    <LedgerContext.Provider value={{ profile, transactions, goals, loans, budgets, syncUrl, syncStatus, healthScore, healthGrade, healthBreakdown, dailyBurnRate, totalSpentThisMonth, projectedBurnoutDay, burnRateMultiplier, setBurnRateMultiplier, setSyncUrl, triggerSync, updateProfile, addTransaction, addCSVTransactions, deleteTransaction, updateBudgetLimit, addSavingsGoal, updateGoalSavings, deleteSavingsGoal, updateLoanExtraPayment, resetDemoData, seedLedger }}>
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
};

// Internal type used only for registry persistence helper
interface UserAccountSlice {
  profile: StudentProfile;
  budgets: Record<string, number>;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loans: StudentLoan[];
}
