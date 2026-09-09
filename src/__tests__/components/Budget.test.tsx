// Budget.test.tsx — Page-level smoke tests for Budget Planner
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Budget } from "../../pages/Budget";
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

describe("Budget Planner Page", () => {
  it("renders the page without crashing and shows budget-related text", () => {
    render(<Wrapper><Budget /></Wrapper>);
    // "Budget" text appears in at least one element
    const matches = screen.queryAllByText(/budget/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the burn rate section", () => {
    render(<Wrapper><Budget /></Wrapper>);
    const matches = screen.queryAllByText(/burn rate/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the Milestone Savings Targets section", () => {
    render(<Wrapper><Budget /></Wrapper>);
    // "Milestone Savings Targets" heading is always present in the Budget page
    const matches = screen.queryAllByText(/milestone savings/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders at least one budget category envelope", () => {
    render(<Wrapper><Budget /></Wrapper>);
    const hasCategory =
      screen.queryAllByText(/food/i).length > 0 ||
      screen.queryAllByText(/rent/i).length > 0 ||
      screen.queryAllByText(/travel/i).length > 0;
    expect(hasCategory).toBe(true);
  });
});
