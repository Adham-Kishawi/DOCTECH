import { createClient } from "@supabase/supabase-js";

const cleanStr = (val?: string) =>
  val ? val.replace(/^\uFEFF/, "").trim().replace(/^["']|["']$/g, "").trim() : undefined;

const realSupabaseUrl = "https://hpgnjcbhpkvflqatzigx.supabase.co";
const realSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ25qY2JocGt2ZmxxYXR6aWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMDk4NzcsImV4cCI6MjEwMzU4NTg3N30.TeU6h382YfTeYyoo3v4bRkIsig6sNKSiJfeNM1s4YQY";

const isPlaceholder = (val?: string) => !val || val.includes("placeholder");

const envUrl =
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanStr(process.env.SUPABASE_URL);
const supabaseUrl = !isPlaceholder(envUrl) && envUrl ? envUrl : realSupabaseUrl;

const envKey =
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanStr(process.env.SUPABASE_ANON_KEY) ||
  cleanStr(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  cleanStr(process.env.SUPABASE_PUBLISHABLE_KEY);
const supabaseAnonKey = !isPlaceholder(envKey) && envKey ? envKey : realSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

