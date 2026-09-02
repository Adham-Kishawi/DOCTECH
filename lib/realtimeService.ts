"use client";

import { supabase } from "./supabase";

export type RealtimeEvent =
  | { type: "SUMMON_SECRETARY"; payload: { doctorName: string; room: string; time: string; urgent: boolean } }
  | { type: "DISMISS_SUMMON"; payload: { by: string } }
  | { type: "SECRETARY_DISCREET_ALERT"; payload: { message: string; patientName?: string; time: string } }
  | { type: "CHAT_MESSAGE"; payload: { id: string; sender: "doctor" | "secretary"; text: string; time: string; isRead?: boolean } }
  | { type: "NOTIFICATION_RECEIVED"; payload: { id: string; title: string; body: string; type: string; createdAt: string } };

const CHANNEL_NAME = "doctech_clinic_realtime";

class RealtimeBus {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];
  private supabaseChannel: ReturnType<typeof supabase.channel> | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e) => {
        this.notify(e.data);
      };
    }

    // Initialize Supabase Realtime Channel only if valid credentials exist
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        this.supabaseChannel = supabase
          .channel(CHANNEL_NAME)
          .on("broadcast", { event: "clinic_event" }, ({ payload }) => {
            if (payload) {
              this.notify(payload as RealtimeEvent);
            }
          })
          .subscribe();
      } catch (err) {
        console.warn("Supabase Realtime subscription fallback to BroadcastChannel", err);
      }
    }
  }

  public subscribe(callback: (event: RealtimeEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public publish(event: RealtimeEvent) {
    // 1. BroadcastChannel (same browser / multi-tab)
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }
    }

    // 2. Supabase Realtime Broadcast (cross-device / remote)
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "clinic_event",
          payload: event,
        });
      } catch (e) {
        console.warn("Supabase send failed, fallback to local bus", e);
      }
    }

    // 3. Also notify self immediately
    this.notify(event);
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error("Realtime listener error:", err);
      }
    });
  }

  // Web Audio Synthesizer Chime for Secretary Summon
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

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1000);
    } catch (e) {
      console.warn("Audio chime autoplay prevented or unsupported", e);
    }
  }
}

export const realtimeBus = new RealtimeBus();
