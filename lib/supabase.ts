import { createClient } from "@supabase/supabase-js";

const cleanStr = (val?: string) =>
  val ? val.replace(/^\uFEFF/, "").trim().replace(/^["']|["']$/g, "").trim() : undefined;

const supabaseUrl =
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanStr(process.env.SUPABASE_URL) ||
  "https://hpgnjcbhpkvflqatzigx.supabase.co";

const supabaseAnonKey =
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SUPABASE_ANON_KEY) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanStr(process.env.SUPABASE_PUBLISHABLE_KEY) ||
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
