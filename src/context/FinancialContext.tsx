// FinWise Financial Context Provider (FinancialContext.tsx)
import React, { createContext, useContext, useState, useEffect } from "react";
import { autoCategorizeExpense, explainAnomaly } from "../services/gemini";
import { calculateHealthScore } from "../utils/health";
import { syncTransactionsToGoogleSheets } from "../services/sheetsSync";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";

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
  healthBreakdown: any;
  dailyBurnRate: number;
  totalSpentThisMonth: number;
  projectedBurnoutDay: string;
  burnRateMultiplier: number;
  isAuthenticated: boolean;
  isGuest: boolean;
  supabaseStatus: "connected" | "local" | "syncing" | "error";
  setBurnRateMultiplier: (val: number) => void;
  setCurrency: (curr: "USD" | "INR") => void;
  setUserType(type: "Student" | "Professional"): void;
  setSyncUrl(url: string): void;
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
  login: (username: string, userType: "Student" | "Professional", currency: "USD" | "INR") => void;
  loginAsGuest: (userType: "Student" | "Professional", currency: "USD" | "INR") => void;
  logout: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// USD Default Seed Data
const DEFAULT_PROFILE_USD_STUDENT: StudentProfile = {
  name: "Aman Kashe",
  major: "Computer Science & FinTech",
  gpa: 3.82,
  academicYear: "Junior",
  incomeTier: "Low-Income (Tier 1)",
  firstGen: true,
  interests: ["Software Engineering", "AI Ethics", "Campus Transit Planning"],
  monthlyAllowance: 650.0,
};

const DEFAULT_BUDGETS_USD_STUDENT: Record<string, number> = {
  "Housing & Rent": 450,
  "Food & Dining": 200,
  "Textbooks & Tuition": 150,
  "Entertainment & Subscriptions": 80,
  "Transportation": 50,
  "Health & Wellness": 40,
  "Shopping & Personal": 100,
  "Miscellaneous": 50,
};

const SEED_TRANSACTIONS_USD_STUDENT: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "Monthly Hostel Rent", amount: 450.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "Campus bookstore - Algorithms Text", amount: 112.5, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Starbucks Iced Macchiato", amount: 5.75, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "Spotify Student Premium", amount: 5.99, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "Dining Hall Flex-Meal", amount: 12.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Transit Bus Pass Card", amount: 25.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Subway Sandwiches Dinner", amount: 11.2, category: "Food & Dining", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Target Grocery Store haul", amount: 72.4, category: "Food & Dining", isAnomaly: false },
  { id: "t9", date: "2026-08-22", description: "CVS Pharmacy - Advil & Bandaids", amount: 14.5, category: "Health & Wellness", isAnomaly: false },
  { id: "t10", date: "2026-08-24", description: "Impulse Campus Concert ticket", amount: 65.0, category: "Entertainment & Subscriptions", isAnomaly: true, anomalyExplanation: "This $65.00 ticket is significantly higher than your typical $10.00 entertainment transactions. Bob advises matching dynamic campus budgets!" },
];

// INR Default Seed Data (Localizing to Indian Students)
const DEFAULT_PROFILE_INR_STUDENT: StudentProfile = {
  name: "Rahul Sharma",
  major: "Computer Science & FinTech",
  gpa: 8.84, // CGPA format
  academicYear: "3rd Year",
  incomeTier: "Tier-2 Family Income",
  firstGen: true,
  interests: ["Software Engineering", "Chai debates", "Auto pooling research"],
  monthlyAllowance: 15000.0, // ₹15,000 allowance
};

const DEFAULT_BUDGETS_INR_STUDENT: Record<string, number> = {
  "Housing & Rent": 6000,
  "Food & Dining": 4000,
  "Textbooks & Tuition": 1500,
  "Entertainment & Subscriptions": 1000,
  "Transportation": 1000,
  "Health & Wellness": 500,
  "Shopping & Personal": 1500,
  "Miscellaneous": 500,
};

