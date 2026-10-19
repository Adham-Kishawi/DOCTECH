import "server-only";

import { createClient } from "@supabase/supabase-js";

const cleanStr = (val?: string) =>
  val ? val.replace(/^\uFEFF/, "").trim().replace(/^["']|["']$/g, "").trim() : undefined;

const supabaseUrl =
  cleanStr(process.env.SUPABASE_URL) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://hpgnjcbhpkvflqatzigx.supabase.co";

// The publishable/anon key must never land here. 0004 enables RLS with no
// policies, so an anon key would make every route return empty results or
// permission denied — and before 0004 it silently ran unscoped queries as a
// public role. Fail loudly at import instead of failing silently at runtime.
const supabaseSecretKey =
  cleanStr(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanStr(process.env.SUPABASE_SECRET_KEY) || "";

if (!supabaseSecretKey) {
  throw new Error(
    "[supabaseAdmin] SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing. " +
      "Server queries need the secret/service key — the publishable key is denied by RLS."
  );
}

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