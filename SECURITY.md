# FinWise — Security Architecture (SECURITY.md)

This document establishes the security guidelines and policies for the FinWise application.

---

## 🔒 Security Principles & Rules

### 1. Secrets & Credentials Management
* **Zero Secrets in Code:** Never hardcode api keys (e.g. Gemini/Google AI Studio API keys) in source files.
* **Environment Configuration:** All API credentials must reside in environment variables (e.g., `import.meta.env.VITE_GEMINI_API_KEY`).
* **Fallback Simulation:** If no API key is set in the environment, the app must gracefully fall back to local rule-based heuristics rather than crashing or displaying raw key input errors.

### 2. Client-Side Input Validation & Sanitization
* **File Uploads (CSV):** Parse uploaded CSV statements line-by-line using structured libraries (`PapaParse` or custom robust parsing). Strip any HTML tags or script blocks embedded in transaction strings.
* **Numeric Fields:** Force inputs (like amount, price, interest rate) to parse through float conversions. Reject negative numbers in single-transaction logs.
* **Prompt Safety:** When passing transaction logs to the Gemini API, construct strict, pre-defined prompt templates to prevent prompt injection.

### 3. Data Storage & Privacy
* **Local Storage Isolation:** User financial profiles, logs, and custom settings must be stored securely in the browser's `localStorage`.
* **Data Sanitization:** When generating reports via `jspdf`, ensure numerical calculations are formatted safely to prevent floating-point errors from leading to overflow layout problems.
* **No Telemetry:** Keep all student transactions strictly local inside the browser unless sent to the Gemini API for categorization.
