import { describe, it, expect } from "vitest";
import { parseSmsText, DEMO_SMS_SAMPLES } from "../utils/smsParser";

describe("smsParser Utility", () => {
  it("parses standard SBI debit SMS correctly", () => {
    const raw = "Dear Customer, Rs.450.00 debited from A/c XXXXX7823 on 01-09-26 at SWIGGY. Avl Bal Rs.12,350.50. -SBI";
    const res = parseSmsText(raw);

    expect(res.transactions.length).toBe(1);
    const tx = res.transactions[0];
    expect(tx.amount).toBe(450);
    expect(tx.type).toBe("debit");
    expect(tx.bank).toBe("SBI");
    expect(tx.category).toBe("Food & Dining");
  });

  it("parses PhonePe & Paytm UPI payments correctly", () => {
    const raw = "PhonePe: Paid Rs.180.00 to Chai Point Kiosk on 02-09-26. UPI Ref: 881273819201.";
    const res = parseSmsText(raw);

    expect(res.transactions.length).toBe(1);
    expect(res.transactions[0].amount).toBe(180);
    expect(res.transactions[0].type).toBe("debit");
    expect(res.transactions[0].bank).toBe("PhonePe");
  });

  it("parses Bank of Baroda debit alerts", () => {
    const raw = "Bank of Baroda: Rs.1450.00 debited from A/c XX9921 on 01-09-26 at APEX BOOK STORE. Avl Bal: Rs.8,400.00.";
    const res = parseSmsText(raw);

    expect(res.transactions.length).toBe(1);
    expect(res.transactions[0].amount).toBe(1450);
    expect(res.transactions[0].bank).toBe("Bank of Baroda");
  });

  it("parses refund and credit notifications", () => {
    const raw = "Refund of Rs.350.00 credited to A/c XX7823 on 02-09-26 from ZOMATO INDIA. Bal: Rs.14,200.00.";
    const res = parseSmsText(raw);

    expect(res.transactions.length).toBe(1);
    expect(res.transactions[0].amount).toBe(350);
    expect(res.transactions[0].type).toBe("credit");
  });

  it("parses the complete DEMO_SMS_SAMPLES corpus without crashes", () => {
    const res = parseSmsText(DEMO_SMS_SAMPLES);
    expect(res.transactions.length).toBeGreaterThanOrEqual(7);
  });
});