const SEED_TRANSACTIONS_INR_STUDENT: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "PG hostel rent deposit", amount: 5500.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "Campus bookstore - Engineering drawing kit", amount: 1200.0, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Chai and Samosa tapri stall", amount: 45.0, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "YouTube Student Premium", amount: 79.0, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "College Mess Monthly Coupon", amount: 2800.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Auto-Rickshaw shared fare", amount: 60.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Maggie and Momos stall", amount: 110.0, category: "Food & Dining", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Supermarket Kirana snacks", amount: 650.0, category: "Food & Dining", isAnomaly: false },
  { id: "t9", date: "2026-08-22", description: "Local Pharmacy - paracetamol & bandages", amount: 180.0, category: "Health & Wellness", isAnomaly: false },
  { id: "t10", date: "2026-08-24", description: "Dominos Pizza college party", amount: 950.0, category: "Food & Dining", isAnomaly: true, anomalyExplanation: "This ₹950.00 pizza haul is 2.5x higher than your typical roadside momo snacks. Bob advises tracking mess coupons!" },
];

// Professional USD Defaults
const DEFAULT_PROFILE_USD_PROFESSIONAL: StudentProfile = {
  name: "Alex Miller",
  major: "Software Developer",
  gpa: 4.0,
  academicYear: "Graduated",
  incomeTier: "Mid-Career Professional",
  firstGen: false,
  interests: ["Equities", "Real Estate", "Coffee Roasting"],
  monthlyAllowance: 4500.0, // Treat allowance as monthly salary budget
};

const DEFAULT_BUDGETS_USD_PROFESSIONAL: Record<string, number> = {
  "Housing & Rent": 1800,
  "Food & Dining": 800,
  "Textbooks & Tuition": 100, // Used for Professional courses / books
  "Entertainment & Subscriptions": 300,
  "Transportation": 400,
  "Health & Wellness": 250,
  "Shopping & Personal": 500,
  "Miscellaneous": 350,
};

const SEED_TRANSACTIONS_USD_PROFESSIONAL: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "Apartment Rent payment", amount: 1750.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "System Design book study course", amount: 65.0, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Downtown Steakhouse Dinner", amount: 110.0, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "Netflix Premium 4K UHD", amount: 22.99, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "Organic Grocery Delivery", amount: 185.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Uber office commute", amount: 35.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Gym membership fee", amount: 80.0, category: "Health & Wellness", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Weekend Mall clothes shopping", amount: 210.0, category: "Shopping & Personal", isAnomaly: false },
];

// Professional INR Defaults
const DEFAULT_PROFILE_INR_PROFESSIONAL: StudentProfile = {
  name: "Arjun Verma",
  major: "FinTech Analyst",
  gpa: 8.5,
  academicYear: "Graduated",
  incomeTier: "Corporate Professional",
  firstGen: false,
  interests: ["Mutual Funds", "Blogging", "Cafes"],
  monthlyAllowance: 60000.0,
};

const DEFAULT_BUDGETS_INR_PROFESSIONAL: Record<string, number> = {
  "Housing & Rent": 18000,
  "Food & Dining": 12000,
  "Textbooks & Tuition": 2500,
  "Entertainment & Subscriptions": 4000,
  "Transportation": 5000,
  "Health & Wellness": 3000,
  "Shopping & Personal": 10000,
  "Miscellaneous": 5500,
};

