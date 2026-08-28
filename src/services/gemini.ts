// FinWise Gemini AI Assistant & Heuristic Fallback Service (gemini.ts)
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BOB_CHAT_SYSTEM_PROMPT,
  ADVISOR_COACH_SYSTEM_PROMPT,
  AFFORDABILITY_CHECK_SYSTEM_PROMPT,
  LOAN_COACH_SYSTEM_PROMPT
} from "../lib/prompts/financialAssistant";

// Read API Key from environment variables (configured via .env)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("fw_gemini_api_key") || "";
let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE") {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Categorize expense description using Gemini API, falling back to local regex heuristics.
 */
export async function autoCategorizeExpense(description: string): Promise<string> {
  const cleanDesc = description.trim().toLowerCase();
  
  // Heuristic Fallback Array
  const heuristics = [
    { keys: ["rent", "housing", "dorm", "apartment", "sublet", "deposit"], category: "Housing & Rent" },
    { keys: ["coffee", "starbucks", "dunkin", "cafe", "boba", "tea", "dining", "hall", "meal", "mcdonalds", "subway", "burger", "pizza", "food", "eat", "groceries", "walmart", "target", "supermarket"], category: "Food & Dining" },
    { keys: ["book", "tuition", "course", "textbook", "materials", "college", "university", "syllabus", "lab", "notebook"], category: "Textbooks & Tuition" },
    { keys: ["netflix", "spotify", "hulu", "cinema", "concert", "movie", "show", "game", "steam", "ps5", "xbox", "hbo", "club", "party"], category: "Entertainment & Subscriptions" },
    { keys: ["transit", "uber", "lyft", "bus", "train", "gas", "subway-fare", "metro", "airline", "flight", "commute", "fare"], category: "Transportation" },
    { keys: ["gym", "health", "doctor", "pharmacy", "medical", "dentist", "prescription", "vitamin", "hospital"], category: "Health & Wellness" },
    { keys: ["clothes", "zara", "nike", "amazon", "shoes", "haircut", "salon", "makeup", "gifts", "shopping"], category: "Shopping & Personal" },
  ];

  // Try heuristic first or as fallback
  const fallback = () => {
    for (const rule of heuristics) {
      if (rule.keys.some(k => cleanDesc.includes(k))) {
        return rule.category;
      }
    }
    return "Miscellaneous";
  };

  if (!genAI) {
    return fallback();
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Classify this transaction description: "${description}" into one of the following exact student-centric categories:
- Housing & Rent
- Food & Dining
- Textbooks & Tuition
- Entertainment & Subscriptions
- Transportation
- Health & Wellness
- Shopping & Personal
- Miscellaneous

Return ONLY the category name. Do not explain.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Validate returned category
    const validCategories = [
      "Housing & Rent", "Food & Dining", "Textbooks & Tuition", 
      "Entertainment & Subscriptions", "Transportation", 
      "Health & Wellness", "Shopping & Personal", "Miscellaneous"
    ];
    
    const matched = validCategories.find(c => text.toLowerCase().includes(c.toLowerCase()));
    return matched || fallback();
  } catch (error) {
    console.warn("Gemini categorization failed, using local heuristics:", error);
    return fallback();
  }
}

/**
 * Generates plain-English descriptions of spending category anomalies
 */
