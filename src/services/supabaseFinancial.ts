// supabaseFinancial.ts - Supabase Remote Data Mapper & Service Layer for BudgetMitra
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import type { StudentProfile, Transaction, SavingsGoal, StudentLoan } from "../context/FinancialContext";

export interface SupabaseHydratedData {
  profile: StudentProfile;
  transactions: Transaction[];
  budgets: Record<string, number>;
  goals: SavingsGoal[];
  loans: StudentLoan[];
  profileId: string | null;
}

/**
 * Loads and maps all user financial data from Supabase tables
 */
export async function loadUserSupabaseData(userEmail?: string): Promise<SupabaseHydratedData | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !userEmail) return null;

    // Fetch Profile
    const profileQuery = user
      ? supabase.from("profiles").select("*").eq("id", user.id).single()
      : supabase.from("profiles").select("*").eq("email", userEmail).single();

    const { data: profileData, error: profileError } = await profileQuery;
    if (profileError || !profileData) return null;

    const profileId = profileData.id;

    // Fetch Transactions, Budgets, Goals, Loans in parallel
    const [txRes, budgetRes, goalRes, loanRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("profile_id", profileId).order("date", { ascending: false }),
      supabase.from("budgets").select("*").eq("profile_id", profileId),
      supabase.from("savings_goals").select("*").eq("profile_id", profileId),
      supabase.from("loans").select("*").eq("profile_id", profileId),
    ]);

    const mappedProfile: StudentProfile = {
      name: profileData.name || "Student",
      major: profileData.major || "B.Tech",
      gpa: profileData.gpa || 3.8,
      academicYear: profileData.academic_year || "3rd Year",
      incomeTier: profileData.income_tier || "Tier-2",
      firstGen: profileData.first_gen || false,
      interests: profileData.interests || [],
      monthlyAllowance: profileData.monthly_allowance || 15000,
      course: profileData.course || "B.Tech",
      year: profileData.year || 3,
      state: profileData.state || "Maharashtra",
      income_bracket: profileData.income_bracket || "1-3L",
      category: profileData.category || "Gen",
      preferred_language: profileData.preferred_language || "en",
    };

    const mappedTransactions: Transaction[] = (txRes.data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
      isAnomaly: Boolean(t.is_anomaly),
      anomalyExplanation: t.anomaly_explanation || undefined,
    }));

    const mappedBudgets: Record<string, number> = {};
    (budgetRes.data || []).forEach((b: any) => {
      mappedBudgets[b.category] = Number(b.monthly_limit);
    });

    const mappedGoals: SavingsGoal[] = (goalRes.data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
    }));

    const mappedLoans: StudentLoan[] = (loanRes.data || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      principal: Number(l.principal),
      interestRate: Number(l.interest_rate),
      termMonths: Number(l.term_months),
      extraPayment: Number(l.extra_payment || 0),
      type: l.type || "Subsidized",
    }));

    return {
      profile: mappedProfile,
      transactions: mappedTransactions,
      budgets: mappedBudgets,
      goals: mappedGoals,
      loans: mappedLoans,
      profileId,
    };
  } catch (err) {
    console.error("Error hydrating Supabase financial state:", err);
    return null;
  }
}
