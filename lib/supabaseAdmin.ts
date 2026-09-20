import "server-only";

import { createClient } from "@supabase/supabase-js";

const cleanStr = (val?: string) =>
  val ? val.replace(/^\uFEFF/, "").trim().replace(/^["']|["']$/g, "").trim() : undefined;

const supabaseUrl =
  cleanStr(process.env.SUPABASE_URL) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://hpgnjcbhpkvflqatzigx.supabase.co";

const supabaseSecretKey =
  cleanStr(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanStr(process.env.SUPABASE_SECRET_KEY) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SUPABASE_ANON_KEY) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanStr(process.env.SUPABASE_PUBLISHABLE_KEY) ||
  "";

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);