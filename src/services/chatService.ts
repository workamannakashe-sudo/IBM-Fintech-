import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, isSupabaseConfigured } from "../utils/supabase/client";
import { sanitizeInput } from "../utils/security";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "bob";
  content: string;
  created_at: string;
}

export interface FinancialContextPayload {
  monthlyAllowance: number;
  remainingBudget: number;
  totalSpentThisMonth: number;
  dailyBurnRate: number;
  topSpendingCategory?: string;
  currency: "USD" | "INR";
  preferredLanguage?: "en" | "hi" | "mr";
  activeSavingsGoals: Array<{ name: string; target: number; current: number }>;
  recentTransactions: Array<{ date: string; description: string; amount: number; category: string }>;
  profile: {
    name?: string;
    course?: string;
    year?: number;
    state?: string;
    income_bracket?: string;
    category?: string;
  };
  loansSummary?: {
    totalDebt: number;
    monthlyEmi: number;
  };
}

export interface SendMessageParams {
  message: string;
  chatHistory: Array<{ role: "user" | "assistant" | "bob"; content: string }>;
  financialContext: FinancialContextPayload;
}

// System Prompt for FinBuddy AI Assistant
export function buildFinBuddySystemPrompt(fc: FinancialContextPayload): string {
  const sym = fc.currency === "INR" ? "₹" : "$";
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - new Date().getDate() + 1);

  const savingsSummary = fc.activeSavingsGoals.length > 0
    ? fc.activeSavingsGoals.map((g) => `${g.name}: ${sym}${g.current.toLocaleString()}/${sym}${g.target.toLocaleString()}`).join(", ")
    : "No active savings goals set.";

  const recentTxSummary = fc.recentTransactions.length > 0
    ? fc.recentTransactions.slice(0, 5).map((t) => `${t.description} (${sym}${t.amount.toLocaleString()} - ${t.category})`).join("; ")
    : "No recent transactions logged.";

  const topCategoryText = fc.topSpendingCategory || "Food & Dining";

  return `You are "FinBuddy", the intelligent, friendly, and empowering AI financial assistant for BudgetMitra, tailored specifically for Indian college students and young adults.

Your core mission:
1. Promote financial literacy, smart spending habits, and debt awareness.
2. Provide concrete, actionable, plain-language financial guidance.
3. NEVER spam generic disclaimers or legal waivers. Keep answers crisp, warm, and student-relatable (like a financially savvy senior student).
4. ALWAYS ground your answers in the student's real-time live financial metrics below. CITE THEIR EXACT NUMBERS whenever answering budgeting, spending, or affordability questions!

=== LIVE STUDENT FINANCIAL CONTEXT ===
• Student Name: ${fc.profile.name || "Student"}
• Degree & Year: ${fc.profile.course || "B.Tech"} (Year ${fc.profile.year || 1})
• Domicile State: ${fc.profile.state || "Maharashtra"}
• Social Category: ${fc.profile.category || "General"} | Family Income Bracket: ${fc.profile.income_bracket || "₹1–3 Lakhs"}
• Monthly Allowance / Income: ${sym}${fc.monthlyAllowance.toLocaleString()}
• Total Spent This Month: ${sym}${fc.totalSpentThisMonth.toLocaleString()}
• Remaining Available Balance: ${sym}${fc.remainingBudget.toLocaleString()}
• Current Daily Burn Rate: ${sym}${fc.dailyBurnRate.toFixed(0)}/day
• Days Remaining in Current Month: ${daysRemaining} days
• Safe Spending Buffer: ${sym}${(fc.remainingBudget / daysRemaining).toFixed(0)}/day
• Top Spending Category: ${topCategoryText}
• Active Savings Goals: ${savingsSummary}
• Recent Transactions: ${recentTxSummary}
${fc.loansSummary ? `• Student Debt / EMI: Total Debt ${sym}${fc.loansSummary.totalDebt.toLocaleString()}, Monthly EMI ${sym}${fc.loansSummary.monthlyEmi.toLocaleString()}` : ""}
======================================

GUIDELINES:
- When asked "Can I afford X?", calculate: Is price > remaining budget? Does it drop their daily allowance below a safe threshold? Conclude with an explicit YES, CAUTION, or NO, citing their remaining balance and days left.
- When asked about scholarships or schemes, highlight relevant options for their state (${fc.profile.state || "India"}) and category (${fc.profile.category || "General"}) such as NSP, PMSS, AICTE Pragati, or State Freeships.
- When asked about loans, explain EMI calculations simply and motivate them with accelerated prepayment benefits.
- Keep answers under 4-5 sentences unless a structured step-by-step breakdown is requested.
- Language control:
  - If preferredLanguage is "hi", respond naturally in conversational Hindi (Devanagari script).
  - If preferredLanguage is "mr", respond naturally in conversational Marathi (Devanagari script).
  - Otherwise, respond in clear English.`;
}

