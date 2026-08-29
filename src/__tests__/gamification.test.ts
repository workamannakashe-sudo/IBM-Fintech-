// gamification.test.ts - Unit tests for XP, Levels, and Streak Calculations
import { describe, it, expect } from "vitest";

describe("Gamification & Habit Algorithms", () => {
  const getLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  const getNextLevelXP = (xp: number) => {
    const currentLevel = getLevel(xp);
    return currentLevel * 100;
  };

  const computeNewStreak = (lastLogDateStr: string | null, todayDateStr: string, currentStreak: number): number => {
    if (!lastLogDateStr) return 1;
    if (lastLogDateStr === todayDateStr) return currentStreak; // Already logged today

    const lastDate = new Date(lastLogDateStr);
    const today = new Date(todayDateStr);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return currentStreak + 1;
    } else {
      return 1; // Streak reset
    }
  };

  it("calculates player level progression correctly based on XP", () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(99)).toBe(1);
    expect(getLevel(100)).toBe(2);
    expect(getLevel(250)).toBe(3);
    expect(getLevel(950)).toBe(10);
  });

  it("calculates remaining XP needed for next level milestone", () => {
    expect(getNextLevelXP(50)).toBe(100);
    expect(getNextLevelXP(150)).toBe(200);
  });

  it("increments daily streak when user logs consecutive days", () => {
    const streak = computeNewStreak("2026-03-30", "2026-03-31", 5);
    expect(streak).toBe(6);
  });

  it("maintains current streak if already logged today", () => {
    const streak = computeNewStreak("2026-03-31", "2026-03-31", 6);
    expect(streak).toBe(6);
  });

  it("resets streak to 1 if user skips more than 1 day", () => {
    const streak = computeNewStreak("2026-03-25", "2026-03-31", 6);
    expect(streak).toBe(1);
  });
});
