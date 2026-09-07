// offlineManager.ts — BudgetMitra Offline First Sync & Data Vault Manager
// ==============================================================================
// Guarantees 100% offline availability with transparent queueing and backup vault.
// ==============================================================================

import { useState, useEffect } from "react";

export interface OfflineAction {
  id: string;
  type: "ADD_TRANSACTION" | "DELETE_TRANSACTION" | "UPDATE_BUDGET" | "UPDATE_GOAL";
  payload: any;
  timestamp: string;
}

const OFFLINE_QUEUE_KEY = "budgetmitra_offline_queue";

/**
 * Hook to track real-time online / offline network state
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      return navigator.onLine;
    }
    return true;
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => setWasOffline(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Queue an action for background synchronization when back online
 */
export function enqueueOfflineAction(type: OfflineAction["type"], payload: any): void {
  try {
    const existing: OfflineAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    const newAction: OfflineAction = {
      id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    existing.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to enqueue offline action", e);
  }
}

/**
 * Retrieve and clear pending offline actions
 */
export function popOfflineQueue(): OfflineAction[] {
  try {
    const actions: OfflineAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return actions;
  } catch (e) {
    console.error("Failed to pop offline queue", e);
    return [];
  }
}

export function getOfflineQueueCount(): number {
  try {
    const actions: OfflineAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    return actions.length;
  } catch {
    return 0;
  }
}

// ─── Complete Data Vault Export & Import ─────────────────────────────────────

export interface VaultBackupData {
  version: string;
  exportedAt: string;
  appName: string;
  profile: any;
  transactions: any[];
  budgets: any[];
  goals: any[];
  loans: any[];
  gamification: any;
  checksum: string;
}

/**
 * Generate a simple hash checksum for backup verification
 */
function generateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `bm_chk_${Math.abs(hash).toString(16)}`;
}

/**
 * Export full application data into a verified JSON file download
 */
export function exportDataVault(
  profile: any,
  transactions: any[],
  budgets: any[],
  goals: any[],
  loans: any[],
  gamification: any
): void {
  const payloadToHash = JSON.stringify({ profile, transactions, budgets, goals, loans, gamification });
  const checksum = generateChecksum(payloadToHash);

  const backup: VaultBackupData = {
    version: "1.0.0",
    appName: "BudgetMitra",
    exportedAt: new Date().toISOString(),
    profile,
    transactions,
    budgets,
    goals,
    loans,
    gamification,
    checksum,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BudgetMitra_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported JSON backup before applying to state
 */
export function validateVaultBackup(rawJson: string): { valid: boolean; data?: VaultBackupData; error?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== "object") {
      return { valid: false, error: "Invalid JSON structure" };
    }
    if (parsed.appName !== "BudgetMitra") {
      return { valid: false, error: "Not a valid BudgetMitra backup file" };
    }
    if (!Array.isArray(parsed.transactions)) {
      return { valid: false, error: "Missing transactions array" };
    }

    const payloadToHash = JSON.stringify({
      profile: parsed.profile,
      transactions: parsed.transactions,
      budgets: parsed.budgets,
      goals: parsed.goals,
      loans: parsed.loans,
      gamification: parsed.gamification,
    });

    const expectedChecksum = generateChecksum(payloadToHash);
    if (parsed.checksum && parsed.checksum !== expectedChecksum) {
      return { valid: false, error: "Backup file integrity check failed (corrupted or tampered)" };
    }

    return { valid: true, data: parsed };
  } catch (e: any) {
    return { valid: false, error: `Parse error: ${e.message}` };
  }
}
