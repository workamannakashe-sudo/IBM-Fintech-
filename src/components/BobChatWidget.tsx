// BudgetMitra — IBM Bob Floating AI Companion Chat (BobChatWidget.tsx)
import React, { useState, useRef, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { askBob } from "../services/gemini";
import { askIBMBob } from "../services/ibmBob";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import { MessageSquare, X, Send, Sparkles, User } from "lucide-react";
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
  const {
    profile,
    transactions,
    goals,
    dailyBurnRate,
    totalSpentThisMonth,
    preferredLanguage,
    currency
  } = useFinancial();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "bob",
      text: "Hey! I'm Bob 🤖 — BudgetMitra's AI co-pilot. I can check if you can afford something, find government schemes, or explain any money concept. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dbProfileId = typeof window !== "undefined" ? localStorage.getItem("fw_db_profile_id") : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const actionChips = [
    { label: "🔥 Burn rate?", query: "How is my burn rate and spending this month?" },
    { label: "💡 Save tips", query: "Give me 3 practical tips to save money this month." },
    { label: "🎓 Schemes?", query: "Which scholarships or schemes am I likely eligible for?", redirect: "scholarships" },
    { label: "🤔 Afford check", query: `Can I afford to buy a new headset worth ${currency === "INR" ? "₹14,000" : "$180"}?` },
  ];

  const persistToDB = async (role: "user" | "bob", content: string) => {
    if (!isSupabaseConfigured() || !dbProfileId) return;
    try {
      await supabase.from("chat_messages").insert({
        user_id: dbProfileId,
        role,
        content,
      });
    } catch (err) {
      console.warn("Failed to persist chat message:", err);
    }
  };

  const handleSend = async (textToSend: string, redirectTab?: string) => {
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

    if (redirectTab) setActiveTab(redirectTab);

    persistToDB("user", textToSend);

    const financialContext = {
      remainingBudget: Math.max(0, profile.monthlyAllowance - totalSpentThisMonth),
      monthlyAllowance: profile.monthlyAllowance,
      totalSpentThisMonth,
      dailyBurnRate,
      savingsGoals: goals.map((g) => ({ name: g.name, target: g.target, current: g.current })),
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    };

    const chatHistory = messages
      .filter((m) => m.id !== "m0")
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "model") as "user" | "model",
        parts: m.text,
      }));

    try {
      const responseText = await askIBMBob({
        message: textToSend,
        financialContext: {
          liquidBalance: financialContext.remainingBudget,
          monthlyIncome: financialContext.monthlyAllowance,
          totalSpentThisMonth: financialContext.totalSpentThisMonth,
          dailyBurnRate: financialContext.dailyBurnRate,
          budgetLimit: financialContext.monthlyAllowance,
          savingsGoals: financialContext.savingsGoals,
          recentTransactions: transactions.slice(0, 5).map((t) => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category,
          })),
        },
      }).catch(async () => {
        return await askBob({
          message: textToSend,
          chatHistory,
          preferredLanguage,
          financialContext,
        });
      });

      const bobMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bob",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, bobMsg]);
      persistToDB("bob", responseText);
    } catch (err) {
      const errMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bob",
        text: "I'm having a momentary connection issue. Feel free to ask again!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const unreadCount = messages.filter((m) => m.sender === "bob" && !isOpen).length;

  return (
    <>
      {/* Floating Bob Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        id="bob-chat-toggle"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-blue-600 dark:bg-gradient-to-r dark:from-[#ff2d78] dark:to-[#bd00ff] text-white shadow-xl shadow-blue-500/30 dark:shadow-[0_0_20px_rgba(255,45,120,0.5)] hover:scale-105 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
        aria-label="Open Bob Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: 90, scale: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MessageSquare className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && unreadCount > 1 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-84 sm:w-96 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181f] shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-blue-600 dark:bg-[#121217] dark:border-b dark:border-zinc-800 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white/20 dark:bg-[#ff2d78]/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white dark:text-[#ff2d78]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">IBM Bob</p>
                  <p className="text-blue-100 dark:text-zinc-400 text-[10px]">BudgetMitra AI Co-Pilot</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Feed */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 dark:bg-[#09090b]/50 no-scrollbar max-h-72"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl shrink-0 flex items-center justify-center ${
                      msg.sender === "bob"
                        ? "bg-blue-600 dark:bg-[#ff2d78] text-white"
                        : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-white"
                    }`}
                  >
                    {msg.sender === "bob" ? (
                      <Sparkles className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === "bob"
                        ? "bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-tl-sm shadow-xs"
                        : "bg-blue-600 dark:bg-[#ff2d78] text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                    <p
                      className={`text-[9px] mt-1 text-right ${
                        msg.sender === "bob"
                          ? "text-slate-400 dark:text-zinc-500"
                          : "text-blue-200 dark:text-pink-200"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-xl bg-blue-600 dark:bg-[#ff2d78] flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-xs">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-[#ff2d78]"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#18181f]">
              {actionChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.query, chip.redirect)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-cyan-950/40 px-2.5 py-1 text-[10px] text-slate-600 dark:text-zinc-300 font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 bg-white dark:bg-[#18181f] border-t border-slate-100 dark:border-zinc-800">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={
                  preferredLanguage === "hi"
                    ? "Bob से पूछें..."
                    : preferredLanguage === "mr"
                    ? "Bob ला विचारा..."
                    : "Ask Bob anything..."
                }
                className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#ff2d78] transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              <button
                onClick={() => handleSend(inputValue)}
                disabled={loading || !inputValue.trim()}
                className="h-8 w-8 rounded-xl bg-blue-600 dark:bg-[#ff2d78] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
