/**
 * DOCTECH — Doctor & Clinic DB Seeding Utility
 * 
 * Usage:
 *   node scripts/seed-doctor.mjs --name "Dr. Tarek Omar" --email "tarek@clinic.com" --specialty "Cardiology" --clinic "Al-Amal Clinic"
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hpgnjcbhpkvflqatzigx.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_tu2bHuy_KF5LT-UKU3OJHg_N3y1NFsl";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDoctor() {
  const args = process.argv.slice(2);
  const getArg = (flag, def) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
  };

  const name = getArg("--name", "Dr. Ahmed Hossam");
  const email = getArg("--email", "doctor@doctech.com");
  const specialty = getArg("--specialty", "Cardiology & Internal Medicine");
  const clinicName = getArg("--clinic", "Al-Amal Specialized Medical Center");

  console.log("==========================================");
  console.log("  DOCTECH CLINIC & DOCTOR SEEDING TOOL    ");
  console.log("==========================================");
  console.log(`Doctor Name: ${name}`);
  console.log(`Email:       ${email}`);
  console.log(`Specialty:   ${specialty}`);
  console.log(`Clinic Name: ${clinicName}`);
  console.log("------------------------------------------");
  console.log("Status: Ready to be provisioned in Database!");
  console.log("==========================================");
}

seedDoctor();
