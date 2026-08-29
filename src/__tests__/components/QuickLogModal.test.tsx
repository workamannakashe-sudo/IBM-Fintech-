// QuickLogModal.test.tsx - Component tests for Rapid Expense Logging Modal
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QuickLogModal } from "../../components/QuickLogModal";
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

describe("QuickLogModal Component", () => {
  it("renders Log Campus Expense modal dialog when open", () => {
    const onClose = vi.fn();

    render(
      <Wrapper>
        <QuickLogModal isOpen={true} onClose={onClose} />
      </Wrapper>
    );

    expect(screen.getByText("Log Campus Expense")).toBeDefined();
    expect(screen.getByPlaceholderText(/Campus Bookstore/i)).toBeDefined();
    expect(screen.getByText("Add Transaction")).toBeDefined();
  });
});
