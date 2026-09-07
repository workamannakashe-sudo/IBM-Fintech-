// smsParser.ts — BudgetMitra SMS & Bank Alert Parsing Engine
// ============================================================
// SECURITY DESIGN:
//   • All parsing is 100% client-side — zero network calls, zero server contact
//   • Raw SMS text is NEVER persisted to localStorage or any storage
//   • Account/card numbers are masked (XXXXX1234) before any output is produced
//   • Amounts are sanitized via sanitizeCurrencyAmount() before return
//   • This module is pure — it receives a string and returns structured data
// ============================================================

import { sanitizeInput, sanitizeCurrencyAmount } from "./security";

// ─── Output Types ─────────────────────────────────────────────────────────────

export type TransactionType = "debit" | "credit";
export type Confidence = "high" | "medium" | "low";

export interface ParsedSmsTransaction {
  /** Sanitized monetary amount — always positive */
  amount: number;
  /** Whether money left the account (debit) or arrived (credit) */
  type: TransactionType;
  /** Best-guess merchant/payee name extracted from the SMS */
  merchant: string;
  /** Always masked — e.g. "XXXXX1234". Never the full account number */
  maskedAccount: string;
  /** Parsed date, defaults to today if not found in SMS */
  date: string; // ISO date string "YYYY-MM-DD"
  /** BudgetMitra expense category auto-assigned by keyword matching */
  category: string;
  /** Last 4 chars of any transaction ref — full refs are discarded */
  shortRef: string;
  /** How confident the parser is about this result */
  confidence: Confidence;
  /** Human-readable source bank name (generic if unknown) */
  bank: string;
}

export interface SmsParseResult {
  transactions: ParsedSmsTransaction[];
  /** Lines that had some keywords but could not be fully parsed */
  partialMatches: number;
  /** Lines with no financial signal at all */
  skipped: number;
}

// ─── Bank SMS Regex Patterns ─────────────────────────────────────────────────

interface BankPattern {
  bank: string;
  regex: RegExp;
  amountGroup: number;
  typeDetect: TransactionType | number;
  merchantGroup?: number;
  accountGroup?: number;
}

