import { createClient } from "@supabase/supabase-js";

// Supports VITE_ prefix (Vite/browser) and NEXT_PUBLIC_ prefix (Next.js) for portability
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  localStorage.getItem("fw_supabase_url") ||
  "";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  localStorage.getItem("fw_supabase_anon_key") ||
  "";

let client: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
}

export const supabase: any = client;

export const isSupabaseConfigured = (): boolean => {
  return !!client;
};

