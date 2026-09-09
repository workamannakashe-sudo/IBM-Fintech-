// AuthContext.tsx — BudgetMitra Authentication Sub-Context
// ==========================================================
// Owns: isAuthenticated, isGuest, userType, currency, preferredLanguage,
//       supabaseStatus, dbProfileId, login, registerUser, loginAsGuest, logout.
// Keeps all auth logic isolated so changes here never trigger re-renders in
// components that only care about transactions or budgets.
// ==========================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import { hashPassword, isPlaintextPassword } from "../utils/security";
import type { StudentProfile, SavingsGoal, StudentLoan, Transaction } from "./FinancialContext";
import {
  DEFAULT_BUDGETS_INR_STUDENT,
  DEFAULT_BUDGETS_USD_STUDENT,
  SEED_TRANSACTIONS_INR_STUDENT,
  SEED_TRANSACTIONS_USD_STUDENT,
  DEFAULT_GOALS_INR_STUDENT,
  DEFAULT_GOALS_USD_STUDENT,
  DEFAULT_LOANS_INR_STUDENT,
  DEFAULT_LOANS_USD_STUDENT,
  DEFAULT_PROFILE_INR_STUDENT,
  generateGuestTransactions,
  GUEST_GAMIFICATION_SEED,
} from "../services/financialSeeds";
import { loadUserSupabaseData } from "../services/supabaseFinancial";

// ─── UserAccount registry helpers ────────────────────────────────────────────

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

const ACCOUNTS_KEY = "bm_user_accounts";

const getStoredUserAccounts = (): Record<string, UserAccount> => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
};