const SEED_TRANSACTIONS_INR_PROFESSIONAL: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "1BHK Flat rent payment", amount: 16500.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "Udemy FinTech certification course", amount: 1800.0, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Starbucks Cappuccino & bagel", amount: 380.0, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "Netflix India Premium Subscription", amount: 649.0, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "Nature's Basket grocery delivery", amount: 3200.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Uber office taxi ride", amount: 480.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Fit India Cultpass gym gym fee", amount: 1500.0, category: "Health & Wellness", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Lifestyle showroom clothes shopping", amount: 4200.0, category: "Shopping & Personal", isAnomaly: false },
];

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("fw_authenticated") === "true";
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem("fw_is_guest") === "true";
  });

  // Localization Configurations
  const [currency, setCurrencyState] = useState<"USD" | "INR">(( ) => {
    return (localStorage.getItem("fw_currency") as "USD" | "INR") || "INR"; // Default Indian Rupees
  });

  const [userType, setUserTypeState] = useState<"Student" | "Professional">(( ) => {
    return (localStorage.getItem("fw_user_type") as "Student" | "Professional") || "Student";
  });

  // Apps Script sync credentials
  const [syncUrl, setSyncUrlState] = useState<string>(( ) => {
    return localStorage.getItem("fw_sync_url") || "";
  });

  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline" | "unconfigured">("unconfigured");

  // Seed selectors based on options
  const getProfileSeed = (curr: "USD" | "INR", type: "Student" | "Professional"): StudentProfile => {
    if (curr === "INR") {
      return type === "Student" ? DEFAULT_PROFILE_INR_STUDENT : DEFAULT_PROFILE_INR_PROFESSIONAL;
    }
    return type === "Student" ? DEFAULT_PROFILE_USD_STUDENT : DEFAULT_PROFILE_USD_PROFESSIONAL;
  };

  const getBudgetsSeed = (curr: "USD" | "INR", type: "Student" | "Professional"): Record<string, number> => {
    if (curr === "INR") {
      return type === "Student" ? DEFAULT_BUDGETS_INR_STUDENT : DEFAULT_BUDGETS_INR_PROFESSIONAL;
    }
    return type === "Student" ? DEFAULT_BUDGETS_USD_STUDENT : DEFAULT_BUDGETS_USD_PROFESSIONAL;
  };

  const getTransactionsSeed = (curr: "USD" | "INR", type: "Student" | "Professional"): Transaction[] => {
    if (curr === "INR") {
      return type === "Student" ? SEED_TRANSACTIONS_INR_STUDENT : SEED_TRANSACTIONS_INR_PROFESSIONAL;
    }
    return type === "Student" ? SEED_TRANSACTIONS_USD_STUDENT : SEED_TRANSACTIONS_USD_PROFESSIONAL;
  };

  const getGoalsSeed = (curr: "USD" | "INR"): SavingsGoal[] => {
    if (curr === "INR") {
      return [
        { id: "g1", name: "Emergency Buffer Fund", target: 20000, current: 8500 },
        { id: "g2", name: "Study Abroad (Germany)", target: 150000, current: 40000 },
        { id: "g3", name: "Laptop Upgrade", target: 80000, current: 25000 },
      ];
    }
    return [
      { id: "g1", name: "Emergency Buffer", target: 1000, current: 450 },
      { id: "g2", name: "Study Abroad (Germany)", target: 3000, current: 850 },
      { id: "g3", name: "Laptop Upgrade", target: 1200, current: 300 },
    ];
  };

  const getLoansSeed = (curr: "USD" | "INR", type: "Student" | "Professional"): StudentLoan[] => {
    if (curr === "INR") {
      return type === "Student"
        ? [
            {
              id: "l1",
              name: "SBI Scholar Education Loan",
              principal: 450000,
              interestRate: 8.15,
              termMonths: 120,
              extraPayment: 0,
              type: "Subsidized",
            },
          ]
        : [
            {
              id: "l1",
              name: "HDFC Flat Home Loan",
              principal: 1200000,
              interestRate: 8.75,
              termMonths: 240,
              extraPayment: 0,
              type: "Home",
            },
          ];
    }
    return type === "Student"
      ? [
          {
            id: "l1",
            name: "Federal Direct Subsidized Loan",
            principal: 8500,
            interestRate: 5.5,
            termMonths: 120,
            extraPayment: 0,
            type: "Subsidized",
          },
        ]
      : [
          {
            id: "l1",
            name: "Chase Car Personal Loan",
            principal: 15000,
            interestRate: 6.2,
            termMonths: 60,
            extraPayment: 0,
            type: "Personal",
          },
        ];
  };

  // State Declarations
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const data = localStorage.getItem("fw_profile");
    return data ? JSON.parse(data) : getProfileSeed(currency, userType);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const data = localStorage.getItem("fw_transactions");
    return data ? JSON.parse(data) : getTransactionsSeed(currency, userType);
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const data = localStorage.getItem("fw_goals");
    return data ? JSON.parse(data) : getGoalsSeed(currency);
  });

  const [loans, setLoans] = useState<StudentLoan[]>(() => {
    const data = localStorage.getItem("fw_loans");
    return data ? JSON.parse(data) : getLoansSeed(currency, userType);
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const data = localStorage.getItem("fw_budgets");
    return data ? JSON.parse(data) : getBudgetsSeed(currency, userType);
  });

  const [burnRateMultiplier, setBurnRateMultiplier] = useState(1.0);

  const [supabaseStatus, setSupabaseStatus] = useState<"connected" | "local" | "syncing" | "error">("local");

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchSupabaseData = async (userProfileName: string) => {
    if (!isSupabaseConfigured()) return null;
    try {
      let { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("name", userProfileName)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (!profileData) {
        const seedProfile = getProfileSeed(currency, userType);
        seedProfile.name = userProfileName;
        
        const { data: newProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            name: seedProfile.name,
            major: seedProfile.major,
            gpa: seedProfile.gpa,
            academic_year: seedProfile.academicYear,
            income_tier: seedProfile.incomeTier,
            first_gen: seedProfile.firstGen,
            interests: seedProfile.interests,
            monthly_allowance: seedProfile.monthlyAllowance,
            currency: currency,
            user_type: userType
          })
          .select()
          .single();

        if (createErr) throw createErr;
        profileData = newProfile;

        // Seed initial sub-data
        const seedTx = getTransactionsSeed(currency, userType);
        const seedGoals = getGoalsSeed(currency);
        const seedLoans = getLoansSeed(currency, userType);
        const seedBudgets = getBudgetsSeed(currency, userType);

        await Promise.all([
          supabase.from("transactions").insert(
            seedTx.map(t => ({
              profile_id: profileData.id,
              date: t.date,
              description: t.description,
              amount: t.amount,
              category: t.category,
              is_anomaly: t.isAnomaly,
              anomaly_explanation: t.anomalyExplanation
            }))
          ),
          supabase.from("savings_goals").insert(
            seedGoals.map(g => ({
              profile_id: profileData.id,
              name: g.name,
              target: g.target,
              current: g.current
            }))
          ),
          supabase.from("loans").insert(
            seedLoans.map(l => ({
              profile_id: profileData.id,
              name: l.name,
              principal: l.principal,
              interest_rate: l.interestRate,
              term_months: l.termMonths,
              extra_payment: l.extraPayment,
              type: l.type
            }))
          ),
          supabase.from("budgets").insert(
            Object.entries(seedBudgets).map(([category, limit_amount]) => ({
              profile_id: profileData.id,
              category,
              limit_amount
            }))
          )
        ]);
      }

      // Fetch related data
      const [txRes, goalsRes, loansRes, budgetsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("profile_id", profileData.id).order("date", { ascending: false }),
        supabase.from("savings_goals").select("*").eq("profile_id", profileData.id),
        supabase.from("loans").select("*").eq("profile_id", profileData.id),
        supabase.from("budgets").select("*").eq("profile_id", profileData.id)
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: Number(t.amount),
          category: t.category,
          isAnomaly: t.is_anomaly,
          anomalyExplanation: t.anomaly_explanation
        })));
      }

      if (goalsRes.data) {
        setGoals(goalsRes.data.map(g => ({
          id: g.id,
          name: g.name,
          target: Number(g.target),
          current: Number(g.current)
        })));
      }

      if (loansRes.data) {
        setLoans(loansRes.data.map(l => ({
          id: l.id,
          name: l.name,
          principal: Number(l.principal),
          interestRate: Number(l.interest_rate),
          termMonths: Number(l.term_months),
          extraPayment: Number(l.extra_payment),
          type: l.type
        })));
      }

      if (budgetsRes.data) {
        const loadedBudgets: Record<string, number> = {};
        for (const b of budgetsRes.data) {
          loadedBudgets[b.category] = Number(b.limit_amount);
        }
        setBudgets(loadedBudgets);
      }

      setProfile({
        name: profileData.name,
        major: profileData.major,
        gpa: Number(profileData.gpa),
        academicYear: profileData.academic_year,
        interests: profileData.interests || [],
        incomeTier: profileData.income_tier,
        firstGen: profileData.first_gen,
        monthlyAllowance: Number(profileData.monthly_allowance)
      });

      return profileData.id;
    } catch (err) {
      console.error("Error loading data from Supabase:", err);
      return null;
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured() && isAuthenticated && profile.name) {
      const loadData = async () => {
        setSupabaseStatus("syncing");
        const profileId = await fetchSupabaseData(profile.name);
        if (profileId) {
          setSupabaseStatus("connected");
          
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("FinWise Real-Time Sync", {
                body: `Successfully linked and synced data for "${profile.name}" from Supabase in real-time!`,
              });
            } catch (e) {
              console.log("Notification blocked");
            }
          }
        } else {
          setSupabaseStatus("error");
        }
      };
      loadData();
    } else {
      setSupabaseStatus(isSupabaseConfigured() ? "connected" : "local");
    }
  }, [profile.name, isAuthenticated]);

  // Synchronization status hook
  useEffect(() => {
    if (!syncUrl) {
      setSyncStatus("unconfigured");
    } else {
      setSyncStatus("pending");
    }
  }, [syncUrl]);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem("fw_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("fw_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("fw_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("fw_loans", JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("fw_budgets", JSON.stringify(budgets));
  }, [budgets]);

  // Handle auto Sheets Synchronization
  useEffect(() => {
    if (syncUrl && transactions.length > 0) {
      const runBgSync = async () => {
        setSyncStatus("pending");
        const success = await syncTransactionsToGoogleSheets(syncUrl, transactions);
        setSyncStatus(success ? "synced" : "offline");
      };
      runBgSync();
    }
  }, [transactions, syncUrl]);

  // Trigger manual sheets sync
  const triggerSync = async (): Promise<boolean> => {
    if (!syncUrl) return false;
    setSyncStatus("pending");
    const success = await syncTransactionsToGoogleSheets(syncUrl, transactions);
    setSyncStatus(success ? "synced" : "offline");
    return success;
  };

  const setCurrency = (curr: "USD" | "INR") => {
    setCurrencyState(curr);
    localStorage.setItem("fw_currency", curr);
  };

  const setUserType = (type: "Student" | "Professional") => {
    setUserTypeState(type);
    localStorage.setItem("fw_user_type", type);
  };

  const setSyncUrl = (url: string) => {
    setSyncUrlState(url);
    localStorage.setItem("fw_sync_url", url);
  };

  // --- Dynamic Math Properties ---
  const totalSpentThisMonth = transactions
    .filter(t => t.date.startsWith("2026-08"))
    .reduce((sum, t) => sum + t.amount, 0);

  const activeLoggingDays = new Set(
    transactions
      .filter(t => t.date.startsWith("2026-08"))
      .map(t => t.date)
  ).size;

  const currentDayOfMonth = new Date("2026-08-27").getDate(); // Grounded in 2026-08-27

  // Spending Velocity calculation
  const rawDailyBurn = currentDayOfMonth > 0 ? totalSpentThisMonth / currentDayOfMonth : totalSpentThisMonth;
  const dailyBurnRate = rawDailyBurn * burnRateMultiplier;

  // Budget Exhaustion Projections
  const totalBudgetLimit = Object.values(budgets).reduce((sum, v) => sum + v, 0);
  
  let projectedBurnoutDay = "Never";
  if (dailyBurnRate > 0) {
    const remainingBudget = Math.max(0, totalBudgetLimit - totalSpentThisMonth);
    const daysLeft = Math.round(remainingBudget / dailyBurnRate);
    if (daysLeft < 30 - currentDayOfMonth) {
      const burnoutDate = new Date("2026-08-27");
      burnoutDate.setDate(burnoutDate.getDate() + daysLeft);
      projectedBurnoutDay = burnoutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      projectedBurnoutDay = "Safe (Month-End)";
    }
  }

  // Categories over budget calculation
  const getExpensesByCategory = () => {
    const totals: Record<string, number> = {};
    for (const key of Object.keys(budgets)) {
      totals[key] = 0;
    }
    for (const t of transactions) {
      if (t.date.startsWith("2026-08")) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    }
    return totals;
  };
  const expensesByCategory = getExpensesByCategory();
  
  const categoriesOverBudgetCount = Object.keys(budgets).filter(
    cat => expensesByCategory[cat] > budgets[cat]
  ).length;

  const anomalyCount = transactions.filter(t => t.isAnomaly).length;

  const actualSavings = goals.reduce((sum, g) => sum + g.current, 0);
  const savingsGoalTarget = goals.reduce((sum, g) => sum + g.target, 0);

  // Compute health score breakdown using the custom formula
  const healthBreakdown = calculateHealthScore({
    monthlyIncome: profile.monthlyAllowance,
    totalExpenses: totalSpentThisMonth,
    totalBudget: totalBudgetLimit,
    savingsGoalTarget,
    actualSavings,
    anomalyCount,
    categoriesOverBudgetCount,
    activeLoggingDays,
    elapsedDaysInMonth: currentDayOfMonth,
  });

  const healthScore = healthBreakdown.score;
  const healthGrade = healthBreakdown.grade;

  // --- Core Methods ---
  const updateProfile = (updated: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));

    if (isSupabaseConfigured() && profile.name) {
      supabase.from("profiles").update({
        major: updated.major ?? profile.major,
        gpa: updated.gpa ?? profile.gpa,
        academic_year: updated.academicYear ?? profile.academicYear,
        income_tier: updated.incomeTier ?? profile.incomeTier,
        first_gen: updated.firstGen ?? profile.firstGen,
        interests: updated.interests ?? profile.interests,
        monthly_allowance: updated.monthlyAllowance ?? profile.monthlyAllowance
      }).eq("name", profile.name).then(({ error }) => {
        if (error) console.error("Error updating profile in Supabase:", error);
      });
    }
  };

  const addTransaction = async (
    description: string,
    amount: number,
    date?: string,
    category?: string
  ): Promise<Transaction> => {
    const txDate = date || "2026-08-27";
    const parsedCategory = category || (await autoCategorizeExpense(description));

    // Determine if this is an anomaly
    const catTxs = transactions.filter(t => t.category === parsedCategory);
    let isAnomaly = false;
    let anomalyExplanation = undefined;

    if (catTxs.length >= 2) {
      const mean = catTxs.reduce((sum, t) => sum + t.amount, 0) / catTxs.length;
      if (amount > mean * 1.8) {
        isAnomaly = true;
        anomalyExplanation = await explainAnomaly(parsedCategory, amount, mean);
      }
    } else {
      const limit = currency === "INR" ? 3000.0 : 120.0;
      if (amount > limit && parsedCategory !== "Housing & Rent" && parsedCategory !== "Textbooks & Tuition") {
        isAnomaly = true;
        anomalyExplanation = `Spending ${currency === "INR" ? "₹" : "$"}${amount.toFixed(2)} is high relative to typical small daily campus expenses.`;
      }
    }

    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      date: txDate,
      description,
      amount,
      category: parsedCategory,
      isAnomaly,
      anomalyExplanation,
    };

    setTransactions(prev => [newTx, ...prev]);

    if (isSupabaseConfigured() && profile.name) {
      supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
        if (data) {
          supabase.from("transactions").insert({
            profile_id: data.id,
            date: newTx.date,
            description: newTx.description,
            amount: newTx.amount,
            category: newTx.category,
            is_anomaly: newTx.isAnomaly,
            anomaly_explanation: newTx.anomalyExplanation
          }).then(({ error }) => {
            if (error) console.error("Error inserting transaction to Supabase:", error);
          });
        }
      });
    }
    
    // Dispatch custom event to award XP in Gamification context
    const event = new CustomEvent("fw_xp_gain", { 
      detail: { type: "add_transaction", isAnomaly } 
    });
    window.dispatchEvent(event);

    return newTx;
  };

  const addCSVTransactions = async (
    rawList: Array<{ date: string; description: string; amount: number; category?: string }>
  ): Promise<number> => {
    let successCount = 0;
    const newTxs: Transaction[] = [];

    for (const t of rawList) {
      const cat = t.category || (await autoCategorizeExpense(t.description));
      newTxs.push({
        id: Math.random().toString(36).substring(2, 9),
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: cat,
        isAnomaly: false,
      });
      successCount++;
    }

    setTransactions(prev => [...newTxs, ...prev]);

    if (isSupabaseConfigured() && profile.name) {
      supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
        if (data) {
          supabase.from("transactions").insert(
            newTxs.map(tx => ({
              profile_id: data.id,
              date: tx.date,
              description: tx.description,
              amount: tx.amount,
              category: tx.category,
              is_anomaly: tx.isAnomaly
            }))
          ).then(({ error }) => {
            if (error) console.error("Error bulk inserting transactions to Supabase:", error);
          });
        }
      });
    }

    // Reward bulk CSV logging XP
    const event = new CustomEvent("fw_xp_gain", { 
      detail: { type: "bulk_upload", count: successCount } 
    });
    window.dispatchEvent(event);

    return successCount;
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured() && profile.name && target) {
      if (typeof id === "string" && id.includes("-")) {
        supabase.from("transactions").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Error deleting transaction from Supabase:", error);
        });
      } else {
        supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
          if (data) {
            supabase.from("transactions").delete()
              .eq("profile_id", data.id)
              .eq("description", target.description)
              .eq("amount", target.amount)
              .then(({ error }) => {
                if (error) console.error("Error deleting transaction from Supabase:", error);
              });
          }
        });
      }
    }
  };

  const updateBudgetLimit = (category: string, limit: number) => {
    setBudgets(prev => ({ ...prev, [category]: limit }));

    if (isSupabaseConfigured() && profile.name) {
      supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
        if (data) {
          supabase.from("budgets").upsert({
            profile_id: data.id,
            category: category,
            limit_amount: limit
          }, { onConflict: "profile_id,category" }).then(({ error }) => {
            if (error) console.error("Error upserting budget in Supabase:", error);
          });
        }
      });
    }
  };

  const addSavingsGoal = (name: string, target: number, current: number) => {
    const newGoal: SavingsGoal = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      target,
      current,
    };
    setGoals(prev => [...prev, newGoal]);

    if (isSupabaseConfigured() && profile.name) {
      supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
        if (data) {
          supabase.from("savings_goals").insert({
            profile_id: data.id,
            name: newGoal.name,
            target: newGoal.target,
            current: newGoal.current
          }).then(({ error }) => {
            if (error) console.error("Error inserting goal to Supabase:", error);
          });
        }
      });
    }
    
    // Dispatch goal XP
    const event = new CustomEvent("fw_xp_gain", { detail: { type: "create_goal" } });
    window.dispatchEvent(event);
  };

  const updateGoalSavings = (id: string, amount: number) => {
    const target = goals.find(g => g.id === id);
    setGoals(prev =>
      prev.map(g => {
        if (g.id === id) {
          const updated = { ...g, current: Math.min(g.target, Math.max(0, amount)) };
          if (updated.current >= g.target && g.current < g.target) {
            const event = new CustomEvent("fw_xp_gain", { 
              detail: { type: "fund_goal", goalName: g.name } 
            });
            window.dispatchEvent(event);
          }
          return updated;
        }
        return g;
      })
    );

    if (isSupabaseConfigured() && profile.name && target) {
      if (typeof id === "string" && id.includes("-")) {
        supabase.from("savings_goals").update({ current: Math.max(0, amount) }).eq("id", id).then(({ error }) => {
          if (error) console.error("Error updating goal in Supabase:", error);
        });
      } else {
        supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
          if (data) {
            supabase.from("savings_goals").update({ current: Math.max(0, amount) })
              .eq("profile_id", data.id)
              .eq("name", target.name)
              .then(({ error }) => {
                if (error) console.error("Error updating goal in Supabase:", error);
              });
          }
        });
      }
    }
  };

  const deleteSavingsGoal = (id: string) => {
    const target = goals.find(g => g.id === id);
    setGoals(prev => prev.filter(g => g.id !== id));

    if (isSupabaseConfigured() && profile.name && target) {
      if (typeof id === "string" && id.includes("-")) {
        supabase.from("savings_goals").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Error deleting goal from Supabase:", error);
        });
      } else {
        supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
          if (data) {
            supabase.from("savings_goals").delete()
              .eq("profile_id", data.id)
              .eq("name", target.name)
              .then(({ error }) => {
                if (error) console.error("Error deleting goal from Supabase:", error);
              });
          }
        });
      }
    }
  };

  const updateLoanExtraPayment = (id: string, extraPayment: number) => {
    const target = loans.find(l => l.id === id);
    setLoans(prev =>
      prev.map(l => (l.id === id ? { ...l, extraPayment: Math.max(0, extraPayment) } : l))
    );

    if (isSupabaseConfigured() && profile.name && target) {
      if (typeof id === "string" && id.includes("-")) {
        supabase.from("loans").update({ extra_payment: Math.max(0, extraPayment) }).eq("id", id).then(({ error }) => {
          if (error) console.error("Error updating loan in Supabase:", error);
        });
      } else {
        supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
          if (data) {
            supabase.from("loans").update({ extra_payment: Math.max(0, extraPayment) })
              .eq("profile_id", data.id)
              .eq("name", target.name)
              .then(({ error }) => {
                if (error) console.error("Error updating loan in Supabase:", error);
              });
          }
        });
      }
    }
  };

  const resetDemoData = () => {
    // Reset local state
    const pSeed = getProfileSeed(currency, userType);
    const tSeed = getTransactionsSeed(currency, userType);
    const gSeed = getGoalsSeed(currency);
    const lSeed = getLoansSeed(currency, userType);
    const bSeed = getBudgetsSeed(currency, userType);

    setProfile(pSeed);
    setTransactions(tSeed);
    setGoals(gSeed);
    setLoans(lSeed);
    setBudgets(bSeed);
    setBurnRateMultiplier(1.0);

    // If Supabase is connected, clear tables and re-seed in DB
    if (isSupabaseConfigured() && profile.name) {
      setSupabaseStatus("syncing");
      supabase.from("profiles").select("id").eq("name", profile.name).maybeSingle().then(({ data }) => {
        if (data) {
          Promise.all([
            supabase.from("transactions").delete().eq("profile_id", data.id),
            supabase.from("savings_goals").delete().eq("profile_id", data.id),
            supabase.from("loans").delete().eq("profile_id", data.id),
            supabase.from("budgets").delete().eq("profile_id", data.id)
          ]).then(() => {
            // Upload seeds
            Promise.all([
              supabase.from("transactions").insert(tSeed.map(t => ({
                profile_id: data.id,
                date: t.date,
                description: t.description,
                amount: t.amount,
                category: t.category,
                is_anomaly: t.isAnomaly,
                anomaly_explanation: t.anomalyExplanation
              }))),
              supabase.from("savings_goals").insert(gSeed.map(g => ({
                profile_id: data.id,
                name: g.name,
                target: g.target,
                current: g.current
              }))),
              supabase.from("loans").insert(lSeed.map(l => ({
                profile_id: data.id,
                name: l.name,
                principal: l.principal,
                interest_rate: l.interestRate,
                term_months: l.termMonths,
                extra_payment: l.extraPayment,
                type: l.type
              }))),
              supabase.from("budgets").insert(Object.entries(bSeed).map(([category, limit_amount]) => ({
                profile_id: data.id,
                category,
                limit_amount
              })))
            ]).then(() => {
              setSupabaseStatus("connected");
            });
          });
        }
      });
    }
  };

  const login = (username: string, type: "Student" | "Professional", curr: "USD" | "INR") => {
    setIsAuthenticated(true);
    setIsGuest(false);
    localStorage.setItem("fw_authenticated", "true");
    localStorage.setItem("fw_is_guest", "false");
    
    setUserTypeState(type);
    setCurrencyState(curr);
    localStorage.setItem("fw_user_type", type);
    localStorage.setItem("fw_currency", curr);
    
    const initialProfile = getProfileSeed(curr, type);
    initialProfile.name = username || "Aman Kashe";
    setProfile(initialProfile);
    localStorage.setItem("fw_profile", JSON.stringify(initialProfile));
    
    setTransactions(getTransactionsSeed(curr, type));
    setGoals(getGoalsSeed(curr));
    setLoans(getLoansSeed(curr, type));
    setBudgets(getBudgetsSeed(curr, type));
  };

  const loginAsGuest = (type: "Student" | "Professional", curr: "USD" | "INR") => {
    setIsAuthenticated(true);
    setIsGuest(true);
    localStorage.setItem("fw_authenticated", "true");
    localStorage.setItem("fw_is_guest", "true");
    
    setUserTypeState(type);
    setCurrencyState(curr);
    localStorage.setItem("fw_user_type", type);
    localStorage.setItem("fw_currency", curr);
    
    const guestProfile = getProfileSeed(curr, type);
    guestProfile.name = "Guest User";
    setProfile(guestProfile);
    localStorage.setItem("fw_profile", JSON.stringify(guestProfile));
    
    setTransactions(getTransactionsSeed(curr, type));
    setGoals(getGoalsSeed(curr));
    setLoans(getLoansSeed(curr, type));
    setBudgets(getBudgetsSeed(curr, type));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsGuest(false);
    localStorage.removeItem("fw_authenticated");
    localStorage.removeItem("fw_is_guest");
    localStorage.removeItem("fw_profile");
    localStorage.removeItem("fw_transactions");
    localStorage.removeItem("fw_goals");
    localStorage.removeItem("fw_loans");
    localStorage.removeItem("fw_budgets");
    
    // Reset to default seed profiles
    setProfile(getProfileSeed(currency, userType));
    setTransactions(getTransactionsSeed(currency, userType));
    setGoals(getGoalsSeed(currency));
    setLoans(getLoansSeed(currency, userType));
    setBudgets(getBudgetsSeed(currency, userType));
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
export { DEFAULT_PROFILE_USD_STUDENT, DEFAULT_PROFILE_INR_STUDENT };
export type { StudentProfile as FinancialProfile };
export type { SavingsGoal as GoalItem };
export type { StudentLoan as LoanItem };
export type { Transaction as TxItem };
