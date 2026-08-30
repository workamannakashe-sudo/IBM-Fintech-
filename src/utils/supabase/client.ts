import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// Supports VITE_ prefix (Vite/browser) and NEXT_PUBLIC_ prefix (Next.js/Node)
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
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  getStorageItem("supabase_url") ||
  "https://aaopluetljjrvykcrxew.supabase.co";

const supabaseKey =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  getStorageItem("supabase_anon_key") ||
  "sb_publishable_N9Iig0qzCLHdsa7v5plMfQ_96cIVXCr";

// Standard Supabase SSR Browser Client Helper
export const createClient = () => {
  if (supabaseUrl && supabaseKey) {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }
  return createBrowserClient("https://aaopluetljjrvykcrxew.supabase.co", "sb_publishable_N9Iig0qzCLHdsa7v5plMfQ_96cIVXCr");
};

// Singleton Client instance for SPA hooks and context
let client: any = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
    client = createSupabaseJsClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (e) {
  console.warn("Supabase client initialized with local fallback:", e);
}

export const supabase: any = client;

export const isSupabaseConfigured = (): boolean => {
  return !!client;
};