// Offline Heuristic Decision Engine (Resilient Fallback)
function generateHeuristicResponse(message: string, fc: FinancialContextPayload): string {
  const text = message.toLowerCase();
  const sym = fc.currency === "INR" ? "₹" : "$";
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - new Date().getDate() + 1);
  const safeDaily = (fc.remainingBudget / daysRemaining).toFixed(0);

  // 1. Affordability check
  const priceMatch = message.match(/(?:₹|\$|rs\.?|inr|usd)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (text.includes("afford") || text.includes("buy") || text.includes("purchase") || text.includes("cost") || text.includes("spend")) {
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (price > fc.remainingBudget) {
        return `❌ **Verdict: NO for now.** That purchase of ${sym}${price.toLocaleString()} exceeds your remaining balance of ${sym}${fc.remainingBudget.toLocaleString()}. You have ${daysRemaining} days left in the month with a safe spending allowance of ${sym}${safeDaily}/day. Waiting until your next allowance refresh or seeking a student discount is highly recommended!`;
      }
      if (price > fc.remainingBudget * 0.4) {
        return `⚠️ **Verdict: CAUTION.** ${sym}${price.toLocaleString()} will take over 40% of your remaining balance (${sym}${fc.remainingBudget.toLocaleString()}), leaving you with only ${sym}${(fc.remainingBudget - price).toLocaleString()} for the next ${daysRemaining} days (${sym}${((fc.remainingBudget - price) / daysRemaining).toFixed(0)}/day). If it's not essential, consider delaying for 1–2 weeks!`;
      }
      return `✅ **Verdict: YES, Affordable!** ${sym}${price.toLocaleString()} fits safely inside your remaining ${sym}${fc.remainingBudget.toLocaleString()} envelope. Even after this expense, you'll have ${sym}${(fc.remainingBudget - price).toLocaleString()} left (${sym}${((fc.remainingBudget - price) / daysRemaining).toFixed(0)}/day for ${daysRemaining} days).`;
    }
  }

  // 2. Budget & Burn rate overview
  if (text.includes("budget") || text.includes("burn rate") || text.includes("spending") || text.includes("balance") || text.includes("how much left")) {
    return `📊 **Your Live Budget Pulse:**\n• **Remaining Balance:** ${sym}${fc.remainingBudget.toLocaleString()} (out of ${sym}${fc.monthlyAllowance.toLocaleString()} allowance)\n• **Spent So Far:** ${sym}${fc.totalSpentThisMonth.toLocaleString()}\n• **Current Velocity:** ${sym}${fc.dailyBurnRate.toFixed(0)}/day vs. **Safe Buffer:** ${sym}${safeDaily}/day for the next ${daysRemaining} days.\n• **Top Category:** ${fc.topSpendingCategory || "Food & Dining"}.\n💡 *Tip: Keep daily variable spends under ${sym}${safeDaily} to preserve your savings goals!*`;
  }

  // 3. Scholarship & Schemes check
  if (text.includes("scholarship") || text.includes("scheme") || text.includes("grant") || text.includes("freeship") || text.includes("waiver")) {
    return `🎓 **Tailored Schemes for Your Profile:**\nBased on your profile (${fc.profile.category || "General"} category in ${fc.profile.state || "Maharashtra"} with family income ${fc.profile.income_bracket || "₹1-3L"}):\n1. **National Scholarship Portal (NSP)** — Post-Matric & Central Sector Merit schemes.\n2. **AICTE Pragati & Saksham** — For technical degree & diploma students.\n3. **State Domicile Waivers** — Visit the Scholarships tab in BudgetMitra for 1-click matching and official application links!`;
  }

  // 4. Student Loan & EMI explanation
  if (text.includes("loan") || text.includes("emi") || text.includes("interest") || text.includes("amortization")) {
    return `💳 **Smart Loan Management Rule:**\nStudent loans amortize monthly: **EMI = P × r × (1+r)^n / ((1+r)^n − 1)**.\n💡 *Pro tip: Adding even ${sym}${fc.currency === "INR" ? "500" : "50"}/month extra toward your principal dramatically reduces compound interest and can shave months off your repayment tenure! Check our Loans tab for the interactive accelerated payoff simulator.*`;
  }

  // 5. Saving Tips & Goals
  if (text.includes("save") || text.includes("tip") || text.includes("goal") || text.includes("money")) {
    return `💡 **Top 3 Student Saving Tactics for You:**\n1. **Mess & Food Optimization:** Discretionary dining is often 40%+ of student spend. Cap delivery orders to once a week.\n2. **Campus Transit Passes:** Avail student monthly concession passes for local buses/trains.\n3. **50/30/20 Rule:** Allocate 50% for Needs (${sym}${(fc.monthlyAllowance * 0.5).toFixed(0)}), 30% for Wants (${sym}${(fc.monthlyAllowance * 0.3).toFixed(0)}), and 20% for Savings (${sym}${(fc.monthlyAllowance * 0.2).toFixed(0)}).`;
  }

  // General welcoming response
  return `👋 Hi ${fc.profile.name || "there"}! I'm **FinBuddy**, your BudgetMitra financial assistant. You currently have **${sym}${fc.remainingBudget.toLocaleString()}** remaining this month with **${daysRemaining} days** left (${sym}${safeDaily}/day safe spend). Ask me anything about checking purchases, managing your loan, finding scholarships, or cutting expenses!`;
}

