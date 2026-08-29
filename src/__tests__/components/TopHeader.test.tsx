// TopHeader.test.tsx - Component smoke tests for Top Header
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TopHeader } from "../../components/TopHeader";
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

describe("TopHeader Component", () => {
  it("renders greetings and search input without crashing", () => {
    const setActiveTab = vi.fn();
    const onOpenMobileMenu = vi.fn();

    render(
      <Wrapper>
        <TopHeader
          setActiveTab={setActiveTab}
          onOpenMobileMenu={onOpenMobileMenu}
        />
      </Wrapper>
    );

    // Search bar is rendered
    expect(screen.getByPlaceholderText(/search transactions/i)).toBeDefined();
  });
});
