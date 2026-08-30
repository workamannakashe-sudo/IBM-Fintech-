import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://aaopluetljjrvykcrxew.supabase.co";
const supabaseKey =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_N9Iig0qzCLHdsa7v5plMfQ_96cIVXCr";

export const updateSession = (request: any, response: any) => {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies?.getAll?.() || [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (response?.cookies?.set) {
            response.cookies.set(name, value, options);
          }
        });
      },
    },
  });

  return { supabase, response };
};
