// BudgetMitra — IBM Bob AI Client (gemini.ts)
// Central service for all AI reasoning calls, each isolated with a fixed system prompt per feature.
// Powered by Gemini API — treated as "IBM Bob" in the UI.
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BOB_CHAT_SYSTEM_PROMPT,
  ADVISOR_COACH_SYSTEM_PROMPT,
  AFFORDABILITY_CHECK_SYSTEM_PROMPT,
  SCHEME_MATCHER_SYSTEM_PROMPT,
  LOAN_COACH_SYSTEM_PROMPT,
} from "../lib/prompts/financialAssistant";

// --- Init Gemini (IBM Bob) ---
const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  localStorage.getItem("fw_gemini_api_key") ||
  "";
let genAI: GoogleGenerativeAI | null = null;
if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") {
  genAI = new GoogleGenerativeAI(apiKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSE AUTO-CATEGORIZATION
// Maps to Indian student categories: food, rent, books, travel, entertainment, other
// ─────────────────────────────────────────────────────────────────────────────
export async function autoCategorizeExpense(description: string): Promise<string> {
  const cleanDesc = description.trim().toLowerCase();

  const heuristics = [
    { keys: ["rent", "hostel", "pg", "paying guest", "room", "flat", "deposit", "accommodation"], category: "rent" },
    { keys: ["coffee", "chai", "tea", "cafe", "boba", "dhaba", "dining", "mess", "canteen", "meal", "mcdonalds", "subway", "burger", "pizza", "zomato", "swiggy", "food", "grocery", "kirana", "supermarket", "vegetable", "fruit", "milk", "ration"], category: "food" },
    { keys: ["book", "textbook", "course", "notes", "tuition", "coaching", "stationery", "photocopy", "library", "lab", "syllabus", "material", "college fee", "exam fee", "university fee"], category: "books" },
    { keys: ["ola", "uber", "auto", "rickshaw", "bus", "train", "metro", "railway", "flight", "local", "taxi", "petrol", "fuel", "commute", "travel", "trip", "fare"], category: "travel" },
    { keys: ["netflix", "hotstar", "prime", "spotify", "gaana", "youtube premium", "cinema", "movie", "show", "concert", "game", "gaming", "cricket match", "outing", "pub", "club", "party", "event", "ticket"], category: "entertainment" },
  ];

  const fallback = () => {
    for (const rule of heuristics) {
      if (rule.keys.some((k) => cleanDesc.includes(k))) return rule.category;
    }
    return "other";
  };

  if (!genAI) return fallback();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Classify this Indian student expense description: "${description}"
into exactly one of these categories:
- food
- rent
- books
- travel
- entertainment
- other

Return ONLY the category name in lowercase. No explanation.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    const valid = ["food", "rent", "books", "travel", "entertainment", "other"];
    return valid.includes(text) ? text : fallback();
  } catch {
    return fallback();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANOMALY EXPLANATION
// ─────────────────────────────────────────────────────────────────────────────
export async function explainAnomaly(
  category: string,
  amount: number,
  averageAmount: number
): Promise<string> {
  const symbol = "₹";
  const fallback = `Your spending on "${category}" (${symbol}${amount.toFixed(0)}) is noticeably higher than your typical average of ${symbol}${averageAmount.toFixed(0)}. Bob flags this as a spike — review if this is a one-time event or a pattern.`;

  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `An Indian college student spent ₹${amount.toFixed(0)} in "${category}". Their typical average for this category is ₹${averageAmount.toFixed(0)}.
Explain this spending spike in a friendly, conversational tone in under 2 sentences. Frame it as an advisory alert from their AI financial companion Bob.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAN I AFFORD THIS? — IBM Bob Affordability Engine
// ─────────────────────────────────────────────────────────────────────────────
export async function askAffordabilityBob(params: {
  itemName: string;
  itemPrice: number;
  itemCategory: string;
  preferredLanguage: "en" | "hi" | "mr";
  financialContext: {
    remainingBudgetThisMonth: number;
    daysLeftInMonth: number;
    dailyBurnRate: number;
    monthlyAllowance: number;
    totalSpentThisMonth: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
  };
}): Promise<{
  decision: "YES" | "CAUTION" | "NO";
  reasoning: string;
  suggested_action: string;
}> {
  const { itemName, itemPrice, itemCategory, preferredLanguage, financialContext: fc } = params;

  const heuristicResult = () => {
    let decision: "YES" | "CAUTION" | "NO" = "YES";
    let reasoning = "";
    let suggested_action = "";

    const cushion = fc.remainingBudgetThisMonth - itemPrice;
    const projectedSpend = fc.dailyBurnRate * fc.daysLeftInMonth;

    if (itemPrice > fc.remainingBudgetThisMonth) {
      decision = "NO";
      reasoning = `This purchase of ₹${itemPrice.toFixed(0)} exceeds your remaining budget of ₹${fc.remainingBudgetThisMonth.toFixed(0)} with ${fc.daysLeftInMonth} days left. Buying this would leave you with negative funds.`;
      suggested_action = "Wait until next month's allowance arrives or explore the Scholarship Matcher for emergency funds.";
    } else if (cushion < fc.dailyBurnRate * 5 || projectedSpend > fc.remainingBudgetThisMonth - itemPrice) {
      decision = "CAUTION";
      reasoning = `You can technically afford this (₹${itemPrice.toFixed(0)}), but it leaves only ₹${cushion.toFixed(0)} — less than 5 days of your daily burn rate (₹${fc.dailyBurnRate.toFixed(0)}/day). You have ${fc.daysLeftInMonth} days left this month.`;
      suggested_action = "Consider waiting 3–5 days or splitting the cost with a friend/roommate.";
    } else {
      decision = "YES";
      reasoning = `Great news! ₹${itemPrice.toFixed(0)} fits comfortably in your budget. You'll still have ₹${cushion.toFixed(0)} remaining with ${fc.daysLeftInMonth} days to go — well above your daily burn of ₹${fc.dailyBurnRate.toFixed(0)}.`;
      suggested_action = "Go ahead — but log this expense immediately to keep your budget tracking accurate.";
    }

    return { decision, reasoning, suggested_action };
  };

  if (!genAI) return heuristicResult();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: AFFORDABILITY_CHECK_SYSTEM_PROMPT,
    });

    const langNote = preferredLanguage === "hi"
      ? "Respond with reasoning and suggested_action in Hindi (Devanagari script)."
      : preferredLanguage === "mr"
      ? "Respond with reasoning and suggested_action in Marathi (Devanagari script)."
      : "Respond in English.";

    const prompt = `${langNote}

Proposed Purchase:
Item: ${itemName}
Price: ₹${itemPrice.toFixed(0)}
Category: ${itemCategory}

Student's Financial Context:
- Remaining budget this month: ₹${fc.remainingBudgetThisMonth.toFixed(0)}
- Days left in the month: ${fc.daysLeftInMonth}
- Daily burn rate (avg spend/day): ₹${fc.dailyBurnRate.toFixed(0)}/day
- Monthly allowance: ₹${fc.monthlyAllowance.toFixed(0)}
- Spent so far this month: ₹${fc.totalSpentThisMonth.toFixed(0)}
- Active savings goals: ${fc.savingsGoals.map((g) => `${g.name} (Target: ₹${g.target}, Saved: ₹${g.current})`).join("; ") || "None"}

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      decision: ["YES", "CAUTION", "NO"].includes(parsed.decision) ? parsed.decision : "CAUTION",
      reasoning: parsed.reasoning || "Bob is analyzing your budget...",
      suggested_action: parsed.suggested_action || "Review your budget carefully before deciding.",
    };
  } catch (err) {
    console.warn("askAffordabilityBob: Gemini failed, using heuristics.", err);
    return heuristicResult();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEME MATCHER — IBM Bob matches student profile to eligible scholarships/loans
// ─────────────────────────────────────────────────────────────────────────────
export interface SchemeRow {
  id: string;
  name: string;
  type: "scholarship" | "loan";
  authority: string;
  eligibility: {
    income_max: number | null;
    category: string[];
    state: string;
    course_type: string[];
    gender?: string;
    notes?: string;
  };
  benefit: string;
  apply_url: string;
  description: string;
}

export interface MatchedScheme {
  scheme_id: string;
  scheme_name: string;
  eligible: boolean;
  match_strength: "Strong" | "Likely" | "Possible";
  eligibility_explanation: string;
  how_to_apply: string;
  // Enriched from original row
  type: "scholarship" | "loan";
  authority: string;
  benefit: string;
  apply_url: string;
  description: string;
}

export async function matchSchemesBob(params: {
  profile: {
    full_name: string;
    course: string;
    year: number;
    state: string;
    income_bracket: "below_1L" | "1-3L" | "3-8L" | "above_8L";
    category: "Gen" | "OBC" | "SC" | "ST" | "EWS";
    monthly_allowance: number;
  };
  schemes: SchemeRow[];
  preferredLanguage: "en" | "hi" | "mr";
}): Promise<MatchedScheme[]> {
  const { profile, schemes, preferredLanguage } = params;

  // Heuristic pre-filter (fast, deterministic, used as fallback too)
  const incomeMap: Record<string, number> = {
    below_1L: 100000,
    "1-3L": 300000,
    "3-8L": 800000,
    above_8L: 9999999,
  };
  const studentIncome = incomeMap[profile.income_bracket] ?? 500000;

  const heuristicMatches: MatchedScheme[] = schemes
    .filter((s) => {
      const e = s.eligibility;
      // Income check
      if (e.income_max !== null && studentIncome > e.income_max) return false;
      // Category check
      if (e.category?.length && !e.category.includes(profile.category)) return false;
      // State check
      if (e.state && e.state !== "all" && e.state !== profile.state) return false;
      // Course check
      if (e.course_type?.length && !e.course_type.includes(profile.course)) return false;
      return true;
    })
    .map((s) => ({
      scheme_id: s.id,
      scheme_name: s.name,
      eligible: true,
      match_strength: "Likely" as const,
      eligibility_explanation: `Based on your profile (${profile.category} category, ${profile.income_bracket} income, ${profile.state} state, ${profile.course}), you appear eligible for this ${s.type}.`,
      how_to_apply: `Visit ${s.apply_url} to start your application. Keep your income certificate and category certificate ready.`,
      type: s.type,
      authority: s.authority,
      benefit: s.benefit,
      apply_url: s.apply_url,
      description: s.description,
    }));

  if (!genAI || schemes.length === 0) return heuristicMatches;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SCHEME_MATCHER_SYSTEM_PROMPT,
    });

    const langNote =
      preferredLanguage === "hi"
        ? "Write all explanation fields in Hindi (Devanagari script)."
        : preferredLanguage === "mr"
        ? "Write all explanation fields in Marathi (Devanagari script)."
        : "Write all explanation fields in English.";

    const prompt = `${langNote}

