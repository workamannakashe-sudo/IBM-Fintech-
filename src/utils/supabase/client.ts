import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://aaopluetljjrvykcrxew.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_N9Iig0qzCLHdsa7v5plMfQ_96cIVXCr";

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

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  getStorageItem("supabase_url") ||
  getStorageItem("fw_supabase_url") ||
  getStorageItem("VITE_SUPABASE_URL") ||
  DEFAULT_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  getStorageItem("supabase_anon_key") ||
  getStorageItem("fw_supabase_anon_key") ||
  getStorageItem("VITE_SUPABASE_ANON_KEY") ||
  DEFAULT_SUPABASE_KEY;

let client: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
}

export const supabase: any = client;

export const isSupabaseConfigured = (): boolean => {
  return !!client;
};


