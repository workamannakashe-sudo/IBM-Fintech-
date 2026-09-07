// BudgetMitra Streak Tracking & Habit Calendar Heatmap (Habits.tsx)
// Enhanced: Spending-based streak, today's spending alert, color-coded heatmap
import React, { useMemo } from "react";
import { useGamification, ALL_BADGES } from "../context/GamificationContext";
import { useFinancial } from "../context/FinancialContext";
import {
  Flame, Award, Trophy, Coins, Calendar,
  Zap, Crown, CalendarClock, Compass,
  AlertTriangle, TrendingDown, ShoppingBag,
  Coffee, Bus, Tv, CheckCircle2, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── Heuristic saving tips by top spending category ─────────────────────────
const SAVING_TIPS: Record<string, { icon: React.ReactNode; tip: string; save: string }[]> = {
  food: [
    { icon: <Coffee className="h-4 w-4 text-amber-500" />, tip: "Cook one meal at home instead of ordering", save: "Save ₹100–200" },
    { icon: <ShoppingBag className="h-4 w-4 text-amber-500" />, tip: "Buy groceries from kirana instead of online", save: "Save ₹50–100" },
    { icon: <TrendingDown className="h-4 w-4 text-amber-500" />, tip: "Skip one cafe visit this week", save: "Save ₹150–300" },
  ],
  travel: [
    { icon: <Bus className="h-4 w-4 text-blue-500" />, tip: "Use public transport or metro instead of cab", save: "Save ₹80–200" },
    { icon: <TrendingDown className="h-4 w-4 text-blue-500" />, tip: "Carpool with friends for weekend trips", save: "Save ₹100–400" },
    { icon: <ShoppingBag className="h-4 w-4 text-blue-500" />, tip: "Walk short distances under 1 km", save: "Save ₹40–80/trip" },
  ],
  entertainment: [
    { icon: <Tv className="h-4 w-4 text-purple-500" />, tip: "Pause one streaming subscription this month", save: "Save ₹150–500" },
    { icon: <Coffee className="h-4 w-4 text-purple-500" />, tip: "Watch movies on free platforms or library", save: "Save ₹200–400" },
    { icon: <TrendingDown className="h-4 w-4 text-purple-500" />, tip: "Limit outings to once a week", save: "Save ₹200–600" },
  ],
  other: [
    { icon: <TrendingDown className="h-4 w-4 text-slate-500" />, tip: "Review and cancel unused subscriptions", save: "Save ₹100–500" },
    { icon: <ShoppingBag className="h-4 w-4 text-slate-500" />, tip: "Apply the 24-hour rule before impulse buys", save: "Save ₹200–800" },
    { icon: <Coffee className="h-4 w-4 text-slate-500" />, tip: "Set a weekly cash limit and stick to it", save: "Save ₹300–1,000" },
  ],
};

export const Habits: React.FC = () => {
  const {
    xp,
    level,
    badges,
    loggingHistory,
  } = useGamification();

  const { transactions, profile, budgets } = useFinancial();

  // Badge Icon mapper
  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const color = isUnlocked ? "" : "text-slate-300";
    switch (iconName) {
      case "Coins": return <Coins className={`h-6 w-6 text-amber-500 ${color}`} />;
      case "Flame": return <Flame className={`h-6 w-6 text-orange-500 ${color}`} />;
      case "Calendar": return <Calendar className={`h-6 w-6 text-blue-500 ${color}`} />;
      case "Trophy": return <Trophy className={`h-6 w-6 text-emerald-500 ${color}`} />;
      case "Zap": return <Zap className={`h-6 w-6 text-purple-500 ${color}`} />;
      case "Crown": return <Crown className={`h-6 w-6 text-yellow-500 ${color}`} />;
      default: return <Award className={`h-6 w-6 text-slate-500 ${color}`} />;
    }
  };

  // XP progression details
  const xpInCurrentLevel = xp % 500;
  const xpProgressPercentage = (xpInCurrentLevel / 500) * 100;
  const levelTitle = useMemo(() => {
    if (level === 4) return "Finance Guru 👑";
    if (level === 3) return "Budget Master 🚀";
    if (level === 2) return "Finance Apprentice 💡";
    return "Budget Rookie 🌱";
  }, [level]);

  // ─── Daily budget ─────────────────────────────────────────────────────────
  const dailyBudget = useMemo(() => {
    const monthly = profile.monthlyAllowance > 0
      ? profile.monthlyAllowance
      : Object.values(budgets).reduce((a, b) => a + b, 0);
    return monthly / 30;
  }, [profile.monthlyAllowance, budgets]);

  // ─── Per-day spending map ─────────────────────────────────────────────────
  const dailySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      const day = t.date.split("T")[0];
      map[day] = (map[day] || 0) + t.amount;
    });
    return map;
  }, [transactions]);

  // ─── Spending-Based Streak ────────────────────────────────────────────────
  // A day "passes" if: either no spend OR spend <= dailyBudget
  // Streak counts consecutive passing days backwards from yesterday
  const spendingStreak = useMemo(() => {
    if (dailyBudget <= 0) return 0;
    let count = 0;
    const today = new Date();
    // Start from yesterday and go backwards
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const spent = dailySpendMap[dateStr] || 0;
      // If no transaction on that day OR spent within budget → streak continues
      if (spent === 0 || spent <= dailyBudget) {
        count++;
      } else {
        break; // streak broken
      }
    }
    return count;
  }, [dailyBudget, dailySpendMap]);

  // ─── Today's spending alert ───────────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySpend = dailySpendMap[todayStr] || 0;
  const budgetRatio = dailyBudget > 0 ? todaySpend / dailyBudget : 0;

  // Top spending category today
  const todayTopCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions
      .filter((t) => t.date.split("T")[0] === todayStr)
      .forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    if (Object.keys(catMap).length === 0) return "other";
    return Object.entries(catMap).sort(([, a], [, b]) => b - a)[0][0];
  }, [transactions, todayStr]);

  const savingTips = SAVING_TIPS[todayTopCategory] || SAVING_TIPS.other;

  const alertLevel: "over" | "caution" | null =
    budgetRatio > 1 ? "over" : budgetRatio >= 0.8 ? "caution" : null;

  // ─── Heatmap Calendar ────────────────────────────────────────────────────
  const { currentMonthName, calendarDays, offsetDaysCount } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      active: boolean;
      spendLevel: "none" | "under" | "caution" | "over";
      spent: number;
    }> = [];

    for (let i = 1; i <= totalDays; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const fullDate = `${year}-${monthStr}-${dayStr}`;
      const spent = dailySpendMap[fullDate] || 0;
      const logged = loggingHistory.includes(fullDate) || spent > 0;

      let spendLevel: "none" | "under" | "caution" | "over" = "none";
      if (logged && dailyBudget > 0) {
        const ratio = spent / dailyBudget;
        if (spent === 0) spendLevel = "under";
        else if (ratio <= 1) spendLevel = "under";
        else if (ratio <= 1.2) spendLevel = "caution";
        else spendLevel = "over";
      } else if (logged) {
        spendLevel = "under";
      }

      days.push({ dateStr: fullDate, dayNum: i, active: logged, spendLevel, spent });
    }

    return {
      currentMonthName: `${monthNames[month]} ${year}`,
      calendarDays: days,
      offsetDaysCount: firstDayIndex,
    };
  }, [loggingHistory, dailySpendMap, dailyBudget]);

  // Heatmap cell color by spend level
  const heatmapCellClass = (spendLevel: string, isToday: boolean) => {
    const ring = isToday ? " ring-2 ring-offset-1 ring-slate-400 dark:ring-zinc-400" : "";
    switch (spendLevel) {
      case "under":
        return `bg-teal-500 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/25${ring}`;
      case "caution":
        return `bg-amber-400 dark:bg-amber-500 text-white shadow-md shadow-amber-400/30${ring}`;
      case "over":
        return `bg-red-500 dark:bg-red-600 text-white shadow-md shadow-red-500/30${ring}`;
      default:
        return `bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-700${ring}`;
    }
  };

  const heatmapTooltip = (d: typeof calendarDays[0]) => {
    if (!d.active) return "No spending logged";
    const pct = dailyBudget > 0 ? Math.round((d.spent / dailyBudget) * 100) : 0;
    if (d.spendLevel === "under") return `₹${d.spent.toFixed(0)} spent — Within budget (${pct}%)`;
    if (d.spendLevel === "caution") return `₹${d.spent.toFixed(0)} spent — Slightly over budget (${pct}%)`;
    if (d.spendLevel === "over") return `₹${d.spent.toFixed(0)} spent — Over budget! (${pct}%)`;
    return "No spending logged";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-slate-900 dark:text-white">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Habits & Streaks</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Track your spending discipline streak, earn badges, and get personalized saving tips.
        </p>
      </div>

      {/* ─── TODAY'S SPENDING ALERT ─────────────────────────────────────── */}
      <AnimatePresence>
        {alertLevel && (
          <motion.div
            key="spending-alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border p-5 ${
              alertLevel === "over"
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
            }`}
          >
            {/* Alert header */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                alertLevel === "over"
                  ? "bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-700"
                  : "bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${alertLevel === "over" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${alertLevel === "over" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                  {alertLevel === "over"
                    ? `⚠️ Today's budget exceeded by ₹${(todaySpend - dailyBudget).toFixed(0)}!`
                    : `🔔 You've used ${Math.round(budgetRatio * 100)}% of today's budget`}
                </h3>
                <p className={`text-xs mt-0.5 ${alertLevel === "over" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                  Today's spend: <strong>₹{todaySpend.toFixed(0)}</strong> / Daily budget: <strong>₹{dailyBudget.toFixed(0)}</strong>
                </p>
              </div>
            </div>

            {/* Spending bar */}
            <div className="mb-4">
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    alertLevel === "over" ? "bg-red-500 dark:bg-red-400" : "bg-amber-400 dark:bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, budgetRatio * 100).toFixed(1)}%` }}
                />
              </div>
            </div>

            {/* Saving suggestions */}
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1 ${
                alertLevel === "over" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
              }`}>
                <Info className="h-3.5 w-3.5" />
                Saving suggestions for tomorrow
              </p>
              <div className="space-y-2">
                {savingTips.map((tip, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-white dark:border-zinc-700 px-3 py-2">
                    {tip.icon}
                    <p className="text-xs text-slate-700 dark:text-zinc-300 flex-1">{tip.tip}</p>
                    <span className={`text-[10px] font-bold shrink-0 ${
                      alertLevel === "over" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {tip.save}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* No alert — show a "You're on track" card if there is spending today */}
        {!alertLevel && todaySpend > 0 && (
          <motion.div
            key="on-track"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Great job! Today's spending is within budget 🎉
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{todaySpend.toFixed(0)} spent of ₹{dailyBudget.toFixed(0)} daily budget ({Math.round(budgetRatio * 100)}% used)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Spending Streak Counter Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121217] p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-100 dark:border-orange-800/40 mb-3">
            <Flame className="h-10 w-10 text-orange-500 animate-pulse" fill="#F97316" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{spendingStreak} Day Streak</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-[80%] mx-auto">
            Consecutive days within your daily budget. Keep spending smart to grow your streak!
          </p>
          {spendingStreak === 0 && (
            <span className="mt-2 inline-block text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-full px-2.5 py-0.5">
              Streak broken — stay under ₹{dailyBudget.toFixed(0)}/day
            </span>
          )}
        </div>

        {/* Level & XP Meter Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121217] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Financial Status Level</span>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Level {level}:</h3>
              <span className="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800/60 px-3 py-0.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                {levelTitle}
              </span>
            </div>
          </div>

          <div className="py-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-300 font-semibold">
              <span>Experience Points Progress</span>
              <span>{xp} XP Total ({xpInCurrentLevel} / 500 XP)</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-teal-600 dark:bg-cyan-500 transition-all duration-500 ease-out"
                style={{ width: `${xpProgressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              <span>Lvl {level}</span>
              <span>Lvl {level + 1} ({500 - xpInCurrentLevel} XP remaining)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Habit Calendar Grid Map */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121217] p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <CalendarClock className="h-5 w-5 text-teal-600 dark:text-cyan-400" />
          Spending Activity Calendar ({currentMonthName})
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { color: "bg-teal-500 dark:bg-cyan-500", label: "Within budget" },
            { color: "bg-amber-400 dark:bg-amber-500", label: "Slightly over" },
            { color: "bg-red-500 dark:bg-red-600", label: "Over budget" },
            { color: "bg-slate-100 dark:bg-zinc-800", label: "No activity" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-sm ${item.color}`} />
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Github style contribution grid */}
        <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto sm:mx-0">
          {/* Calendar Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={idx} className="text-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              {day[0]}
            </div>
          ))}

          {/* Blank offsets */}
          {Array.from({ length: offsetDaysCount }).map((_, idx) => (
            <div key={`offset-${idx}`} className="aspect-square bg-transparent" />
          ))}

          {/* Days */}
          {calendarDays.map((d) => {
            const isToday = d.dateStr === todayStr;
            return (
              <div
                key={d.dayNum}
                className={`heatmap-cell aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative group cursor-pointer ${heatmapCellClass(d.spendLevel, isToday)}`}
              >
                <span>{d.dayNum}</span>

                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block rounded bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-700 text-white text-[9px] px-2 py-0.5 whitespace-nowrap z-20">
                  {heatmapTooltip(d)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-4 leading-normal">
          🟢 Teal = within budget · 🟡 Amber = slightly over · 🔴 Red = over budget · ⬜ Gray = no activity
        </p>
      </div>

      {/* Badges milestones grid */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121217] p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Compass className="h-5 w-5 text-teal-600 dark:text-cyan-400" />
          Available Milestones & Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ALL_BADGES.map((b) => {
            const unlocked = badges.find(x => x.id === b.id);
            const isUnlocked = !!unlocked;

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 flex gap-3 transition-all ${
                  isUnlocked
                    ? "bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-700/50 shadow-sm"
                    : "bg-slate-50/50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60"
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isUnlocked ? "bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60" : "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                }`}>
                  {getBadgeIcon(b.iconName, isUnlocked)}
                </div>

                <div className="space-y-0.5 text-left">
                  <p className={`text-xs font-bold ${isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-zinc-400"}`}>
                    {b.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-400 leading-normal">
                    {b.description}
                  </p>
                  {isUnlocked && unlocked.unlockedAt && (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      Unlocked: {unlocked.unlockedAt}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
