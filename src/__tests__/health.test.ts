// health.test.ts - Unit tests for Financial Health Score & 4-Pillar breakdown algorithm
import { describe, it, expect } from "vitest";
import { calculateHealthScore, getGrade } from "../utils/health";

describe("Financial Health Score Algorithm", () => {
  describe("getGrade", () => {
    it("returns correct letter grade thresholds", () => {
      expect(getGrade(95)).toBe("A+");
      expect(getGrade(93)).toBe("A+");
      expect(getGrade(88)).toBe("A");
      expect(getGrade(85)).toBe("A");
      expect(getGrade(78)).toBe("B");
      expect(getGrade(75)).toBe("B");
      expect(getGrade(68)).toBe("C");
      expect(getGrade(65)).toBe("C");
      expect(getGrade(50)).toBe("D");
    });
  });

  describe("calculateHealthScore", () => {
    it("evaluates a disciplined student with high savings and consistent logging", () => {
      const result = calculateHealthScore({
        monthlyIncome: 20000,
        totalExpenses: 8000,
        totalBudget: 15000,
        savingsGoalTarget: 5000,
        actualSavings: 5000,
        anomalyCount: 0,
        categoriesOverBudgetCount: 0,
        activeLoggingDays: 20,
        elapsedDaysInMonth: 20,
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(["A+", "A"]).toContain(result.grade);
      expect(result.savingsScore).toBe(100);
      expect(result.riskScore).toBe(100);
      expect(result.consistencyScore).toBe(100);
    });

    it("penalizes anomalies and over-budget spending proportionally", () => {
      const result = calculateHealthScore({
        monthlyIncome: 10000,
        totalExpenses: 14000, // Over budget!
        totalBudget: 10000,
        savingsGoalTarget: 2000,
        actualSavings: 0,
        anomalyCount: 2, // 2 anomalies (-30 pts risk)
        categoriesOverBudgetCount: 2, // 2 categories burst (-20 pts risk)
        activeLoggingDays: 5,
        elapsedDaysInMonth: 25,
      });

      expect(result.score).toBeLessThan(60);
      expect(result.grade).toBe("D");
      expect(result.riskScore).toBeLessThanOrEqual(50);
      expect(result.budgetScore).toBeLessThan(100);
    });

    it("safely handles 0 monthly allowance and 0 budget without NaN or crash", () => {
      const result = calculateHealthScore({
        monthlyIncome: 0,
        totalExpenses: 0,
        totalBudget: 0,
        savingsGoalTarget: 0,
        actualSavings: 0,
        anomalyCount: 0,
        categoriesOverBudgetCount: 0,
        activeLoggingDays: 0,
        elapsedDaysInMonth: 1,
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(isNaN(result.score)).toBe(false);
    });
  });
});
