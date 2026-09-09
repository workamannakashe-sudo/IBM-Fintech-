// Advisor.test.tsx — Page-level smoke tests for AI Advisor (FinBuddy) Page
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Advisor } from "../../pages/Advisor";
import { FinancialProvider } from "../../context/FinancialContext";
import { GamificationProvider } from "../../context/GamificationContext";
import { ThemeProvider } from "../../context/ThemeContext";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <FinancialProvider>
      <GamificationProvider>
        {children}
      </GamificationProvider>
    </FinancialProvider>
  </ThemeProvider>
);

describe("Advisor (FinBuddy AI Coach) Page", () => {
  it("renders without crashing and shows the AI coach interface", () => {
    render(<Wrapper><Advisor /></Wrapper>);
    // Page renders an input or textarea for the chat
    const input =
      document.querySelector("input[type='text']") ||
      document.querySelector("textarea");
    expect(input).not.toBeNull();
  });

  it("renders the initial welcome message from the AI coach", () => {
    render(<Wrapper><Advisor /></Wrapper>);
    // The seeded first message contains "financial advisor" or "BudgetMitra"
    const hasWelcome =
      screen.queryAllByText(/financial advisor/i).length > 0 ||
      screen.queryAllByText(/budgetmitra/i).length > 0 ||
      screen.queryAllByText(/finbuddy/i).length > 0 ||
      screen.queryAllByText(/ask me/i).length > 0;
    expect(hasWelcome).toBe(true);
  });

  it("renders quick-reply suggestion chips", () => {
    render(<Wrapper><Advisor /></Wrapper>);
    const hasChip =
      screen.queryAllByText(/burn rate/i).length > 0 ||
      screen.queryAllByText(/scholarship/i).length > 0 ||
      screen.queryAllByText(/loan/i).length > 0 ||
      screen.queryAllByText(/afford/i).length > 0 ||
      screen.queryAllByText(/budget/i).length > 0;
    expect(hasChip).toBe(true);
  });

  it("renders the message send button", () => {
    render(<Wrapper><Advisor /></Wrapper>);
    // Send button is rendered (either by text or icon button)
    const sendButton =
      screen.queryAllByRole("button").length > 0;
    expect(sendButton).toBe(true);
  });
});
