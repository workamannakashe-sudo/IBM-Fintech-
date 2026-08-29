// AskFinBuddyWidget.tsx — Floating AI Financial Copilot Chatbot
// Grounded in real-time student finances with multi-turn history & Supabase persistence.
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useFinancial } from "../context/FinancialContext";
import {
  sendChatMessage,
  loadRecentChatHistory,
  persistChatMessageToStorage,
  type ChatMessage,
  type FinancialContextPayload,
} from "../services/chatService";
import {
  X,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Trash2,
  Minimize2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AskFinBuddyWidgetProps {
  setActiveTab?: (tab: string) => void;
}

export const AskFinBuddyWidget: React.FC<AskFinBuddyWidgetProps> = ({ setActiveTab }) => {
  const {
    profile,
    transactions,
    goals,
    loans,
    dailyBurnRate,
    totalSpentThisMonth,
    currency,
    preferredLanguage,
  } = useFinancial();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dbProfileId = typeof window !== "undefined" ? localStorage.getItem("bm_profile_id") : null;

  // Real-time Financial Context Calculation
  const financialContextPayload: FinancialContextPayload = useMemo(() => {
    const monthlyAllowance = profile.monthlyAllowance > 0 ? profile.monthlyAllowance : (currency === "INR" ? 15000 : 650);
    const remainingBudget = Math.max(0, monthlyAllowance - totalSpentThisMonth);

    // Compute top spending category
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topSpendingCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "Food & Dining";

    // Loans summary
    const totalDebt = loans.reduce((sum, l) => sum + l.principal, 0);
    const monthlyEmi = loans.reduce((sum, l) => sum + (l.principal * (l.interestRate / 100 / 12) * 1.1), 0);

    return {
      monthlyAllowance,
      remainingBudget,
      totalSpentThisMonth,
      dailyBurnRate: dailyBurnRate || (currency === "INR" ? 350 : 20),
      topSpendingCategory,
      currency,
      preferredLanguage,
      activeSavingsGoals: goals.map((g) => ({ name: g.name, target: g.target, current: g.current })),
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
      profile: {
        name: profile.name || "Student",
        course: profile.course || profile.major || "B.Tech",
        year: profile.year || 1,
        state: profile.state || "Maharashtra",
        income_bracket: profile.income_bracket || "1-3L",
        category: profile.category || "Gen",
      },
      loansSummary: totalDebt > 0 ? { totalDebt, monthlyEmi } : undefined,
    };
  }, [profile, transactions, goals, loans, dailyBurnRate, totalSpentThisMonth, currency, preferredLanguage]);

  // Load message history on open
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      loadRecentChatHistory(dbProfileId).then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Welcoming Intro Message
          const sym = currency === "INR" ? "₹" : "$";
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const daysRemaining = Math.max(1, daysInMonth - new Date().getDate() + 1);

          const introMsg: ChatMessage = {
            id: "m_intro",
            role: "assistant",
            content: `👋 Hi ${profile.name || "there"}! I'm **FinBuddy**, your personal AI financial assistant for **BudgetMitra**.\n\n📊 You currently have **${sym}${financialContextPayload.remainingBudget.toLocaleString()}** remaining for the next **${daysRemaining} days** (safe spend: **${sym}${(financialContextPayload.remainingBudget / daysRemaining).toFixed(0)}/day**).\n\nAsk me anything about checking purchases, managing your loan, finding scholarships, or cutting expenses!`,
            created_at: new Date().toISOString(),
          };
          setMessages([introMsg]);
        }
        setHasInitialized(true);
      });
    }
  }, [isOpen, hasInitialized, dbProfileId, profile.name, currency, financialContextPayload]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Quick Reply Chips
  const quickReplyChips = useMemo(() => {
    const sym = currency === "INR" ? "₹" : "$";
    const sampleItem = currency === "INR" ? "₹850 weekend dinner" : "$35 campus hoodie";

    return [
      {
        label: "📊 How's my budget?",
        query: "How is my budget and spending burn rate looking this month?",
      },
      {
        label: `🤔 Can I afford ${sampleItem}?`,
        query: `Can I afford to spend ${sym}${currency === "INR" ? "850" : "35"} on ${currency === "INR" ? "dinner with friends" : "a campus hoodie"}?`,
      },
      {
        label: "💳 Explain my loan",
        query: "How does my student loan interest calculate, and how can I save with accelerated prepayments?",
        redirect: "loans",
      },
      {
        label: "🎓 Suggest a scholarship",
        query: "Which scholarships and government schemes match my student profile?",
        redirect: "scholarships",
      },
    ];
  }, [currency]);

  const handleSendMessage = async (textToSend: string, redirectTab?: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setErrorState(null);
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    if (redirectTab && setActiveTab) {
      setActiveTab(redirectTab);
    }

    // Persist user message
    await persistChatMessageToStorage(dbProfileId, "user", trimmed);

    try {
      const responseContent = await sendChatMessage({
        message: trimmed,
        chatHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        financialContext: financialContextPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: "assistant",
        content: responseContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await persistChatMessageToStorage(dbProfileId, "assistant", responseContent);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorState("Unable to complete request. Tap retry to run offline heuristic.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem("bm_chat_messages");
    setHasInitialized(false);
    setMessages([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Simple Markdown text renderer for bolding, bullet points, and emoji tags
  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Bullet list item
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc my-0.5">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="ml-2 font-medium my-0.5">
            {renderInlineMarkdown(line)}
          </div>
        );
      }
      // Empty line spacer
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="my-0.5">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-slate-600 dark:text-zinc-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ─── Floating Action Button (FAB) ─── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer"
        title="Ask FinBuddy AI Financial Assistant"
        aria-label="Open FinBuddy AI Chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-white dark:border-slate-900" />
            </span>
          </div>
        )}
      </button>

      {/* ─── Floating Chat Panel / Drawer ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#121217]/95 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/60 flex flex-col overflow-hidden"
            style={{ maxHeight: "580px", height: "580px" }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 dark:from-[#181822] dark:to-[#0f0f14] border-b border-slate-800 px-5 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm tracking-tight font-display text-white">
                      Ask FinBuddy
                    </h3>
                    <span className="rounded-full bg-orange-500/20 border border-orange-400/30 px-1.5 py-0.2 text-[9px] font-bold text-orange-300">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Financial Grounding Connected</span>
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Live Financial Context Banner ── */}
            <div className="bg-slate-100 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                <span>
                  Remaining:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {currency === "INR" ? "₹" : "$"}
                    {financialContextPayload.remainingBudget.toLocaleString()}
                  </strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Allowance: {currency === "INR" ? "₹" : "$"}
                {financialContextPayload.monthlyAllowance.toLocaleString()}
              </span>
            </div>

            {/* ── Message Feed ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-[#0a0a0e]/50 no-scrollbar"
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-7 w-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                        isUser
                          ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white"
                          : "bg-slate-900 dark:bg-zinc-800 text-orange-400 border border-slate-700 dark:border-zinc-700"
                      }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-sm"
                          : "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none shadow-sm"
                      }`}
                    >
                      <div className="space-y-1">{renderFormattedMessage(msg.content)}</div>
                      <span
                        className={`text-[9px] mt-1 block text-right font-medium ${
                          isUser ? "text-orange-100" : "text-slate-400 dark:text-zinc-500"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Loading Animation */}
              {loading && (
                <div className="flex gap-2.5 items-center">
                  <div className="h-7 w-7 rounded-xl bg-slate-900 dark:bg-zinc-800 text-orange-400 border border-slate-700 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-xs">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-orange-500"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
                      Analyzing real-time finances...
                    </span>
                  </div>
                </div>
              )}

              {/* Error fallback alert */}
              {errorState && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{errorState}</span>
                  </div>
                  <button
                    onClick={() => handleSendMessage("How is my budget looking this month?")}
                    className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                </div>
              )}
            </div>

            {/* ── Suggested Quick-Reply Chips ── */}
            <div className="px-3 py-2 bg-white dark:bg-[#121217] border-t border-slate-100 dark:border-zinc-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplyChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSendMessage(chip.query, chip.redirect)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/90 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/40 dark:hover:border-orange-600 px-3 py-1 text-[10.5px] text-slate-700 dark:text-zinc-300 font-semibold transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* ── Input Bar ── */}
            <div className="p-3 bg-white dark:bg-[#121217] border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={
                  preferredLanguage === "hi"
                    ? "FinBuddy से कुछ भी पूछें..."
                    : preferredLanguage === "mr"
                    ? "FinBuddy ला काहीही विचारा..."
                    : "Ask FinBuddy anything about budget, loans, or savings..."
                }
                className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors shadow-inner"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={loading || !inputValue.trim()}
                className="h-9 w-9 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 transition-all disabled:opacity-40 disabled:hover:from-orange-500 cursor-pointer shrink-0"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