export async function explainAnomaly(
  category: string,
  amount: number,
  averageAmount: number
): Promise<string> {
  const fallbackMsg = `Your spending on "${category}" ($${amount.toFixed(2)}) is significantly higher than your typical average of $${averageAmount.toFixed(2)}. This spike often correlates with academic cycle demands (like start-of-semester fees, text purchases, or group dining events).`;

  if (!genAI) {
    return fallbackMsg;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `A student spent $${amount.toFixed(2)} in "${category}". Their typical average is $${averageAmount.toFixed(2)}.
Explain this anomaly in a friendly, conversational, student-centric tone. Keep it under 2 sentences. Explain it as an advisory alert.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim() || fallbackMsg;
  } catch (error) {
    console.warn("Gemini explainAnomaly failed:", error);
    return fallbackMsg;
  }
}

/**
 * Floating chat conversation with Bob, grounded in the student's current profile data.
 */
export async function askBob(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  financialContext: {
    liquidBalance: number;
    monthlyIncome: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    budgetLimit: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ date: string; description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, financialContext } = params;
  const lowercaseMsg = message.toLowerCase();

  // HEURISTIC CHAT RESPONSES
  const getHeuristicResponse = (): string => {
    if (lowercaseMsg.includes("burn rate") || lowercaseMsg.includes("burn") || lowercaseMsg.includes("velocity")) {
      const projected = financialContext.dailyBurnRate * 30;
      const budgetExceeded = projected > financialContext.budgetLimit;
      return `Your current daily burn rate is $${financialContext.dailyBurnRate.toFixed(2)}. At this velocity, you are projected to spend $${projected.toFixed(2)} this month vs your limit of $${financialContext.budgetLimit.toFixed(2)}. ${budgetExceeded ? `⚠️ Warning: You're burning through cash and might exceed your budget in ${Math.max(1, Math.round(financialContext.budgetLimit / Math.max(1, financialContext.dailyBurnRate)))} days!` : `✅ Keep it up! You are pacing well within your safety envelope.`}`;
    }
    
    if (lowercaseMsg.includes("afford") || lowercaseMsg.includes("buy")) {
      // Regex parsing for dollar amounts
      const amtMatch = message.match(/\$?(\d+(\.\d{2})?)/);
      const price = amtMatch ? parseFloat(amtMatch[1]) : 50;
      
      let verdict = "YES";
      let reasoning = "This purchase fits safely into your liquid balance.";
      if (price > financialContext.liquidBalance) {
        verdict = "NO";
        reasoning = `You only have $${financialContext.liquidBalance.toFixed(2)} available. Purchasing this would overdraft your account.`;
      } else if (price > (financialContext.liquidBalance - 200)) {
        verdict = "CAUTION";
        reasoning = `This is affordable but will leave you with less than $200 in cushion cash.`;
      }

      // Delays calculation
      let delayText = "";
      if (financialContext.savingsGoals.length > 0) {
        const topGoal = financialContext.savingsGoals[0];
        const monthlySavingsSpeed = Math.max(50, financialContext.monthlyIncome - financialContext.totalSpentThisMonth);
        const dailySavingsSpeed = monthlySavingsSpeed / 30;
        const delayDays = Math.round(price / dailySavingsSpeed);
        delayText = ` Buying this will also delay your "${topGoal.name}" savings target by approximately ${delayDays} days.`;
      }

      return `[Verdict: ${verdict}] ${reasoning}${delayText} Try exploring student discount portals or rent alternatives instead!`;
    }

    if (lowercaseMsg.includes("loan") || lowercaseMsg.includes("emi") || lowercaseMsg.includes("interest")) {
      return `To knock down your student loan principal faster, consider adding just $50 extra each month. By accelerating payments, you'll slash months off your repayment timeline and save hundreds in compound interest! Check out the Loan tab to play with the slider.`;
    }

    if (lowercaseMsg.includes("scholarship") || lowercaseMsg.includes("grant")) {
      return `I found matching scholarships for you based on your academic profile! Head over to the Scholarships tab to see match probabilities, essay tips, and key deadline calendars.`;
    }

    // Default friendly tip
    const tips = [
      "Keep an eye on your logging consistency! Hitting a 7-day logging streak earns you +100 XP and keeps you mindful of small expenses.",
      "Looks like your top spending category is Food & Dining. Consider packing lunch or using campus dining halls this week to trim discretionary costs.",
      "Reviewing your budget: Try to automate transferring 10% of any allowance directly into your Study Abroad savings goal to hit your target early.",
      "Hey there! I'm Bob, your FinWise AI companion. I can help track your daily burn rate, review upcoming loan payments, or advise if that impulse purchase is safe. Try asking 'Can I afford $80 sneakers?'"
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  if (!genAI) {
    return getHeuristicResponse();
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${BOB_CHAT_SYSTEM_PROMPT}
Ground your answers in the student's real-time financial stats:
- Liquid cash balance: $${financialContext.liquidBalance.toFixed(2)}
- Monthly income/allowance: $${financialContext.monthlyIncome.toFixed(2)}
- Spent this month: $${financialContext.totalSpentThisMonth.toFixed(2)}
- Daily burn rate: $${financialContext.dailyBurnRate.toFixed(2)}/day
- Budget envelope limit: $${financialContext.budgetLimit.toFixed(2)}
- Active savings goals: ${financialContext.savingsGoals.map(g => `${g.name} (Target: $${g.target}, Saved: $${g.current})`).join(", ")}
- Recent logs: ${financialContext.recentTransactions.slice(0, 5).map(t => `${t.date}: ${t.description} ($${t.amount.toFixed(2)}) [${t.category}]`).join("; ")}`,
    });

    const chat = model.startChat({
      history: chatHistory.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      }))
    });

    const result = await chat.sendMessage(message);
    return result.response.text().trim() || getHeuristicResponse();
  } catch (error) {
    console.warn("Bob failed to respond using Gemini API, using heuristics:", error);
    return getHeuristicResponse();
  }
}

/**
 * Chat conversation with Coach FinWise, providing detailed, structured money advice.
 */
export async function askCoach(params: {
  message: string;
  chatHistory: Array<{ role: "user" | "model"; parts: string }>;
  financialContext: {
    liquidBalance: number;
    monthlyIncome: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    budgetLimit: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
    recentTransactions: Array<{ date: string; description: string; amount: number; category: string }>;
  };
}): Promise<string> {
  const { message, chatHistory, financialContext } = params;
  const lowercaseMsg = message.toLowerCase();

  const getHeuristicResponse = (): string => {
    if (lowercaseMsg.includes("groceries") || lowercaseMsg.includes("food") || lowercaseMsg.includes("eat")) {
      return `To optimize your Food & Dining spending:
1. **Meal Prep**: Plan meals weekly to avoid last-minute dining hall swipes or food deliveries.
2. **Local Markets**: Buy fresh produce at local markets instead of campus convenience stores where prices are marked up.
3. **Student Discount Portal**: Always show your student ID for food discounts around campus.`;
    }
    if (lowercaseMsg.includes("emergency") || lowercaseMsg.includes("save") || lowercaseMsg.includes("buffer")) {
      return `Here is a step-by-step strategy to build an emergency fund:
1. **Target ₹5,000 / $200 first**: Start with a small, achievable target rather than a multi-month goal.
2. **Automate Transfers**: Set up auto-transfers of 5-10% of your monthly allowance or income on day one.
3. **High-Yield Savings**: Keep it in a separate, liquid account so you aren't tempted to spend it.`;
    }
    return `Here are some standard money tips:
- Audit your subscriptions: Cancel unused gym passes or streaming trials.
- Buy books second-hand: Check university forums or library rentals before buying textbooks new.
- Use campus transportation: Avoid taking commercial cab rides for short commutes.`;
  };

  if (!genAI) {
    return getHeuristicResponse();
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${ADVISOR_COACH_SYSTEM_PROMPT}
Ground your suggestions in the user's real-time financial stats:
- Balance Cushion: $${financialContext.liquidBalance.toFixed(2)}
- Income: $${financialContext.monthlyIncome.toFixed(2)}
- Spent this month: $${financialContext.totalSpentThisMonth.toFixed(2)}
- Daily burn rate: $${financialContext.dailyBurnRate.toFixed(2)}/day
- Budget: $${financialContext.budgetLimit.toFixed(2)}
- Savings Goals: ${financialContext.savingsGoals.map(g => `${g.name} (${g.current}/${g.target})`).join(", ")}
- Recent transactions: ${financialContext.recentTransactions.slice(0, 5).map(t => `${t.description} ($${t.amount.toFixed(2)})`).join("; ")}`,
    });

    const chat = model.startChat({
      history: chatHistory.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      }))
    });

    const result = await chat.sendMessage(message);
    return result.response.text().trim() || getHeuristicResponse();
  } catch (error) {
    console.warn("askCoach failed, using heuristics:", error);
    return getHeuristicResponse();
  }
}

/**
 * AI-backed dynamic affordability checks.
 */
export async function askAffordability(params: {
  itemName: string;
  itemPrice: number;
  itemCategory: string;
  financialContext: {
    liquidBalance: number;
    monthlyIncome: number;
    totalSpentThisMonth: number;
    dailyBurnRate: number;
    savingsGoals: Array<{ name: string; target: number; current: number }>;
  };
}): Promise<{
  verdict: "YES" | "CAUTION" | "NO";
  confidenceScore: number;
  reason: string;
  delayDays: number;
  alternative: string;
}> {
  const { itemName, itemPrice, itemCategory, financialContext } = params;

  const getHeuristicResult = () => {
    let verdict: "YES" | "CAUTION" | "NO" = "YES";
    let confidenceScore = 100;
    let reason = "";
    let delayDays = 0;

    if (itemPrice > financialContext.liquidBalance) {
      verdict = "NO";
      confidenceScore = 15;
      reason = `This purchase exceeds your entire remaining cash cushion ($${financialContext.liquidBalance.toFixed(2)}) for the month. Buying this will trigger an overdraft.`;
    } else if (itemPrice > (financialContext.liquidBalance - 150)) {
      verdict = "CAUTION";
      confidenceScore = 55;
      reason = `You can buy this, but it leaves you with less than a $150 emergency cushion for the rest of the month. Avoid if you have variable food/travel needs.`;
    } else {
      verdict = "YES";
      confidenceScore = 92;
      reason = `This item fits comfortably within your liquid balance. Your cash reserve remains solid at $${(financialContext.liquidBalance - itemPrice).toFixed(2)}.`;
    }

    const monthlySurplus = Math.max(50, financialContext.monthlyIncome - financialContext.totalSpentThisMonth);
    const dailySavingsRate = monthlySurplus / 30;
    delayDays = Math.round(itemPrice / dailySavingsRate);

    let alternative = "Wait 48 hours before purchasing to evaluate if it is a genuine utility need or an impulse want.";
    if (itemCategory === "Textbooks & Tuition") {
      alternative = "Check if this textbook is available in the university library course reserves, rent from second-hand marketplaces (Chegg/AbeBooks), or request a PDF scan in campus groups.";
    } else if (itemCategory === "Food & Dining") {
      alternative = "Eat at the campus dining hall using remaining student meal swipes, or pool grocery ingredients with roommates to cook in bulk.";
    }

    return { verdict, confidenceScore, reason, delayDays, alternative };
  };

  if (!genAI) {
    return getHeuristicResult();
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: AFFORDABILITY_CHECK_SYSTEM_PROMPT,
    });

    const prompt = `Proposed Purchase:
Item Name: ${itemName}
Price: $${itemPrice.toFixed(2)}
Category: ${itemCategory}

User Context:
Remaining Cash Cushion: $${financialContext.liquidBalance.toFixed(2)}
Monthly Income/Allowance: $${financialContext.monthlyIncome.toFixed(2)}
Spent This Month So Far: $${financialContext.totalSpentThisMonth.toFixed(2)}
Daily Burn Rate: $${financialContext.dailyBurnRate.toFixed(2)}/day
Active Goals: ${financialContext.savingsGoals.map(g => `${g.name} (Target: $${g.target}, Current: $${g.current})`).join(", ")}

Respond only with the requested JSON object.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const cleanJson = responseText.replace(/```json/i, "").replace(/```/, "").trim();
    const parsed = JSON.parse(cleanJson);
    return {
      verdict: parsed.verdict || "YES",
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 90,
      reason: parsed.reason || "Fit within parameters.",
      delayDays: typeof parsed.delayDays === "number" ? parsed.delayDays : 0,
      alternative: parsed.alternative || "Wait 48 hours before purchasing."
    };
  } catch (error) {
    console.warn("Gemini askAffordability failed, using heuristics:", error);
    return getHeuristicResult();
  }
}

