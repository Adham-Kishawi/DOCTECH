import type {
  ClinicalHistoryItem,
  ClinicalMeta,
  ClinicalRecordType,
} from "@/lib/doctor/historyData";
import type { DoctorListItem, ReportDbRow } from "@/types/index";

const META_BLOCK = /<!-- CLINICAL_META:\s*([\s\S]*?)\s*-->/;

/** Splits a stored `doctor_review` into the doctor's prose and the embedded snapshot. */
export function parseClinicalMeta(doctorReview?: string | null): {
  cleanReview: string;
  meta: ClinicalMeta;
} {
  const review = doctorReview || "";
  const stripped = review.replace(/<!-- CLINICAL_META:[\s\S]*?-->/g, "").trim();

  if (!review.includes("<!-- CLINICAL_META:")) {
    return { cleanReview: stripped, meta: {} };
  }

  try {
    const match = review.match(META_BLOCK);
    const parsed: unknown = match?.[1] ? JSON.parse(match[1]) : {};
    const meta = parsed && typeof parsed === "object" ? (parsed as ClinicalMeta) : {};
    return { cleanReview: stripped, meta };
  } catch (error) {
    console.error("Failed to parse CLINICAL_META block:", error);
    return { cleanReview: stripped, meta: {} };
  }
}

/** Re-writes the snapshot so the doctor's prose stays byte-for-byte intact. */
export function buildDoctorReview(cleanReview: string | undefined, meta: ClinicalMeta): string {
  const text = (cleanReview || "").trim();
  const payload: ClinicalMeta = {};

  if (meta.type) payload.type = meta.type;
  if (meta.title) payload.title = meta.title;
  if (meta.diagnosis) payload.diagnosis = meta.diagnosis;
  if (meta.urgency) payload.urgency = meta.urgency;
  if (meta.vitals && Object.keys(meta.vitals).length > 0) payload.vitals = meta.vitals;
  if (meta.medicines && meta.medicines.length > 0) payload.medicines = meta.medicines;

  if (Object.keys(payload).length === 0) return text;

  const block = `<!-- CLINICAL_META: ${JSON.stringify(payload)} -->`;
  return text ? `${text}\n\n${block}` : block;
}

function toRecordType(value?: string): ClinicalRecordType {
  if (value === "CONSULTATION" || value === "PRESCRIPTION" || value === "TRIAGE_REPORT") {
    return value;
  }
  return "TRIAGE_REPORT";
}

function toUrgency(value?: string): ClinicalHistoryItem["urgency"] {
  if (value === "High" || value === "Medium" || value === "Normal") return value;
  return "Normal";
}

function toAge(dateOfBirth?: string | null): number | undefined {
  if (!dateOfBirth) return undefined;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return undefined;

  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
  return age >= 0 && age < 130 ? age : undefined;
}

function toRelative(iso?: string | null): { ar: string; en: string } {
  if (!iso) return { ar: "اليوم", en: "Today" };

  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return { ar: "", en: "" };

  const days = Math.floor((Date.now() - created.getTime()) / 86_400_000);
  if (days <= 0) return { ar: "اليوم", en: "Today" };
  if (days === 1) return { ar: "أمس", en: "Yesterday" };
  if (days < 7) return { ar: `منذ ${days} أيام`, en: `${days} days ago` };

  return {
    ar: created.toLocaleDateString("ar-EG"),
    en: created.toLocaleDateString("en-GB"),
  };
}

function toStatus(status?: string | null): ClinicalHistoryItem["status"] {
  if (status === "REVIEWED") return "reviewed";
  if (status === "CLOSED") return "completed";
  return "pending_action";
}

/** Maps a raw `reports` row onto the shape every history screen renders. */
export function mapReportRow(row: ReportDbRow, doctors: DoctorListItem[]): ClinicalHistoryItem {
  const { cleanReview, meta } = parseClinicalMeta(row.doctor_review);
  const doctor = doctors.find((d) => d.id === row.doctor_id);
  const patient = row.patients;
  const relative = toRelative(row.created_at);
  const content = row.content || "";

  return {
    id: row.id,
    recordNumber: `REP-${(row.id || "").slice(-6).toUpperCase()}`,
    type: toRecordType(meta.type),
    doctorId: row.doctor_id || "",
    doctorName: doctor?.name ?? "Unassigned",
    doctorNameAr: doctor?.nameAr ?? "غير محدد",
    specialty: doctor?.specialty ?? "",
    specialtyAr: doctor?.specialtyAr ?? "",
    patientId: row.patient_id || "",
    patientName: patient?.name || "",
    patientNameAr: patient?.name || "",
    patientAge: toAge(patient?.date_of_birth),
    patientGender: patient?.gender?.toLowerCase() === "female" ? "female" : "male",
    patientPhone: patient?.phone || "",
    date: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    relativeTimeAr: relative.ar,
    relativeTimeEn: relative.en,
    title: meta.title || (content ? content.slice(0, 60) : "Medical Case Report"),
    titleAr: meta.title || (content ? content.slice(0, 60) : "تقرير حالة طبية"),
    diagnosis: meta.diagnosis || cleanReview || undefined,
    diagnosisAr: meta.diagnosis || cleanReview || undefined,
    symptoms: content || undefined,
    symptomsAr: content || undefined,
    doctorNotes: cleanReview || undefined,
    doctorNotesAr: cleanReview || undefined,
    triageNotes: row.triage_notes || undefined,
    triageNotesAr: row.triage_notes || undefined,
    medicines: meta.medicines,
    vitals: meta.vitals,
    clinicalMeta: meta,
    urgency: toUrgency(meta.urgency),
    status: toStatus(row.status),
  };
}
