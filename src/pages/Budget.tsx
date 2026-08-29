// BudgetMitra Budget Planner & Burn Rate Velocity Simulator (Budget.tsx)
import React, { useState, useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import { 
  Percent, AlertTriangle, ShieldCheck, Milestone, 
  Flame, Plus, Trash2 
} from "lucide-react";

export const Budget: React.FC = () => {
  const {
    budgets,
    goals,
    dailyBurnRate,
    projectedBurnoutDay,
    burnRateMultiplier,
    setBurnRateMultiplier,
    updateBudgetLimit,
    addSavingsGoal,
    updateGoalSavings,
    deleteSavingsGoal,
    currency,
  } = useFinancial();

  // New goal form states
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCurrent, setNewGoalCurrent] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Dynamic currency formatting helper
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const totalBudgetLimit = Object.values(budgets).reduce((sum, v) => sum + v, 0);

  // Category spent aggregation
  const categorySpent = useMemo(() => {
    const list = useFinancial().transactions;
    const totals: Record<string, number> = {};
    for (const key of Object.keys(budgets)) {
      totals[key] = 0;
    }
    list.forEach(t => {
      if (t.date.startsWith("2026-08")) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  }, [useFinancial().transactions, budgets]);

  // Safe Burn rate calculation: totalBudgetLimit / 30
  const safeDailyBurnRate = totalBudgetLimit / 30;

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(newGoalTarget);
    const cur = parseFloat(newGoalCurrent) || 0;
    if (!newGoalName.trim() || isNaN(tgt) || tgt <= 0) return;

    addSavingsGoal(newGoalName, tgt, cur);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalCurrent("");
    setShowGoalForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Budget Envelopes & Velocity</h1>
        <p className="text-sm text-slate-500">
          Configure category envelopes, simulate daily burn rates, and track milestones towards savings targets.
        </p>
      </div>

      {/* Burn Rate Velocity Simulator Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
          Spending Velocity & Safe Burn Monitor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Burn rate info */}
          <div className="space-y-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Daily Burn Rate</span>
            <p className="text-2xl font-bold font-display text-slate-900">{formatAmt(dailyBurnRate)}/day</p>
            <p className="text-[10px] text-slate-500 font-medium">Target safe burn: {formatAmt(safeDailyBurnRate)}/day</p>
          </div>

          {/* Burnout projection */}
          <div className="space-y-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Budget Burnout</span>
            <p className={`text-2xl font-bold font-display ${projectedBurnoutDay.includes("⚠️") || projectedBurnoutDay.includes("Safe") ? "text-brand-teal" : "text-orange-500"}`}>
              {projectedBurnoutDay}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Predicted exhaustion day of envelopes</p>
          </div>

          {/* Burn Rate Simulation Slider */}
          <div className="space-y-1.5 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Velocity Multiplier</span>
              <span className="text-orange-600 font-extrabold">{burnRateMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={burnRateMultiplier}
              onChange={(e) => setBurnRateMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
            />
            <p className="text-[9px] text-slate-400">Drag to simulate midterm or holiday spending spikes</p>
          </div>

        </div>

        {/* Action feedback info */}
        {dailyBurnRate > safeDailyBurnRate ? (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 flex items-center gap-3 text-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-xs font-semibold leading-normal">
              Spending Velocity Alert: Your daily burn rate is exceeding the safe threshold. Lock down subscriptions or cook in dorms to stretch your envelope.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold leading-normal">
              Safe Burn Rate: Your spending velocity is paced perfectly! Your cash reserve is safe for the rest of the month.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Envelope Sliders card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Percent className="h-4.5 w-4.5 text-brand-teal" />
            Envelope Budget Allocations
          </h3>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {Object.entries(budgets).map(([cat, limit]) => {
              const spent = categorySpent[cat] || 0;
              const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold">{cat}</span>
                    <span className="text-slate-500 font-medium">
                      {formatAmt(spent)} / <span className="text-slate-800 font-bold">{formatAmt(limit)}</span>
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        spent > limit 
                          ? "bg-rose-500" 
                          : percentage > 75 
                          ? "bg-orange-500" 
                          : "bg-brand-teal"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Envelope Slider control */}
                  <div className="flex justify-between items-center gap-4">
                    <input
                      type="range"
                      min={currency === "INR" ? "500" : "10"}
                      max={currency === "INR" ? "25000" : "800"}
                      step={currency === "INR" ? "500" : "10"}
                      value={limit}
                      onChange={(e) => updateBudgetLimit(cat, parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                    />
                    <span className="text-[10px] font-bold text-slate-400 w-10 text-right">
                      Edit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Goals card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Milestone className="h-4.5 w-4.5 text-brand-teal" />
                Milestone Savings Targets
              </h3>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            {showGoalForm && (
              <form onSubmit={handleAddGoalSubmit} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Goal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Study Abroad"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target ({currency === "INR" ? "₹" : "$"})
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={currency === "INR" ? "50000" : "1500"}
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-teal text-white px-3 py-1.5 text-[10px] font-bold hover:bg-brand-teal-light shadow-sm"
                  >
                    Save Target
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {goals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No active goals configured.</p>
              ) : (
                goals.map((g) => {
                  const percent = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                  return (
                    <div key={g.id} className="space-y-1.5 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                      
                      {/* Name/Edit */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{g.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                        </div>
                        <button
                          onClick={() => deleteSavingsGoal(g.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Slider to edit goal funding */}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={g.target}
                          step={currency === "INR" ? "500" : "10"}
                          value={g.current}
                          onChange={(e) => updateGoalSavings(g.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600 shrink-0 w-24 text-right">
                          {formatAmt(g.current)} / {formatAmt(g.target)}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