/**
 * AI-backed loan advisory and accelerated payoff explainer.
 */
export async function askLoanCoaching(params: {
  loanName: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  extraPayment: number;
  standardMetrics: {
    monthlyPayment: number;
    totalInterest: number;
    monthsToPay: number;
  };
  acceleratedMetrics: {
    monthlyPayment: number;
    totalInterest: number;
    monthsToPay: number;
    monthsSaved: number;
    interestSaved: number;
  };
}): Promise<string> {
  const { loanName, principal, interestRate, termMonths, extraPayment, standardMetrics, acceleratedMetrics } = params;

  const getHeuristicResponse = () => {
    return `Loan Details: ${loanName}
- Standard monthly repayment: $${standardMetrics.monthlyPayment.toFixed(2)} over ${termMonths} months.
- Compound interest accrues continuously. Total interest is $${standardMetrics.totalInterest.toFixed(2)}.
- By adding $${extraPayment.toFixed(2)} extra monthly payments, you shorten your tenure to ${acceleratedMetrics.monthsToPay} months (saving ${acceleratedMetrics.monthsSaved} months).
- You save a total of $${acceleratedMetrics.interestSaved.toFixed(2)} in compound interest charges!`;
  };

  if (!genAI) {
    return getHeuristicResponse();
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: LOAN_COACH_SYSTEM_PROMPT,
    });

    const prompt = `Loan Details:
Name: ${loanName}
Principal Amount: $${principal.toFixed(2)}
Interest Rate: ${interestRate.toFixed(2)}%
Repayment Term: ${termMonths} months
Proposed Extra Monthly Contribution: $${extraPayment.toFixed(2)}/month

Standard Payoff:
- Monthly Payment: $${standardMetrics.monthlyPayment.toFixed(2)}
- Total Interest Paid: $${standardMetrics.totalInterest.toFixed(2)}
- Total Tenure: ${standardMetrics.monthsToPay} months

Accelerated Payoff:
- Monthly Payment: $${acceleratedMetrics.monthlyPayment.toFixed(2)}
- Total Interest Paid: $${acceleratedMetrics.totalInterest.toFixed(2)}
- Total Tenure: ${acceleratedMetrics.monthsToPay} months
- Repayment Months Saved: ${acceleratedMetrics.monthsSaved} months
- Interest Cost Saved: $${acceleratedMetrics.interestSaved.toFixed(2)}

Please explain this amortization and payoff plan in plain, encouraging language.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim() || getHeuristicResponse();
  } catch (error) {
    console.warn("Gemini askLoanCoaching failed, using heuristics:", error);
    return getHeuristicResponse();
  }
}

