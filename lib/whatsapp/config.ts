// Centralized Clinic WhatsApp Line Configuration
// The phone number is persisted in localStorage so the doctor can change it from the UI.

const STORAGE_KEY = "doctech_clinic_whatsapp_phone";
const DEFAULT_RAW = "01031445949";

function formatEgyptianPhone(raw: string) {
  // Strip everything non-digit
  const digits = raw.replace(/[^0-9]/g, "");

  // Normalise to international (20...) if starting with 0
  const international = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;

  // Build display: +20 1XX XXX XXXX
  const local = international.startsWith("20") ? `0${international.slice(2)}` : international;
  const display =
    local.length === 11
      ? `+20 ${local.slice(1, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
      : `+${international}`;

  return {
    raw: local.length === 11 ? local : raw,
    international,
    display,
    waMeLink: `https://wa.me/${international}`,
  };
}

function getStoredPhone(): string {
  if (typeof window === "undefined") return DEFAULT_RAW;
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_RAW;
  } catch {
    return DEFAULT_RAW;
  }
}

function setStoredPhone(raw: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // noop
  }
}

function buildConfig(raw?: string) {
  const phone = raw || getStoredPhone();
  const fmt = formatEgyptianPhone(phone);
  return {
    ...fmt,
    carrier: "Egypt",
    webhookVerifyToken:
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "doctech_whatsapp_webhook_secret_2026",
    getDirectChatLink: (message?: string) => {
      return message
        ? `${fmt.waMeLink}?text=${encodeURIComponent(message)}`
        : fmt.waMeLink;
    },
  };
}

// Default export (for static imports)
export const CLINIC_WHATSAPP = buildConfig();

// Dynamic helpers for the settings page
export { getStoredPhone, setStoredPhone, buildConfig, formatEgyptianPhone, DEFAULT_RAW };
