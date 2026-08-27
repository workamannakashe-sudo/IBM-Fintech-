// FinWise Floating AI Companion Chatbot Drawer (BobChatWidget.tsx)
import React, { useState, useRef, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { askBob } from "../services/gemini";
import { MessageSquare, X, Send, Bot, Sparkles, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: "user" | "bob";
  text: string;
  timestamp: Date;
}

interface BobChatWidgetProps {
  setActiveTab: (tab: string) => void;
}

export const BobChatWidget: React.FC<BobChatWidgetProps> = ({ setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "bob",
      text: "Hey! I'm Bob, your campus financial buddy. Need to check if a purchase fits your budget, evaluate student loan terms, or find scholarships? Drop a question below!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    profile,
    transactions,
    goals,
    dailyBurnRate,
    totalSpentThisMonth,
    budgets,
  } = useFinancial();

  // Scroll message feed to bottom on new updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Suggested shortcut pills
  const actionChips = [
    { label: "🔥 How's my burn rate?", query: "How is my burn rate and spending velocity looking this month?" },
    { label: "☕ Can I afford coffee?", query: "Can I afford coffee today?" },
    { label: "🎓 Match scholarships", query: "Suggest a matching scholarship for me", redirect: "scholarships" },
    { label: "💸 Accelerated loan payoff?", query: "How does paying an extra $50 a month affect my loan repayment?", redirect: "loans" },
  ];

  const handleSendMessage = async (textToSend: string, redirectTab?: string) => {
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    if (redirectTab) {
      setActiveTab(redirectTab);
    }

    // 2. Format Context for Gemini
    const financialContext = {
      liquidBalance: profile.monthlyAllowance - totalSpentThisMonth, // Liquid cash cushion approximation
      monthlyIncome: profile.monthlyAllowance,
      totalSpentThisMonth,
      dailyBurnRate,
      budgetLimit: Object.values(budgets).reduce((sum, v) => sum + v, 0),
      savingsGoals: goals.map(g => ({ name: g.name, target: g.target, current: g.current })),
      recentTransactions: transactions.slice(0, 5).map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    };

    // Format chat history into Gemini prompt structure
    const chatHistory = messages.map((m) => ({
      role: (m.sender === "user" ? "user" : "model") as "user" | "model",
      parts: m.text,
    }));

    try {
      const responseText = await askBob({
        message: textToSend,
        chatHistory,
        financialContext,
      });

      const bobMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bob",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, bobMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-brand-teal px-4 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/80">
                  <Bot className="h-4.5 w-4.5" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-brand-teal" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-none">Ask Bob</h4>
                  <span className="text-[10px] text-teal-200">Personal AI Financial Coach</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 hover:bg-teal-800 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Message Feed */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 scroll-smooth"
            >
              {messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 max-w-[85%] ${
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        isUser ? "bg-teal-100 text-teal-800" : "bg-teal-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs leading-normal shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                        isUser
                          ? "bg-brand-teal text-white rounded-tr-none"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-start gap-2 max-w-[80%] mr-auto">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Pills */}
            <div className="border-t border-slate-100 bg-white px-3 py-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Suggested Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {actionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query, chip.redirect)}
                    className="rounded-full border border-slate-200 hover:border-brand-teal hover:bg-teal-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-brand-teal transition-all select-none"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3"
            >
              <input
                type="text"
                placeholder="Ask Bob about budgets, loans, or goals..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-teal transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-white hover:bg-brand-teal-light shadow-sm disabled:opacity-50 transition-colors"
                disabled={loading || !inputValue.trim()}
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mascot Button Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal hover:bg-brand-teal-light text-white shadow-lg shadow-teal-700/20 hover:scale-105 transition-all duration-200 group relative border border-white/20"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
        <MessageSquare className="h-6 w-6 group-hover:rotate-6 transition-transform" />
      </button>
    </div>
  );
};
