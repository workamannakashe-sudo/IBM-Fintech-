// Loans.test.tsx — Page-level smoke tests for Loans & EMI Simulator
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Loans } from "../../pages/Loans";
import { FinancialProvider } from "../../context/FinancialContext";
import { GamificationProvider } from "../../context/GamificationContext";
import { ThemeProvider } from "../../context/ThemeContext";

// recharts uses ResizeObserver — stub it in the test environment
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <FinancialProvider>
      <GamificationProvider>
        {children}
      </GamificationProvider>
    </FinancialProvider>
  </ThemeProvider>
);

describe("Loans & EMI Simulator Page", () => {
  it("renders without crashing and shows loan-related text", () => {
    render(<Wrapper><Loans /></Wrapper>);
    const matches = screen.queryAllByText(/loan/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the interest rate input label", () => {
    render(<Wrapper><Loans /></Wrapper>);
    const matches = screen.queryAllByText(/interest/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders payoff simulation result rows", () => {
    render(<Wrapper><Loans /></Wrapper>);
    const hasPayoffData =
      screen.queryAllByText(/standard/i).length > 0 ||
      screen.queryAllByText(/accelerated/i).length > 0 ||
      screen.queryAllByText(/monthly/i).length > 0 ||
      screen.queryAllByText(/payment/i).length > 0;
    expect(hasPayoffData).toBe(true);
  });

  it("renders the extra payment slider section", () => {
    render(<Wrapper><Loans /></Wrapper>);
    const matches = screen.queryAllByText(/extra/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
