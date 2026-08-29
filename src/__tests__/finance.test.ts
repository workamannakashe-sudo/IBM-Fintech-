// finance.test.ts - Unit tests for financial formulas & amortization engine
import { describe, it, expect } from "vitest";
import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateAmortization,
  simulateAcceleratedPayoff,
} from "../utils/finance";

describe("Financial Calculation Utilities", () => {
  describe("calculateSimpleInterest", () => {
    it("correctly calculates simple interest for standard values", () => {
      // Principal $10,000, 5% annual rate, 3 years -> Interest: $1,500, Total: $11,500
      const result = calculateSimpleInterest(10000, 5, 3);
      expect(result.totalInterest).toBeCloseTo(1500, 2);
      expect(result.totalPaid).toBeCloseTo(11500, 2);
      expect(result.monthlyPayment).toBeCloseTo(11500 / 36, 2);
    });

    it("handles zero interest rate correctly", () => {
      const result = calculateSimpleInterest(5000, 0, 2);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPaid).toBe(5000);
      expect(result.monthlyPayment).toBeCloseTo(5000 / 24, 2);
    });
  });

  describe("calculateCompoundInterest", () => {
    it("correctly calculates monthly compounding interest", () => {
      // P = 1000, r = 10%, t = 2 years, n = 12
      const result = calculateCompoundInterest(1000, 10, 2, 12);
      expect(result.totalPaid).toBeGreaterThan(1200);
      expect(result.totalInterest).toBeGreaterThan(200);
      expect(result.monthlyPayment).toBeCloseTo(result.totalPaid / 24, 2);
    });
  });

  describe("calculateAmortization", () => {
    it("generates a valid amortization schedule where balance reaches 0", () => {
      const principal = 10000;
      const rate = 6.5;
      const termMonths = 36;

      const schedule = calculateAmortization(principal, rate, termMonths);

      expect(schedule.amortization.length).toBeLessThanOrEqual(termMonths);
      expect(schedule.totalPaid).toBeGreaterThan(principal);
      expect(schedule.totalInterest).toBeGreaterThan(0);

      // Check that the last period brings remaining balance to 0
      const lastPeriod = schedule.amortization[schedule.amortization.length - 1];
      expect(lastPeriod.remainingBalance).toBeLessThanOrEqual(0.01);
    });

    it("supports 0% interest subsidized student loans", () => {
      const principal = 6000;
      const rate = 0;
      const termMonths = 12;

      const schedule = calculateAmortization(principal, rate, termMonths);
      expect(schedule.totalInterest).toBe(0);
      expect(schedule.totalPaid).toBe(6000);
      expect(schedule.monthlyPayment).toBeCloseTo(500, 2);
      expect(schedule.monthsToPay).toBe(12);
    });
  });

  describe("simulateAcceleratedPayoff", () => {
    it("shortens loan tenure and saves interest when extra payments are applied", () => {
      const principal = 20000;
      const rate = 7.5;
      const termMonths = 60;
      const extraPayment = 150;

      const comparison = simulateAcceleratedPayoff(principal, rate, termMonths, extraPayment);

      expect(comparison.monthsSaved).toBeGreaterThan(0);
      expect(comparison.interestSaved).toBeGreaterThan(0);
      expect(comparison.accelerated.monthsToPay).toBeLessThan(comparison.standard.monthsToPay);
      expect(comparison.accelerated.totalInterest).toBeLessThan(comparison.standard.totalInterest);
    });
  });
});
