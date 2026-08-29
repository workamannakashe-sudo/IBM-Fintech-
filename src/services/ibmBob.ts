// IBM Bob AI Chatbot Service (ibmBob.ts)
// Integrates with IBM watsonx Assistant using the provided bob_prod API key

const IBM_BOB_API_KEY =
  import.meta.env.VITE_IBM_BOB_API_KEY ||
  "bob_prod_bob-apikey_5KsiHEKrF4f2Y2yLzNxojz21NG2aVMsTwojK625Wnh2xKy5tKpPptFRgfKRn3E5bdoqi5PH9RHkQRtULP4jYukB2_Fe3UGHWhW1RKYNa2aDBKcDA5hV6rsRoDoUCH5S91DqRE";

// IBM Bob endpoint — stateless message API
const IBM_BOB_BASE_URL = "https://api.us-south.assistant.watson.cloud.ibm.com";
const IBM_BOB_ASSISTANT_ID = "bob_prod";
const IBM_BOB_VERSION = "2024-08-25";

interface BobMessage {
  role: "user" | "assistant";
  content: string;
}

interface BobFinancialContext {
  liquidBalance: number;
  monthlyIncome: number;
  totalSpentThisMonth: number;
  dailyBurnRate: number;
  budgetLimit: number;
  savingsGoals: Array<{ name: string; target: number; current: number }>;
  recentTransactions: Array<{ date: string; description: string; amount: number; category: string }>;
}

/**
 * Build a system context string to inject into the Bob message
 * so Bob is grounded in the student's real financial data.
 */
function buildFinancialContext(ctx: BobFinancialContext): string {
  const goalsSummary = ctx.savingsGoals.length > 0
    ? ctx.savingsGoals.map(g => `${g.name} (saved ₹${g.current.toFixed(0)} of ₹${g.target.toFixed(0)})`).join(", ")
    : "No active savings goals";

  const txSummary = ctx.recentTransactions.length > 0
    ? ctx.recentTransactions.slice(0, 5).map(t => `${t.date}: ${t.description} ₹${t.amount.toFixed(0)} [${t.category}]`).join("; ")
    : "No recent transactions";

  return `[Student Financial Profile — BudgetMitra]
Remaining Balance: ₹${ctx.liquidBalance.toFixed(0)}
Monthly Allowance: ₹${ctx.monthlyIncome.toFixed(0)}
Spent This Month: ₹${ctx.totalSpentThisMonth.toFixed(0)}
Daily Burn Rate: ₹${ctx.dailyBurnRate.toFixed(0)}/day
Budget Limit: ₹${ctx.budgetLimit.toFixed(0)}
Savings Goals: ${goalsSummary}
Recent Transactions: ${txSummary}`;
}

/**
 * Local heuristic fallback responses for when IBM Bob API is unavailable.
 */
