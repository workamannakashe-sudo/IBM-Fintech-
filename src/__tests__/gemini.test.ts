import { describe, it, expect } from "vitest";
import { autoCategorizeExpense, askAffordabilityBob, matchSchemesBob } from "../services/gemini";
import type { SchemeRow } from "../services/gemini";

describe("AI Services & Heuristic Decision Engines", () => {
  describe("autoCategorizeExpense", () => {
    it("categorizes Indian student food items correctly", async () => {
      expect(await autoCategorizeExpense("Zomato Biryani")).toBe("food");
      expect(await autoCategorizeExpense("Chai & Samosa Canteen")).toBe("food");
      expect(await autoCategorizeExpense("McDonalds Burger Meal")).toBe("food");
    });

    it("categorizes rent and accommodation items", async () => {
      expect(await autoCategorizeExpense("Hostel Room Rent")).toBe("rent");
      expect(await autoCategorizeExpense("Paying Guest Deposit")).toBe("rent");
    });

    it("categorizes travel & commute expenses", async () => {
      expect(await autoCategorizeExpense("Uber Auto Ride")).toBe("travel");
      expect(await autoCategorizeExpense("Metro Smartcard")).toBe("travel");
    });

    it("categorizes books, academics, and exams", async () => {
      expect(await autoCategorizeExpense("Engineering Physics Textbook")).toBe("books");
      expect(await autoCategorizeExpense("Semester Exam Fee")).toBe("books");
    });

    it("categorizes entertainment and subscriptions", async () => {
      expect(await autoCategorizeExpense("Netflix Monthly")).toBe("entertainment");
      expect(await autoCategorizeExpense("IMAX Movie Ticket")).toBe("entertainment");
    });
  });

  describe("askAffordabilityBob", () => {
    it("returns 'NO' when proposed price exceeds remaining monthly budget", async () => {
      const result = await askAffordabilityBob({
        itemName: "PlayStation 5",
        itemPrice: 45000,
        itemCategory: "Entertainment",
        preferredLanguage: "en",
        financialContext: {
          remainingBudgetThisMonth: 8000,
          daysLeftInMonth: 18,
          dailyBurnRate: 400,
          monthlyAllowance: 20000,
          totalSpentThisMonth: 12000,
          savingsGoals: [{ name: "Laptop", target: 50000, current: 15000 }],
        },
      });

      expect(result.decision).toBe("NO");
      expect(result.reasoning).toBeTruthy();
      expect(result.suggested_action).toBeTruthy();
    });

    it("returns 'YES' when proposed item comfortably fits in budget with safety cushion", async () => {
      const result = await askAffordabilityBob({
        itemName: "Notebook & Pen Set",
        itemPrice: 150,
        itemCategory: "Academics",
        preferredLanguage: "en",
        financialContext: {
          remainingBudgetThisMonth: 15000,
          daysLeftInMonth: 15,
          dailyBurnRate: 300,
          monthlyAllowance: 20000,
          totalSpentThisMonth: 5000,
          savingsGoals: [],
        },
      });

      expect(result.decision).toBe("YES");
      expect(result.reasoning).toBeTruthy();
    });

    it("returns reasoning in Hindi when preferredLanguage is 'hi'", async () => {
      const result = await askAffordabilityBob({
        itemName: "Dinner Buffet",
        itemPrice: 900,
        itemCategory: "Food",
        preferredLanguage: "hi",
        financialContext: {
          remainingBudgetThisMonth: 1200,
          daysLeftInMonth: 14,
          dailyBurnRate: 200,
          monthlyAllowance: 10000,
          totalSpentThisMonth: 8800,
          savingsGoals: [],
        },
      });

      expect(result.decision).toBe("CAUTION");
      // Verify Hindi characters are generated
      expect(/[\u0900-\u097F]/.test(result.reasoning)).toBe(true);
    });
  });

  describe("matchSchemesBob", () => {
    const mockSchemes: SchemeRow[] = [
      {
        id: "nsp_post_matric",
        name: "Post-Matric Scholarship for SC/ST Students",
        type: "scholarship",
        authority: "Ministry of Social Justice & Empowerment",
        eligibility: {
          income_max: 300000,
          category: ["SC", "ST"],
          state: "all",
          course_type: ["B.Tech", "B.Sc", "B.Com"],
        },
        benefit: "100% Tuition Waiver + ₹1,200/month maintenance",
        apply_url: "https://scholarships.gov.in",
        description: "Central scholarship scheme for higher education.",
      },
    ];

    it("matches eligible student profile to relevant scholarship", async () => {
      const matches = await matchSchemesBob({
        profile: {
          full_name: "Rahul Kamble",
          course: "B.Tech",
          year: 2,
          state: "Maharashtra",
          income_bracket: "1-3L",
          category: "SC",
          monthly_allowance: 4000,
        },
        schemes: mockSchemes,
        preferredLanguage: "en",
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].scheme_id).toBe("nsp_post_matric");
      expect(matches[0].eligible).toBe(true);
    });
  });
});
