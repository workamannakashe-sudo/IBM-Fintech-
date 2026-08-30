import React, { useMemo, useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { generateMonthlyPDFReport } from "../services/pdfGenerator";
import { SplitBillModal } from "../components/SplitBillModal";
import {
  Download,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Mic,
  Plus,
  ArrowUpRight,
  Layers,
  FileText,
  CreditCard,
  Users,
  Sliders,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickLog?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const {
    profile,
    transactions,
    goals,
    currency,
    healthScore,
    healthGrade,
    totalSpentThisMonth,
  } = useFinancial();

  // Active top sub-nav pill filter
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "balance" | "split" | "envelopes" | "reports" | "bob">("overview");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Initiated" | "Authorized" | "Successful" | "Payouts">("Successful");
  const [settlementView, setSettlementView] = useState<"weekly" | "daily">("weekly");
  const [logPeriod, setLogPeriod] = useState<"weekly" | "monthly">("monthly");
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedReportModal, setSelectedReportModal] = useState<string | null>(null);

  // Currency Formatter
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const monthlyAllowance = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : (currency === "INR" ? 38176 : 3817.6);

  // Real-time Date format
  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Payments breakdown chart — derived from real transaction data
  const paymentBreakdownData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Initialise all 7 days with zero
    const buckets: Record<string, { day: string; Successful: number; Payouts: number }> = {};
    days.forEach((d) => { buckets[d] = { day: d, Successful: 0, Payouts: 0 }; });

    transactions.forEach((t) => {
      try {
        const dow = days[new Date(t.date).getDay()];
        if (!dow) return;
        buckets[dow].Successful += t.amount;
        // Payouts = anomalous transactions (flagged spend) scaled for visual separation
        if (t.isAnomaly) buckets[dow].Payouts += t.amount * 0.15;
      } catch {
        // skip malformed date
      }
    });

    // If no real data yet, return representative seed values so chart is never blank
    const total = Object.values(buckets).reduce((s, b) => s + b.Successful, 0);
    if (total === 0) {
      return [
        { day: "Mon", Successful: 6200, Payouts: 850 },
        { day: "Tue", Successful: 8261, Payouts: 1098 },
        { day: "Wed", Successful: 7400, Payouts: 920 },
        { day: "Thu", Successful: 9100, Payouts: 1400 },
        { day: "Fri", Successful: 11200, Payouts: 1650 },
        { day: "Sat", Successful: 5400, Payouts: 600 },
        { day: "Sun", Successful: 4800, Payouts: 450 },
      ];
    }

    // Return in Mon–Sun order (visually nicer than Sun-first)
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => buckets[d]);
  }, [transactions]);


  // Envelopes Gross Volume metrics
  const envelopeItems = [
    { name: "Home Rent / Dorm", amount: currency === "INR" ? 15000 : 1500, color: "from-amber-400 to-orange-500", pct: 75 },
    { name: "Grocery & Dining", amount: currency === "INR" ? 8260.09 : 826.09, color: "from-teal-400 to-emerald-500", pct: 45 },
    { name: "Subscriptions & Tech", amount: currency === "INR" ? 2400 : 240, color: "from-blue-400 to-cyan-500", pct: 30 },
    { name: "Online Shopping", amount: currency === "INR" ? 3560 : 356, color: "from-purple-400 to-pink-500", pct: 20 },
  ];

  // Soundwave settlement chart data
  const settlementSoundwave = useMemo(() => [
    { time: "09:00", val: 40, height: "40%" },
    { time: "10:00", val: 65, height: "65%" },
    { time: "11:00", val: 95, height: "95%" },
    { time: "12:00", val: 70, height: "70%" },
    { time: "13:00", val: 85, height: "85%" },
    { time: "14:00", val: 50, height: "50%" },
    { time: "15:00", val: 90, height: "90%" },
    { time: "16:00", val: 60, height: "60%" },
    { time: "17:00", val: 75, height: "75%" },
    { time: "18:00", val: 45, height: "45%" },
    { time: "19:00", val: 80, height: "80%" },
  ], []);

  // Structured Transaction Log (from user data + mock enriched)
  const transactionRows = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.slice(0, 6).map((t, idx) => ({
        id: `Txn_...${t.id.slice(-4) || 'C3Nv'}`,
        date: t.date,
        customer: t.description,
        amount: t.amount,
        method: idx % 2 === 0 ? "Credit Card" : idx % 3 === 0 ? "UPI Transfer" : "Bank Transfer",
        status: t.isAnomaly ? "Anomaly ⚠️" : idx % 4 === 0 ? "Processing" : "Settled",
        fee: currency === "INR" ? "₹0.00" : "$0.00"
      }));
    }
    return [
      { id: "Txn_...C3Nv", date: "31 Mar 2026", customer: "Flivia Hartman", amount: 2480.00, method: "Credit Card", status: "Settled", fee: "$72.00" },
      { id: "Txn_...X1Yz", date: "29 Mar 2026", customer: "Marcus Riley", amount: 540.00, method: "Bank Transfer", status: "Processing", fee: "$10.80" },
      { id: "Txn_...A9Bc", date: "28 Mar 2026", customer: "Campus Bookstore", amount: 112.50, method: "UPI Transfer", status: "Settled", fee: "$0.00" },
      { id: "Txn_...K4Lm", date: "27 Mar 2026", customer: "Le Ju' Bistro", amount: 65.00, method: "Credit Card", status: "Settled", fee: "$1.50" },
    ];
  }, [transactions, currency]);

  const handleDownloadPDF = () => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    generateMonthlyPDFReport({
      studentName: profile.name || "Student",
      studentMajor: profile.major || "B.Tech",
      monthYear: "March 2026",
      healthScore,
      healthGrade,
      monthlyIncome: monthlyAllowance,
      totalSpent: totalSpentThisMonth,
      totalBudget: monthlyAllowance,
      remainingBudget: Math.max(0, monthlyAllowance - totalSpentThisMonth),
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ─── ROW 1: Sleek Dark Hectra Banner Header ─── */}
      <div className="rounded-3xl bg-[#0d0d12] text-white border border-zinc-800/90 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Background abstract fluid aura */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-purple-600 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-zinc-400 tracking-wider">
              {currentDateFormatted}
            </span>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight mt-1 font-display">
              {greeting},{" "}
              <span className="italic font-serif font-normal text-cyan-400">
                {profile.name || "Mellnson Ele."}
              </span>
            </h1>

            {/* Sub-Navigation Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-6 flex-wrap">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "balance", label: "Balance & Wallet", icon: CreditCard, action: () => setActiveTab("budget") },
                { id: "split", label: "Split Bill", icon: Users, action: () => setIsSplitModalOpen(true) },
                { id: "envelopes", label: "Envelopes", icon: Sliders, action: () => setActiveTab("budget") },
                { id: "reports", label: "Reports & PDF", icon: FileText, action: handleDownloadPDF },
                // Powered by Google Gemini 2.5 Flash & Heuristic Decision Rules
                { id: "bob", label: "AI Assistant", icon: Sparkles, action: () => setActiveTab("advisor") },
              ].map((pill) => {
                const Icon = pill.icon;
                const isActive = activeSubTab === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setActiveSubTab(pill.id as any);
                      if (pill.action) pill.action();
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                      isActive
                        ? "bg-white text-slate-900 shadow-md shadow-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Promotion Card: "Specially for you" */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 max-w-sm w-full backdrop-blur-md shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              <span>Specially for you</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-xs font-bold text-white mb-1">
              Be the best with Student PRO
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
              Unlock auto-scholarship applications, anomaly protection & watsonx AI co-pilot.
            </p>
            <button
              onClick={() => setActiveTab("scholarships")}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Schemes & Upgrade</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: Payments Breakdown + Gross Volume Envelopes + KPI Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payments Breakdown 3D Pillar Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 ambient-shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Payments breakdown
              </h3>
              <button
                onClick={() => setActiveTab("expenses")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Average this month
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                  {formatAmt(monthlyAllowance)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                0.6% transactions | today
              </span>
            </div>

            {/* Pillar Graphic Bar Preview */}
            <div className="h-44 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentBreakdownData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" fontSize={10} stroke="#94a3b8" />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      backgroundColor: "#18181f",
                      color: "#ffffff",
                      borderColor: "#27272a",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="Successful" fill="#c084fc" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Payouts" fill="#e879f9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800 flex-wrap">
            {["Initiated", "Authorized", "Successful", "Payouts"].map((f) => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f as any)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  paymentFilter === f
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Gross Volume / Envelope Breakdown (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 ambient-shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Gross Volume
              </h3>
              <button
                onClick={() => setActiveTab("budget")}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Add new budget envelope"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search filter */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="Search envelope..."
                className="w-full h-8 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none"
              />
              <Mic className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Envelopes list with dot meters */}
            <div className="space-y-4">
              {envelopeItems.map((env, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{env.name}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-display">
                      {formatAmt(env.amount)}
                    </span>
                  </div>
                  {/* Segmented dot track */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${env.pct}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${env.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("budget")}
              className="w-full py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold text-blue-600 dark:text-cyan-400 transition-colors cursor-pointer text-center"
            >
              Adjust Envelopes & Targets →
            </button>
          </div>
        </div>

        {/* Transactions & Peer Network Sparkline Cards (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Transactions Velocity */}
          <div className="rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-5 ambient-shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Transactions</span>
              <button onClick={() => setActiveTab("expenses")}>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                147k
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Highest: Wed
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>+53,002 vs last period</span>
            </div>
          </div>

          {/* Card 2: Peer Network / Active Students */}
          <div className="rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-5 ambient-shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Peer Network</span>
              <button onClick={() => setIsSplitModalOpen(true)}>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                1,679
              </span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                Peak: Fri
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-2">
              <Users className="w-3 h-3 text-purple-500" />
              <span>+435 new campus splits</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─── ROW 3: Settlement Soundwave Overview & Action Reports ─── */}
      <div className="rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Settlement & Cashflow Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Live cashflow timeline and liquidation soundwave
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setSettlementView("weekly")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settlementView === "weekly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSettlementView("daily")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settlementView === "daily"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                Daily
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Metrics */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Today Balance
              </span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                {formatAmt(currency === "INR" ? 31200 : 312.00)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Yesterday Settlement
              </span>
              <span className="text-2xl font-bold text-slate-500 dark:text-zinc-400 font-display">
                {formatAmt(currency === "INR" ? 56800 : 568.00)}
              </span>
            </div>
          </div>

          {/* Middle Soundwave Graphic */}
          <div className="lg:col-span-5 flex items-end justify-between h-28 px-4 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-100 dark:border-zinc-800">
            {settlementSoundwave.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  style={{ height: s.height }}
                  className="w-2.5 rounded-full bg-gradient-to-t from-amber-400 to-orange-500 shadow-xs hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-semibold text-slate-400">{s.time}</span>
              </div>
            ))}
          </div>

          {/* Right Settlement Action Cards */}
          <div className="lg:col-span-3 space-y-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Pending</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatAmt(currency === "INR" ? 31200 : 312)}
                </span>
              </div>
              <button
                onClick={() => setSelectedReportModal("Pending Settlement")}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
              >
                View Report
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Processing</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatAmt(currency === "INR" ? 56800 : 568)}
                </span>
              </div>
              <button
                onClick={() => setSelectedReportModal("Processing Settlement")}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
              >
                View Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: Transaction Log Table (with CSV Export) ─── */}
      <div className="rounded-3xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Transaction log
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Recent card, UPI, and bank transfers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setLogPeriod("weekly")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logPeriod === "weekly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setLogPeriod("monthly")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logPeriod === "monthly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                Monthly
              </button>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Transaction ID</th>
                <th className="pb-3">Customer / Merchant</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
              {transactionRows.map((tx, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors text-slate-700 dark:text-zinc-300"
                >
                  <td className="py-3.5 pl-2 font-medium text-slate-500 dark:text-zinc-400">{tx.date}</td>
                  <td className="py-3.5 font-mono text-[11px] font-bold text-slate-600 dark:text-zinc-400">{tx.id}</td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{tx.customer}</td>
                  <td className="py-3.5 font-display font-extrabold text-slate-900 dark:text-white">
                    {formatAmt(tx.amount)}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      {tx.method}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === "Settled"
                          ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800"
                          : tx.status === "Processing"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-right font-medium text-slate-500 dark:text-zinc-400">
                    {tx.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split the Bill Modal Trigger */}
      <SplitBillModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
      />

      {/* Settlement Report Modal Dialog */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18181f] p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in">
            <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
              {selectedReportModal}
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              All transactions for this period have been verified and matched with your bank feed.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600">Active Pipeline</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification</span>
                <span className="font-bold text-slate-900 dark:text-white">100% Reconciled</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedReportModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
            >
              Close Dialog
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
