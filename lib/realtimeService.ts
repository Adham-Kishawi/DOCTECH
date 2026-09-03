
"use client";

import { supabase } from "@/lib/supabase";

export type RealtimeEvent =
  | {
      type: "SUMMON_SECRETARY";
      payload: {
        doctorName: string;
        room: string;
        time: string;
        urgent: boolean;
      };
    }
  | {
      type: "DISMISS_SUMMON";
      payload: {
        by: string;
      };
    }
  | {
      type: "SECRETARY_DISCREET_ALERT";
      payload: {
        message: string;
        patientName?: string;
        time: string;
      };
    }
  | {
      type: "CHAT_MESSAGE";
      payload: {
        id: string;
        sender: "doctor" | "secretary";
        text: string;
        time: string;
      };
    };

const CHANNEL_NAME = "doctech_clinic_alerts";

class RealtimeBus {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private listeners: ((event: RealtimeEvent) => void)[] = [];
  private initialized = false;

  private init() {
   

    if (this.initialized) return;

    this.initialized = true;

    this.channel = supabase.channel(CHANNEL_NAME);

    this.channel
      .on("broadcast", { event: "CLINIC_ALERT" }, ({ payload }) => {
        this.notify(payload as RealtimeEvent);
        
      })
        .subscribe((status) => {
         console.log("Realtime alerts status:", status);
  });
     
  }

  public subscribe(callback: (event: RealtimeEvent) => void) {
 
    this.init();

    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  public publish(event: RealtimeEvent) {
 
    this.init();

    this.channel?.send({
      type: "broadcast",
      event: "CLINIC_ALERT",
      payload: event,
    });

    
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  // 🚨 Emergency alert sound for the secretary
  public playSummonChime() {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      const playTone = (
        frequency: number,
        startDelay: number,
        duration: number
      ) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(
          frequency,
          ctx.currentTime + startDelay
        );

        const start = ctx.currentTime + startDelay;
        const end = start + duration;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.45, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(start);
        oscillator.stop(end);
      };

      // 🚨 Emergency pattern: high-low / high-low
      playTone(1100, 0, 0.18);
      playTone(750, 0.22, 0.18);
      playTone(1100, 0.44, 0.18);
      playTone(750, 0.66, 0.18);
      playTone(1100, 0.88, 0.18);

      setTimeout(() => {
        void ctx.close();
      }, 1400);
    } catch (error) {
     }
  }
}

export const realtimeBus = new RealtimeBus();