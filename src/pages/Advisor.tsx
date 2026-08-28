import React, { useState, useRef, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { askCoach } from "../services/gemini";
import { Bot, Sparkles, User, Landmark, Lightbulb, PiggyBank, ShieldCheck, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: Date;
}

export const Advisor: React.FC = () => {
  const {
    profile,
    transactions,
    goals,
    dailyBurnRate,
    totalSpentThisMonth,
    budgets,
    currency,
  } = useFinancial();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "coach",
      text: `Hello ${profile.name || "there"}! I'm Coach FinWise, your AI wealth and saving advisor. Ask me anything about creating an emergency buffer, cutting down variable spending, optimizing envelope budgets, or compound interest payoff plans. I am fully grounded in your live cash flow status!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatAmt = (val: number) => {
    if (currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const liquidBalance = profile.monthlyAllowance - totalSpentThisMonth;
  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0);

  // Quick advice action chips
  const actionChips = [
    { label: "💡 How to grow my savings goals?", query: "Give me step by step strategies to fund my savings goals faster based on my income." },
    { label: "🛒 How can I save on food & dining?", query: "My food & dining expenses are a major part of discretionary costs. What are actionable ways to trim this?" },
    { label: "📊 What is the 50/30/20 rule?", query: "Explain the classic 50/30/20 budget envelope setup and how I can adopt it." },
    { label: "💳 Smart credit card rules?", query: "What are the core credit building rules and pitfalls young adults should avoid?" },
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    const financialContext = {
      liquidBalance,
      monthlyIncome: profile.monthlyAllowance,
      totalSpentThisMonth,
      dailyBurnRate,
      budgetLimit: totalBudget,
      savingsGoals: goals.map((g) => ({ name: g.name, target: g.target, current: g.current })),
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    };

    const chatHistory = messages.map((m) => ({
      role: (m.sender === "user" ? "user" : "model") as "user" | "model",
      parts: m.text,
    }));

    try {
      const responseText = await askCoach({
        message: textToSend,
        chatHistory,
        financialContext,
      });

      const coachMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "coach",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">AI Wealth Advisor</h1>
        <p className="text-sm text-slate-500">
          Get interactive saving suggestions, compound growth calculations, and personalized cash-flow guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Chat Console Column */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[600px]">
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display leading-tight">Coach FinWise</h3>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Financial Grounding Connected
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex items-start gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs shadow-sm ${
                    isUser ? "bg-teal-100 text-teal-800" : "bg-brand-teal text-white"
                  }`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-brand-teal text-white rounded-tr-none"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  }`}>
                    {m.text.split("\n").map((paragraph, index) => (
                      <p key={index} className={index > 0 ? "mt-2" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Chips Container */}
          <div className="border-t border-slate-100 bg-white px-6 py-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Inquiries</span>
            <div className="flex flex-wrap gap-2">
              {actionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 hover:border-brand-teal hover:bg-teal-50 px-3.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-brand-teal transition-all select-none cursor-pointer disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-3 border-t border-slate-100 bg-white px-6 py-4"
          >
            <input
              type="text"
              placeholder="Ask Coach FinWise about savings hacks, budget optimization, or investments..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-teal transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-bold px-5 py-2.5 text-xs shadow-md shadow-teal-700/10 transition-all select-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* AI Smart Recommendations Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-brand-teal" />
              Live Savings Insights
            </h3>

            {/* Empty Slate Warning */}
            {transactions.length === 0 ? (
              <div className="space-y-3 text-center py-6">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">No Transactions Logged</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                    Log your daily student expenses to generate personalized AI recommendations based on your actual budget velocity!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Cash Cushion Analysis */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cushion Cushion Analysis</span>
                  <div className="flex items-center gap-2">
                    {liquidBalance < 1000 ? (
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-800">
                      {liquidBalance < 1000 ? "Low Cash Reserve warning!" : "Healthy Reserve Envelope"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    You have {formatAmt(liquidBalance)} left out of your allowance.
                    {liquidBalance < 1000 
                      ? " Coach recommends pausing non-essential subscriptions immediately to avoid overdraft."
                      : " Pacing is within parameters. Keep active logging checks!"}
                  </p>
                </div>

                {/* Savings target rules */}
                {goals.length === 0 ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Savings Target Advice</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <PiggyBank className="h-4.5 w-4.5 text-brand-teal" />
                      <span className="text-xs font-bold">Goal-Driven Budgets</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      You haven't configured any Savings Goals. Head over to Budget & Goals and add a target (like an Emergency buffer) to enable savings rate tracking!
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Goal Acceleration Tip</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <PiggyBank className="h-4.5 w-4.5 text-brand-teal" />
                      <span className="text-xs font-bold">Auto-Saving Target</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      For your "{goals[0].name}" goal, transfer just {formatAmt(goals[0].target * 0.05)} next week to boost progress by 5%!
                    </p>
                  </div>
                )}

                {/* Envelope limit recommendation */}
                {totalBudget === 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Envelope allocations</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      All your envelope limits are currently ₹0 / $0. Open the Budgets tab to allocate limits for categories like Food & Dining to unlock velocity projections.
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Quick reference guide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-brand-teal" />
              Financial Advisor Principles
            </h4>
            <ul className="space-y-2 text-[10px] text-slate-500 leading-relaxed list-disc list-inside">
              <li><strong className="text-slate-800">Rule of 72</strong>: Divide 72 by your interest rate to estimate when your savings/investments will double.</li>
              <li><strong className="text-slate-800">50/30/20 Rule</strong>: Split income into 50% Needs, 30% Wants, and 20% Savings/Debt payoff.</li>
              <li><strong className="text-slate-800">Emergency Cushion</strong>: Aim to keep 3 to 6 months of basic fixed living expenses as a reserve buffer.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
