// AskFinBuddyWidget.test.tsx — Component test for AskFinBuddy floating AI chatbot
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AskFinBuddyWidget } from "../../components/AskFinBuddyWidget";
import { FinancialProvider } from "../../context/FinancialContext";
import { ThemeProvider } from "../../context/ThemeContext";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <FinancialProvider>{children}</FinancialProvider>
  </ThemeProvider>
);

describe("AskFinBuddyWidget Component", () => {
  it("renders floating action button initially", () => {
    render(
      <Wrapper>
        <AskFinBuddyWidget />
      </Wrapper>
    );

    const fabButton = screen.getByLabelText(/Open FinBuddy AI Chat/i);
    expect(fabButton).toBeDefined();
  });

  it("opens chat drawer on clicking FAB and displays header and quick reply chips", async () => {
    render(
      <Wrapper>
        <AskFinBuddyWidget />
      </Wrapper>
    );

    const fabButton = screen.getByLabelText(/Open FinBuddy AI Chat/i);
    await act(async () => {
      fireEvent.click(fabButton);
    });

    expect(screen.getByText("Ask FinBuddy")).toBeDefined();
    expect(screen.getByText("Live Financial Grounding Connected")).toBeDefined();
    expect(screen.getByText(/How's my budget/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Ask FinBuddy anything/i)).toBeDefined();
  });
});