const saveUserAccountToRegistry = (account: UserAccount) => {
  try {
    const all = getStoredUserAccounts();
    all[account.email.toLowerCase()] = account;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};

const findUserAccountInRegistry = (email: string): UserAccount | undefined => {
  return getStoredUserAccounts()[email.toLowerCase()];
};

const DEMO_PASSWORD_HASH = "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";

const ensureDemoAccount = (): UserAccount => {
  const existing = findUserAccountInRegistry("rahul@budgetmitra.in");
  if (existing) return existing;
  const demo: UserAccount = {
    email: "rahul@budgetmitra.in",
    password: DEMO_PASSWORD_HASH,
    name: "Rahul Sharma",
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
  return demo;
};

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthLedgerSeed {
  profile: StudentProfile;
  budgets: Record<string, number>;
  transactions: Transaction[];
  goals: SavingsGoal[];
  loans: StudentLoan[];
  dbProfileId?: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  userType: "Student" | "Professional";
  currency: "USD" | "INR";
  preferredLanguage: "en" | "hi" | "mr";
  supabaseStatus: "connected" | "local" | "syncing" | "error";
  dbProfileId: string | null;
  setCurrency: (curr: "USD" | "INR") => void;
  setUserType: (type: "Student" | "Professional") => void;
  setPreferredLanguage: (lang: "en" | "hi" | "mr") => void;
  /** Called by FinancialProvider after auth succeeds to seed ledger state */
  onAuthSuccess: (seed: AuthLedgerSeed) => void;
  login: (
    email: string,
    password: string,
    userType: "Student" | "Professional",
    currency: "USD" | "INR",
    monthlyAllowance?: number
  ) => Promise<{ success: boolean; error?: string }>;
  registerUser: (
    email: string,
    password: string,
    name: string,
    userType: "Student" | "Professional",
    currency: "USD" | "INR",
    monthlyAllowance?: number,
    additionalDetails?: Partial<StudentProfile>
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (
    userType: "Student" | "Professional",
    currency: "USD" | "INR",
    monthlyAllowance?: number
  ) => void;
  logout: (snapshot: {
    profile: StudentProfile;
    budgets: Record<string, number>;
    transactions: Transaction[];
    goals: SavingsGoal[];
    loans: StudentLoan[];
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onAuthSuccess: (seed: AuthLedgerSeed) => void;
}> = ({ children, onAuthSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem("bm_authenticated") === "true"
  );
  const [isGuest, setIsGuest] = useState<boolean>(
    () => localStorage.getItem("bm_is_guest") === "true"
  );
  const [userType, setUserTypeState] = useState<"Student" | "Professional">(
    () => (localStorage.getItem("bm_user_type") as "Student" | "Professional") || "Student"
  );
  const [currency, setCurrencyState] = useState<"USD" | "INR">(
    () => (localStorage.getItem("bm_currency") as "USD" | "INR") || "INR"
  );
  const [preferredLanguage, setPreferredLanguageState] = useState<"en" | "hi" | "mr">(
    () => (localStorage.getItem("bm_language") as "en" | "hi" | "mr") || "en"
  );
  const [dbProfileId, setDbProfileId] = useState<string | null>(null);

  const supabaseStatus: "connected" | "local" | "syncing" | "error" =
    isSupabaseConfigured() ? "connected" : "local";

  useEffect(() => { localStorage.setItem("bm_currency", currency); }, [currency]);
  useEffect(() => { localStorage.setItem("bm_user_type", userType); }, [userType]);
  useEffect(() => { localStorage.setItem("bm_language", preferredLanguage); }, [preferredLanguage]);
  useEffect(() => {
    localStorage.setItem("bm_authenticated", String(isAuthenticated));
    localStorage.setItem("bm_is_guest", String(isGuest));
  }, [isAuthenticated, isGuest]);

  // Hydrate Supabase session on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      const session = data?.session;
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuest(false);
        loadUserSupabaseData(session.user.email).then((d) => {
          if (d) {
            setDbProfileId(d.profileId);
            onAuthSuccess({ profile: d.profile, budgets: d.budgets, transactions: d.transactions, goals: d.goals, loans: d.loans, dbProfileId: d.profileId });
          }
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuest(false);
        loadUserSupabaseData(session.user.email).then((d) => {
          if (d) {
            setDbProfileId(d.profileId);
            onAuthSuccess({ profile: d.profile, budgets: d.budgets, transactions: d.transactions, goals: d.goals, loans: d.loans, dbProfileId: d.profileId });
          }
        });
      } else if (!isGuest) {
        setIsAuthenticated(false);
        setDbProfileId(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  const setCurrency = (curr: "USD" | "INR") => setCurrencyState(curr);
  const setUserType = (type: "Student" | "Professional") => setUserTypeState(type);
  const setPreferredLanguage = (lang: "en" | "hi" | "mr") => setPreferredLanguageState(lang);

  const login = async (
    email: string,
    password: string,
    selectedUserType: "Student" | "Professional",
    selectedCurrency: "USD" | "INR",
    monthlyAllowance?: number
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const inputHash = await hashPassword(trimmedPassword);

    setUserTypeState(selectedUserType);
    setCurrencyState(selectedCurrency);

    if (normalizedEmail === "rahul@budgetmitra.in" && inputHash === DEMO_PASSWORD_HASH) {
      const demo = ensureDemoAccount();
      setIsAuthenticated(true); setIsGuest(false);
      localStorage.setItem("bm_current_user_email", normalizedEmail);
      onAuthSuccess({ profile: demo.profile, budgets: demo.budgets, transactions: demo.transactions, goals: demo.goals, loans: demo.loans });
      setCurrencyState("INR"); setUserTypeState("Student");
      return { success: true };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: trimmedPassword });
        if (authData?.user && !authError) {
          setIsAuthenticated(true); setIsGuest(false);
          localStorage.setItem("bm_current_user_email", normalizedEmail);
          const remoteData = await loadUserSupabaseData(normalizedEmail);
          if (remoteData) {
            setDbProfileId(remoteData.profileId);
            onAuthSuccess({ profile: remoteData.profile, budgets: remoteData.budgets, transactions: remoteData.transactions, goals: remoteData.goals, loans: remoteData.loans, dbProfileId: remoteData.profileId });
            saveUserAccountToRegistry({ email: normalizedEmail, password: inputHash, name: remoteData.profile.name, userType: selectedUserType, currency: selectedCurrency, profile: remoteData.profile, budgets: remoteData.budgets, transactions: remoteData.transactions, goals: remoteData.goals, loans: remoteData.loans, dbProfileId: remoteData.profileId, createdAt: new Date().toISOString() });
          }
          return { success: true };
        }
        console.warn("[Auth] Supabase auth did not succeed, checking offline cache:", authError?.message);
      } catch (networkErr) {
        console.warn("[Auth] Supabase network error, checking offline cache:", networkErr);
      }
    }

    const existingAccount = findUserAccountInRegistry(normalizedEmail);
    if (existingAccount) {
      if (isPlaintextPassword(existingAccount.password)) {
        const legacyHash = await hashPassword(existingAccount.password);
        if (legacyHash === inputHash) { existingAccount.password = inputHash; saveUserAccountToRegistry(existingAccount); }
        else return { success: false, error: "Incorrect password. Please verify your password and try again." };
      }
      if (existingAccount.password === inputHash) {
        setIsAuthenticated(true); setIsGuest(false);
        localStorage.setItem("bm_current_user_email", normalizedEmail);
        if (existingAccount.dbProfileId) setDbProfileId(existingAccount.dbProfileId);
        const loadedProfile = { ...existingAccount.profile, monthlyAllowance: monthlyAllowance || existingAccount.profile.monthlyAllowance || (selectedCurrency === "INR" ? 15000 : 650) };
        onAuthSuccess({ profile: loadedProfile, budgets: existingAccount.budgets || (existingAccount.currency === "INR" ? DEFAULT_BUDGETS_INR_STUDENT : DEFAULT_BUDGETS_USD_STUDENT), transactions: existingAccount.transactions || (existingAccount.currency === "INR" ? SEED_TRANSACTIONS_INR_STUDENT : SEED_TRANSACTIONS_USD_STUDENT), goals: existingAccount.goals || (existingAccount.currency === "INR" ? DEFAULT_GOALS_INR_STUDENT : DEFAULT_GOALS_USD_STUDENT), loans: existingAccount.loans || (existingAccount.currency === "INR" ? DEFAULT_LOANS_INR_STUDENT : DEFAULT_LOANS_USD_STUDENT), dbProfileId: existingAccount.dbProfileId });
        if (existingAccount.currency) setCurrencyState(existingAccount.currency);
        if (existingAccount.userType) setUserTypeState(existingAccount.userType);
        return { success: true };
      } else {
        return { success: false, error: "Incorrect password. Please verify your password and try again." };
      }
    }
    return { success: false, error: "No account found with this email. Please check your email or Sign Up first." };
  };

  const registerUser = async (email: string, password: string, name: string, selectedUserType: "Student" | "Professional", selectedCurrency: "USD" | "INR", monthlyAllowance?: number, additionalDetails?: Partial<StudentProfile>): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const cleanName = name.trim();
    setUserTypeState(selectedUserType); setCurrencyState(selectedCurrency);
    const allowanceValue = monthlyAllowance || (selectedCurrency === "INR" ? 15000 : 650);
    const newProfile: StudentProfile = { name: cleanName, major: additionalDetails?.major || additionalDetails?.course || "B.Tech Computer Science", gpa: 8.5, academicYear: `${additionalDetails?.year || 1}st Year`, incomeTier: additionalDetails?.income_bracket || "1-3L", firstGen: false, interests: ["FinTech", "Academics", "Student Life"], monthlyAllowance: allowanceValue, course: additionalDetails?.course || "B.Tech", year: additionalDetails?.year || 1, state: additionalDetails?.state || "Maharashtra", income_bracket: additionalDetails?.income_bracket || "1-3L", category: additionalDetails?.category || "Gen", preferred_language: (additionalDetails?.preferred_language as "en" | "hi" | "mr") || preferredLanguage || "en" };
    const initialBudgets = selectedCurrency === "INR" ? { ...DEFAULT_BUDGETS_INR_STUDENT } : { ...DEFAULT_BUDGETS_USD_STUDENT };
    const initialTransactions = selectedCurrency === "INR" ? [...SEED_TRANSACTIONS_INR_STUDENT] : [...SEED_TRANSACTIONS_USD_STUDENT];
    const initialGoals = selectedCurrency === "INR" ? [...DEFAULT_GOALS_INR_STUDENT] : [...DEFAULT_GOALS_USD_STUDENT];
    const initialLoans = selectedCurrency === "INR" ? [...DEFAULT_LOANS_INR_STUDENT] : [...DEFAULT_LOANS_USD_STUDENT];
    let registeredProfileId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: signUpData, error } = await supabase.auth.signUp({ email: normalizedEmail, password: trimmedPassword, options: { data: { name: cleanName, userType: selectedUserType } } });
        if (!error && signUpData?.user) { registeredProfileId = signUpData.user.id; setDbProfileId(registeredProfileId); }
      } catch (err: any) { console.warn("Supabase registration warning:", err); }
    }
    const passwordHash = await hashPassword(trimmedPassword);
    const userAccount: UserAccount = { email: normalizedEmail, password: passwordHash, name: cleanName, userType: selectedUserType, currency: selectedCurrency, profile: newProfile, budgets: initialBudgets, transactions: initialTransactions, goals: initialGoals, loans: initialLoans, dbProfileId: registeredProfileId, createdAt: new Date().toISOString() };
    saveUserAccountToRegistry(userAccount);
    localStorage.setItem("bm_current_user_email", normalizedEmail);
    setIsAuthenticated(true); setIsGuest(false);
    onAuthSuccess({ profile: newProfile, budgets: initialBudgets, transactions: initialTransactions, goals: initialGoals, loans: initialLoans, dbProfileId: registeredProfileId });
    return { success: true };
  };

  const loginAsGuest = (selectedUserType: "Student" | "Professional", selectedCurrency: "USD" | "INR", monthlyAllowance?: number) => {
    setUserTypeState(selectedUserType); setCurrencyState(selectedCurrency);
    setIsAuthenticated(true); setIsGuest(true);
    const allowance = monthlyAllowance || (selectedCurrency === "INR" ? 12000 : 500);
    const guestProfile: StudentProfile = { name: "Guest Student", major: "B.Tech Computer Science", gpa: 7.8, academicYear: "2nd Year", incomeTier: "1-3L", firstGen: false, interests: ["Campus Life", "Smart Budgeting"], monthlyAllowance: allowance, course: "B.Tech", year: 2, state: "Maharashtra", income_bracket: "1-3L", category: "Gen", preferred_language: "en" };
    const guestBudgets: Record<string, number> = selectedCurrency === "INR" ? { food: 4000, rent: 5000, travel: 1200, entertainment: 800, books: 1000, other: 1000 } : { food: 150, rent: 250, travel: 40, entertainment: 30, books: 30, other: 50 };
    const guestGoals = selectedCurrency === "INR" ? [{ id: "gg1", name: "Emergency Tech Reserve", target: 15000, current: 6500 }, { id: "gg2", name: "Goa Trip Pool", target: 8000, current: 2000 }] : [{ id: "gg1", name: "Laptop Upgrade Fund", target: 800, current: 320 }, { id: "gg2", name: "Vacation Savings", target: 400, current: 100 }];
    const guestLoans = selectedCurrency === "INR" ? [{ id: "gl1", name: "Vidya Lakshmi Education Loan", principal: 200000, interestRate: 8.5, termMonths: 60, extraPayment: 500, type: "Subsidized" as const }] : [{ id: "gl1", name: "Federal Student Loan", principal: 5000, interestRate: 4.99, termMonths: 120, extraPayment: 20, type: "Subsidized" as const }];
    const guestTransactions = selectedCurrency === "INR" ? generateGuestTransactions() : [];
    localStorage.setItem("bm_xp", String(GUEST_GAMIFICATION_SEED.xp));
    localStorage.setItem("bm_level", String(GUEST_GAMIFICATION_SEED.level));
    localStorage.setItem("bm_streak", String(GUEST_GAMIFICATION_SEED.streak));
    localStorage.setItem("bm_badges", JSON.stringify(GUEST_GAMIFICATION_SEED.badges));
    localStorage.setItem("bm_logging_history", JSON.stringify(GUEST_GAMIFICATION_SEED.loggingHistory));
    onAuthSuccess({ profile: guestProfile, budgets: guestBudgets, transactions: guestTransactions.length > 0 ? guestTransactions : (selectedCurrency === "INR" ? SEED_TRANSACTIONS_INR_STUDENT : SEED_TRANSACTIONS_USD_STUDENT), goals: guestGoals, loans: guestLoans });
  };

  const logout = async (snapshot: { profile: StudentProfile; budgets: Record<string, number>; transactions: Transaction[]; goals: SavingsGoal[]; loans: StudentLoan[] }) => {
    const currentEmail = localStorage.getItem("bm_current_user_email");
    if (currentEmail) {
      const existing = findUserAccountInRegistry(currentEmail);
      if (existing) saveUserAccountToRegistry({ ...existing, ...snapshot, currency, userType });
    }
    if (isSupabaseConfigured()) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    setIsAuthenticated(false); setIsGuest(false); setDbProfileId(null);
    localStorage.removeItem("bm_authenticated");
    localStorage.removeItem("bm_is_guest");
    localStorage.removeItem("bm_current_user_email");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isGuest, userType, currency, preferredLanguage, supabaseStatus, dbProfileId, setCurrency, setUserType, setPreferredLanguage, onAuthSuccess, login, registerUser, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
