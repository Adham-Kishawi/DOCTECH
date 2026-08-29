import fs from "node:fs";
import path from "node:path";

const roots = ["D:\\FULL-PROJECTS\\DOCTECK", "D:\\FULL-PROJECTS\\DOCTECH"];

// ============================================
// 1. AUTH STORE & SESSION MANAGEMENT
// ============================================
const authStore = `"use client";

export type UserRole = "doctor" | "secretary";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicName: string;
  avatarColor: string;
}

const STORAGE_KEY = "doctech_session";

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // Also set cookie for middleware compatibility
  document.cookie = \`doctech_role=\${session.role}; path=/; max-age=86400; SameSite=Lax\`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "doctech_role=; path=/; max-age=0";
}
`;

// ============================================
// 2. AUTH GUARD COMPONENT
// ============================================
const authGuard = `"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { getSession, UserRole } from "@/stores/authStore";
import { Logo } from "@/components/shared/Logo";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "en";
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      // Redirect to sign in if no active session
      router.replace(\`/\${locale}/sign-in?redirect=\${encodeURIComponent(pathname)}\`);
      return;
    }

    if (allowedRole && session.role !== allowedRole) {
      // Role mismatch redirect to their respective portal
      router.replace(\`/\${locale}/\${session.role}/dashboard\`);
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [locale, router, pathname, allowedRole]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B131E] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Logo size={48} />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3368A0] animate-ping" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Verifying Medical Session Security...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
`;

// ============================================
// 3. REALTIME SERVICE & AUDIO SYNTHESIZER
// ============================================
const realtimeService = `"use client";

export type RealtimeEvent =
  | { type: "SUMMON_SECRETARY"; payload: { doctorName: string; room: string; time: string; urgent: boolean } }
  | { type: "DISMISS_SUMMON"; payload: { by: string } }
  | { type: "SECRETARY_DISCREET_ALERT"; payload: { message: string; patientName?: string; time: string } }
  | { type: "CHAT_MESSAGE"; payload: { id: string; sender: "doctor" | "secretary"; text: string; time: string } };

const CHANNEL_NAME = "doctech_clinic_realtime";

class RealtimeBus {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e) => {
        this.notify(e.data);
      };
    }
  }

  public subscribe(callback: (event: RealtimeEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public publish(event: RealtimeEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
    // Also notify self
    this.notify(event);
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((l) => l(event));
  }

  // Synthesizer Audio Chime for Secretary Summon (Web Audio API)
  public playSummonChime() {
    if (typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const now = ctx.currentTime;
      
      // Dual tone chime (E5 -> G5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.15); // G5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(783.99, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn("Audio chime autoplay prevented or unsupported", e);
    }
  }
}

export const realtimeBus = new RealtimeBus();
`;

// ============================================
// 4. SUMMON MODAL FOR SECRETARY
// ============================================
const summonModal = `"use client";

import { useEffect, useState } from "react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { BellRing, Stethoscope, CheckCircle, Volume2, X } from "lucide-react";
import { toast } from "sonner";

export function SummonModal() {
  const [summon, setSummon] = useState<{
    doctorName: string;
    room: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "SUMMON_SECRETARY") {
        setSummon(event.payload);
        realtimeBus.playSummonChime();
        toast.error(\`🚨 URGENT: \${event.payload.doctorName} is calling you to \${event.payload.room}!\`, {
          duration: 10000,
        });
      } else if (event.type === "DISMISS_SUMMON") {
        setSummon(null);
      }
    });

    return () => unsub();
  }, []);

  if (!summon) return null;

  const handleAcknowledge = () => {
    realtimeBus.publish({ type: "DISMISS_SUMMON", payload: { by: "Secretary" } });
    setSummon(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#131E2E] rounded-3xl p-8 shadow-2xl border-4 border-red-500 animate-in zoom-in-95 duration-200 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-red-500/20">
          <BellRing size={40} />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 uppercase tracking-widest mb-2">
            🚨 Immediate Assistance Required
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Doctor Summon Alert
          </h2>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
            {summon.doctorName} requested your immediate presence in:
          </p>
          <p className="text-xl font-extrabold text-[#3368A0] dark:text-[#4B85C5] mt-1 bg-blue-50 dark:bg-slate-800 p-3 rounded-2xl border border-blue-200 dark:border-slate-700">
            🏥 {summon.room}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Summoned at: {summon.time}
          </p>
        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <CheckCircle size={18} />
          <span>I am on my way (Acknowledge)</span>
        </button>
      </div>
    </div>
  );
}
`;

// ============================================
// 5. DISCREET ALERT FOR DOCTOR
// ============================================
const discreetAlert = `"use client";

import { useEffect, useState } from "react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { Info, X } from "lucide-react";

export function DiscreetAlert() {
  const [alert, setAlert] = useState<{
    message: string;
    patientName?: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "SECRETARY_DISCREET_ALERT") {
        setAlert(event.payload);
        // Auto dismiss after 8 seconds
        setTimeout(() => setAlert(null), 8000);
      }
    });

    return () => unsub();
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed top-3 right-6 z-50 max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-[#36ADA3] shadow-lg rounded-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] flex items-center justify-center shrink-0">
        <Info size={18} />
      </div>
      <div className="flex-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white">Note from Reception</span>
          <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium leading-relaxed">
          {alert.message}
        </p>
      </div>
      <button
        onClick={() => setAlert(null)}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
`;

for (const root of roots) {
  const storesDir = path.join(root, "stores");
  const authCompDir = path.join(root, "components", "auth");
  const sharedCompDir = path.join(root, "components", "shared");
  const libDir = path.join(root, "lib");

  fs.mkdirSync(storesDir, { recursive: true });
  fs.mkdirSync(authCompDir, { recursive: true });
  fs.mkdirSync(sharedCompDir, { recursive: true });
  fs.mkdirSync(libDir, { recursive: true });

  fs.writeFileSync(path.join(storesDir, "authStore.ts"), authStore, "utf8");
  fs.writeFileSync(path.join(authCompDir, "AuthGuard.tsx"), authGuard, "utf8");
  fs.writeFileSync(path.join(libDir, "realtimeService.ts"), realtimeService, "utf8");
  fs.writeFileSync(path.join(sharedCompDir, "SummonModal.tsx"), summonModal, "utf8");
  fs.writeFileSync(path.join(sharedCompDir, "DiscreetAlert.tsx"), discreetAlert, "utf8");
}

console.log("AuthGuard, realtimeService, SummonModal & DiscreetAlert created in both directories");
