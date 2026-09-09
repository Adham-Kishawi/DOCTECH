// ============================================
// DOCTECH - Core TypeScript Types
// ============================================

export type UserRole = "doctor" | "secretary";
export type Locale = "en" | "ar";

export interface Clinic {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  clerkOrgId: string;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  specialty?: string;
  avatarUrl?: string;
  clinicId: string;
  clinic?: Clinic;
  createdAt: Date;
}

export interface Secretary {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  clinicId: string;
  clinic?: Clinic;
  lastActiveAt?: Date;
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  address?: string;
  notes?: string;
  clinicId: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  secretaryId?: string;
  clinicId: string;
  date: Date;
  duration: number;
  status: AppointmentStatus;
  type?: string;
  notes?: string;
  createdAt: Date;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Report {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  clinicId: string;
  content: string;
  triageNotes?: string;
  doctorReview?: string;
  replyMethod?: "HUMAN" | "AI";
  aiReply?: string;
  status: ReportStatus;
  createdAt: Date;
}

export type ReportStatus = "PENDING" | "TRIAGED" | "REVIEWED" | "REPLIED" | "CLOSED";

export interface WhatsAppConversation {
  id: string;
  patientId: string;
  patient?: Patient;
  clinicId: string;
  waId: string;
  status: "OPEN" | "CLOSED";
  lastMessage?: string;
  lastMessageAt?: Date;
  messages?: WhatsAppMessage[];
  createdAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  from: "PATIENT" | "CLINIC" | "AI";
  content: string;
  waMessageId?: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  sentAt: Date;
}

export interface InternalMessage {
  id: string;
  clinicId?: string;
  channelId?: string;
  doctorId?: string;
  doctor?: Doctor;
  secretaryId?: string;
  secretary?: Secretary;
  senderRole?: "doctor" | "secretary";
  senderName?: string;
  content: string;
  isRead: boolean;
  sentAt: Date | string;
}

export interface Notification {
  id: string;
  clinicId: string;
  doctorId?: string;
  secretaryId?: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export type NotificationType =
  | "NEW_APPOINTMENT"
  | "APPOINTMENT_CANCELLED"
  | "NEW_REPORT"
  | "REPORT_REVIEWED"
  | "WHATSAPP_MESSAGE"
  | "SECRETARY_INVITATION"
  | "SYSTEM";

// Dashboard Stats
export interface DashboardStats {
  todayAppointments: number;
  pendingReports: number;
  totalPatients: number;
  unreadMessages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
