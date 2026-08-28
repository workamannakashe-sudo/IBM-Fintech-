// FinWise Streak Tracking & Habit Calendar Heatmap (Habits.tsx)
import React, { useMemo } from "react";
import { useGamification, ALL_BADGES } from "../context/GamificationContext";
import { 
  Flame, Award, Trophy, Coins, Calendar, 
  Zap, Crown, CalendarClock, Compass 
} from "lucide-react";

export const Habits: React.FC = () => {
  const {
    xp,
    level,
    streak,
    badges,
    loggingHistory,
  } = useGamification();

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

  // Dynamic Heatmap Calendar Calculations based on ongoing month
  const { currentMonthName, calendarDays, offsetDaysCount } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Offset for the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days: Array<{ dateStr: string; dayNum: number; active: boolean }> = [];
    for (let i = 1; i <= totalDays; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const fullDate = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dateStr: fullDate,
        dayNum: i,
        active: loggingHistory.includes(fullDate),
      });
    }
    
    return {
      currentMonthName: `${monthNames[month]} ${year}`,
      calendarDays: days,
      offsetDaysCount: firstDayIndex
    };
  }, [loggingHistory]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Habits & Streaks</h1>
        <p className="text-sm text-slate-500">
          Earn Experience Points (XP) for logging transactions and complete challenges to unlock badges.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Streak Counter Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 mb-3">
            <Flame className="h-10 w-10 text-orange-500 animate-pulse" fill="#F97316" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900">{streak} Day Streak</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[80%] mx-auto">
            You've logged expenses or checked in consecutively. Log tomorrow to keep your streak!
          </p>
        </div>

        {/* Level & XP Meter Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial Status Level</span>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-extrabold text-slate-900">Level {level}:</h3>
              <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-3 py-0.5 text-xs font-bold text-teal-800">
                {levelTitle}
              </span>
            </div>
          </div>

          <div className="py-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-semibold">
              <span>Experience Points Progress</span>
              <span>{xp} XP Total ({xpInCurrentLevel} / 500 XP)</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-brand-teal transition-all duration-500 ease-out" 
                style={{ width: `${xpProgressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Lvl {level}</span>
              <span>Lvl {level + 1} ({500 - xpInCurrentLevel} XP remaining)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Habit Calendar Grid Map */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <CalendarClock className="h-5 w-5 text-brand-teal" />
          Logging Activity Calendar ({currentMonthName})
        </h3>

        {/* Github style contribution grid */}
        <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto sm:mx-0">
          {/* Calendar Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={idx} className="text-center text-[10px] font-bold text-slate-400 uppercase">
              {day[0]}
            </div>
          ))}

          {/* Blank offsets matching first weekday of the month */}
          {Array.from({ length: offsetDaysCount }).map((_, idx) => (
            <div key={`offset-${idx}`} className="aspect-square bg-transparent" />
          ))}

          {/* Days */}
          {calendarDays.map((d) => (
            <div
              key={d.dayNum}
              className={`heatmap-cell aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all relative group cursor-pointer ${
                d.active
                  ? "bg-brand-teal text-white shadow-[0_2px_6px_-2px_rgba(15,118,110,0.4)]"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
            >
              <span>{d.dayNum}</span>
              
              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block rounded bg-slate-800 text-white text-[9px] px-2 py-0.5 whitespace-nowrap z-20">
                {d.active ? "Checked in / Logged" : "No logs"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-4 leading-normal">
          Active days are highlighted in Teal. Streak tracks consecutive logging days.
        </p>
      </div>

      {/* Badges milestones grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Compass className="h-5 w-5 text-brand-teal" />
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
                    ? "bg-white border-amber-200 shadow-sm"
                    : "bg-slate-50/50 border-slate-200 opacity-60"
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isUnlocked ? "bg-amber-50 border border-amber-100" : "bg-slate-100 border border-slate-200"
                }`}>
                  {getBadgeIcon(b.iconName, isUnlocked)}
                </div>

                <div className="space-y-0.5 text-left">
                  <p className={`text-xs font-bold ${isUnlocked ? "text-slate-900" : "text-slate-500"}`}>
                    {b.name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {b.description}
                  </p>
                  {isUnlocked && unlocked.unlockedAt && (
                    <span className="text-[9px] text-emerald-600 font-bold block mt-1">
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
