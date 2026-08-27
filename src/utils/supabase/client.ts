import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("fw_supabase_url") || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("fw_supabase_anon_key") || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseKey;
};
