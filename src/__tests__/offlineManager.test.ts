import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueOfflineAction,
  popOfflineQueue,
  getOfflineQueueCount,
  validateVaultBackup,
} from "../utils/offlineManager";

describe("offlineManager Utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("enqueues and pops offline actions reliably", () => {
    expect(getOfflineQueueCount()).toBe(0);

    enqueueOfflineAction("ADD_TRANSACTION", { id: "tx1", amount: 250 });
    enqueueOfflineAction("UPDATE_BUDGET", { category: "Food", amount: 5000 });

    expect(getOfflineQueueCount()).toBe(2);

    const popped = popOfflineQueue();
    expect(popped.length).toBe(2);
    expect(popped[0].type).toBe("ADD_TRANSACTION");
    expect(popped[0].payload.amount).toBe(250);

    expect(getOfflineQueueCount()).toBe(0);
  });

  it("validates authentic BudgetMitra vault backups", () => {
    const rawValidBackup = JSON.stringify({
      version: "1.0.0",
      appName: "BudgetMitra",
      exportedAt: new Date().toISOString(),
      profile: { name: "Rohan" },
      transactions: [{ id: "tx1", amount: 500 }],
      budgets: [],
      goals: [],
      loans: [],
      gamification: {},
    });

    const result = validateVaultBackup(rawValidBackup);
    expect(result.valid).toBe(true);
    expect(result.data?.appName).toBe("BudgetMitra");
  });

  it("rejects invalid or foreign backup structures", () => {
    const invalidBackup = JSON.stringify({
      appName: "SomeOtherApp",
      data: 123,
    });

    const result = validateVaultBackup(invalidBackup);
    expect(result.valid).toBe(false);
  });
});