const BANK_PATTERNS: BankPattern[] = [
  // SBI Debit
  {
    bank: "SBI",
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+(?:debited|withdrawn)\s+from\s+(?:A\/c|Acct?)[.\s*#]*([X*\d]+)/i,
    amountGroup: 1, typeDetect: "debit", accountGroup: 2,
  },
  // SBI Credit
  {
    bank: "SBI",
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+credited\s+to\s+(?:A\/c|Acct?)[.\s*#]*([X*\d]+)/i,
    amountGroup: 1, typeDetect: "credit", accountGroup: 2,
  },
  // HDFC named
  {
    bank: "HDFC",
    regex: /HDFC\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // HDFC generic
  {
    bank: "HDFC",
    regex: /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:has been\s+)?(debited|credited)\s+(?:from|to)\s+(?:your\s+)?(?:HDFC\s+)?(?:Acct?|A\/c)[.\s*#]*([X*\d]+)/i,
    amountGroup: 1, typeDetect: 2, accountGroup: 3,
  },
  // ICICI
  {
    bank: "ICICI",
    regex: /ICICI\s+Bank\s+Acct?\s+([X*\d]+)\s+(debited|credited)\s+(?:with\s+)?(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i,
    amountGroup: 3, typeDetect: 2, accountGroup: 1,
  },
  // Axis
  {
    bank: "Axis",
    regex: /Axis\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // Kotak
  {
    bank: "Kotak",
    regex: /Kotak\s+(?:Mahindra\s+)?Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // PNB
  {
    bank: "PNB",
    regex: /PNB[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // Bank of Baroda (BOB)
  {
    bank: "Bank of Baroda",
    regex: /(?:BOB|Bank of Baroda)[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)\s+from\s+A\/c\s*([X*\d]+)/i,
    amountGroup: 1, typeDetect: 2, accountGroup: 3,
  },
  // Canara Bank
  {
    bank: "Canara Bank",
    regex: /Canara\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)\s+(?:from|to)\s+A\/c\s*([X*\d]+)/i,
    amountGroup: 1, typeDetect: 2, accountGroup: 3,
  },
  // Union Bank of India
  {
    bank: "Union Bank",
    regex: /Union\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // Federal Bank
  {
    bank: "Federal Bank",
    regex: /Federal\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // IndusInd Bank
  {
    bank: "IndusInd Bank",
    regex: /IndusInd\s+Bank[:\s]+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
  // CRED Card Payment / Credit
  {
    bank: "CRED",
    regex: /CRED[:\s]+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:paid|received|credited)\s+(?:towards|for)\s+([A-Za-z\s]+)/i,
    amountGroup: 1, typeDetect: "debit", merchantGroup: 2,
  },
  // PhonePe / Paytm / GPay / UPI direct
  {
    bank: "PhonePe",
    regex: /PhonePe[:\s]+(?:Paid|Sent)\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+to\s+([\w\s@.]+)/i,
    amountGroup: 1, typeDetect: "debit", merchantGroup: 2,
  },
  {
    bank: "Paytm",
    regex: /Paytm[:\s]+(?:Paid|Sent)\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+to\s+([\w\s@.]+)/i,
    amountGroup: 1, typeDetect: "debit", merchantGroup: 2,
  },
  // Refund / Cashback
  {
    bank: "Refund",
    regex: /(?:Refund|Cashback)\s+of\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+credited\s+to\s+(?:A\/c|account)[.\s*#]*([X*\d]+)/i,
    amountGroup: 1, typeDetect: "credit", accountGroup: 2,
  },
  // UPI paid
  {
    bank: "UPI",
    regex: /(?:paid|sent)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)\s+to\s+([\w\s@.]+?)\s*(?:via|using)\s+UPI/i,
    amountGroup: 1, typeDetect: "debit", merchantGroup: 2,
  },
  // UPI debited
  {
    bank: "UPI",
    regex: /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:debited|deducted)\s+(?:via|through)?\s*UPI/i,
    amountGroup: 1, typeDetect: "debit",
  },
  // UPI credited
  {
    bank: "UPI",
    regex: /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+credited\s+(?:via|to)?\s*UPI/i,
    amountGroup: 1, typeDetect: "credit",
  },
  // Dr/Cr shorthand
  {
    bank: "Bank",
    regex: /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)[\s-]*(Dr|Cr)\b/i,
    amountGroup: 1, typeDetect: 2,
  },
  // Generic fallback
  {
    bank: "Bank",
    regex: /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:has\s+been\s+)?(debited|credited)/i,
    amountGroup: 1, typeDetect: 2,
  },
];

// ─── Category Keywords ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  {
    keywords: ["swiggy","zomato","domino","pizza","burger","kfc","mcdonald","subway",
                "haldiram","mess","canteen","cafe","dhaba","chai","food","restaurant","eat","biryani"],
    category: "Food & Dining",
  },
  {
    keywords: ["irctc","railway","train","metro","dmrc","bmtc","ola","uber","rapido",
                "auto","bus","transport","fuel","petrol","diesel","cab","taxi","toll","parking"],
    category: "Transportation",
  },
  {
    keywords: ["amazon","flipkart","myntra","ajio","nykaa","meesho","shopsy","shopping",
                "mall","reliance","dmart","bigbasket"],
    category: "Shopping & Personal",
  },
  {
    keywords: ["netflix","hotstar","spotify","zee5","sonyliv","prime","subscription",
                "youtube","gaming","game","entertainment"],
    category: "Entertainment & Subscriptions",
  },
  {
    keywords: ["hospital","clinic","pharmacy","medplus","apollo","doctor","medicine",
                "health","wellness","gym","fitness","yoga","1mg","netmeds"],
    category: "Health & Wellness",
  },
  {
    keywords: ["college","university","tuition","library","book","textbook","course",
                "coaching","exam","fee","admission","hostel","education","byju","unacademy"],
    category: "Textbooks & Tuition",
  },
  {
    keywords: ["rent","landlord","pg","paying guest","accommodation","flat","house",
                "electricity","water","maintenance","wifi","internet","broadband"],
    category: "Housing & Rent",
  },
];

function autoCategory(merchant: string, rawSms: string): string {
  const haystack = `${merchant} ${rawSms}`.toLowerCase();
  for (const { keywords, category } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }
  return "Miscellaneous";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// SECURITY: Mask full account numbers — only last 4 digits visible
function maskAccount(raw: string): string {
  if (!raw) return "XXXXX????";
  const cleaned = raw.replace(/[X*\s]/gi, "");
  if (cleaned.length >= 4) return `XXXXX${cleaned.slice(-4)}`;
  return "XXXXX????";
}

const DATE_PATTERNS: RegExp[] = [
  /(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/,
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i,
  /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
];
const MONTH_MAP: Record<string, string> = {
  jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
  jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
};

function extractDate(sms: string): string {
  for (const pat of DATE_PATTERNS) {
    const m = sms.match(pat);
    if (!m) continue;
    if (m[0].match(/^\d{4}/)) return m[0].slice(0, 10);
    if (isNaN(parseInt(m[2]))) {
      const month = MONTH_MAP[m[2].toLowerCase()] ?? "01";
      const year = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${year}-${month}-${m[1].padStart(2,"0")}`;
    }
    const day = m[1].padStart(2,"0");
    const month = m[2].padStart(2,"0");
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
}

// SECURITY: Discard full ref IDs — keep only last 4 chars as short display token
function extractShortRef(sms: string): string {
  const m = sms.match(/(?:ref(?:erence)?|txn|utr|imps|neft)[.\s#:]*([A-Z0-9]{6,})/i);
  return m ? `...${m[1].slice(-4)}` : "";
}

function extractMerchant(sms: string): string {
  const patterns = [
    /(?:at|to|for|towards)\s+([A-Za-z][\w\s&.'\-]{2,30}?)(?:\s+on|\s+via|\s+ref|\s+txn|\.|,|$)/i,
    /(?:purchase|payment)\s+(?:at|to)\s+([A-Za-z][\w\s&.'\-]{2,25})/i,
    /UPI[:\-]\s*([A-Za-z][\w\s&.'\-]{2,20})/i,
  ];
  for (const pat of patterns) {
    const m = sms.match(pat);
    if (m?.[1]) return m[1].trim().replace(/\s+/g," ").slice(0, 40);
  }
  return "Unknown Merchant";
}

function resolveType(typeDetect: TransactionType | number, match: RegExpMatchArray): TransactionType {
  if (typeof typeDetect === "string") return typeDetect;
  const raw = (match[typeDetect] ?? "").toLowerCase().trim();
  if (raw === "dr" || raw === "debit" || raw === "debited") return "debit";
  if (raw === "cr" || raw === "credit" || raw === "credited") return "credit";
  return "debit";
}

function parseAmount(raw: string): number {
  return sanitizeCurrencyAmount(parseFloat(raw.replace(/,/g, "")));
}

function scoreConfidence(match: RegExpMatchArray, bank: string, merchant: string): Confidence {
  let score = 0;
  if (bank !== "Bank") score += 2;
  if (match.length >= 3) score += 1;
  if (merchant !== "Unknown Merchant") score += 1;
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function detectBankName(sms: string, defaultBank: string): string {
  const upper = sms.toUpperCase();
  if (upper.includes("SBI") || upper.includes("STATE BANK")) return "SBI";
  if (upper.includes("HDFC")) return "HDFC";
  if (upper.includes("ICICI")) return "ICICI";
  if (upper.includes("AXIS")) return "Axis";
  if (upper.includes("KOTAK")) return "Kotak";
  if (upper.includes("PNB") || upper.includes("PUNJAB NATIONAL")) return "PNB";
  if (upper.includes("BANK OF BARODA") || upper.includes("BOB")) return "Bank of Baroda";
  if (upper.includes("CANARA")) return "Canara Bank";
  if (upper.includes("UNION BANK")) return "Union Bank";
  if (upper.includes("FEDERAL BANK")) return "Federal Bank";
  if (upper.includes("INDUSIND")) return "IndusInd Bank";
  if (upper.includes("PHONEPE")) return "PhonePe";
  if (upper.includes("PAYTM")) return "Paytm";
  if (upper.includes("CRED")) return "CRED";
  if (upper.includes("UPI")) return "UPI";
  return defaultBank;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Parses a block of text containing one or more bank SMS alerts.
 *
 * SECURITY GUARANTEE:
 *   - The `rawText` parameter is processed in memory only.
 *   - It is NEVER written to any storage, sent over the network, or logged.
 *   - All returned `maskedAccount` values are pre-masked (XXXXX????).
 *   - All returned `amount` values are sanitized via sanitizeCurrencyAmount().
 *
 * @param rawText - One or more SMS messages, separated by newlines or blank lines
 */
export function parseSmsText(rawText: string): SmsParseResult {
  const sanitized = sanitizeInput(rawText);
  if (!sanitized.trim()) return { transactions: [], partialMatches: 0, skipped: 0 };

  const messages = sanitized
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const transactions: ParsedSmsTransaction[] = [];
  let partialMatches = 0;
  let skipped = 0;

  for (const sms of messages) {
    const hasCurrencySignal = /(?:Rs\.?|INR|₹|debited|credited|Dr\.|Cr\.)/i.test(sms);
    if (!hasCurrencySignal) { skipped++; continue; }

    let matched = false;

    for (const pattern of BANK_PATTERNS) {
      const match = sms.match(pattern.regex);
      if (!match) continue;

      const amount = parseAmount(match[pattern.amountGroup] ?? "0");
      if (amount <= 0 || amount > 10_000_000) { partialMatches++; break; }

      const type = resolveType(pattern.typeDetect, match);
      const maskedAccount = maskAccount(pattern.accountGroup ? (match[pattern.accountGroup] ?? "") : "");
      const merchant = pattern.merchantGroup
        ? (match[pattern.merchantGroup] ?? "Unknown Merchant").trim()
        : extractMerchant(sms);
      const date = extractDate(sms);
      const shortRef = extractShortRef(sms);
      const category = autoCategory(merchant, sms);
      const bank = detectBankName(sms, pattern.bank);
      const confidence = scoreConfidence(match, bank, merchant);

      transactions.push({ amount, type, merchant, maskedAccount, date, category, shortRef, confidence, bank });
      matched = true;
      break;
    }

    if (!matched) partialMatches++;
  }

  return { transactions, partialMatches, skipped };
}

// ─── Demo Sample Data (synthetic — no real user data) ─────────────────────────
export const DEMO_SMS_SAMPLES = `Dear Customer, Rs.450.00 debited from A/c XXXXX7823 on 01-09-26 at SWIGGY. Avl Bal Rs.12,350.50. -SBI

HDFC Bank: Rs.2500.00 debited from your account ending 6621 for IRCTC booking on 31-08-26. Ref No. 4521xxxx9234.

PhonePe: Paid Rs.180.00 to Chai Point Kiosk on 02-09-26. UPI Ref: 881273819201.

ICICI Bank Acct XX3412 debited INR 89.00 on 01-Sep-26. Info: SPOTIFY INDIA. Avl Bal: INR 8,921.00.

Bank of Baroda: Rs.1450.00 debited from A/c XX9921 on 01-09-26 at APEX BOOK STORE. Avl Bal: Rs.8,400.00.

Dear UPI User, Rs.120.00 paid to Rahul Mess Canteen via UPI on 01-09-26. UPI Ref: 67312xxxxx45.

Axis Bank: INR 599.00 debited from A/c **4821 towards AMAZON INDIA on 31-08-26. Bal: INR 15,421.00.

Refund of Rs.350.00 credited to A/c XX7823 on 02-09-26 from ZOMATO INDIA. Bal: Rs.14,200.00.

SBI: Rs.1200.00 credited to A/c XXXXX7823 on 01-09-26. Info: SCHOLARSHIP DISBURSAL NSSP. Avl Bal Rs.13,550.50.

Kotak Mahindra Bank: Rs.350.00 debited for MEDPLUS PHARMACY on 31-08-26. Acct: XXXX9001. Bal: Rs.5,210.00.`;
