// ibmBob.ts — IBM Bob Offline Heuristic Financial Intelligence Engine
// This module powers the Bob chat when no Gemini API key is configured,
// or when the Gemini API call fails. It uses rule-based reasoning grounded
// in the student's real-time financial context.

export interface IBMBobContext {
  liquidBalance: number;
  monthlyIncome: number;
  totalSpentThisMonth: number;
  dailyBurnRate: number;
  budgetLimit: number;
  savingsGoals: Array<{ name: string; target: number; current: number }>;
  recentTransactions: Array<{
    date: string;
    description: string;
    amount: number;
    category: string;
  }>;
}

export interface IBMBobParams {
  message: string;
  financialContext: IBMBobContext;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword matching helpers
// ─────────────────────────────────────────────────────────────────────────────

function includes(msg: string, keywords: string[]): boolean {
  return keywords.some((k) => msg.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// askIBMBob — rule-based response engine grounded in live financial context
// ─────────────────────────────────────────────────────────────────────────────

export async function askIBMBob({ message, financialContext: fc }: IBMBobParams): Promise<string> {
  const msg = message.toLowerCase().trim();
  const sym = "₹";

  const remaining = Math.max(0, fc.liquidBalance);
  const spent = fc.totalSpentThisMonth;
  const income = fc.monthlyIncome;
  const burn = fc.dailyBurnRate;
  const budgetUsedPct = income > 0 ? Math.round((spent / income) * 100) : 0;

  // Days left in current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const safeBurnRate = daysLeft > 0 ? remaining / daysLeft : 0;

  // Top savings goal
  const topGoal = fc.savingsGoals[0];

  // ── Burn rate / spending velocity ──────────────────────────────────────────
  if (includes(msg, ["burn rate", "spending rate", "velocity", "how am i spending", "spending this month"])) {
    const status = burn > safeBurnRate
      ? `⚠️ Your current burn rate of ${sym}${burn.toFixed(0)}/day is above the safe rate of ${sym}${safeBurnRate.toFixed(0)}/day. Slow down on discretionary spending!`
      : `✅ You're doing well! Burn rate ${sym}${burn.toFixed(0)}/day vs safe rate ${sym}${safeBurnRate.toFixed(0)}/day.`;
    return `${status} You've spent ${sym}${spent.toLocaleString("en-IN")} (${budgetUsedPct}% of your ${sym}${income.toLocaleString("en-IN")} budget) with ${daysLeft} days left this month.`;
  }

  // ── Balance / how much left ─────────────────────────────────────────────────
  if (includes(msg, ["balance", "how much left", "remaining", "left this month", "available"])) {
    return `You have ${sym}${remaining.toLocaleString("en-IN")} remaining this month. With ${daysLeft} days left, you can safely spend about ${sym}${safeBurnRate.toFixed(0)}/day. ${budgetUsedPct >= 80 ? "Heads up — you've used over 80% of your budget!" : "Keep it up! 💪"}`;
  }

  // ── Savings / goals ────────────────────────────────────────────────────────
  if (includes(msg, ["save", "saving", "goal", "target", "emergency fund", "study abroad", "laptop"])) {
    if (!topGoal) {
      return `You haven't set any savings goals yet. Try adding one in the Budget tab — even a small goal like an Emergency Fund (${sym}5,000) builds great habits! 🎯`;
    }
    const progress = topGoal.target > 0 ? Math.round((topGoal.current / topGoal.target) * 100) : 0;
    const shortfall = topGoal.target - topGoal.current;
    return `Your top goal "${topGoal.name}" is ${progress}% funded (${sym}${topGoal.current.toLocaleString("en-IN")} / ${sym}${topGoal.target.toLocaleString("en-IN")}). ${shortfall > 0 ? `You need ${sym}${shortfall.toLocaleString("en-IN")} more. Putting aside an extra ${sym}${Math.ceil(shortfall / 30).toLocaleString("en-IN")}/day gets you there in about a month! 🚀` : "Goal reached — celebrate! 🎉"}`;
  }

  // ── Afford check (price extraction) ────────────────────────────────────────
  if (includes(msg, ["afford", "buy", "purchase", "can i get", "should i buy", "worth buying"])) {
    // Try to extract a price from the message (e.g. ₹1500, Rs 2000, 3000 rupees, $50)
    const priceMatch = msg.match(/[₹$rs\s]*(\d[\d,]*)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;

    if (price > 0) {
      if (price > remaining) {
        return `${sym}${price.toLocaleString("en-IN")} exceeds your remaining balance of ${sym}${remaining.toLocaleString("en-IN")}. ❌ Bob says NO for now — wait until next month or look for a student discount / second-hand option!`;
      } else if (price > remaining * 0.5) {
        return `${sym}${price.toLocaleString("en-IN")} is more than 50% of your remaining balance (${sym}${remaining.toLocaleString("en-IN")}). ⚠️ Bob says CAUTION — it's doable but will tighten your budget. Check if it can wait a few days.`;
      } else {
        return `${sym}${price.toLocaleString("en-IN")} looks affordable! ✅ You have ${sym}${remaining.toLocaleString("en-IN")} remaining and a safe daily rate of ${sym}${safeBurnRate.toFixed(0)}. Go for it — but log the expense!`;
      }
    }

    return `To check affordability, tell me the price — e.g. "Can I afford a ₹2,000 jacket?" I'll run the numbers against your ${sym}${remaining.toLocaleString("en-IN")} remaining balance instantly! 🧮`;
  }

  // ── Scholarship / scheme ───────────────────────────────────────────────────
  if (includes(msg, ["scholarship", "scheme", "government", "grant", "nsp", "pmsss", "aicte", "ishan", "pragati"])) {
    return `Head over to the Scholarships tab to see schemes matched to your profile! Bob looks at your income bracket, category (Gen/OBC/SC/ST/EWS), state, and course. Common ones include NSP Post-Matric, PMSSS, Ishan Uday, AICTE Pragati & Saksham. Apply early — deadlines fill up fast! 🎓`;
  }

  // ── Loan / EMI ─────────────────────────────────────────────────────────────
  if (includes(msg, ["loan", "emi", "interest", "repayment", "debt", "borrow", "moratorium", "subsidised", "subsidized"])) {
    return `Check out the Loans tab for a full EMI & amortization simulator! In short: EMI = P × r × (1+r)^n / ((1+r)^n − 1). Adding even ${sym}500/month extra can save thousands in interest and cut months off your tenure. Bob recommends prioritising high-interest loans first! 💳`;
  }

  // ── Budget tips ────────────────────────────────────────────────────────────
  if (includes(msg, ["tip", "advice", "suggestion", "help", "how to", "improve", "better", "budget"])) {
    const tips = [];
    if (budgetUsedPct > 75) tips.push(`You've used ${budgetUsedPct}% of your budget — pause non-essential spending for the rest of the month.`);
    if (burn > safeBurnRate) tips.push(`Cut daily spend by ${sym}${Math.ceil(burn - safeBurnRate)}/day to stay on track.`);
    if (fc.recentTransactions.filter((t) => t.category === "entertainment").length > 3) tips.push(`You have 3+ entertainment expenses recently — consider the campus library or free events.`);
    if (!topGoal) tips.push(`Set a savings goal in the Budget tab to build a financial cushion.`);
    tips.push(`Use the Quick Log FAB (bottom-right button) to log every expense — consistency builds awareness!`);

    return `Here are Bob's top tips for you:\n${tips.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
  }

  // ── Recent transactions ────────────────────────────────────────────────────
  if (includes(msg, ["recent", "last transaction", "what did i spend", "transactions", "expenses"])) {
    if (fc.recentTransactions.length === 0) {
      return `No transactions logged yet! Use the Quick Log button or Expenses tab to start tracking. Logging daily is the #1 habit that improves your financial health score. 📊`;
    }
    const lines = fc.recentTransactions
      .slice(0, 4)
      .map((t) => `• ${t.description} — ${sym}${t.amount.toLocaleString("en-IN")} (${t.category})`)
      .join("\n");
    return `Your recent expenses:\n${lines}\n\nTotal spent this month: ${sym}${spent.toLocaleString("en-IN")} (${budgetUsedPct}% of budget).`;
  }

  // ── Split bill ─────────────────────────────────────────────────────────────
  if (includes(msg, ["split", "share", "divide", "roommate", "friends", "group"])) {
    return `Use the Split Bill tab to split expenses with friends instantly! Enter the total amount and number of people and Bob calculates each share. You can also export the breakdown as a WhatsApp message. 👥`;
  }

  // ── Greeting / general ────────────────────────────────────────────────────
  if (includes(msg, ["hi", "hello", "hey", "hii", "namaste", "namaskar", "kya haal", "what can you do", "help me"])) {
    return `Hey! I'm Bob, your BudgetMitra AI co-pilot 🤖. I can help you:\n• Check if you can afford something\n• Analyse your burn rate & budget\n• Find scholarships & government schemes\n• Explain loans & EMI calculations\n• Give personalised saving tips\n\nJust ask me anything in plain English, Hindi, or Marathi!`;
  }

  // ── Default fallback with context summary ─────────────────────────────────
  return `Here's your quick financial snapshot:\n• Balance: ${sym}${remaining.toLocaleString("en-IN")} remaining (${100 - budgetUsedPct}% of budget left)\n• Burn rate: ${sym}${burn.toFixed(0)}/day vs safe ${sym}${safeBurnRate.toFixed(0)}/day\n• Days left this month: ${daysLeft}\n${topGoal ? `• Top goal "${topGoal.name}": ${Math.round((topGoal.current / topGoal.target) * 100)}% funded\n` : ""}Try asking: "Can I afford ₹2,000?", "Give me saving tips", or "Which scholarships suit me?" 💡`;
}
