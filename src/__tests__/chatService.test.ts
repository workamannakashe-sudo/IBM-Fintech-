// chatService.test.ts — Unit tests for FinBuddy AI Chat Service
import { describe, it, expect } from "vitest";
import {
  buildFinBuddySystemPrompt,
  sendChatMessage,
  type FinancialContextPayload,
} from "../services/chatService";

describe("FinBuddy AI Chat Service (chatService.ts)", () => {
  const mockFinancialContext: FinancialContextPayload = {
    monthlyAllowance: 15000,
    remainingBudget: 9400,
    totalSpentThisMonth: 5600,
    dailyBurnRate: 350,
    topSpendingCategory: "Food & Dining",
    currency: "INR",
    preferredLanguage: "en",
    activeSavingsGoals: [{ name: "Emergency Fund", target: 5000, current: 2500 }],
    recentTransactions: [
      { date: "2026-08-28", description: "Campus Canteen Lunch", amount: 120, category: "Food & Dining" },
    ],
    profile: {
      name: "Rahul Sharma",
      course: "B.Tech",
      year: 2,
      state: "Maharashtra",
      income_bracket: "1-3L",
      category: "OBC",
    },
    loansSummary: {
      totalDebt: 50000,
      monthlyEmi: 1500,
    },
  };

  it("builds a system prompt injected with real-time student financial numbers", () => {
    const prompt = buildFinBuddySystemPrompt(mockFinancialContext);
    expect(prompt).toContain("Rahul Sharma");
    expect(prompt).toContain("₹15,000");
    expect(prompt).toContain("₹9,400");
    expect(prompt).toContain("Emergency Fund");
    expect(prompt).toContain("Food & Dining");
  });

  it("evaluates affordability queries using live context in heuristic fallback", async () => {
    const response = await sendChatMessage({
      message: "Can I afford to buy a ₹1,200 jacket?",
      chatHistory: [],
      financialContext: mockFinancialContext,
    });

    expect(response).toBeDefined();
    expect(response).toMatch(/Verdict/i);
    expect(response).toContain("₹1,200");
  });

  it("rejects purchases exceeding remaining budget", async () => {
    const response = await sendChatMessage({
      message: "Can I afford a ₹15,000 new smartphone right now?",
      chatHistory: [],
      financialContext: mockFinancialContext,
    });

    expect(response).toContain("NO");
    expect(response).toContain("exceeds your remaining balance");
  });

  it("provides live budget summary with burn rate and safe daily buffer", async () => {
    const response = await sendChatMessage({
      message: "How is my budget and spending burn rate looking?",
      chatHistory: [],
      financialContext: mockFinancialContext,
    });

    expect(response).toContain("Remaining Balance");
    expect(response).toContain("₹9,400");
  });

  it("suggests scholarships tailored to student profile and state", async () => {
    const response = await sendChatMessage({
      message: "Which scholarships or schemes should I apply for?",
      chatHistory: [],
      financialContext: mockFinancialContext,
    });

    expect(response).toMatch(/NSP|AICTE|Scholarship/i);
  });

  it("explains student loans with compound interest and prepayment guidance", async () => {
    const response = await sendChatMessage({
      message: "Explain how my loan EMI works and how to pay it off faster",
      chatHistory: [],
      financialContext: mockFinancialContext,
    });

    expect(response).toContain("EMI");
    expect(response).toMatch(/amortiz|principal|interest/i);
  });
});