function getHeuristicResponse(
  message: string,
  ctx: BobFinancialContext
): string {
  const lower = message.toLowerCase();

  if (lower.includes("burn rate") || lower.includes("burn") || lower.includes("pace")) {
    const projected = ctx.dailyBurnRate * 30;
    const exceeded = projected > ctx.budgetLimit;
    return `Your daily burn rate is **₹${ctx.dailyBurnRate.toFixed(0)}/day**. At this pace, you'll spend ₹${projected.toFixed(0)} this month vs your ₹${ctx.budgetLimit.toFixed(0)} allowance. ${exceeded ? `⚠️ You may exceed your budget — consider cutting discretionary spending!` : `✅ You're pacing well within your budget.`}`;
  }

  if (lower.includes("afford") || lower.includes("buy") || lower.includes("purchase")) {
    const amtMatch = message.match(/\$?₹?(\d+(\.\d{1,2})?)/);
    const price = amtMatch ? parseFloat(amtMatch[1]) : 500;
    if (price > ctx.liquidBalance) {
      return `⚠️ **Verdict: NO** — That ₹${price} purchase would exceed your remaining balance of ₹${ctx.liquidBalance.toFixed(0)}. Hold off for now!`;
    } else if (price > ctx.liquidBalance - 1000) {
      return `⚠️ **Verdict: CAUTION** — You can technically afford ₹${price}, but it'll leave you with less than ₹1,000 cushion. Think it over!`;
    }
    return `✅ **Verdict: YES** — ₹${price} fits comfortably in your ₹${ctx.liquidBalance.toFixed(0)} available budget. Go for it!`;
  }

  if (lower.includes("loan") || lower.includes("emi") || lower.includes("interest")) {
    return `💡 Check the **Loan & EMI** tab to model education loan payoffs and compare simple vs subsidized interest rates!`;
  }

  if (lower.includes("scholarship") || lower.includes("grant") || lower.includes("scheme")) {
    return `🎓 Head to the **Schemes** tab! Bob has filtered real Indian government scholarships (PMSS, CSSS, Tata Scholarship) matching your course and income category.`;
  }

  if (lower.includes("budget") || lower.includes("save") || lower.includes("spending")) {
    const remaining = ctx.budgetLimit - ctx.totalSpentThisMonth;
    return `📊 You've spent **₹${ctx.totalSpentThisMonth.toFixed(0)}** this month out of your **₹${ctx.budgetLimit.toFixed(0)}** budget. You have **₹${remaining.toFixed(0)} remaining** — ${remaining < 0 ? "⚠️ you're over budget!" : "keep up the disciplined spending!"}`;
  }

  const tips = [
    `💰 Your remaining budget is **₹${ctx.liquidBalance.toFixed(0)}**. Log every expense to keep your daily burn rate of ₹${ctx.dailyBurnRate.toFixed(0)}/day accurate.`,
    `🎯 Tip: Automating 10% of your allowance (₹${(ctx.monthlyIncome * 0.1).toFixed(0)}) into savings on Day 1 is the easiest way to fund your goals!`,
    `📈 Check the 48-hour rule: wait 2 days before buying anything non-essential over ₹500. It eliminates 80% of impulse buys.`,
    `Hey! I'm Bob, your IBM-powered AI financial co-pilot. Ask me things like "Can I afford ₹2,000 headphones?" or "How's my burn rate?"`,
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Main function: Send a message to IBM Bob and get a response.
 * Falls back to local heuristics if the API is unavailable or returns an error.
 */
export async function askIBMBob(params: {
  message: string;
  chatHistory?: BobMessage[];
  financialContext: BobFinancialContext;
}): Promise<string> {
  const { message, financialContext } = params;

  if (!IBM_BOB_API_KEY) {
    return getHeuristicResponse(message, financialContext);
  }

  // Build enriched message with financial context
  const contextualMessage = `${buildFinancialContext(financialContext)}\n\nUser question: ${message}`;

  try {
    // Try IBM watsonx Assistant stateless message API
    // Auth: Basic auth with "apikey" as username and the key as password
    const credentials = btoa(`apikey:${IBM_BOB_API_KEY}`);

    const response = await fetch(
      `${IBM_BOB_BASE_URL}/v2/assistants/${IBM_BOB_ASSISTANT_ID}/message?version=${IBM_BOB_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          input: {
            message_type: "text",
            text: contextualMessage,
          },
          context: {
            global: {
              system: {
                user_id: "finwise-student-user",
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`IBM Bob API returned ${response.status}. Using heuristic fallback.`);
      return getHeuristicResponse(message, financialContext);
    }

    const data = await response.json();

    // Extract text from IBM watsonx Assistant response
    const outputText = data?.output?.generic
      ?.filter((item: { response_type: string }) => item.response_type === "text")
      ?.map((item: { text: string }) => item.text)
      ?.join("\n")
      ?.trim();

    if (outputText && outputText.length > 0) {
      return outputText;
    }

    return getHeuristicResponse(message, financialContext);
  } catch (error) {
    console.warn("IBM Bob API call failed, using heuristic fallback:", error);
    return getHeuristicResponse(message, financialContext);
  }
}

export { type BobMessage, type BobFinancialContext };
