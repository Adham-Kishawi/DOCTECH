// Clinic context data — stored in localStorage so the doctor can configure it from the UI.
// The AI assistant reads this data to answer patient questions accurately.

const STORAGE_KEY = "doctech_clinic_context";

export interface ClinicContextData {
  clinicName: string;
  doctorName: string;
  specialty: string;
  address: string;
  workingDays: string;
  workingHours: string;
  consultationFee: string;
  followUpFee: string;
  services: string;
  additionalNotes: string;
}

export const DEFAULT_CLINIC_CONTEXT: ClinicContextData = {
  clinicName: "",
  doctorName: "",
  specialty: "",
  address: "",
  workingDays: "السبت - الخميس",
  workingHours: "10:00 ص - 06:00 م",
  consultationFee: "400",
  followUpFee: "200",
  services: "",
  additionalNotes: "",
};

export function getClinicContext(): ClinicContextData {
  if (typeof window === "undefined") return DEFAULT_CLINIC_CONTEXT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLINIC_CONTEXT;
    return { ...DEFAULT_CLINIC_CONTEXT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLINIC_CONTEXT;
  }
}

export function setClinicContext(data: ClinicContextData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

/** Build the system prompt section from the saved clinic context */
export function buildClinicContextPrompt(data: ClinicContextData): string {
  const lines: string[] = [];
  if (data.clinicName) lines.push(`- اسم العيادة: ${data.clinicName}`);
  if (data.doctorName) lines.push(`- الطبيب: ${data.doctorName}`);
  if (data.specialty) lines.push(`- التخصص: ${data.specialty}`);
  if (data.address) lines.push(`- العنوان: ${data.address}`);
  if (data.workingDays) lines.push(`- أيام العمل: ${data.workingDays}`);
  if (data.workingHours) lines.push(`- مواعيد العمل: ${data.workingHours}`);
  if (data.consultationFee) lines.push(`- سعر الكشف: ${data.consultationFee} جنيه`);
  if (data.followUpFee) lines.push(`- سعر المتابعة: ${data.followUpFee} جنيه`);
  if (data.services) lines.push(`- الخدمات المتاحة: ${data.services}`);
  if (data.additionalNotes) lines.push(`- ملاحظات إضافية: ${data.additionalNotes}`);

  if (lines.length === 0) return "";
  return `\n\nبيانات العيادة:\n${lines.join("\n")}`;
}
