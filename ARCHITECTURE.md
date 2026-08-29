# 🏛️ BudgetMitra Architecture & Engineering Manual

BudgetMitra is a student-centric financial copilot and executive money management platform built with React 19, TypeScript (Strict Mode), Vite, Tailwind CSS, Supabase, and Google Gemini / IBM Bob AI engines.

---

## 📐 System Architecture Diagram

```mermaid
graph TD
    A[User / Browser] --> B[React 19 Frontend App]
    B --> C[Theme Context (Dark/Light)]
    B --> D[Financial Context Engine]
    B --> E[Gamification Engine (XP/Streaks)]
    
    D --> F[Security & XSS Sanitization]
    D --> G[Supabase Realtime Cloud Sync]
    D --> H[Local Storage Fallback Cache]
    D --> I[Google Sheets Export Service]
    D --> J[PDF Monthly Report Generator]

    B --> K[IBM Bob / Gemini AI Copilot]
    K --> L[Affordability Decision Engine]
    K --> M[Expense Auto-Categorization]
    K --> N[Scholarship & Loan Matcher]
    K --> O[Multi-turn Conversational Coach]

    D --> P[Financial Calculation Utilities]
    P --> Q[Amortization Engine]
    P --> R[4-Pillar Health Score Algorithm]
    P --> S[CSV Bank Statement Parser]
    P --> T[Split the Bill Engine]
```

---

## 🔒 Security & Data Privacy Matrix

| Feature | Implementation | Guarantee |
| :--- | :--- | :--- |
| **XSS Defense** | `sanitizeInput()` in `src/utils/security.ts` | All strings escaped before rendering or persistence. |
| **Boundary Guard** | `sanitizeCurrencyAmount()` | Rejects `NaN`, negative, or overflow values (`<= 100M`). |
| **Prompt Injection** | `sanitizePromptQuery()` | Filters system-override sequences before sending to LLM. |
| **Local Storage** | `safeStorageGet()` / `safeStorageSet()` | Validates schema integrity; SSR-safe with error fallback. |
| **Secret Masking** | `maskSecretKey()` | Masks private API keys in logs and telemetry (`AIza••••cdef`). |
| **Data Encryption** | Supabase SSL / Row Level Security | Authenticated user sessions segregated in cloud database. |

---

## 🧪 Testing & Quality Assurance Suite

All core mathematical equations, security boundaries, AI heuristic engines, and gamification mechanics are covered with 100% passing tests via **Vitest**.

### Running Tests:
```bash
# Run all unit and integration test suites once
npm test

# Run tests in interactive watch mode
npm run test:watch

# Build production bundle with full TypeScript strict type checking
npm run build
```

### Test Suite Catalog:
1. `src/__tests__/finance.test.ts`: Simple/Compound interest, 50-year safety ceilings, 0% interest student loans, accelerated payoff schedules.
2. `src/__tests__/health.test.ts`: 4-pillar financial health score, letter grade boundaries (A+ to D), budget burst penalties, anomaly deductions.
3. `src/__tests__/security.test.ts`: XSS HTML escaping, boundary constraints, prompt injection sanitization, safe storage serialization.
4. `src/__tests__/csvParser.test.ts`: Bank statement CSV ingestion, Indian UPI parsing, negative amounts vs credit/debit detection.
5. `src/__tests__/gemini.test.ts`: Auto-categorization heuristics (Food, Rent, Books, Travel, Entertainment), Affordability decision trees (YES/CAUTION/NO), Hindi & Marathi language generation, scholarship matching.
6. `src/__tests__/splitBill.test.ts`: Group expense splitting, friend allocations, decimal currency precision.
7. `src/__tests__/gamification.test.ts`: XP progression, level milestones, consecutive streak calculations and reset safeguards.

---

## 💎 Type Safety & Strict Mode Standards

- **TypeScript Version**: ~6.0.2 with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.
- **Zero Unused Variables**: Built with `"noUnusedLocals": true` and `"noUnusedParameters": true`.
- **Explicit Interfaces**: All database schemas (`profiles`, `transactions`, `budgets`, `savings_goals`, `loans`, `schemes`), context states, and helper returns are fully typed.
