// SplitBillModal.test.tsx - Component tests for Split the Bill tool
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SplitBillModal } from "../../components/SplitBillModal";
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

describe("SplitBillModal Component", () => {
  it("renders Split the Bill dialog when isOpen is true", () => {
    const onClose = vi.fn();

    render(
      <Wrapper>
        <SplitBillModal isOpen={true} onClose={onClose} />
      </Wrapper>
    );

    expect(screen.getByText("Split the Bill")).toBeDefined();
    expect(screen.getByText("Bill Balance")).toBeDefined();
    expect(screen.getByText("Your Friends (3 selected)")).toBeDefined();
    expect(screen.getByText("Jony L.")).toBeDefined();
    expect(screen.getByText("Amy J.")).toBeDefined();
  });

  it("does not render when isOpen is false", () => {
    const onClose = vi.fn();

    const { container } = render(
      <Wrapper>
        <SplitBillModal isOpen={false} onClose={onClose} />
      </Wrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});
