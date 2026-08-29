// Sidebar.test.tsx - Component smoke tests for Left Navigation Sidebar
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Sidebar } from "../../components/Sidebar";
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

describe("Sidebar Navigation Component", () => {
  it("renders brand logo, nav buttons, and Add Expense CTA", () => {
    const setActiveTab = vi.fn();
    const onOpenQuickLog = vi.fn();

    render(
      <Wrapper>
        <Sidebar
          activeTab="dashboard"
          setActiveTab={setActiveTab}
          onOpenQuickLog={onOpenQuickLog}
        />
      </Wrapper>
    );

    // Brand title present
    expect(screen.getByText("Budget")).toBeDefined();
    expect(screen.getByText("Mitra")).toBeDefined();

    // Nav items present
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Split Bill")).toBeDefined();
    expect(screen.getByText("Afford-Check")).toBeDefined();
    expect(screen.getByText("Schemes")).toBeDefined();

    // Add Expense CTA button
    const addExpenseBtn = screen.getByText("Add Expense");
    expect(addExpenseBtn).toBeDefined();

    fireEvent.click(addExpenseBtn);
    expect(onOpenQuickLog).toHaveBeenCalled();
  });
});
