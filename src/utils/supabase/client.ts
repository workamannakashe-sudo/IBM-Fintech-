import { createClient } from "@supabase/supabase-js";

// Supports VITE_ prefix (Vite/browser) and NEXT_PUBLIC_ prefix (Next.js) for portability
const getStorageItem = (key: string): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

const rawSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  getStorageItem("supabase_url") ||
  getStorageItem("fw_supabase_url") ||
  getStorageItem("VITE_SUPABASE_URL");

const rawSupabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  getStorageItem("supabase_anon_key") ||
  getStorageItem("fw_supabase_anon_key") ||
  getStorageItem("VITE_SUPABASE_ANON_KEY");

// Validate whether a genuine, live Supabase configuration is provided
const isValidSupabaseConfig = (url?: string | null, key?: string | null): boolean => {
  if (!url || !key) return false;
  if (!url.startsWith("http")) return false;
  if (url.includes("aaopluetljjrvykcrxew.supabase.co")) return false; // Default placeholder project
  if (key.startsWith("sb_publishable_")) return false; // Non-JWT placeholder key
  return key.startsWith("eyJ") || key.length > 50;
};

let client: ReturnType<typeof createClient> | null = null;
try {
  if (isValidSupabaseConfig(rawSupabaseUrl, rawSupabaseKey)) {
    client = createClient(rawSupabaseUrl!, rawSupabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (e) {
  console.warn("Supabase client not initialized, running in Local Mode:", e);
}

export const supabase: any = client;

export const isSupabaseConfigured = (): boolean => {
  return !!client;
};



