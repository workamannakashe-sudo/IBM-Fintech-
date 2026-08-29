# BudgetMitra — Application Specification (PROJECT.md)

BudgetMitra is an AI-powered financial literacy, budgeting, and decision-support platform tailored specifically for college students and young adults. It bridges the gap between everyday campus spending habits and long-term financial stability.

---

## 🎯 Core Product Vision & Objectives
1. **Promote Financial Literacy:** Demystify financial terms (EMI, compound interest, burn rate) using conversational, student-friendly AI.
2. **Actionable Budgeting:** Go beyond passive tracking to active, predictive alerts based on spending velocity and future bills.
3. **Behavioral Gamification:** Build habit streaks, reward consistency with experience points (XP), and celebrate milestones visually.
4. **Intelligent Decision-Support:** Prevent impulse spending by visualizing the tangible opportunity cost of purchases in real-time.
5. **Peer Expense Splitting:** Simplify group expenses, canteen meals, and flat rent with instant calculations, OCR receipt scanning, and WhatsApp/UPI shareable links.

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
* **Instant Auto-Categorization:** Uses Google Gemini 2.5 Flash API (with robust local heuristics as fallbacks) to classify expenses into student-centric categories:
  * *Housing & Rent*, *Food & Dining*, *Textbooks & Tuition*, *Entertainment & Subscriptions*, *Transportation*, *Shopping & Personal*, *Health & Wellness*, and *Miscellaneous*.
* **Frequent Purchase Presets:** Quick-log chips for rapid entry:
  * Campus Coffee / Chai ($5.50 / ₹50)
  * Dining Hall Meal ($12.00 / ₹150)
  * Campus Transit ($2.50 / ₹60)
  * Course Materials ($45.00 / ₹500)
* **CSV Bulk Upload:** Drag-and-drop parsing of bank statements with bulk auto-categorization.
* **Spending Anomaly Explainer:** Flags transactions that are 2x+ above historical category averages, accompanied by plain-language AI explanations.

### 3. "Can I Afford This?" Impulse Purchase Simulator
* **Affordability Engine:** Evaluates a potential purchase price against the student's liquid balance, upcoming fixed bills, daily burn rate, and active savings goals.
* **Verdict & Confidence Score:** Outputs a verdict:
  * **YES** (emerald-500)
  * **CAUTION** (orange-500)
  * **NO** (rose-500)
* **Opportunity Cost Simulator:** Calculates the direct impact on savings goals and daily burn rate cushions.
* **Multilingual Explanations:** Delivers verdicts in English, Hindi (हिंदी), and Marathi (मराठी).

### 4. Split the Bill Peer Hub
* **Instant Group Division:** Split bills equally or by custom percentages among friends with decimal accuracy.
* **OCR Receipt Scanner:** Drag-and-drop receipt upload with automated line-item extraction.
* **WhatsApp & UPI Integration:** 1-tap sharing to WhatsApp groups and UPI payment link generation.
* **Automatic Ledger Logging:** Logs user shares directly into the expense ledger with a single click.

### 5. Student Loan & EMI Calculator
* **Interest Models:** Supports Simple and Compound Interest models to calculate monthly payments and total interest over time.
* **Accelerated Payoff Simulator:** Visualizes how adding a small extra amount monthly (e.g., +$50/mo or +₹1,500/mo) affects the amortization schedule, showing total interest saved and months saved.
* **0% Subsidized Student Loans:** Full support for zero-interest schemes and government moratorium interest subsidies.

### 6. Personalized Scholarship & Scheme Matcher
* **Profile-Driven Recommendations:** Uses the student's profile (degree, year, state domicile, family income bracket, and social category) to match government and institutional schemes.
* **Match Strength & Deadlines:** Ranks matches as *Strong*, *Likely*, or *Possible*, with direct links to official portals (`scholarships.gov.in`, `vidyalakshmi.co.in`).
* **Document Guidance:** Outlines income certificate, caste certificate, and mark sheet requirements.

### 7. Budget Planner & Spending Velocity Monitor
* **Flexible Envelopes:** Custom envelope breakdown tracking monthly limits across categories.
* **Spending Velocity & Burn Rate:** Measures current daily burn rate vs. safe burn rate. Projects month-end balances and predicts the exact calendar date of budget exhaustion.
* **Interactive Burn Rate Simulation:** A slider allowing students to simulate scenarios (e.g., *"What if my spending increases by 1.3x this week due to exams?"*).
* **Milestone Savings Goals:** Goals like *Emergency Fund*, *Tech Upgrade*, or *Travel Fund* with visual progress meters.

### 8. Gamification & Habit Calendar
* **Daily Streaks:** Tracks consecutive days of logging or checking in.
* **XP & Level Progression:** Earn points for logging transactions, completing challenges, or hitting savings milestones. Levels: *Budget Rookie* (Lvl 1), *Finance Apprentice* (Lvl 2), *Budget Master* (Lvl 3), *Finance Guru* (Lvl 4).
* **Achievement Badges:** Visual badges (e.g., *7-Day Streak*, *First Goal Funded*, *Debt Buster*) featuring canvas-confetti celebrations.
* **Activity Heatmap Calendar:** A GitHub-style commit grid reflecting logging activity and consistency.

### 9. AI Financial Companion (FinBuddy)
* **Context-Aware Floating Assistant:** A persistent assistant drawer grounded in the student's real-time financial data: current balance, remaining budgets, active savings goals, and top spending categories.
* **Suggested Action Chips:** Instant quick-replies (e.g., *"How's my burn rate?"*, *"Can I afford a ₹900 dinner?"*, *"Suggest a scholarship"*).

---

## 🔄 Core User Flow & Navigation Map
1. **Onboarding / Demo Mode:** User enters a profile configuration (Course, Year, State, Income Bracket, Category, Allowance) or selects Demo Student / Guest Mode.
2. **Dashboard Overview:** Displays Hectra executive metrics, 3D payments breakdown, gross volume envelopes, soundwave settlements, and live transaction log.
3. **Expenses & Upload:** Users can log individual transactions, use Quick-Log preset chips, or drag-and-drop a CSV file to import and categorize transactions in bulk.
4. **Split the Bill:** Input total bill, select friends, calculate individual portions, and share payment requests.
5. **"Can I Afford This?" Simulator:** Input item name, price, and category, and review the verdict, burn rate impact, and alternatives.
6. **Loan & Scholarship Pages:** Run loan interest simulations or view matching scholarship criteria and application guides.
7. **Budget Planner:** Adjust category limits and interact with the Burn Rate Velocity Simulator.
8. **Habit Hub:** View unlocked badges, current XP, and the logging calendar heatmap.