// Primary Chat Service Dispatcher
export async function sendChatMessage({
  message,
  chatHistory,
  financialContext,
}: SendMessageParams): Promise<string> {
  const sanitizedMessage = sanitizeInput(message.trim());
  if (!sanitizedMessage) return "Please enter a question or query.";

  const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) || "";

  if (apiKey && apiKey !== "optional_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const systemInstruction = buildFinBuddySystemPrompt(financialContext);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
      });

      // Build multi-turn history
      const history = chatHistory.slice(-10).map((item) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.content }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(sanitizedMessage);
      const text = result.response.text();

      if (text) {
        return text.trim();
      }
    } catch (err) {
      console.warn("sendChatMessage: Gemini live call failed, falling back to local heuristic intelligence:", err);
    }
  }

  // Deterministic local reasoning fallback
  return generateHeuristicResponse(sanitizedMessage, financialContext);
}

// Database Persistence Helpers
export async function loadRecentChatHistory(profileId: string | null): Promise<ChatMessage[]> {
  if (isSupabaseConfigured() && profileId) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("user_id", profileId)
        .order("created_at", { ascending: true })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data as ChatMessage[];
      }
    } catch (err) {
      console.warn("Failed to load chat messages from Supabase:", err);
    }
  }

  // Fallback to local storage
  try {
    const saved = localStorage.getItem("bm_chat_messages");
    if (saved) {
      return JSON.parse(saved) as ChatMessage[];
    }
  } catch {
    /* ignore */
  }

  return [];
}

export async function persistChatMessageToStorage(
  profileId: string | null,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role,
    content,
    created_at: new Date().toISOString(),
  };

  // Local storage save
  try {
    const saved = localStorage.getItem("bm_chat_messages");
    const existing: ChatMessage[] = saved ? JSON.parse(saved) : [];
    const updated = [...existing.slice(-25), newMsg];
    localStorage.setItem("bm_chat_messages", JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  // Supabase save
  if (isSupabaseConfigured() && profileId) {
    try {
      await supabase.from("chat_messages").insert({
        user_id: profileId,
        role,
        content,
      });
    } catch (err) {
      console.warn("Failed to persist message to Supabase:", err);
    }
  }
}
