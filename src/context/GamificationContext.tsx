// FinWise Gamification & Streak Context Provider (GamificationContext.tsx)
import React, { createContext, useContext, useState, useEffect } from "react";
import confetti from "canvas-confetti";

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
}

interface GamificationContextType {
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  loggingHistory: string[]; // List of YYYY-MM-DD strings
  unlockedBadge: Badge | null;
  clearUnlockedBadge: () => void;
  gainXp: (amount: number, reason: string) => void;
  checkInToday: () => void;
  resetGamification: () => void;
}

const ALL_BADGES: Badge[] = [
  { id: "b1", name: "Budget Rookie", description: "Log your first expense transaction.", iconName: "Coins" },
  { id: "b2", name: "Streak Starter", description: "Maintain a 3-day financial logging streak.", iconName: "Flame" },
  { id: "b3", name: "7-Day Warrior", description: "Log details consistently for 7 days.", iconName: "Calendar" },
  { id: "b4", name: "First Goal Funded", description: "Successfully reach a Milestone Savings Goal.", iconName: "Trophy" },
  { id: "b5", name: "Debt Buster", description: "Simulate accelerated payoffs for student loans.", iconName: "Zap" },
  { id: "b6", name: "Finance Guru", description: "Reach Level 4 in FinWise financial literacy.", iconName: "Crown" },
];

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXp] = useState<number>(() => {
    const val = localStorage.getItem("fw_xp");
    return val ? parseInt(val) : 120; // Default seed XP
  });

  const [level, setLevel] = useState<number>(() => {
    const val = localStorage.getItem("fw_level");
    return val ? parseInt(val) : 1;
  });

  const [streak, setStreak] = useState<number>(() => {
    const val = localStorage.getItem("fw_streak");
    return val ? parseInt(val) : 4; // Seed 4-day streak
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const val = localStorage.getItem("fw_badges_list");
    // Seed 1 unlocked badge ("Budget Rookie")
    return val ? JSON.parse(val) : [
      { ...ALL_BADGES[0], unlockedAt: "2026-08-20" }
    ];
  });

  // Logged days for the GitHub heatmap calendar
  const [loggingHistory, setLoggingHistory] = useState<string[]>(() => {
    const val = localStorage.getItem("fw_log_history");
    return val ? JSON.parse(val) : [
      "2026-08-01", "2026-08-05", "2026-08-08", "2026-08-10", 
      "2026-08-12", "2026-08-15", "2026-08-18", "2026-08-20", 
      "2026-08-22", "2026-08-24"
    ];
  });

  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("fw_xp", String(xp));
    localStorage.setItem("fw_level", String(level));
    localStorage.setItem("fw_streak", String(streak));
    localStorage.setItem("fw_badges_list", JSON.stringify(badges));
    localStorage.setItem("fw_log_history", JSON.stringify(loggingHistory));
  }, [xp, level, streak, badges, loggingHistory]);

  // Level thresholds: Lvl 1 (0-300), Lvl 2 (300-800), Lvl 3 (800-1500), Lvl 4 (1500+)
  useEffect(() => {
    let newLvl = 1;
    if (xp >= 1500) newLvl = 4;
    else if (xp >= 800) newLvl = 3;
    else if (xp >= 300) newLvl = 2;

    if (newLvl !== level) {
      setLevel(newLvl);
      triggerConfetti();
      
      // If Level 4 is reached, unlock Finance Guru badge
      if (newLvl === 4) {
        unlockBadge("b6");
      }
    }
  }, [xp]);

  // Listen to XP gain requests dispatched from the FinancialContext
  useEffect(() => {
    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;

      if (data.type === "add_transaction") {
        let amt = 20; // base logging XP
        if (!data.isAnomaly) amt += 10; // Extra XP for clean non-impulsive spending
        gainXp(amt, "Logged Expense");
        
        // Add log date to heatmap
        const today = new Date().toISOString().split("T")[0];
        checkInToday(today);
      } else if (data.type === "bulk_upload") {
        gainXp(Math.min(150, data.count * 15), `Bulk CSV upload of ${data.count} items`);
      } else if (data.type === "create_goal") {
        gainXp(50, "Created savings milestone target");
      } else if (data.type === "fund_goal") {
        gainXp(200, `Fully funded Savings Goal: ${data.goalName}`);
        unlockBadge("b4");
      }
    };

    window.addEventListener("fw_xp_gain", handleXpEvent);
    return () => {
      window.removeEventListener("fw_xp_gain", handleXpEvent);
    };
  }, [badges, loggingHistory, streak]);

  // Confetti trigger
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const clearUnlockedBadge = () => {
    setUnlockedBadge(null);
  };

  const gainXp = (amount: number, reason: string) => {
    console.log(`Earned +${amount} XP: ${reason}`);
    setXp(prev => prev + amount);
  };

  const unlockBadge = (id: string) => {
    // Check if already unlocked
    if (badges.some(b => b.id === id)) return;
    
    const target = ALL_BADGES.find(b => b.id === id);
    if (target) {
      const today = new Date().toISOString().split("T")[0];
      const newBadge = { ...target, unlockedAt: today };
      setBadges(prev => [...prev, newBadge]);
      setUnlockedBadge(newBadge);
      triggerConfetti();
    }
  };

  const checkInToday = (customDate?: string) => {
    const today = customDate || new Date().toISOString().split("T")[0];
    if (loggingHistory.includes(today)) return;

    setLoggingHistory(prev => [...prev, today]);

    // Simple streak counter increment
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (loggingHistory.includes(yesterdayStr)) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Badge rewards for streaks
      if (newStreak === 3) unlockBadge("b2");
      if (newStreak === 7) unlockBadge("b3");
    } else {
      // Check if logged today already or streak reset
      const alreadyChecked = loggingHistory.some(d => {
        const diff = Math.abs(new Date(d).getTime() - new Date(today).getTime());
        return diff < 86400000;
      });
      if (!alreadyChecked) {
        setStreak(1);
      }
    }
  };

  const resetGamification = () => {
    setXp(120);
    setLevel(1);
    setStreak(4);
    setBadges([{ ...ALL_BADGES[0], unlockedAt: "2026-08-20" }]);
    setLoggingHistory([
      "2026-08-01", "2026-08-05", "2026-08-08", "2026-08-10", 
      "2026-08-12", "2026-08-15", "2026-08-18", "2026-08-20", 
      "2026-08-22", "2026-08-24"
    ]);
  };

  return (
    <GamificationContext.Provider
      value={{
        xp,
        level,
        streak,
        badges,
        loggingHistory,
        unlockedBadge,
        clearUnlockedBadge,
        gainXp,
        checkInToday,
        resetGamification,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};
export { ALL_BADGES };
export type { Badge as GamificationBadge };
