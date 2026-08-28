// FinWise Impulse Purchase Affordability Simulator (Affordability.tsx)
import React, { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { 
  ShieldCheck, ShieldAlert, HelpCircle, 
  Landmark, ShoppingBag, Lightbulb 
} from "lucide-react";
import { motion } from "motion/react";
import { askAffordability } from "../services/gemini";

export const Affordability: React.FC = () => {
  const { profile, totalSpentThisMonth, goals } = useFinancial();

  // Form states
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Shopping & Personal");
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    verdict: "YES" | "CAUTION" | "NO";
    confidenceScore: number;
    reason: string;
    delayDays: number;
    alternative: string;
  } | null>(null);

  // Constants
  const liquidBalance = profile.monthlyAllowance - totalSpentThisMonth;
  const activeGoal = goals[0]; // Primary target goal for delay comparison

  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const price = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(price) || price <= 0) return;

    setIsLoading(true);
    setError(null);
    setHasSimulated(true);

    try {
      const res = await askAffordability({
        itemName,
        itemPrice: price,
        itemCategory,
        financialContext: {
          liquidBalance,
          monthlyIncome: profile.monthlyAllowance,
          totalSpentThisMonth,
          dailyBurnRate: (profile.monthlyAllowance - totalSpentThisMonth) > 0 
            ? (profile.monthlyAllowance - totalSpentThisMonth) / 30 
            : 0,
          savingsGoals: goals.map(g => ({ name: g.name, target: g.target, current: g.current }))
        }
      });
      setAiResult(res);
    } catch (err: any) {
      console.error("Affordability check failed:", err);
      setError("AI Affordability Check was unable to contact the advisor service. Please check your API key configuration or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          "Can I Afford This?" Impulse Simulator
        </h1>
        <p className="text-sm text-slate-500">
          Simulate major discretionary purchases against active savings targets and liquid balances before committing cash.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="h-4.5 w-4.5 text-brand-teal" />
              Purchase Details
            </h3>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex justify-between text-xs font-semibold text-slate-700">
              <span>Current Cash Cushion:</span>
              <span className={`font-bold ${liquidBalance > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ${liquidBalance.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Item / Purchase Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wireless Headset, Winter Coat"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setHasSimulated(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-teal transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={itemPrice}
                    onChange={(e) => {
                      setItemPrice(e.target.value);
                      setHasSimulated(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-teal transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => {
                      setItemCategory(e.target.value);
                      setHasSimulated(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-teal transition-all"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Textbooks & Tuition">Textbooks & Tuition</option>
                    <option value="Entertainment & Subscriptions">Entertainment & Subscriptions</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Shopping & Personal">Shopping & Personal</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!itemName.trim() || !itemPrice || isLoading}
                className="w-full rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white py-3.5 text-xs font-bold shadow-md shadow-teal-700/10 transition-all flex items-center justify-center"
              >
                {isLoading ? "Running AI Evaluation..." : "Run Affordability Check"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Simulation Analysis */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-white p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-teal mb-4" />
              <h4 className="text-sm font-bold text-slate-700">Analyzing Affordability...</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[70%] mx-auto">
                Our AI Advisor is reviewing your cushion cash, budgets, active savings targets, and monthly net savings rate.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <ShieldAlert className="h-8 w-8 text-rose-500 mb-2" />
              <h4 className="text-sm font-bold text-rose-800">Affordability Check Error</h4>
              <p className="text-xs text-rose-700 mt-1 max-w-[80%] mx-auto mb-4">
                {error}
              </p>
              <button
                onClick={() => handleSimulate()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition-all"
              >
                Retry Request
              </button>
            </div>
          ) : !hasSimulated || !aiResult ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Awaiting Simulator Metrics</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[70%] mx-auto">
                Fill in the item details to compute confidence indices, opportunity delays, and alternatives.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Verdict Card */}
              <div 
                className={`rounded-2xl border p-6 shadow-sm ${
                  aiResult.verdict === "YES"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : aiResult.verdict === "CAUTION"
                    ? "bg-orange-50 border-orange-200 text-orange-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {aiResult.verdict === "NO" ? (
                      <ShieldAlert className="h-6 w-6 text-rose-500" />
                    ) : (
                      <ShieldCheck className={`h-6 w-6 ${aiResult.verdict === "YES" ? "text-emerald-500" : "text-orange-500"}`} />
                    )}
                    <h3 className="font-display text-lg font-bold">
                      VERDICT: {aiResult.verdict}
                    </h3>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Score: {aiResult.confidenceScore}/100
                  </span>
                </div>
                
                <p className="text-xs leading-relaxed font-semibold">
                  {aiResult.reason}
                </p>
              </div>

              {/* Opportunity Cost / Delay info */}
              {activeGoal && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Landmark className="h-4.5 w-4.5 text-slate-400" />
                    Opportunity Delay Tracker
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-sm">
                      +{aiResult.delayDays}d
                    </div>
                    <div>
                      <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                        Purchasing this delays your primary savings goal <span className="font-bold">"{activeGoal.name}"</span> by approximately <span className="text-orange-600 font-bold">{aiResult.delayDays} days</span>.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Based on current daily net saving velocity.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Student Alternatives */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm">
                <h3 className="font-display text-sm font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
                  Smart Student Alternative
                </h3>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {aiResult.alternative}
                </p>
              </div>

            </motion.div>
          )}
        </div>

      </div>

    </div>
  );
};
