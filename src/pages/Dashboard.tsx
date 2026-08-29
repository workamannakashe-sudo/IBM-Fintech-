import React, { useMemo, useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { useGamification } from "../context/GamificationContext";
import { generateMonthlyPDFReport } from "../services/pdfGenerator";
import {
  Download,
  TrendingUp,
  ShieldQuestion,
  CalendarClock,
  Sparkles,
  Zap,
  Wifi,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickLog?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const {
    profile,
    transactions,
    goals,
    budgets,
    currency,
    healthScore,
    healthGrade,
    healthBreakdown,
    totalSpentThisMonth,
    addTransaction
  } = useFinancial();

  const { streak } = useGamification();

  // Currency Formatter
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Allowance & Balances
  const monthlyAllowance = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : (currency === "INR" ? 20000 : 2000);
  const liquidBalance = monthlyAllowance - totalSpentThisMonth;
  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0) || monthlyAllowance;

  // Upcoming bills state for interactive payment
  const [billsPaid, setBillsPaid] = useState(false);
  const [payingBills, setPayingBills] = useState(false);

  const upcomingBills = [
    {
      id: "b1",
      title: "Electricity Bill",
      due: "Due in 3 days",
      amount: currency === "INR" ? 1200 : 120,
      icon: Zap,
      color: "bg-rose-500 text-white dark:bg-rose-500/20 dark:text-rose-400",
    },
    {
      id: "b2",
      title: "Internet Provider",
      due: "Due in 7 days",
      amount: currency === "INR" ? 899 : 89,
      icon: Wifi,
      color: "bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-400",
    },
  ];

  const handlePayAllBills = async () => {
    if (billsPaid) return;
    setPayingBills(true);
    for (const bill of upcomingBills) {
      await addTransaction(`${bill.title} Payment`, bill.amount, undefined, "Housing & Rent");
    }
    setPayingBills(false);
    setBillsPaid(true);
  };

  // Spending Calculations for Multi-segment progress bar
  const committedSpent = Math.min(totalSpentThisMonth * 0.72, totalSpentThisMonth);
  const discretionarySpent = totalSpentThisMonth - committedSpent;
  const spentPercentage = Math.min(100, Math.round((totalSpentThisMonth / monthlyAllowance) * 100)) || 27.5;
  const committedPct = Math.min(100, Math.round((committedSpent / monthlyAllowance) * 100)) || 20;
  const discretionaryPct = Math.min(100, Math.round((discretionarySpent / monthlyAllowance) * 100)) || 7.5;

  // Daily AI Insights
  const dailyTip = useMemo(() => {
    const activeGoal = goals[0];
    const topExpenses = transactions.filter((t) => t.category === "Food & Dining");
    const totalFood = topExpenses.reduce((s, t) => s + t.amount, 0);

    if (totalSpentThisMonth > totalBudget) {
      return `Hey ${profile.name || "friend"}! You've run over your total budget envelope by ${formatAmt(
        totalSpentThisMonth - totalBudget
      )}. Consider holding discretionary expenses for the next few days to cushion your balance!`;
    }
    if (totalFood > (budgets["Food & Dining"] || 4000) * 0.75) {
      return `You have spent 75%+ of your 'Food & Dining' envelope. Cooking in your dorm or eating at campus mess can save ~${formatAmt(
        currency === "INR" ? 1500 : 80
      )} this week!`;
    }
    if (activeGoal && activeGoal.current < activeGoal.target) {
      return `Putting just ${formatAmt(
        currency === "INR" ? 500 : 25
      )} extra this week into "${activeGoal.name}" accelerates your milestone by 12 days. Let's make it happen!`;
    }
    return `Looking good, ${profile.name || "Student"}! Your logging consistency score is at ${
      healthBreakdown?.consistencyScore || 85
    }%. Keep checking in daily to maintain your ${streak}-day streak!`;
  }, [profile, transactions, goals, budgets, totalSpentThisMonth, totalBudget, healthBreakdown, currency, streak]);

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

    const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dateRegex = new RegExp(`^${currentYear}-${monthStr}-(\\d{2})`);

    transactions.forEach((t) => {
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
    transactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    generateMonthlyPDFReport({
      studentName: profile.name || "Student",
      studentMajor: profile.major || "B.Tech",
      monthYear: "August 2026",
      healthScore,
      healthGrade,
      monthlyIncome: monthlyAllowance,
      totalSpent: totalSpentThisMonth,
      totalBudget,
      remainingBudget: Math.max(0, totalBudget - totalSpentThisMonth),
      savingsGoalProgress: goals.map((g) => ({ name: g.name, target: g.target, current: g.current })),
      categoryBreakdown: categoryTotals,
      transactions: transactions.map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* ─── ROW 1: Monthly Overview Hero Card + Upcoming Due Card ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Overview Card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card relative overflow-hidden flex flex-col justify-between">
          {/* Subtle neon top accent bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 dark:from-[#ff2d78] dark:via-[#bd00ff] dark:to-[#00f0ff] opacity-80" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-cyan-400 filled-icon">
                  monitoring
                </span>
                Monthly Overview
              </h3>
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+5% VS LAST MONTH</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800/80">
              {/* Total Balance */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block mb-1">
                  Total Balance
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-[#00f0ff] font-display drop-shadow-xs dark:drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  {formatAmt(liquidBalance > 0 ? liquidBalance : (currency === "INR" ? 14500 : 1450))}
                </span>
              </div>

              {/* Monthly Allowance */}
              <div className="sm:border-l sm:border-slate-100 sm:dark:border-zinc-800 sm:pl-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block mb-1">
                  Monthly Allowance
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatAmt(monthlyAllowance)}
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-xs">
                  <span className="material-symbols-outlined text-[15px]">account_balance</span>
                  <span>Deposited on 1st</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Progress & Multi-Segment Progress Bar */}
          <div className="pt-5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Spent So Far
              </span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  {formatAmt(totalSpentThisMonth || (currency === "INR" ? 5500 : 550))}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                  {" "}/ {formatAmt(monthlyAllowance)}
                </span>
              </div>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3.5 bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden flex border border-slate-200/60 dark:border-zinc-700/50 p-0.5">
              {/* Committed */}
              <div
                style={{ width: `${committedPct}%` }}
                className="h-full rounded-l-full bg-blue-600 dark:bg-[#ff2d78] shadow-xs dark:shadow-[0_0_8px_rgba(255,45,120,0.8)] transition-all duration-700"
                title={`Committed: ${formatAmt(committedSpent)}`}
              />
              {/* Safe to Spend / Discretionary */}
              <div
                style={{ width: `${discretionaryPct}%` }}
                className="h-full bg-cyan-500 dark:bg-[#bd00ff] shadow-xs dark:shadow-[0_0_8px_rgba(189,0,255,0.8)] transition-all duration-700"
                title={`Safe Spent: ${formatAmt(discretionarySpent)}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-[#ff2d78] dark:shadow-[0_0_5px_rgba(255,45,120,0.8)]" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Committed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-[#bd00ff] dark:shadow-[0_0_5px_rgba(189,0,255,0.8)]" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Safe Spent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Remaining</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                {spentPercentage}% utilized
              </span>
            </div>
          </div>

        </div>

        {/* Upcoming Due Card (1 col) */}
        <div className="rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 ambient-shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-4 flex items-center justify-between">
              <span>Upcoming Due</span>
              <CalendarClock className="w-4 h-4 text-slate-400" />
            </h3>

            <div className="space-y-3">
              {upcomingBills.map((bill) => {
                const Icon = bill.icon;
                return (
                  <div
                    key={bill.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bill.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{bill.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">{bill.due}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatAmt(bill.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={handlePayAllBills}
              disabled={billsPaid || payingBills}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                billsPaid
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30 hover:border-blue-300 shadow-xs"
              }`}
            >
              {billsPaid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All Bills Paid!</span>
                </>
              ) : payingBills ? (
                <span>Processing Payments...</span>
              ) : (
                <span>Pay All Bills ({formatAmt(currency === "INR" ? 2099 : 209)})</span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ─── ROW 2: Explore Financial Schemes Banner ─── */}
      <div
        onClick={() => setActiveTab("scholarships")}
        className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 dark:from-[#18181f] dark:via-[#202028] dark:to-[#121217] border border-blue-800/40 dark:border-zinc-800 p-6 sm:p-8 text-white relative overflow-hidden cursor-pointer group shadow-lg"
      >
        {/* Background abstract graphic elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent" />
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Government & University Programs</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display mb-2 text-white">
            Explore Financial Schemes
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
            Discover government initiatives, scholarships, and fee waivers tailored for your university profile to maximize savings.
          </p>

          <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>VIEW SCHEMES</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* ─── ROW 3: Financial Health Score & Pillar Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ring Chart Score Card */}
        <div className="rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 flex flex-col items-center text-center ambient-shadow-card">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
              Financial Health Grade
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 border border-blue-100 dark:border-cyan-800">
              AI Monitored
            </span>
          </div>

          <div className="relative flex items-center justify-center h-36 w-36 my-2">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-slate-100 dark:text-zinc-800"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={389}
                strokeDashoffset={389 - (389 * (healthScore || 82)) / 100}
                strokeLinecap="round"
                className="text-blue-600 dark:text-[#00f0ff] transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white leading-none">
                {healthGrade || "A-"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                {healthScore || 82}/100 Score
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-[85%] mt-2 leading-relaxed">
            Combines savings targets, logging consistency, and allowance adherence.
          </p>
        </div>

        {/* Pillars & Daily AI Insight */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 ambient-shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-4">
              Financial Health Pillars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Savings Rate Score</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {healthBreakdown?.savingsScore || 80}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${healthBreakdown?.savingsScore || 80}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Budget Adherence</span>
                  <span className="font-bold text-blue-600 dark:text-cyan-400">
                    {healthBreakdown?.budgetScore || 75}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full"
                    style={{ width: `${healthBreakdown?.budgetScore || 75}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Anomaly & Risk Score</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {healthBreakdown?.riskScore || 90}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${healthBreakdown?.riskScore || 90}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>Logging Consistency</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {healthBreakdown?.consistencyScore || 85}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${healthBreakdown?.consistencyScore || 85}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Daily AI Insight card */}
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50/70 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-[#ff2d78] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-900 dark:text-white uppercase tracking-wider">
                Daily AI Insight
              </p>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed mt-0.5 font-medium">
                {dailyTip}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── ROW 4: Spending Trajectory Area Chart ─── */}
      <div className="rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 ambient-shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">
              Monthly Spending Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Daily cumulative spending vs. monthly budget cap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Download PDF</span>
            </button>
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 border border-blue-200/80 dark:border-cyan-800 px-3 py-1 rounded-full">
              {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="Spent"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSpent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── ROW 5: Quick Simulation & Bottom Shortcuts ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-zinc-900 dark:to-zinc-900/60 border border-blue-200/80 dark:border-zinc-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 dark:bg-[#ff2d78] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(255,45,120,0.4)]">
            <ShieldQuestion className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Can I Afford This Purchase?
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Simulate the impact of any expense or impulse buy on your remaining monthly trajectory.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("affordability")}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-500/20 dark:shadow-[0_0_15px_rgba(255,45,120,0.4)] hover:scale-102 transition-all cursor-pointer self-start md:self-auto"
        >
          Open Afford-Check Simulator →
        </button>
      </div>

    </div>
  );
};
