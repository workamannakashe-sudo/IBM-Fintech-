// csvParser.test.ts - Unit tests for Bank and UPI CSV statement ingestion
import { describe, it, expect } from "vitest";
import { parseBankCSV } from "../services/csvParser";

describe("CSV Bank Statement Parser", () => {
  it("correctly parses standard Date, Description, Amount headers", async () => {
    const csvContent = `Date,Description,Amount,Category
2026-03-01,Campus Bookstore,45.00,books
2026-03-02,Zomato Food Delivery,12.50,food
2026-03-03,Metro Rail Card Recharge,20.00,travel`;

    const result = await parseBankCSV(csvContent);
    expect(result).toHaveLength(3);
    expect(result[0].description).toBe("Campus Bookstore");
    expect(result[0].amount).toBe(45);
    expect(result[0].category).toBe("books");
    expect(result[1].amount).toBe(12.5);
  });

  it("handles Indian Rupee currency symbols and negative amounts correctly", async () => {
    const csvContent = `Date,Payee,Amount
2026-03-04,Chai Point,-₹150
2026-03-05,Hostel Room Rent,-₹8500`;

    const result = await parseBankCSV(csvContent);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe("Chai Point");
    expect(result[0].amount).toBe(150);
    expect(result[1].amount).toBe(8500);
  });

  it("sanitizes HTML from description headers in CSV rows", async () => {
    const csvContent = `Date,Description,Amount
2026-03-06,<b>Hacked Label</b>,35.00`;

    const result = await parseBankCSV(csvContent);
    expect(result[0].description).toBe("Hacked Label");
    expect(result[0].amount).toBe(35);
  });
});
