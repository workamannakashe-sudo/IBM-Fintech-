// BudgetMitra — IBM Bob Floating AI Companion Chat (BobChatWidget.tsx)
// Persistent chat with IBM Bob, saves messages to Supabase chat_messages table.
import React, { useState, useRef, useEffect } from "react";
import { useFinancial } from "../context/FinancialContext";
import { askBob } from "../services/gemini";
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

const LANG_LABEL: Record<string, string> = { en: "EN", hi: "हिन्दी", mr: "मराठी" };

const getWelcomeMessage = (lang: string): string => {
  if (lang === "hi") return "नमस्ते! मैं Bob हूँ — BudgetMitra का AI financial co-pilot। आपका बजट कैसा चल रहा है? कोई भी खर्च, scholarship, या loan के बारे में पूछ सकते हैं!";
  if (lang === "mr") return "नमस्कार! मी Bob आहे — BudgetMitra चा AI financial co-pilot. तुमचं बजेट कसं चालू आहे? कोणताही खर्च, scholarship, किंवा loan बद्दल विचारा!";
  return "Hey! I'm Bob 🤖 — BudgetMitra's IBM-powered AI co-pilot. I can check if you can afford something, find scholarships you qualify for, or explain any money concept. What's on your mind?";
};

export const BobChatWidget: React.FC<BobChatWidgetProps> = ({ setActiveTab }) => {
  const {
    profile, transactions, goals, dailyBurnRate, totalSpentThisMonth,
    preferredLanguage, setPreferredLanguage,
  } = useFinancial();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dbProfileId = typeof window !== "undefined" ? localStorage.getItem("fw_db_profile_id") : null;

  // Init welcome message based on language
  useEffect(() => {
    setMessages([{
      id: "m0", sender: "bob",
      text: getWelcomeMessage(preferredLanguage),
      timestamp: new Date(),
    }]);
  }, [preferredLanguage]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const actionChips = [
    { label: "🔥 Burn rate?", query: "How is my burn rate and spending this month?" },
    { label: "💡 Save tips", query: "Give me 3 practical tips to save money this month." },
    { label: "🎓 Scholarships?", query: "Which scholarships am I likely eligible for?", redirect: "scholarships" },
    { label: "🤔 Can I buy phone?", query: "Can I afford to buy a new smartphone worth ₹18,000?" },
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
      sender: "user", text: textToSend, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    if (redirectTab) setActiveTab(redirectTab);

    // Persist user message
    persistToDB("user", textToSend);

    const financialContext = {
      remainingBudget: Math.max(0, profile.monthlyAllowance - totalSpentThisMonth),
      monthlyAllowance: profile.monthlyAllowance,
      totalSpentThisMonth,
      dailyBurnRate,
      savingsGoals: goals.map(g => ({ name: g.name, target: g.target, current: g.current })),
      recentTransactions: transactions.slice(0, 5).map(t => ({
        description: t.description, amount: t.amount, category: t.category,
      })),
    };

    const chatHistory = messages
      .filter(m => m.id !== "m0") // Skip welcome msg
      .map(m => ({
        role: (m.sender === "user" ? "user" : "model") as "user" | "model",
        parts: m.text,
      }));

    try {
      const responseText = await askBob({
        message: textToSend,
        chatHistory,
        preferredLanguage,
        financialContext,
      });

      const bobMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bob", text: responseText, timestamp: new Date(),
      };
      setMessages(prev => [...prev, bobMsg]);
      persistToDB("bob", responseText);
    } catch (err) {
      const errMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bob",
        text: "Sorry, I had trouble connecting. Check your API key in settings, or try again!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(inputValue); }
  };

  const unreadCount = messages.filter(m => m.sender === "bob" && !isOpen).length;

  return (
    <>
      {/* Floating Bob Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        id="bob-chat-toggle"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-400/30 hover:from-orange-400 hover:to-amber-400 transition-all flex items-center justify-center active:scale-95"
        aria-label="Open Bob Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }}>
                <X className="h-6 w-6" />
              </motion.div>
            : <motion.div key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <MessageSquare className="h-6 w-6" />
              </motion.div>
          }
        </AnimatePresence>
        {!isOpen && unreadCount > 1 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
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
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60 flex flex-col overflow-hidden"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">IBM Bob</p>
                  <p className="text-orange-100 text-[10px]">BudgetMitra AI Co-Pilot</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language toggle in chat header */}
                <div className="flex gap-1">
                  {(["en", "hi", "mr"] as const).map(lang => (
                    <button key={lang} onClick={() => setPreferredLanguage(lang)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                        preferredLanguage === lang
                          ? "bg-white text-orange-600"
                          : "text-white/70 hover:text-white"
                      }`}>
                      {LANG_LABEL[lang]}
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 no-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 rounded-xl shrink-0 flex items-center justify-center ${
                    msg.sender === "bob"
                      ? "bg-gradient-to-br from-orange-400 to-amber-400 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {msg.sender === "bob" ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === "bob"
                      ? "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm"
                      : "bg-orange-500 text-white rounded-tr-sm"
                  }`}>
                    {msg.text}
                    <p className={`text-[9px] mt-1 ${msg.sender === "bob" ? "text-slate-400" : "text-orange-200"}`}>
                      {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-orange-400"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-slate-100 bg-white">
              {actionChips.map(chip => (
                <button key={chip.label} onClick={() => handleSend(chip.query, chip.redirect)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 px-2.5 py-1 text-[10px] text-slate-600 font-medium transition-all disabled:opacity-50">
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-100">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={preferredLanguage === "hi" ? "Bob से पूछें..." : preferredLanguage === "mr" ? "Bob ला विचारा..." : "Ask Bob anything..."}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-orange-400 transition-colors placeholder:text-slate-400"
              />
              <button onClick={() => handleSend(inputValue)} disabled={loading || !inputValue.trim()}
                className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center hover:from-orange-400 hover:to-amber-400 transition-all disabled:opacity-50 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
