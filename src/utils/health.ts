// FinWise Health Score Equation Utilities (health.ts)

export interface HealthBreakdown {
  score: number; // 0 - 100
  grade: string; // A+ to D
  savingsScore: number; // 0 - 100
  budgetScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  consistencyScore: number; // 0 - 100
}

/**
 * Calculates a letter grade based on a numeric score
 */
export function getGrade(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  return "D";
}

/**
 * Computes the financial health score breakdown based on four key pillars
 */
export function calculateHealthScore(params: {
  monthlyIncome: number;
  totalExpenses: number;
  totalBudget: number;
  savingsGoalTarget: number; // e.g. 200
  actualSavings: number;
  anomalyCount: number;
  categoriesOverBudgetCount: number;
  activeLoggingDays: number; // number of days active this month
  elapsedDaysInMonth: number; // e.g. 15 or 27
}): HealthBreakdown {
  const {
    monthlyIncome,
    totalExpenses,
    totalBudget,
    savingsGoalTarget,
    actualSavings,
    anomalyCount,
    categoriesOverBudgetCount,
    activeLoggingDays,
    elapsedDaysInMonth,
  } = params;

  // 1. Savings Rate Score (30% weight)
  // Evaluates how close the user is to their savings goal target
  let savingsScore = 100;
  if (savingsGoalTarget > 0) {
    savingsScore = Math.min(100, Math.max(0, (actualSavings / savingsGoalTarget) * 100));
  } else if (monthlyIncome > 0) {
    const rate = (monthlyIncome - totalExpenses) / monthlyIncome;
    savingsScore = Math.min(100, Math.max(0, (rate / 0.20) * 100)); // 20% target savings rate
  } else {
    // Student with no active income, check if expenses are lower than monthly allowance budget
    const budgetMargin = totalBudget - totalExpenses;
    savingsScore = budgetMargin > 0 ? 100 : Math.max(0, 100 + (budgetMargin / Math.max(1, totalBudget)) * 100);
  }

  // 2. Budget Adherence Score (30% weight)
  // Evaluates total spent against total budget envelopes
  let budgetScore = 100;
  if (totalBudget > 0) {
    if (totalExpenses > totalBudget) {
      const overSpendPercentage = ((totalExpenses - totalBudget) / totalBudget) * 100;
      budgetScore = Math.max(0, 100 - overSpendPercentage * 2.5); // Drops by 2.5 points for each 1% overspent
    } else {
      // Reward staying well under budget
      const underSpendPercent = ((totalBudget - totalExpenses) / totalBudget) * 100;
      budgetScore = 90 + (underSpendPercent / 10); // Scale from 90 to 100
    }
  }

  // 3. Anomaly & Risk Score (20% weight)
  // Evaluates frequency of category spikes and unexpected transactions
  let riskScore = 100;
  riskScore -= anomalyCount * 15; // Deduct 15 points per anomaly explanation
  riskScore -= categoriesOverBudgetCount * 10; // Deduct 10 points per category budget burst
  riskScore = Math.min(100, Math.max(0, riskScore));

  // 4. Logging Consistency Score (20% weight)
  // Evaluates check-ins and logs throughout the elapsed period of the month
  const targetDays = Math.max(1, elapsedDaysInMonth);
  // Log consistency = active days divided by elapsed days, scaled to 100
  let consistencyScore = Math.min(100, (activeLoggingDays / targetDays) * 100);
  // Guarantee a minimum of 20 points if they have at least logged 1 transaction to stay encouraging
  if (activeLoggingDays > 0 && consistencyScore < 20) {
    consistencyScore = 20;
  }

  // Final Weighted Average
  const weightedScore = Math.round(
    savingsScore * 0.30 +
    budgetScore * 0.30 +
    riskScore * 0.20 +
    consistencyScore * 0.20
  );

  return {
    score: weightedScore,
    grade: getGrade(weightedScore),
    savingsScore: Math.round(savingsScore),
    budgetScore: Math.round(budgetScore),
    riskScore: Math.round(riskScore),
    consistencyScore: Math.round(consistencyScore),
  };
}
