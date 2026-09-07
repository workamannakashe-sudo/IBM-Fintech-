// financialSeeds.ts - Default Seed Datasets for BudgetMitra
import type { StudentProfile, Transaction, SavingsGoal, StudentLoan } from "../context/FinancialContext";

export const DEFAULT_PROFILE_EMPTY: StudentProfile = {
  name: "",
  major: "",
  gpa: 0,
  academicYear: "",
  incomeTier: "",
  firstGen: false,
  interests: [],
  monthlyAllowance: 0,
  course: "",
  year: 1,
  state: "",
  income_bracket: "1-3L",
  category: "Gen",
  preferred_language: "en",
};

export const DEFAULT_BUDGETS_EMPTY: Record<string, number> = {
  "Housing & Rent": 0,
  "Food & Dining": 0,
  "Textbooks & Tuition": 0,
  "Entertainment & Subscriptions": 0,
  "Transportation": 0,
  "Health & Wellness": 0,
  "Shopping & Personal": 0,
  "Miscellaneous": 0,
};

export const DEFAULT_PROFILE_USD_STUDENT: StudentProfile = {
  name: "Aman Kashe",
  major: "Computer Science & FinTech",
  gpa: 3.82,
  academicYear: "Junior",
  incomeTier: "Low-Income (Tier 1)",
  firstGen: true,
  interests: ["Software Engineering", "AI Ethics", "Campus Transit Planning"],
  monthlyAllowance: 650.0,
};

export const DEFAULT_BUDGETS_USD_STUDENT: Record<string, number> = {
  "Housing & Rent": 450,
  "Food & Dining": 200,
  "Textbooks & Tuition": 150,
  "Entertainment & Subscriptions": 80,
  "Transportation": 50,
  "Health & Wellness": 40,
  "Shopping & Personal": 100,
  "Miscellaneous": 50,
};

export const SEED_TRANSACTIONS_USD_STUDENT: Transaction[] = [
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

export const DEFAULT_PROFILE_INR_STUDENT: StudentProfile = {
  name: "Rahul Sharma",
  major: "B.Tech Computer Science",
  gpa: 8.84,
  academicYear: "3rd Year",
  incomeTier: "Tier-2 Family Income",
  firstGen: true,
  interests: ["Software Engineering", "Chai debates", "Auto pooling research"],
  monthlyAllowance: 15000.0,
  course: "B.Tech",
  year: 3,
  state: "Maharashtra",
  income_bracket: "1-3L",
  category: "OBC",
  preferred_language: "en",
};

export const DEFAULT_BUDGETS_INR_STUDENT: Record<string, number> = {
  "Housing & Rent": 6000,
  "Food & Dining": 4000,
  "Textbooks & Tuition": 1500,
  "Entertainment & Subscriptions": 1000,
  "Transportation": 1000,
  "Health & Wellness": 500,
  "Shopping & Personal": 1500,
  "Miscellaneous": 500,
};

export const SEED_TRANSACTIONS_INR_STUDENT: Transaction[] = [
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

export const DEFAULT_PROFILE_USD_PROFESSIONAL: StudentProfile = {
  name: "Alex Miller",
  major: "Software Developer",
  gpa: 4.0,
  academicYear: "Graduated",
  incomeTier: "Mid-Career Professional",
  firstGen: false,
  interests: ["Equities", "Real Estate", "Coffee Roasting"],
  monthlyAllowance: 4500.0,
};

export const DEFAULT_BUDGETS_USD_PROFESSIONAL: Record<string, number> = {
  "Housing & Rent": 1800,
  "Food & Dining": 800,
  "Textbooks & Tuition": 100,
  "Entertainment & Subscriptions": 300,
  "Transportation": 400,
  "Health & Wellness": 250,
  "Shopping & Personal": 500,
  "Miscellaneous": 350,
};

export const SEED_TRANSACTIONS_USD_PROFESSIONAL: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "Apartment Rent payment", amount: 1750.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "System Design book study course", amount: 65.0, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Downtown Steakhouse Dinner", amount: 110.0, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "Netflix Premium 4K UHD", amount: 22.99, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "Organic Grocery Delivery", amount: 185.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Uber office commute", amount: 35.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Gym membership fee", amount: 80.0, category: "Health & Wellness", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Weekend Mall clothes shopping", amount: 210.0, category: "Shopping & Personal", isAnomaly: false },
];

export const DEFAULT_PROFILE_INR_PROFESSIONAL: StudentProfile = {
  name: "Arjun Verma",
  major: "FinTech Analyst",
  gpa: 8.5,
  academicYear: "Graduated",
  incomeTier: "Corporate Professional",
  firstGen: false,
  interests: ["Mutual Funds", "Blogging", "Cafes"],
  monthlyAllowance: 60000.0,
};

export const DEFAULT_BUDGETS_INR_PROFESSIONAL: Record<string, number> = {
  "Housing & Rent": 20000,
  "Food & Dining": 12000,
  "Textbooks & Tuition": 2000,
  "Entertainment & Subscriptions": 4000,
  "Transportation": 5000,
  "Health & Wellness": 3000,
  "Shopping & Personal": 8000,
  "Miscellaneous": 6000,
};

