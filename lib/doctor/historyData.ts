export type ClinicalRecordType = "CONSULTATION" | "PRESCRIPTION" | "TRIAGE_REPORT";

export interface PrescriptionMedicine {
  name: string;
  nameAr?: string;
  dosage: string;
  frequency: string;
  frequencyAr: string;
  duration: string;
  durationAr: string;
  notes?: string;
}

export interface PatientVitals {
  bp?: string;          // Blood pressure (e.g. 120/80)
  temp?: string;        // Temperature (e.g. 37.1 C)
  heartRate?: string;   // Pulse (e.g. 78 bpm)
  bloodSugar?: string;  // Glucose (e.g. 110 mg/dL)
  weight?: string;      // Weight (e.g. 74 kg)
}

/** Structured snapshot embedded inside `reports.doctor_review`. */
export interface ClinicalMeta {
  type?: string;
  title?: string;
  diagnosis?: string;
  urgency?: string;
  vitals?: PatientVitals;
  medicines?: PrescriptionMedicine[];
}

export interface ClinicalHistoryItem {
  id: string;
  recordNumber: string; // e.g. "CR-2026-108"
  type: ClinicalRecordType;
  doctorId: string;
  doctorName: string;
  doctorNameAr: string;
  specialty: string;
  specialtyAr: string;
  
  // Patient details
  patientId: string;
  patientName: string;
  patientNameAr: string;
  /** Absent when the patient has no date of birth on file. */
  patientAge?: number;
  patientGender: "male" | "female";
  patientPhone: string;

  // Timestamps
  date: string;       // YYYY-MM-DD
  time: string;       // e.g. "10:30 AM"
  relativeTimeAr: string;
  relativeTimeEn: string;

  // Clinical Content
  title: string;
  titleAr: string;
  diagnosis?: string;
  diagnosisAr?: string;
  symptoms?: string;
  symptomsAr?: string;
  doctorNotes?: string;
  doctorNotesAr?: string;
  
  // Prescription specifics
  medicines?: PrescriptionMedicine[];
  
  // Triage specifics
  urgency: "High" | "Medium" | "Normal";
  status: "completed" | "reviewed" | "pending_action";
  triageNotes?: string;
  triageNotesAr?: string;
  triageSecretary?: string;
  urgencyReason?: string;

  // Vitals
  vitals?: PatientVitals;

  /** The snapshot exactly as stored; edits re-serialise this, never the display fields. */
  clinicalMeta?: ClinicalMeta;
}

