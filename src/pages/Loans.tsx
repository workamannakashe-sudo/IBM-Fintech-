// BudgetMitra Student Loan & EMI Accelerated Payoff Simulator (Loans.tsx)
import React, { useState, useMemo, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { simulateAcceleratedPayoff } from "../utils/finance";
import { 
  Percent, Sparkles, TrendingDown, BookOpen, BrainCircuit 
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { askLoanCoaching } from "../services/gemini";

export const Loans: React.FC = () => {
  const { loans, updateLoanExtraPayment, currency } = useFinancial();

  const targetLoan = loans[0] || {
    name: "Student Education Loan",
    principal: currency === "INR" ? 450000 : 8500,
    interestRate: currency === "INR" ? 8.15 : 5.5,
    termMonths: 120,
    extraPayment: 0,
  };

  // State sliders (re-initialize when currency switches dynamically)
  const [principal, setPrincipal] = useState(targetLoan.principal);
  const [rate, setRate] = useState(targetLoan.interestRate);
  const [term, setTerm] = useState(targetLoan.termMonths);
  const [extraPayment, setExtraPayment] = useState(targetLoan.extraPayment);

  // AI Coaching States
  const [coachingText, setCoachingText] = useState<string | null>(null);
  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false);
  const [coachingError, setCoachingError] = useState<string | null>(null);
  
  useEffect(() => {
    setPrincipal(targetLoan.principal);
    setRate(targetLoan.interestRate);
    setTerm(targetLoan.termMonths);
    setExtraPayment(targetLoan.extraPayment);
    setCoachingText(null); // Reset explanation if inputs change
  }, [currency, loans]);

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  // Run payoff simulations
  const { standard, accelerated, monthsSaved, interestSaved } = useMemo(() => {
    return simulateAcceleratedPayoff(principal, rate, term, extraPayment);
  }, [principal, rate, term, extraPayment]);

  const handleSliderChange = (val: number) => {
    setExtraPayment(val);
    setCoachingText(null); // Reset explanation on slider modifications
    if (loans[0]) {
      updateLoanExtraPayment(loans[0].id, val);
    }
  };

  const handleRequestCoaching = async () => {
    setIsLoadingCoaching(true);
    setCoachingError(null);
    try {
      const res = await askLoanCoaching({
        loanName: loans[0]?.name || "Student Loan",
        principal,
        interestRate: rate,
        termMonths: term,
        extraPayment,
        standardMetrics: {
          monthlyPayment: standard.monthlyPayment,
          totalInterest: standard.totalInterest,
          monthsToPay: standard.monthsToPay
        },
        acceleratedMetrics: {
          monthlyPayment: standard.monthlyPayment + extraPayment,
          totalInterest: accelerated.totalInterest,
          monthsToPay: accelerated.monthsToPay,
          monthsSaved,
          interestSaved
        }
      });
      setCoachingText(res);
    } catch (err) {
      console.error("Loan coaching failed:", err);
      setCoachingError("Unable to retrieve dynamic loan payoff analysis. Check your settings.");
    } finally {
      setIsLoadingCoaching(false);
    }
  };

  // Currency helper
  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Chart Data
  const chartData = useMemo(() => {
    const list: any[] = [];
    const step = Math.max(1, Math.round(standard.amortization.length / 10));
    
    for (let i = 0; i < standard.amortization.length; i += step) {
      const p = standard.amortization[i];
      const accP = accelerated.amortization.find(x => x.month === p.month) || { remainingBalance: 0 };
      list.push({
        month: `Mo ${p.month}`,
        Standard: Math.round(p.remainingBalance),
        Accelerated: Math.round(accP.remainingBalance),
      });
    }

    const lastStd = standard.amortization[standard.amortization.length - 1];
    if (lastStd) {
      list.push({
        month: `Mo ${lastStd.month}`,
        Standard: 0,
        Accelerated: 0,
      });
    }
    return list;
  }, [standard, accelerated]);

  // Dynamic ranges based on currency
  const limits = useMemo(() => {
    if (currency === "INR") {
      return {
        principalMin: 50000,
        principalMax: 1500000,
        principalStep: 10000,
        extraMin: 0,
        extraMax: 25000,
        extraStep: 500,
      };
    }
    return {
      principalMin: 1000,
      principalMax: 35000,
      principalStep: 500,
      extraMin: 0,
      extraMax: 300,
      extraStep: 10,
    };
  }, [currency]);

  // Glossary Terms Data (Localized to Indian Banking and General Terms)
  const glossary = useMemo(() => {
    if (currency === "INR") {
      return [
        {
          term: "SBI Scholar Loan",
          def: "Special education loan scheme offered by State Bank of India (SBI) for premier institutions with low interest rates, zero collateral requirements, and a flexible repayment moratorium.",
        },
        {
          term: "Moratorium Period",
          def: "A repayment holiday duration (course duration plus 6 months or 1 year) during which the student is not required to pay any EMI. However, interest continues to accumulate.",
        },
        {
          term: "MCLR / Repolinked Rate",
          def: "The minimum interest rate a bank can lend at. Most retail loans (including education and home loans) are linked directly to RBI Repo Rate spikes.",
        },
        {
          term: "Collateral Guarantee",
          def: "Security (like property, fixed deposits, or gold) pledged by the borrower. Loans above ₹7.5 Lakhs in India usually require collateral guarantees, whereas premier college loans are collateral-free.",
        },
        {
          term: "Section 80E Tax Deduction",
          def: "A deduction under Section 80E of the Income Tax Act which allows taxpayers to claim tax deductions on the interest component paid on education loans for up to 8 years.",
        },
      ];
    }
    return [
      {
        term: "Subsidized Loan",
        def: "A federal student loan where the government pays (subsidizes) the interest accrued while you are enrolled in college at least half-time. This saves you tons of cash!",
      },
      {
        term: "Unsubsidized Loan",
        def: "A federal loan where interest starts compounding immediately from the day the loan is disbursed. It builds up even while you are in class.",
      },
      {
        term: "Grace Period",
        def: "The period (usually 6 months) after you graduate, leave school, or drop below half-time enrollment before you must start making monthly principal payments.",
      },
      {
        term: "Amortization",
        def: "The process of spreading out loan payments over time. Each monthly payment is split between covering the interest and reducing the principal balance.",
      },
      {
        term: "Compound Interest",
        def: "Interest calculated on both the initial principal balance AND the accumulated interest of previous periods. It causes debt to grow exponentially if left unpaid.",
      },
    ];
  }, [currency]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Loan & Payoff Simulator
        </h1>
        <p className="text-sm text-slate-500">
          Simulate simple/compound interest loans, test the impact of extra monthly contributions, and study amortization timelines.
        </p>
      </div>

      {/* Main interactive calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sliders Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Percent className="h-4.5 w-4.5 text-brand-teal" />
            Simulation Sliders
          </h3>

          {/* Principal */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Principal Amount</span>
              <span className="font-bold">{formatAmt(principal)}</span>
            </div>
            <input
              type="range"
              min={limits.principalMin}
              max={limits.principalMax}
              step={limits.principalStep}
              value={principal}
              onChange={(e) => setPrincipal(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
            <p className="text-[9px] text-slate-400">Total initial borrowed amount</p>
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Annual Interest Rate</span>
              <span className="font-bold">{rate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
            <p className="text-[9px] text-slate-400">Fixed rate of interest over the loan tenure</p>
          </div>

          {/* Term duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Repayment Term</span>
              <span className="font-bold">{term} Months</span>
            </div>
            <input
              type="range"
              min="12"
              max="240"
              step="12"
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
            <p className="text-[9px] text-slate-400">Number of months scheduled for full amortization</p>
          </div>

          {/* Extra Payoff */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Extra Monthly Payment</span>
              <span className="font-bold text-amber-600">+{formatAmt(extraPayment)}/mo</span>
            </div>
            <input
              type="range"
              min={limits.extraMin}
              max={limits.extraMax}
              step={limits.extraStep}
              value={extraPayment}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[9px] text-slate-400">Speeds up payoff and saves compound interest</p>
          </div>

        </div>

        {/* Payoff summaries compare */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Comparative Metrics layout */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Standard Plan */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Standard Monthly Payment
              </p>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                {formatAmt(standard.monthlyPayment)}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Payoff Duration:</span>
                  <span className="font-bold">{standard.monthsToPay} mos</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Interest:</span>
                  <span className="font-bold">{formatAmt(standard.totalInterest)}</span>
                </div>
              </div>
            </div>

            {/* Accelerated Plan */}
            <div className="rounded-2xl border border-amber-200/50 bg-amber-50/20 p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Accelerated Payment
              </p>
              <p className="text-2xl font-bold font-display text-slate-900 mt-1">
                {formatAmt(standard.monthlyPayment + extraPayment)}
              </p>
              <div className="mt-4 pt-3 border-t border-amber-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between text-amber-700">
                  <span>Payoff Duration:</span>
                  <span className="font-bold">{accelerated.monthsToPay} mos</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Total Interest:</span>
                  <span className="font-bold">{formatAmt(accelerated.totalInterest)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Savings Highlight Box */}
          {extraPayment > 0 && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Accelerated Savings</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    You save <span className="font-bold">{formatAmt(interestSaved)}</span> in compound interest and cut off <span className="font-bold">{monthsSaved} months</span> of loan repayments!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Loan Payoff Explainer Tool */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BrainCircuit className="h-4.5 w-4.5 text-brand-teal animate-pulse" />
                  AI Payoff Explainer
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Let Bob explain how compound interest and monthly accelerations affect your specific numbers.
                </p>
              </div>
              <button
                onClick={handleRequestCoaching}
                disabled={isLoadingCoaching}
                className="rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold px-4 py-2 shadow-sm transition-colors cursor-pointer select-none shrink-0"
              >
                {isLoadingCoaching ? "Bob is Analyzing..." : "Explain payoff with AI"}
              </button>
            </div>

            {isLoadingCoaching && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-teal" />
                <span className="text-xs text-slate-500 font-medium">Analyzing loan structure...</span>
              </div>
            )}

            {coachingError && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 font-medium">
                {coachingError}
              </div>
            )}

            {coachingText && (
              <div className="rounded-xl bg-teal-50/30 border border-teal-100/50 p-4 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line animate-in fade-in slide-in-from-top-1 duration-200 font-sans">
                {coachingText}
              </div>
            )}
          </div>

          {/* Line Chart comparing paths */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
              Payoff Timeline Trajectory (Balance over months)
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" fontSize={9} stroke="#64748B" />
                  <YAxis fontSize={9} stroke="#64748B" />
                  <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="Standard" stroke="#94A3B8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Accelerated" stroke="#4F46E5" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Glossary Glossary Terms */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <BookOpen className="h-4.5 w-4.5 text-brand-teal" />
          Bob's Financial Literacy Glossary
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {glossary.map((g, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTerm(g.term === selectedTerm ? null : g.term)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                g.term === selectedTerm
                  ? "bg-brand-teal text-white border-brand-teal"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {g.term}
            </button>
          ))}
        </div>

        {selectedTerm && (
          <div className="rounded-xl bg-teal-50/50 border border-teal-100 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-teal text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-0.5">{selectedTerm}</p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {glossary.find(g => g.term === selectedTerm)?.def}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
