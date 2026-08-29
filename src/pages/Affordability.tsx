// BudgetMitra — "Can I Afford This?" Impulse Simulator (Affordability.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  ShieldCheck, ShieldAlert, ShieldX, ShoppingBag,
  Sparkles, Lightbulb, RefreshCw, IndianRupee, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { askAffordabilityBob } from "../services/gemini";

type BobDecision = "YES" | "CAUTION" | "NO";

const CATEGORY_OPTIONS = [
  { value: "food", label: "🍽️ Food & Dining" },
  { value: "rent", label: "🏠 Rent & Accommodation" },
  { value: "books", label: "📚 Books & Study Material" },
  { value: "travel", label: "🚌 Travel & Commute" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "other", label: "🛍️ Shopping & Other" },
];

const QUICK_FILLS = [
  { name: "New Smartphone", amount: 18999, category: "other" },
  { name: "Zomato dinner order", amount: 650, category: "food" },
  { name: "Engineering textbook", amount: 1200, category: "books" },
  { name: "Weekend trip to Goa", amount: 8500, category: "travel" },
  { name: "Netflix subscription", amount: 649, category: "entertainment" },
  { name: "Gaming laptop", amount: 65000, category: "other" },
];

const verdictConfig = {
  YES: {
    icon: ShieldCheck,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-500",
    label: "✅ YES — You Can Afford It",
    glow: "shadow-emerald-100",
  },
  CAUTION: {
    icon: ShieldAlert,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-500",
    label: "⚠️ CAUTION — Think Twice",
    glow: "shadow-amber-100",
  },
  NO: {
    icon: ShieldX,
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "bg-rose-500",
    label: "🚫 NO — Don't Buy This Now",
    glow: "shadow-rose-100",
  },
};

export const Affordability: React.FC = () => {
  const { profile, totalSpentThisMonth, dailyBurnRate, goals, preferredLanguage } = useFinancial();

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("other");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    decision: BobDecision;
    reasoning: string;
    suggested_action: string;
  } | null>(null);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - now.getDate() + 1;
  const liquidBalance = Math.max(0, profile.monthlyAllowance - totalSpentThisMonth);

  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const price = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(price) || price <= 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await askAffordabilityBob({
        itemName,
        itemPrice: price,
        itemCategory,
        preferredLanguage,
        financialContext: {
          remainingBudgetThisMonth: liquidBalance,
          daysLeftInMonth,
          dailyBurnRate,
          monthlyAllowance: profile.monthlyAllowance,
          totalSpentThisMonth,
          savingsGoals: goals.map(g => ({ name: g.name, target: g.target, current: g.current })),
        },
      });
      setResult(res);
    } catch (err: any) {
      setError("Bob couldn't respond. Check your API key in the settings drawer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (item: typeof QUICK_FILLS[0]) => {
    setItemName(item.name);
    setItemPrice(String(item.amount));
    setItemCategory(item.category);
    setResult(null);
  };

  const cfg = result ? verdictConfig[result.decision] : null;
  const langLabel: Record<string, string> = { en: "EN", hi: "हिन्दी", mr: "मराठी" };
  const currentLang = langLabel[preferredLanguage] || "EN";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
          "Can I Afford This?" — IBM Bob Check
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
            <Globe className="h-3 w-3" /> {currentLang}
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          IBM Bob analyzes your remaining budget, daily burn rate, and savings goals to give you a real decision.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ─── LEFT: Input Panel ─── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            Purchase Details
          </h3>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex justify-between text-xs font-semibold text-slate-700">
            <span>Remaining Budget This Month:</span>
            <span className={`font-bold ${liquidBalance > 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{liquidBalance.toLocaleString("en-IN")} ({daysLeftInMonth}d left)
            </span>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Fill</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILLS.map(item => (
                <button key={item.name} onClick={() => handleQuickFill(item)}
                  className="rounded-full border border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 px-3 py-1 text-xs text-slate-600 font-medium transition-all">
                  {item.name} · ₹{item.amount.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">What do you want to buy?</label>
              <input
                type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                placeholder="e.g. Gaming Laptop, Zomato dinner..."
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Price (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                    placeholder="0" required min="1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Category</label>
                <select value={itemCategory} onChange={e => setItemCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors cursor-pointer">
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading || !itemName.trim() || !itemPrice}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3.5 text-xs shadow-md shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              {isLoading
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> IBM Bob is reasoning...</>
                : <><Sparkles className="h-4 w-4" /> Ask Bob ({currentLang})</>
              }
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Bob's Result Panel ─── */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!result && !isLoading && (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-10 text-center gap-3 min-h-[300px]">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-orange-400 animate-pulse" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Enter a purchase above and let IBM Bob decide.</p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 rounded-2xl border border-orange-100 bg-orange-50/60 flex flex-col items-center justify-center p-10 text-center gap-4 min-h-[300px]">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <p className="text-orange-700 font-bold">IBM Bob is thinking...</p>
              </motion.div>
            )}

            {result && cfg && (
              <motion.div key="result"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex-1 rounded-2xl border-2 ${cfg.border} ${cfg.bg} ${cfg.glow} shadow-lg p-6 space-y-4`}>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl ${cfg.badge} flex items-center justify-center shadow-sm`}>
                    <cfg.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-lg font-extrabold font-display ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{itemName} · ₹{parseFloat(itemPrice).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/80 border border-white/60 p-4 space-y-2 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-orange-400" /> IBM Bob's Reasoning ({currentLang})
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.reasoning}</p>
                </div>

                <div className="rounded-xl bg-white/60 border border-white/40 p-3.5 flex gap-2.5">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Suggested Action</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{result.suggested_action}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* How Bob Works explainer */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">How IBM Bob Decides</p>
            <ol className="space-y-1.5 text-xs text-slate-500">
              {[
                "Checks your remaining budget vs. the item price",
                "Calculates days left in the month × daily burn rate",
                "Assesses impact on your active savings goals",
                "Outputs a decision + plain-language reasoning",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-px">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
