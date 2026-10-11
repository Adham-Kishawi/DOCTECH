import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const ENV_FILE = "C:\\saeed work\\DOCTECH\\.env.local";

function readEnvValue(name: string): string {
  try {
    const content = fs.readFileSync(ENV_FILE, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key === name) {
        return value;
      }
    }
  } catch {
    return "";
  }

  return "";
}

const supabaseUrl =
  readEnvValue("SUPABASE_URL") ||
  readEnvValue("NEXT_PUBLIC_SUPABASE_URL") ||
  "https://hpgnjcbhpkvflqatzigx.supabase.co";

const supabaseSecretKey =
  readEnvValue("SUPABASE_SERVICE_ROLE_KEY") ||
  readEnvValue("SUPABASE_SECRET_KEY") ||
  readEnvValue("SUPABASE_ANON_KEY") ||
  readEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  "";

export const supabaseMcp = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);