export const SEED_TRANSACTIONS_INR_PROFESSIONAL: Transaction[] = [
  { id: "t1", date: "2026-08-01", description: "Flat Rent payment", amount: 18000.0, category: "Housing & Rent", isAnomaly: false },
  { id: "t2", date: "2026-08-05", description: "Financial Modeling certification", amount: 1500.0, category: "Textbooks & Tuition", isAnomaly: false },
  { id: "t3", date: "2026-08-08", description: "Family Dinner Restaurant", amount: 2400.0, category: "Food & Dining", isAnomaly: false },
  { id: "t4", date: "2026-08-10", description: "Hotstar & Netflix bundle", amount: 499.0, category: "Entertainment & Subscriptions", isAnomaly: false },
  { id: "t5", date: "2026-08-12", description: "DMart Monthly Groceries", amount: 4800.0, category: "Food & Dining", isAnomaly: false },
  { id: "t6", date: "2026-08-15", description: "Metro & Cab expenses", amount: 1200.0, category: "Transportation", isAnomaly: false },
  { id: "t7", date: "2026-08-18", description: "Cult.fit Annual Gym pass EMI", amount: 1600.0, category: "Health & Wellness", isAnomaly: false },
  { id: "t8", date: "2026-08-20", description: "Lifestyle Store Clothing", amount: 3200.0, category: "Shopping & Personal", isAnomaly: false },
];

export const DEFAULT_GOALS_USD_STUDENT: SavingsGoal[] = [
  { id: "g1", name: "Emergency Textbook & Tech Reserve", target: 500, current: 280 },
  { id: "g2", name: "Campus Graduation Trip Pool", target: 1200, current: 450 },
  { id: "g3", name: "MacBook Pro Replacement Fund", target: 1800, current: 920 },
];

export const DEFAULT_GOALS_INR_STUDENT: SavingsGoal[] = [
  { id: "g1", name: "Emergency Laptop & Tech Reserve", target: 25000, current: 14000 },
  { id: "g2", name: "College Goa Trip Pool", target: 12000, current: 4500 },
  { id: "g3", name: "Semester Certification & Books", target: 8000, current: 6200 },
];

export const DEFAULT_GOALS_USD_PROFESSIONAL: SavingsGoal[] = [
  { id: "g1", name: "6-Month Living Emergency Fund", target: 15000, current: 9500 },
  { id: "g2", name: "Annual International Vacation", target: 4000, current: 2200 },
];

export const DEFAULT_GOALS_INR_PROFESSIONAL: SavingsGoal[] = [
  { id: "g1", name: "Emergency Living Reserve", target: 200000, current: 140000 },
  { id: "g2", name: "Mutual Fund SIP Target", target: 100000, current: 65000 },
];

export const DEFAULT_LOANS_USD_STUDENT: StudentLoan[] = [
  { id: "l1", name: "Direct Subsidized Federal Loan", principal: 5500, interestRate: 4.99, termMonths: 120, extraPayment: 25, type: "Subsidized" },
  { id: "l2", name: "Direct Unsubsidized Stafford Loan", principal: 7000, interestRate: 6.54, termMonths: 120, extraPayment: 50, type: "Unsubsidized" },
  { id: "l3", name: "University Campus Emergency Advance", principal: 1200, interestRate: 3.25, termMonths: 24, extraPayment: 0, type: "Personal" },
];

export const DEFAULT_LOANS_INR_STUDENT: StudentLoan[] = [
  { id: "l1", name: "SBI Student Scholar Loan (CSIS Subsidized)", principal: 400000, interestRate: 8.15, termMonths: 84, extraPayment: 1500, type: "Subsidized" },
  { id: "l2", name: "Canara Bank Higher Education Loan", principal: 250000, interestRate: 9.25, termMonths: 60, extraPayment: 1000, type: "Unsubsidized" },
  { id: "l3", name: "Laptop Equipment 0% No-Cost EMI", principal: 45000, interestRate: 0.0, termMonths: 9, extraPayment: 0, type: "Personal" },
];

export const DEFAULT_LOANS_USD_PROFESSIONAL: StudentLoan[] = [
  { id: "l1", name: "Refinanced Graduate Student Loan", principal: 24000, interestRate: 5.25, termMonths: 120, extraPayment: 100, type: "Subsidized" },
];

export const DEFAULT_LOANS_INR_PROFESSIONAL: StudentLoan[] = [
  { id: "l1", name: "HDFC Education Loan", principal: 800000, interestRate: 8.75, termMonths: 84, extraPayment: 3000, type: "Subsidized" },
];

// ─── Guest Habits Demo Data ───────────────────────────────────────────────────
// Generates realistic recent transactions (today-relative) so the Habits page
// heatmap and spending streak show live data for guest users.
const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

