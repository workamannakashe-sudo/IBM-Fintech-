// FinWise Financial Command Center & Dashboard Tab (Dashboard.tsx)
import React, { useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { generateMonthlyPDFReport } from "../services/pdfGenerator";
import { 
  Sparkles, TrendingDown, ArrowUpRight, 
  Flame, Download, ShieldQuestion, CalendarClock,
  Cloud, CloudOff, RefreshCw 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickLog: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onOpenQuickLog }) => {
  const {
    profile,
    transactions,
    goals,
    budgets,
    currency,
    syncStatus,
    triggerSync,
    healthScore,
    healthGrade,
    healthBreakdown,
    totalSpentThisMonth,
  } = useFinancial();

  const { streak } = useGamification();

  // Dynamic currency formatting helper
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const liquidBalance = profile.monthlyAllowance - totalSpentThisMonth;
  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0);

  // Daily AI Insights - local heuristics context
  const dailyTip = useMemo(() => {
    const activeGoal = goals[0];
    const topExpenses = transactions.filter(t => t.category === "Food & Dining");
    const totalFood = topExpenses.reduce((s, t) => s + t.amount, 0);

    if (totalSpentThisMonth > totalBudget) {
      return `Hey ${profile.name}! You've currently run over your total budget envelope by ${formatAmt(totalSpentThisMonth - totalBudget)}. I highly advise parking discretionary spending on shopping/subscriptions for the next few days to cushion your balance!`;
    }
    if (totalFood > (budgets["Food & Dining"] * 0.75)) {
      return `You have spent 75%+ of your 'Food & Dining' envelope. Consider switching to the campus dining hall or dorm cooking to hit your saving goals!`;
    }
    if (activeGoal && activeGoal.current < activeGoal.target) {
      return `Awesome job checking in! Putting just ${formatAmt(currency === "INR" ? 500 : 15)} extra this week into your "${activeGoal.name}" will accelerate your target milestone by 12 days. Let's make it happen!`;
    }
    return `Looking good, ${profile.name}! Your logging consistency score is at ${healthBreakdown.consistencyScore}%. Keep checking in daily to maintain your XP streak and unlock the Streak Starter badge!`;
  }, [profile, transactions, goals, budgets, totalSpentThisMonth, totalBudget, healthBreakdown, currency]);

  // Area Chart Data
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbr = monthNamesShort[currentMonth];

    const dayMap: Record<number, number> = {};
    for (let i = 1; i <= currentDay; i++) {
      dayMap[i] = 0;
    }
    
    const monthStr = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dateRegex = new RegExp(`^${currentYear}-${monthStr}-(\\d{2})`);

    transactions.forEach(t => {
      const match = t.date.match(dateRegex);
      if (match) {
        const day = parseInt(match[1]);
        if (day <= currentDay) {
          dayMap[day] = (dayMap[day] || 0) + t.amount;
        }
      }
    });

    let runningTotal = 0;
    return Object.entries(dayMap).map(([day, val]) => {
      runningTotal += val;
      return {
        name: `${monthAbbr} ${day}`,
        Spent: parseFloat(runningTotal.toFixed(2)),
      };
    });
  }, [transactions]);

  const handleDownloadPDF = () => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const reportData = {
      studentName: profile.name,
      studentMajor: profile.major,
      monthYear: "August 2026",
      healthScore,
      healthGrade,
      monthlyIncome: profile.monthlyAllowance,
      totalSpent: totalSpentThisMonth,
      totalBudget,
      remainingBudget: Math.max(0, totalBudget - totalSpentThisMonth),
      savingsGoalProgress: goals.map(g => ({ name: g.name, target: g.target, current: g.current })),
      categoryBreakdown: categoryTotals,
      transactions: transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    };

    generateMonthlyPDFReport(reportData);
  };

  // Sync status bar rendering
  const renderSyncStatusBar = () => {
    switch (syncStatus) {
      case "synced":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-bold text-emerald-800 shadow-sm animate-in fade-in duration-200">
            <Cloud className="h-3.5 w-3.5 text-emerald-600" />
            <span>Synced to Google Sheets</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-bold text-amber-800 shadow-sm">
            <RefreshCw className="h-3 w-3 text-amber-600 animate-spin" />
            <span>Syncing with Cloud...</span>
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[10px] font-bold text-rose-800 shadow-sm">
            <CloudOff className="h-3.5 w-3.5 text-rose-600" />
            <span>Offline (cached locally)</span>
            <button
              onClick={triggerSync}
              className="rounded bg-rose-100 hover:bg-rose-200 text-rose-800 px-1.5 py-0.5 border border-rose-200 cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        );
      case "unconfigured":
      default:
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[10px] font-medium text-slate-500 shadow-sm">
            <CloudOff className="h-3.5 w-3.5 text-slate-400" />
            <span>Cloud sync not configured (saving offline to local storage)</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Welcome Title Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            Financial Command Center
          </h1>
          <p className="text-sm text-slate-500">
            Track student spending, manage monthly budget envelopes, and build healthy financial habits.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all select-none shadow-xs"
          >
            <Download className="h-4 w-4 text-orange-500" />
            Download PDF Report
          </button>
          <button
            onClick={onOpenQuickLog}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 px-4 py-2.5 text-xs font-bold shadow-md shadow-orange-500/25 transition-all select-none"
          >
            <ArrowUpRight className="h-4 w-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Sync Status Alert bar */}
      <div className="flex justify-start">
        {renderSyncStatusBar()}
      </div>

      {/* Health Score Overview Block */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Ring Chart Score Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 flex flex-col items-center text-center shadow-sm">
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 self-start">
            Financial Health Grade
          </h3>
          
          <div className="relative flex items-center justify-center h-36 w-36 mb-4">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#E2E8F0"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#4F46E5"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * healthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-display text-4xl font-extrabold text-slate-900 leading-none">
                {healthGrade}
              </span>
              <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                Score: {healthScore}/100
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-[85%] leading-normal">
            Your score combines savings targets, logging consistency, and budget boundaries.
          </p>
        </div>

        {/* Pillars breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
              Financial Health Pillars
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Savings Rate Score</span>
                  <span className="font-bold">{healthBreakdown.savingsScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${healthBreakdown.savingsScore}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Budget Adherence Score</span>
                  <span className="font-bold">{healthBreakdown.budgetScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-teal" style={{ width: `${healthBreakdown.budgetScore}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Anomaly & Risk Score</span>
                  <span className="font-bold">{healthBreakdown.riskScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${healthBreakdown.riskScore}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Logging Consistency Score</span>
                  <span className="font-bold">{healthBreakdown.consistencyScore}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${healthBreakdown.consistencyScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Daily AI Insight
              </p>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {dailyTip}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Available Cash Cushion
          </p>
          <p className={`text-2xl font-bold font-display mt-1 ${liquidBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
            {formatAmt(liquidBalance)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-2 font-medium">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Out of {formatAmt(profile.monthlyAllowance)} allowance</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Spent This Month
          </p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">
            {formatAmt(totalSpentThisMonth)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-orange-500 mt-2 font-medium">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Target budget: {formatAmt(totalBudget)} limit</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Log Streak
          </p>
          <p className="text-2xl font-bold font-display text-amber-600 mt-1 flex items-center gap-1.5">
            <Flame className="h-6 w-6 text-amber-500 animate-bounce" fill="#F59E0B" />
            <span>{streak} Days</span>
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2 font-medium">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Keep checking in daily for XP</span>
          </div>
        </div>
      </div>

      {/* Area charts section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center justify-between">
          <span>Monthly Spending Trajectory</span>
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">
            {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" fontSize={10} stroke="#64748B" />
              <YAxis fontSize={10} stroke="#64748B" />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px", borderColor: "#FED7AA", boxShadow: "0 4px 12px rgba(249,115,22,0.1)" }} />
              <Area type="monotone" dataKey="Spent" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Command Actions Drawer shortcuts */}
      <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50/60 to-amber-50/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xs">
            <ShieldQuestion className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Simulate Discretionary Expenses</h4>
            <p className="text-xs text-slate-500">Check with IBM Bob whether your liquid cash supports buying an item before spending.</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("affordability")}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all select-none self-start md:self-auto cursor-pointer"
        >
          Can I Afford This?
        </button>
      </div>

    </div>
  );
};