Student Profile:
- Name: ${profile.full_name}
- Course: ${profile.course}
- Year: ${profile.year}
- State: ${profile.state}
- Income Bracket: ${profile.income_bracket} (approximate annual family income)
- Category: ${profile.category}
- Monthly Allowance: ₹${profile.monthly_allowance}

Available Schemes (JSON):
${JSON.stringify(schemes.map((s) => ({ id: s.id, name: s.name, type: s.type, authority: s.authority, eligibility: s.eligibility, benefit: s.benefit, apply_url: s.apply_url })), null, 2)}

Return ONLY the JSON array of eligible schemes.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed: Array<{
      scheme_id: string;
      scheme_name: string;
      eligible: boolean;
      match_strength: "Strong" | "Likely" | "Possible";
      eligibility_explanation: string;
      how_to_apply: string;
    }> = JSON.parse(clean);

    // Enrich with original scheme data
    return parsed
      .filter((m) => m.eligible)
      .map((m) => {
        const original = schemes.find((s) => s.id === m.scheme_id);
        return {
          ...m,
          type: original?.type ?? "scholarship",
          authority: original?.authority ?? "",
          benefit: original?.benefit ?? "",
          apply_url: original?.apply_url ?? "",
          description: original?.description ?? "",
        };
      });
  } catch (err) {
    console.warn("matchSchemesBob: Gemini failed, using heuristics.", err);
    return heuristicMatches;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOB CHAT — Multi-turn financial literacy assistant
// ─────────────────────────────────────────────────────────────────────────────
export async function askBob(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  preferredLanguage: "en" | "hi" | "mr";
  financialContext: {
    remainingBudget: number;
    monthlyAllowance: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, preferredLanguage, financialContext: fc } = params;
  const msg = message.toLowerCase();

  const heuristic = (): string => {
    if (msg.includes("burn rate") || msg.includes("खर्च") || msg.includes("जळत")) {
      return `तुमचा daily burn rate ₹${fc.dailyBurnRate.toFixed(0)}/day आहे. Your burn rate is ₹${fc.dailyBurnRate.toFixed(0)}/day. At this pace, you'll spend ₹${(fc.dailyBurnRate * 30).toFixed(0)} this month vs your allowance of ₹${fc.monthlyAllowance.toFixed(0)}.`;
    }
    if (msg.includes("afford") || msg.includes("buy") || msg.includes("खरेदी") || msg.includes("खरीद")) {
      return `Use the "Can I Afford This?" tab to get Bob's step-by-step reasoning on any purchase. It analyzes your remaining ₹${fc.remainingBudget.toFixed(0)} budget and days left this month.`;
    }
    if (msg.includes("scholarship") || msg.includes("loan") || msg.includes("शिष्यवृत्ती") || msg.includes("वजीफा")) {
      return `Head to the Scholarship & Loan Matcher tab! Based on your profile, Bob will filter all real Indian government schemes you're likely eligible for — including PMSS, CSSS, and more.`;
    }
    if (msg.includes("save") || msg.includes("बचत") || msg.includes("बचाव")) {
      return `Start small: transfer 10% of your monthly allowance (₹${(fc.monthlyAllowance * 0.1).toFixed(0)}) to a savings goal on Day 1 of every month. Bob calls this the "Pay Yourself First" strategy.`;
    }
    const tips = [
      `Your remaining budget is ₹${fc.remainingBudget.toFixed(0)}. Try logging every expense — even ₹10 chai — to keep Bob's analysis accurate!`,
      `A quick tip: Check the National Scholarship Portal (scholarships.gov.in) — there are schemes you likely haven't applied for yet.`,
      `You've spent ₹${fc.totalSpentThisMonth.toFixed(0)} this month. Try the 48-hour rule: wait 2 days before any purchase above ₹500. It eliminates 80% of impulse buys.`,
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  if (!genAI) return heuristic();

  try {
    const langNote =
      preferredLanguage === "hi"
        ? "Respond entirely in Hindi (Devanagari script)."
        : preferredLanguage === "mr"
        ? "Respond entirely in Marathi (Devanagari script)."
        : "Respond in English.";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${BOB_CHAT_SYSTEM_PROMPT}
${langNote}

Student's live financial snapshot:
- Remaining budget this month: ₹${fc.remainingBudget.toFixed(0)}
- Monthly allowance: ₹${fc.monthlyAllowance.toFixed(0)}
- Spent so far: ₹${fc.totalSpentThisMonth.toFixed(0)}
- Daily burn rate: ₹${fc.dailyBurnRate.toFixed(0)}/day
- Savings goals: ${fc.savingsGoals.map((g) => `${g.name} (₹${g.current}/₹${g.target})`).join(", ") || "None set"}
- Recent transactions: ${fc.recentTransactions.slice(0, 5).map((t) => `${t.description} (₹${t.amount}, ${t.category})`).join("; ")}`,
    });

    const chat = model.startChat({
      history: chatHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });

    const result = await chat.sendMessage(message);
    return result.response.text().trim() || heuristic();
  } catch (err) {
    console.warn("askBob: Gemini failed, using heuristics.", err);
    return heuristic();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVISOR CHAT — Full-page Coach with structured guidance
// ─────────────────────────────────────────────────────────────────────────────
export async function askCoach(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  preferredLanguage: "en" | "hi" | "mr";
  financialContext: {
    remainingBudget: number;
    monthlyAllowance: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, preferredLanguage, financialContext: fc } = params;

  const heuristic = () =>
    `Here are three evidence-based tips:\n1. Track every rupee — even small amounts compound into big leakages.\n2. Allocate your allowance on Day 1: 50% needs, 30% wants, 20% savings.\n3. Check the National Scholarship Portal — most students miss schemes they're fully eligible for.`;

  if (!genAI) return heuristic();

  try {
    const langNote =
      preferredLanguage === "hi"
        ? "Respond entirely in Hindi (Devanagari script)."
        : preferredLanguage === "mr"
        ? "Respond entirely in Marathi (Devanagari script)."
        : "Respond in English.";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${ADVISOR_COACH_SYSTEM_PROMPT}
${langNote}
Financial context:
- Remaining budget: ₹${fc.remainingBudget.toFixed(0)}
- Monthly allowance: ₹${fc.monthlyAllowance.toFixed(0)}
- Spent this month: ₹${fc.totalSpentThisMonth.toFixed(0)}
- Daily burn rate: ₹${fc.dailyBurnRate.toFixed(0)}/day
- Goals: ${fc.savingsGoals.map((g) => `${g.name} (₹${g.current}/₹${g.target})`).join(", ") || "None"}`,
    });

    const chat = model.startChat({
      history: chatHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });
    const result = await chat.sendMessage(message);
    return result.response.text().trim() || heuristic();
  } catch (err) {
    console.warn("askCoach: Gemini failed, using heuristics.", err);
    return heuristic();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAN COACH — Amortization explainer
// ─────────────────────────────────────────────────────────────────────────────
export async function askLoanCoaching(params: {
  loanName: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  extraPayment: number;
  standardMetrics: { monthlyPayment: number; totalInterest: number; monthsToPay: number };
  acceleratedMetrics: {
    monthlyPayment: number;
    totalInterest: number;
    monthsToPay: number;
    monthsSaved: number;
    interestSaved: number;
  };
  preferredLanguage?: "en" | "hi" | "mr";
}): Promise<string> {
  const { loanName, principal, interestRate, termMonths, extraPayment, standardMetrics, acceleratedMetrics, preferredLanguage = "en" } = params;

  const heuristic = () =>
    `Loan: ${loanName}
- Standard EMI: ₹${standardMetrics.monthlyPayment.toFixed(0)}/month over ${termMonths} months. Total interest: ₹${standardMetrics.totalInterest.toFixed(0)}.
- Adding ₹${extraPayment.toFixed(0)}/month saves ${acceleratedMetrics.monthsSaved} months and ₹${acceleratedMetrics.interestSaved.toFixed(0)} in interest!
- That's a ₹${(acceleratedMetrics.interestSaved / termMonths).toFixed(0)} saving per original month. Worth it!`;

  if (!genAI) return heuristic();

  try {
    const langNote =
      preferredLanguage === "hi"
        ? "Respond in Hindi."
        : preferredLanguage === "mr"
        ? "Respond in Marathi."
        : "Respond in English.";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${LOAN_COACH_SYSTEM_PROMPT} ${langNote}`,
    });

    const prompt = `Loan: ${loanName}
Principal: ₹${principal.toFixed(0)} | Rate: ${interestRate}% | Term: ${termMonths} months | Extra Payment: ₹${extraPayment.toFixed(0)}/month

Standard: EMI ₹${standardMetrics.monthlyPayment.toFixed(0)}, Total Interest ₹${standardMetrics.totalInterest.toFixed(0)}, Tenure ${standardMetrics.monthsToPay} months
Accelerated: EMI ₹${acceleratedMetrics.monthlyPayment.toFixed(0)}, Total Interest ₹${acceleratedMetrics.totalInterest.toFixed(0)}, Tenure ${acceleratedMetrics.monthsToPay} months
Savings: ${acceleratedMetrics.monthsSaved} months saved, ₹${acceleratedMetrics.interestSaved.toFixed(0)} interest saved

Explain this in plain student-friendly language.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim() || heuristic();
  } catch (err) {
    console.warn("askLoanCoaching: Gemini failed, using heuristics.", err);
    return heuristic();
  }
}