export const generateGuestTransactions = (): Transaction[] => [
  // Today — slight overspend to trigger the alert
  { id: "g_t1",  date: getPastDate(0),  description: "Zomato dinner order",          amount: 680,  category: "food",          isAnomaly: false },
  { id: "g_t2",  date: getPastDate(0),  description: "Auto-rickshaw to college",     amount: 80,   category: "travel",        isAnomaly: false },
  // Yesterday — within budget
  { id: "g_t3",  date: getPastDate(1),  description: "Mess lunch coupon",            amount: 120,  category: "food",          isAnomaly: false },
  { id: "g_t4",  date: getPastDate(1),  description: "Metro token to library",       amount: 40,   category: "travel",        isAnomaly: false },
  // 2 days ago — within budget
  { id: "g_t5",  date: getPastDate(2),  description: "Campus canteen breakfast",     amount: 55,   category: "food",          isAnomaly: false },
  { id: "g_t6",  date: getPastDate(2),  description: "YouTube Premium monthly",      amount: 79,   category: "entertainment",  isAnomaly: false },
  // 3 days ago — within budget
  { id: "g_t7",  date: getPastDate(3),  description: "Kirana store snacks",          amount: 210,  category: "food",          isAnomaly: false },
  { id: "g_t8",  date: getPastDate(3),  description: "Shared Ola to station",        amount: 95,   category: "travel",        isAnomaly: false },
  // 4 days ago — slightly over budget (amber day)
  { id: "g_t9",  date: getPastDate(4),  description: "Dominos pizza party",          amount: 820,  category: "food",          isAnomaly: true,  anomalyExplanation: "₹820 on food is 2.3x your daily average. Bob suggests sticking to mess coupons!" },
  { id: "g_t10", date: getPastDate(4),  description: "MovieMax cinema ticket",       amount: 250,  category: "entertainment",  isAnomaly: false },
  // 5 days ago — within budget
  { id: "g_t11", date: getPastDate(5),  description: "Mess monthly coupon top-up",  amount: 300,  category: "food",          isAnomaly: false },
  // 6 days ago — within budget
  { id: "g_t12", date: getPastDate(6),  description: "Chai and samosa stall",        amount: 45,   category: "food",          isAnomaly: false },
  { id: "g_t13", date: getPastDate(6),  description: "City bus pass weekly",         amount: 70,   category: "travel",        isAnomaly: false },
  // 7 days ago — over budget (red day)
  { id: "g_t14", date: getPastDate(7),  description: "Online shopping spree",        amount: 1200, category: "other",         isAnomaly: true,  anomalyExplanation: "₹1,200 miscellaneous spend detected — 3x your usual daily limit. Consider the 24-hour rule before impulsive buys!" },
  // 8 days ago — within budget
  { id: "g_t15", date: getPastDate(8),  description: "Pharmacy medicines",           amount: 180,  category: "other",         isAnomaly: false },
  { id: "g_t16", date: getPastDate(8),  description: "Momos stall evening snack",    amount: 60,   category: "food",          isAnomaly: false },
  // 9 days ago — within budget
  { id: "g_t17", date: getPastDate(9),  description: "Engineering notebook set",     amount: 220,  category: "books",         isAnomaly: false },
  // 10 days ago — within budget
  { id: "g_t18", date: getPastDate(10), description: "Morning chai + toast",         amount: 35,   category: "food",          isAnomaly: false },
  { id: "g_t19", date: getPastDate(10), description: "Auto fare shared commute",     amount: 50,   category: "travel",        isAnomaly: false },
  // 11 days ago — within budget
  { id: "g_t20", date: getPastDate(11), description: "Supermarket weekly groceries", amount: 480,  category: "food",          isAnomaly: false },
  // Older transactions for context
  { id: "g_t21", date: getPastDate(15), description: "PG hostel rent (half month)",  amount: 3500, category: "rent",          isAnomaly: false },
  { id: "g_t22", date: getPastDate(18), description: "Spotify student subscription", amount: 59,   category: "entertainment",  isAnomaly: false },
  { id: "g_t23", date: getPastDate(22), description: "College lab fees",             amount: 500,  category: "books",         isAnomaly: false },
];

// Pre-seeded gamification state for guest — stored directly in localStorage
// by loginAsGuest so Habits page shows a realistic demo immediately.
export const GUEST_GAMIFICATION_SEED = {
  xp: 240,
  level: 1,
  streak: 5,   // will be recomputed from transactions, but pre-seed for safety
  badges: [
    { id: "b1", name: "Budget Rookie", description: "Log your first expense transaction.", iconName: "Coins", unlockedAt: getPastDate(10) },
    { id: "b2", name: "Streak Starter", description: "Maintain a 3-day financial logging streak.", iconName: "Flame", unlockedAt: getPastDate(5) },
  ],
  loggingHistory: [
    getPastDate(11), getPastDate(10), getPastDate(9), getPastDate(8),
    getPastDate(7),  getPastDate(6),  getPastDate(5), getPastDate(4),
    getPastDate(3),  getPastDate(2),  getPastDate(1), getPastDate(0),
  ],
};
