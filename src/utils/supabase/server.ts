import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://aaopluetljjrvykcrxew.supabase.co";
const supabaseKey =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_N9Iig0qzCLHdsa7v5plMfQ_96cIVXCr";

export interface CookieStoreInterface {
  getAll: () => Array<{ name: string; value: string }>;
  set?: (name: string, value: string, options?: CookieOptions) => void;
}

export const createClient = (cookieStore: any) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return typeof cookieStore?.getAll === "function" ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (typeof cookieStore?.set === "function") {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Can be ignored if handled by middleware
        }
      },
    },
  });
};
