import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("fw_supabase_url") || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("fw_supabase_anon_key") || "";

let client: any = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return !!client;
};

