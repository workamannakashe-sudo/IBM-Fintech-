// Dashboard.test.tsx — Page-level smoke tests for Dashboard
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Dashboard } from "../../pages/Dashboard";
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

describe("Dashboard Page", () => {
  const noop = vi.fn();

  it("renders the Payments breakdown chart section", () => {
    render(
      <Wrapper>
        <Dashboard setActiveTab={noop} onOpenQuickLog={noop} />
      </Wrapper>
    );
    // "Payments breakdown" heading is always present in the dashboard
    const matches = screen.queryAllByText(/payments breakdown/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders the sub-navigation tabs", () => {
    render(
      <Wrapper>
        <Dashboard setActiveTab={noop} onOpenQuickLog={noop} />
      </Wrapper>
    );
    // Overview tab is the default — may appear in multiple nav elements
    const overviewElements = screen.queryAllByText(/overview/i);
    expect(overviewElements.length).toBeGreaterThan(0);
  });

  it("renders a financial metric (currency symbol present)", () => {
    render(
      <Wrapper>
        <Dashboard setActiveTab={noop} onOpenQuickLog={noop} />
      </Wrapper>
    );
    const rupeeOrDollar = document.body.textContent?.match(/[₹$]/) != null;
    expect(rupeeOrDollar).toBe(true);
  });

  it("renders a Download or Report action", () => {
    render(
      <Wrapper>
        <Dashboard setActiveTab={noop} onOpenQuickLog={noop} />
      </Wrapper>
    );
    const reportElements = screen.queryAllByText(/report/i);
    expect(reportElements.length).toBeGreaterThan(0);
  });
});
