# FinWise — Application Specification (PROJECT.md)

FinWise is an AI-powered financial literacy, budgeting, and decision-support platform tailored specifically for college students and young adults. It bridges the gap between everyday campus spending habits and long-term financial stability.

---

## 🎯 Core Product Vision & Objectives
1. **Promote Financial Literacy:** Demystify financial terms (EMI, compound interest, burn rate) using conversational, student-friendly AI.
2. **Actionable Budgeting:** Go beyond passive tracking to active, predictive alerts based on spending velocity and future bills.
3. **Behavioral Gamification:** Build habit streaks, reward consistency with experience points (XP), and celebrate milestones visually.
4. **Intelligent Decision-Support:** Prevent impulse spending by visualizing the tangible opportunity cost of purchases in real-time.

---

## 🚀 Key Features

### 1. Financial Command Center & Health Score
* **Dynamic Health Score (0–100 & Grade A+ to D):** Combines four pillars:
  1. *Savings Rate Score* (income vs. savings target)
  2. *Budget Adherence Score* (current spend vs. budget envelopes)
  3. *Anomaly & Risk Score* (frequency/magnitude of category spikes)
  4. *Logging Consistency Score* (days active in current month)
* **Daily AI Insight:** A personalized, actionable tip contextualized to the user's cash flow, upcoming bills, and recent velocity.
* **Downloadable PDF Reports:** Generates professional monthly statements with breakdowns, goals, and health grades using `jspdf` and `jspdf-autotable`.

### 2. Smart Expense Tracker & Anomaly Detection
* **Instant Auto-Categorization:** Uses Gemini 3.7 Flash API (with robust local heuristics as fallbacks) to classify expenses into student-centric categories:
  * *Housing & Rent*, *Food & Dining*, *Textbooks & Tuition*, *Entertainment & Subscriptions*, *Transportation*, *Shopping & Personal*, *Health & Wellness*, and *Miscellaneous*.
* **Frequent Purchase Presets:** Quick-log chips for rapid entry:
  * Campus Coffee ($5.50)
  * Dining Hall Meal ($12.00)
  * Campus Transit ($2.50)
  * Course Materials ($45.00)
* **CSV Bulk Upload:** Drag-and-drop parsing of bank statements with bulk auto-categorization.
* **Spending Anomaly Explainer:** Flags transactions that are 1.5x+ standard deviation above historical averages for that category, accompanied by plain-English AI explanations.

### 3. "Can I Afford This?" Impulse Purchase Simulator
* **Affordability Engine:** Evaluates a potential purchase price against the student's liquid balance, upcoming fixed bills (rent, utilities due in the next 15 days), and active savings goals.
* **Verdict & Confidence Score:** Outputs a verdict:
  * **YES** (emerald-500)
  * **CAUTION** (orange-500)
  * **NO** (rose-500)
* **Opportunity Cost Simulator:** Calculates the direct impact on savings goals (e.g., *"Buying this item delays your 'Study Abroad' savings goal by 18 days"*).
* **Smart Student Alternatives:** Suggests alternatives like university equipment rentals, student discount portals, or second-hand marketplace resources.

### 4. Student Loan & EMI Calculator
* **Interest Models:** Supports Simple and Compound Interest models to calculate monthly payments and total interest over time.
* **Accelerated Payoff Simulator:** Visualizes how adding a small extra amount monthly (e.g., +$50/mo) affects the amortization schedule, showing total interest saved and months saved.
* **AI Loan Advisor:** A dedicated panel where **Bob** explains loan terms (subsidized vs. unsubsidized, grace periods) and compares repayment strategies (Standard vs. Income-Driven).

### 5. Personalized Scholarship & Grant Matcher
* **Profile-Driven Recommendations:** Uses the student's profile (major, GPA, academic year, household income tier, first-generation status, and interests) to recommend opportunities.
* **Match Probability & Deadlines:** Ranks matches as *Very High*, *High*, or *Medium*, and includes visual progress bars for days remaining.
* **Custom Essay Tips & Keywords:** Generates tailored essay advice and high-impact search keywords.
* **Saved Opportunities Tracker:** Bookmark listings and update application statuses (*Not Started*, *In Progress*, *Submitted*, *Awarded*).

### 6. Budget Planner & Spending Velocity Monitor
* **Flexible Envelopes:** Toggle between the classic 50/30/20 structure and a custom envelope breakdown.
* **Spending Velocity & Burn Rate:** Measures current daily burn rate vs. safe burn rate. Projects month-end balances and predicts the exact calendar date of budget exhaustion.
* **Interactive Burn Rate Simulation:** A slider allowing students to simulate scenarios (e.g., *"What if my spending increases by 1.3x this week due to midterms?"*).
* **Milestone Savings Goals:** Goals like *Emergency Fund*, *Study Abroad*, or *Laptop Upgrade* with visual progress meters.

### 7. Gamification & Habit Calendar
* **Daily Streaks:** Tracks consecutive days logging or checking in.
* **XP & Level Progression:** Earn points for logging transactions, completing challenges, or hitting savings milestones. Levels: *Budget Rookie* (Lvl 1), *Finance Apprentice* (Lvl 2), *Budget Master* (Lvl 3), *Finance Guru* (Lvl 4).
* **Achievement Badges:** Visual badges (e.g., *7-Day Streak*, *First Goal Funded*, *Debt Buster*) featuring canvas-confetti celebrations.
* **Activity Heatmap Calendar:** A GitHub-style commit grid reflecting logging activity and consistency.

### 8. "Ask Bob" AI Financial Companion
* **Context-Aware Floating Chatbot:** A persistent chatbot drawer grounded in the student's real-time financial data: current balance, remaining budgets, active savings goals, and top spending categories.
* **Suggested Action Chips:** Instant quick-replies (e.g., *"How's my burn rate?"*, *"Can I afford a $60 video game?"*, *"Suggest a scholarship"*).

---

## 🔄 Core User Flow & Navigation Map
1. **Onboarding / Demo Mode:** User enters a profile configuration (Major, GPA, Income Tier, Savings Goals) or selects "Instant Demo Student" to load sample transactions, active loans, and realistic budgets.
2. **Dashboard Overview:** Displays the Health Score, Daily AI Insight, current monthly budget progress, and the floating chatbot Bob.
3. **Expenses & Upload:** Users can log individual transactions, use Quick-Log preset chips, or drag-and-drop a CSV file to import and categorize transactions in bulk.
4. **"Can I Afford This?" Simulator:** Input a item name, price, and category, and review the verdict, delayed days, and smart alternatives.
5. **Loan & Scholarship Pages:** Run loan interest simulations or view matching scholarship essay tips.
6. **Budget Planner:** Adjust sliders for category limits and interact with the Burn Rate Velocity Simulator.
7. **Habit Hub:** View unlocked badges, current XP, and the logging calendar heatmap.
