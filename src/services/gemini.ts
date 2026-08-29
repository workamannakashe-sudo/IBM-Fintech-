import { GoogleGenerativeAI } from "@google/generative-ai";
import { askIBMBob } from "./ibmBob";
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
      if (preferredLanguage === "hi") {
        reasoning = `यह ₹${itemPrice.toFixed(0)} की खरीदारी आपके शेष बजट (₹${fc.remainingBudgetThisMonth.toFixed(0)}) से अधिक है, जबकि महीने में अभी ${fc.daysLeftInMonth} दिन बाकी हैं। इसे खरीदने से आपके पास आवश्यक खर्चों के लिए पैसे खत्म हो जाएंगे।`;
        suggested_action = "अगले महीने के पॉकेट मनी या भत्ते का इंतजार करें, या आवश्यक वित्तीय सहायता के लिए स्कॉलरशिप मैच टैब देखें।";
      } else if (preferredLanguage === "mr") {
        reasoning = `ही ₹${itemPrice.toFixed(0)} ची खरेदी तुमच्या शिल्लक बजेटपेक्षा (₹${fc.remainingBudgetThisMonth.toFixed(0)}) जास्त आहे आणि चालू महिन्यात अजून ${fc.daysLeftInMonth} दिवस शिल्लक आहेत. हे खरेदी केल्यास तुमचे बजेट संपेल.`;
        suggested_action = "पुढील महिन्याच्या पॉकेट मनीची वाट पाहा किंवा आपत्कालीन मदतीसाठी शिष्यवृत्ती विभाग तपासा.";
      } else {
        reasoning = `This purchase of ₹${itemPrice.toFixed(0)} exceeds your remaining budget of ₹${fc.remainingBudgetThisMonth.toFixed(0)} with ${fc.daysLeftInMonth} days left. Buying this would leave you with negative funds.`;
        suggested_action = "Wait until next month's allowance arrives or explore the Scholarship Matcher for emergency funds.";
      }
    } else if (cushion < fc.dailyBurnRate * 5 || projectedSpend > fc.remainingBudgetThisMonth - itemPrice) {
      decision = "CAUTION";
      if (preferredLanguage === "hi") {
        reasoning = `आप इसे तकनीकी रूप से खरीद सकते हैं (₹${itemPrice.toFixed(0)}), लेकिन इसके बाद केवल ₹${cushion.toFixed(0)} बचेंगे — जो आपके 5 दिनों के दैनिक खर्च (₹${fc.dailyBurnRate.toFixed(0)}/दिन) से भी कम है। महीने में अभी ${fc.daysLeftInMonth} दिन बाकी हैं।`;
        suggested_action = "कम से कम 3-5 दिन प्रतीक्षा करें (48-घंटे का नियम) या रूममेट/मित्र के साथ खर्च साझा करने का विचार करें।";
      } else if (preferredLanguage === "mr") {
        reasoning = `तुम्ही तांत्रिकदृष्ट्या हे घेऊ शकता (₹${itemPrice.toFixed(0)}), पण यानंतर फक्त ₹${cushion.toFixed(0)} उरतील — जे तुमच्या 5 दिवसांच्या दैनंदिन खर्चापेक्षा (₹${fc.dailyBurnRate.toFixed(0)}/दिवस) कमी आहे. अजून ${fc.daysLeftInMonth} दिवस बाकी आहेत.`;
        suggested_action = "किमान ३ ते ५ दिवस थांबा किंवा मित्रासोबत खर्च वाटून घेण्याचा प्रयत्न करा.";
      } else {
        reasoning = `You can technically afford this (₹${itemPrice.toFixed(0)}), but it leaves only ₹${cushion.toFixed(0)} — less than 5 days of your daily burn rate (₹${fc.dailyBurnRate.toFixed(0)}/day). You have ${fc.daysLeftInMonth} days left this month.`;
        suggested_action = "Consider waiting 3–5 days or splitting the cost with a friend/roommate.";
      }
    } else {
      decision = "YES";
      if (preferredLanguage === "hi") {
        reasoning = `शानदार खबर! ₹${itemPrice.toFixed(0)} आपके बजट में बहुत आराम से फिट होता है। खरीदारी के बाद भी आपके पास ₹${cushion.toFixed(0)} सुरक्षित बचेंगे और ${fc.daysLeftInMonth} दिन शेष हैं — जो आपके दैनिक खर्च (₹${fc.dailyBurnRate.toFixed(0)}) से कहीं अधिक है।`;
        suggested_action = "आप बेझिझक खरीदारी कर सकते हैं — पर अपने बजट को ट्रैक रखने के लिए इस खर्च को तुरंत ऐप में दर्ज करें।";
      } else if (preferredLanguage === "mr") {
        reasoning = `उत्तम बातमी! ₹${itemPrice.toFixed(0)} तुमच्या मासिक बजेटमध्ये अगदी सहज बसते. खरेदीनंतरही तुमच्याकडे ₹${cushion.toFixed(0)} शिल्लक राहतील आणि ${fc.daysLeftInMonth} दिवस बाकी आहेत — जे दैनंदिन खर्चापेक्षा जास्त आहे.`;
        suggested_action = "नक्की खरेदी करा — पण बजेट अचूक राहण्यासाठी हा खर्च लगेच ॲपमध्ये नोंदवून ठेवा.";
      } else {
        reasoning = `Great news! ₹${itemPrice.toFixed(0)} fits comfortably in your budget. You'll still have ₹${cushion.toFixed(0)} remaining with ${fc.daysLeftInMonth} days to go — well above your daily burn of ₹${fc.dailyBurnRate.toFixed(0)}.`;
        suggested_action = "Go ahead — but log this expense immediately to keep your budget tracking accurate.";
      }
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
      ? "CRITICAL: Write all reasoning and suggested_action in Hindi (हिंदी, Devanagari script). Do not use English."
      : preferredLanguage === "mr"
      ? "CRITICAL: Write all reasoning and suggested_action in Marathi (मराठी, Devanagari script). Do not use English."
      : "Write all reasoning and suggested_action in clear, conversational English.";

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
      reasoning: parsed.reasoning || (heuristicResult().reasoning),
      suggested_action: parsed.suggested_action || (heuristicResult().suggested_action),
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
      if (e.income_max !== null && studentIncome > e.income_max) return false;
      if (e.category?.length && !e.category.includes(profile.category)) return false;
      if (e.state && e.state !== "all" && e.state !== profile.state) return false;
      if (e.course_type?.length && !e.course_type.includes(profile.course)) return false;
      return true;
    })
    .map((s) => {
      let explanation = "";
      let howToApply = "";

      if (preferredLanguage === "hi") {
        explanation = `आपकी प्रोफाइल (${profile.category} श्रेणी, ${profile.income_bracket} पारिवारिक आय, ${profile.state || "भारत"}, ${profile.course}) के आधार पर आप इस ${s.type === "scholarship" ? "छात्रवृत्ति" : "ऋण योजना"} के लिए पूर्णतः पात्र हैं।`;
        howToApply = `${s.apply_url} पर जाएं। अपना आय प्रमाण पत्र, आधार और श्रेणी प्रमाण पत्र साथ रखें।`;
      } else if (preferredLanguage === "mr") {
        explanation = `तुमच्या प्रोफाइलनुसार (${profile.category} प्रवर्ग, ${profile.income_bracket} कौटुंबिक उत्पन्न, ${profile.state || "महाराष्ट्र"}, ${profile.course}) तुम्ही या ${s.type === "scholarship" ? "शिष्यवृत्तीसाठी" : "शैक्षणिक कर्जासाठी"} पात्र आहात.`;
        howToApply = `${s.apply_url} अधिकृत पोर्टलवर अर्ज करा. तुमचे उत्पन्न आणि जात प्रमाणपत्र तयार ठेवा.`;
      } else {
        explanation = `Based on your profile (${profile.category} category, ${profile.income_bracket} income, ${profile.state} state, ${profile.course}), you appear eligible for this ${s.type}.`;
        howToApply = `Visit ${s.apply_url} to start your application. Keep your income certificate and category certificate ready.`;
      }

      return {
        scheme_id: s.id,
        scheme_name: s.name,
        eligible: true,
        match_strength: "Likely" as const,
        eligibility_explanation: explanation,
        how_to_apply: howToApply,
        type: s.type,
        authority: s.authority,
        benefit: s.benefit,
        apply_url: s.apply_url,
        description: s.description,
      };
    });

  if (!genAI || schemes.length === 0) return heuristicMatches;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SCHEME_MATCHER_SYSTEM_PROMPT,
    });

    const langNote =
      preferredLanguage === "hi"
        ? "CRITICAL: Write all eligibility_explanation and how_to_apply fields in pure Hindi (हिंदी, Devanagari script)."
        : preferredLanguage === "mr"
        ? "CRITICAL: Write all eligibility_explanation and how_to_apply fields in pure Marathi (मराठी, Devanagari script)."
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
// BOB CHAT — Multi-turn financial literacy assistant (IBM Bob)
// ─────────────────────────────────────────────────────────────────────────────
export async function askBob(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  preferredLanguage?: "en" | "hi" | "mr";
  financialContext: {
    remainingBudget: number;
    monthlyAllowance: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, financialContext: fc } = params;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `${BOB_CHAT_SYSTEM_PROMPT}

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
      const output = result.response.text().trim();
      if (output) return output;
    } catch (err) {
      console.warn("askBob: Gemini live call error, using IBM Bob engine:", err);
    }
  }

  // Use IBM Bob AI financial intelligence engine
  return askIBMBob({
    message,
    financialContext: {
      liquidBalance: fc.remainingBudget,
      monthlyIncome: fc.monthlyAllowance,
      totalSpentThisMonth: fc.totalSpentThisMonth,
      dailyBurnRate: fc.dailyBurnRate,
      budgetLimit: fc.monthlyAllowance,
      savingsGoals: fc.savingsGoals,
      recentTransactions: fc.recentTransactions.map((t) => ({
        date: "Recent",
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVISOR CHAT — Full-page Coach with structured guidance (IBM Bob)
// ─────────────────────────────────────────────────────────────────────────────
export async function askCoach(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  preferredLanguage?: "en" | "hi" | "mr";
  financialContext: {
    remainingBudget: number;
    monthlyAllowance: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, financialContext: fc } = params;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `${ADVISOR_COACH_SYSTEM_PROMPT}

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
      const output = result.response.text().trim();
      if (output) return output;
    } catch (err) {
      console.warn("askCoach: live call failed, using IBM Bob engine:", err);
    }
  }

  // Use IBM Bob AI financial intelligence engine
  return askIBMBob({
    message,
    financialContext: {
      liquidBalance: fc.remainingBudget,
      monthlyIncome: fc.monthlyAllowance,
      totalSpentThisMonth: fc.totalSpentThisMonth,
      dailyBurnRate: fc.dailyBurnRate,
      budgetLimit: fc.monthlyAllowance,
      savingsGoals: fc.savingsGoals,
      recentTransactions: fc.recentTransactions.map((t) => ({
        date: "Recent",
        description: t.description,
        amount: t.amount,
        category: t.category,
      })),
    },
  });
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
