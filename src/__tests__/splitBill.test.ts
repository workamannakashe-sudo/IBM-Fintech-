// splitBill.test.ts - Unit tests for Group Expense & Split Calculations
import { describe, it, expect } from "vitest";

describe("Split the Bill Calculation Logic", () => {
  const calculateEqualSplit = (total: number, selectedFriendsCount: number) => {
    if (total <= 0 || isNaN(total)) return { userShare: 0, friendShare: 0, totalCount: 1 };
    const totalCount = selectedFriendsCount + 1; // user + selected friends
    const share = total / totalCount;
    return {
      userShare: Math.round(share * 100) / 100,
      friendShare: Math.round(share * 100) / 100,
      totalCount,
    };
  };

  it("splits a dinner bill equally among 4 people (user + 3 friends)", () => {
    const result = calculateEqualSplit(1200, 3);
    expect(result.totalCount).toBe(4);
    expect(result.userShare).toBe(300);
    expect(result.friendShare).toBe(300);
  });

  it("handles decimal amounts with precision", () => {
    const result = calculateEqualSplit(100, 2); // 3 people total: 33.33 each
    expect(result.totalCount).toBe(3);
    expect(result.userShare).toBe(33.33);
  });

  it("safely handles 0 bill amount", () => {
    const result = calculateEqualSplit(0, 4);
    expect(result.userShare).toBe(0);
    expect(result.friendShare).toBe(0);
  });
});
