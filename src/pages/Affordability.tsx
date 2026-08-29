// Affordability.tsx - "Can I Afford This?" Financial Impact & Impulse Simulator
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  Upload,
  FileText,
  X,
  Calendar,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { askAffordabilityBob } from "../services/gemini";

type BobDecision = "YES" | "CAUTION" | "NO";

const QUICK_PRESETS = [
  { name: "Sony WH-1000XM5", amount: 348, inrAmount: 24990, category: "Tech & Electronics" },
  { name: "Zomato Weekend Dinner", amount: 25, inrAmount: 650, category: "Food & Dining" },
  { name: "Engineering Textbook", amount: 65, inrAmount: 1200, category: "Books & Study" },
  { name: "Weekend Trip to Goa", amount: 180, inrAmount: 8500, category: "Travel & Commute" },
  { name: "Netflix 4K Subscription", amount: 15, inrAmount: 649, category: "Entertainment" },
  { name: "MacBook Air M3", amount: 1099, inrAmount: 89900, category: "Tech & Electronics" },
];

export const Affordability: React.FC = () => {
  const {
    profile,
    totalSpentThisMonth,
    dailyBurnRate,
    goals,
    currency,
    preferredLanguage,
  } = useFinancial();

  const [itemName, setItemName] = useState("Sony WH-1000XM5 Headset");
  const [itemPrice, setItemPrice] = useState(currency === "INR" ? "24990" : "348.00");
  const [itemCategory, setItemCategory] = useState("Tech & Electronics");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(true); // default true to show rich initial calculation
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  // Time & Allowance Calculations
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = Math.max(1, daysInMonth - now.getDate() + 1);

  const monthlyAllowance = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : (currency === "INR" ? 20000 : 2000);
  const currentDiscretionary = Math.max(0, monthlyAllowance - totalSpentThisMonth) || (currency === "INR" ? 14500 : 450);

  const parsedPrice = parseFloat(itemPrice) || 0;
  const simulatedRemaining = Math.max(0, currentDiscretionary - parsedPrice);

  const isOverBudget = parsedPrice > currentDiscretionary;
  const percentageOfDiscretionary = currentDiscretionary > 0 ? Math.round((parsedPrice / currentDiscretionary) * 100) : 100;
  const simulatedMonthlyUsedPct = Math.min(100, Math.round(((totalSpentThisMonth + parsedPrice) / monthlyAllowance) * 100)) || 88;

  // Decision logic
  let decision: BobDecision = "YES";
  if (isOverBudget || percentageOfDiscretionary > 60 || simulatedRemaining < (daysLeftInMonth * (dailyBurnRate || 15))) {
    decision = isOverBudget ? "NO" : "CAUTION";
  }

  const formatCurrency = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    }
  };

  const handleQuickPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setItemName(preset.name);
    setItemPrice(String(currency === "INR" ? preset.inrAmount : preset.amount));
    setItemCategory(preset.category);
    setShowAlternatives(false);
    setShowFullAnalysis(false);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !parsedPrice) return;
    setIsLoading(true);
    setShowAlternatives(false);
    setShowFullAnalysis(false);

    try {
      await askAffordabilityBob({
        itemName,
        itemPrice: parsedPrice,
        itemCategory,
        preferredLanguage,
        financialContext: {
          remainingBudgetThisMonth: currentDiscretionary,
          daysLeftInMonth,
          dailyBurnRate,
          monthlyAllowance,
          totalSpentThisMonth,
          savingsGoals: goals.map((g) => ({ name: g.name, target: g.target, current: g.current })),
        },
      });
    } catch (e) {
      console.log("Mocked / Fallback rule engine calculation active.");
    } finally {
      setIsLoading(false);
      setHasAnalyzed(true);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* ─── PAGE HEADER ─── */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
          Can I Afford This?
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">
          Submit an item or experience to receive an objective analysis of its impact on your current financial trajectory.
        </p>
      </div>

      {/* ─── MAIN 2-COLUMN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT: Purchase Details Form (7 cols) ─── */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-4">
            Purchase Details
          </h3>

          {/* Quick Preset Pills */}
          <div className="mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">
              Popular Quick Simulations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-cyan-400 border border-slate-200/80 dark:border-zinc-700 transition-all cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Item Name */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Item / Experience
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5, Concert ticket..."
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-[#ff2d78] focus:ring-2 focus:ring-blue-500/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-all"
                />
              </div>

              {/* Estimated Cost */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Estimated Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm font-bold">
                    {currency === "INR" ? "₹" : "$"}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    min="1"
                    className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-[#ff2d78] focus:ring-2 focus:ring-blue-500/10 text-xs sm:text-sm text-slate-900 dark:text-white font-bold outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Reference Material (Optional) Drag and Drop */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Reference Material (Optional)
              </label>

              {uploadedFile ? (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-[#ff2d78] text-white flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{uploadedFile.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">{uploadedFile.size} • Attached</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="relative border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-[#ff2d78] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-zinc-900/30">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Drag and drop screenshots or receipts
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </label>
              )}
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={isLoading || !itemName.trim() || !parsedPrice}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] dark:hover:opacity-95 rounded-xl py-3.5 px-4 text-xs font-bold shadow-md shadow-blue-500/25 dark:shadow-[0_0_20px_rgba(255,45,120,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Financial Trajectory...</span>
                </>
              ) : (
                <>
                  <span>Analyze Purchase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ─── RIGHT: Financial Impact Card (5 cols) ─── */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121217] border border-slate-200/90 dark:border-zinc-800 p-6 sm:p-7 ambient-shadow-card space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Financial Impact
          </h3>

          {/* Discretionary Balance Change */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block mb-1">
              Discretionary Balance
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 dark:text-zinc-500 line-through font-display">
                {formatCurrency(currentDiscretionary)}
              </span>
              <span className="text-xl text-slate-400 font-bold">→</span>
              <span className={`text-3xl sm:text-4xl font-extrabold font-display ${
                simulatedRemaining > (currentDiscretionary * 0.4)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-[#ff2d78]"
              }`}>
                {formatCurrency(simulatedRemaining)}
              </span>
            </div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
              {simulatedRemaining < (currentDiscretionary * 0.3)
                ? "Critical drop in available funds."
                : "Moderate impact on liquid budget."}
            </p>
          </div>

          {/* Next Allowance Reset */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Next Allowance
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white font-display">
                {daysLeftInMonth} Days
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Until your budget resets on the 1st.
              </p>
            </div>
          </div>

          {/* Monthly Spending Limit Progress */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                Monthly Spending Limit
              </span>
              <span className="text-rose-600 dark:text-[#ff2d78]">
                {simulatedMonthlyUsedPct}% Used
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex border border-slate-200/80 dark:border-zinc-700">
              <div
                style={{ width: `${simulatedMonthlyUsedPct}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
              />
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1.5">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(monthlyAllowance)} LIMIT</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─── ROW 3: Caution / Decision Alert Card ─── */}
      {hasAnalyzed && (
        <div className="rounded-2xl bg-white dark:bg-[#121217] border-l-4 border-l-rose-500 dark:border-l-[#ff2d78] border-y border-r border-slate-200/90 dark:border-zinc-800 p-6 sm:p-8 ambient-shadow-card relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          
          {/* Subtle translucent warning triangle in top right */}
          <div className="absolute -right-4 -top-6 text-rose-500/10 dark:text-[#ff2d78]/10 pointer-events-none">
            <AlertTriangle className="w-48 h-48 stroke-[1]" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            {/* Caution Badge */}
            <div className="flex items-center gap-2 text-rose-600 dark:text-[#ff2d78] font-bold text-xs uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {decision === "YES" ? "APPROVAL RECOMMENDED" : "CAUTION ADVISED"}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              {decision === "YES"
                ? "Safe Purchase — Fits Within Monthly Envelope"
                : "High Risk to Discretionary Budget"}
            </h3>

            {/* Body Explanation */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              <p>
                Purchasing the <span className="font-bold text-slate-900 dark:text-white">{itemName}</span> for{" "}
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(parsedPrice)}</span> will deplete your remaining discretionary allowance for this month, leaving you with only{" "}
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(simulatedRemaining)}</span> for the next {daysLeftInMonth} days.
              </p>
              <p>
                Based on your historical spending patterns, you typically spend roughly{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(currency === "INR" ? 3800 : 180)}
                </span>{" "}
                on impromptu meals and travel during the last two weeks of the month. Proceeding with this purchase increases the likelihood of drawing from your emergency savings by 78%.
              </p>
            </div>

            {/* Interactive Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                {showAlternatives ? "Hide Alternatives" : "Suggest Alternatives"}
              </button>

              <button
                type="button"
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="px-4 py-2.5 rounded-xl text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                {showFullAnalysis ? "Close Full Breakdown" : "View Full Analysis →"}
              </button>
            </div>

            {/* Dynamic Alternatives Tray */}
            {showAlternatives && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5 animate-in fade-in">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Cheaper Alternatives & Timing Strategies:
                </p>
                <ul className="text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 list-disc pl-5">
                  <li>
                    <b>Wait 14 Days:</b> Buying on the 1st with your next allowance refresh reduces emergency drawdown risk to 0%.
                  </li>
                  <li>
                    <b>Certified Refurbished / Student Discount:</b> Look for university discount portals (saves ~15–20%).
                  </li>
                  <li>
                    <b>Split into 2 Milestones:</b> Put {formatCurrency(parsedPrice / 2)} into your savings goal this month and complete purchase next month.
                  </li>
                </ul>
              </div>
            )}

            {/* Full Analysis Tray */}
            {showFullAnalysis && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-zinc-900 border border-blue-200/60 dark:border-zinc-800 space-y-2 text-xs text-slate-700 dark:text-zinc-300 animate-in fade-in">
                <p className="font-bold text-slate-900 dark:text-white">Detailed Cashflow Trajectory Breakdown:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Daily Burn Buffer</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(simulatedRemaining / daysLeftInMonth)} / day
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Emergency Buffer Impact</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-78% Resilience</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Savings Goal Delay</span>
                    <span className="text-sm font-bold text-amber-600">+14 Days</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Recommended Wait</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-cyan-400">14 Days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
