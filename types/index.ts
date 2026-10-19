// ============================================================================
// DOCTECH — the single type system.
//
// E25 in CRM_MASTER_PLAN.md: this file used to declare 15 dead camelCase
// entities with `Date` fields while every page re-declared its own copy of the
// same entities in snake_case — three parallel systems, none of them true.
// It is now the only place a type that is used by more than one file may be
// declared. Two layers, named so you always know what you are holding:
//
//   *Row          a database row exactly as PostgREST returns it (snake_case,
//                 ISO-8601 strings instead of Date — JSON has no Date).
//   *ListItem     a presentation DTO built by an app/api route and rendered by
//                 an app/[locale] page. The route that constructs the object
//                 and the page that reads it import THIS, so renaming a field
//                 is a compile error instead of a blank cell in production.
//
// Types with exactly one caller (a modal's props, a chart's series, an
// AI-client message envelope) stay next to that caller — duplication is only
// a bug when two files have to agree.
// ============================================================================

// ----------------------------------------------------------------------------
// Shared primitives
// ----------------------------------------------------------------------------
export type UserRole = "doctor" | "secretary";
export type Locale = "en" | "ar";

export type SecretaryStatus = "PENDING" | "ACTIVE" | "INACTIVE";

/** `patients.gender` as stored. */
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";

/** `PatientListItem.gender` — the /api/patients route title-cases it for the UI. */
export type PatientListGender = "Female" | "Male" | "Unknown";

export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";

export type ReportStatus = "PENDING" | "TRIAGED" | "REVIEWED" | "REPLIED" | "CLOSED";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type BookingStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type NotificationType =
  | "NEW_APPOINTMENT"
  | "AI_BOOKING_REQUEST"
  | "APPOINTMENT_CANCELLED"
  | "NEW_REPORT"
  | "REPORT_REVIEWED"
  | "WHATSAPP_MESSAGE"
  | "INTERNAL_MESSAGE"
  | "SECRETARY_INVITATION"
  | "SYSTEM";

// ----------------------------------------------------------------------------
// Database rows — snake_case, ISO strings
// ----------------------------------------------------------------------------
export interface ClinicRow {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  clerk_org_id?: string | null;
  timezone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorRow {
  id: string;
  clerk_user_id?: string | null;
  /** Always a string in our API responses; profile inputs bind it directly. */
  email: string;
  name: string;
  specialty?: string | null;
  avatar_url?: string | null;
  clinic_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface SecretaryRow {
  id: string;
  clerk_user_id?: string | null;
  /** Always a string in our API responses; profile inputs bind it directly. */
  email: string;
  name: string;
  phone: string | null;
  permissions: string[];
  avatar_url: string | null;
  status: SecretaryStatus;
  clinic_id: string;
  created_at: string;
  updated_at: string;
  invited_at?: string | null;
  activated_at?: string | null;
}

export interface PatientRow {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender: Gender | string;
  address?: string | null;
  notes?: string | null;
  clinic_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorScheduleRow {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

/** `expenses.amount` is an integer number of piastres — see lib/money.ts. */
export interface ExpenseRow {
  id: string;
  clinic_id: string;
  doctor_id?: string | null;
  category: string;
  title: string;
  title_ar?: string | null;
  amount: number;
  date: string;
  payment_method: PaymentMethod | string;
  paid_to?: string | null;
  receipt_no?: string | null;
  notes?: string | null;
  is_recurring?: boolean;
  recorded_by_role?: string;
  created_at?: string;
  updated_at?: string;
}

/** `payment_transactions.amount` is an integer number of piastres — see lib/money.ts. */
export interface PaymentTransactionRow {
  id: string;
  clinic_id: string;
  doctor_id?: string | null;
  patient_id?: string | null;
  appointment_id?: string | null;
  type: string;
  amount: number;
  payment_method: PaymentMethod | string;
  status: string;
  date: string;
  notes?: string | null;
  recorded_by_role?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------------------
// API presentation DTOs — built by app/api/*, rendered by app/[locale]/*
// ----------------------------------------------------------------------------

/** GET /api/appointments — `status` is lower-cased by the route. */
export interface AppointmentListItem {
  id: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  doctorId: string | null;
  doctorName: string;
  doctorSpecialty: string;
  /** Display date in the clinic's zone, e.g. "Oct 7, 2026". */
  date: string;
  /** Display time in the clinic's zone, e.g. "10:00 AM". */
  time: string;
  /** The raw UTC timestamp; use it for any arithmetic. */
  rawDate: string;
  duration: number;
  status: string;
  type: string;
  source: string;
  bookingStatus: BookingStatus | string;
  /** A PENDING_REVIEW hold only reserves its slot until this timestamp. */
  expiresAt: string | null;
  notes: string;
  fee: number;
  amountPaid: number;
  paymentMethod: string;
  createdAt?: string;
}

/** A grid slot returned by /api/appointments/available-slots. */
export interface AvailableSlotDto {
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  /** "AVAILABLE" | "BOOKED" | "BLOCKED" — what actually happens in that slot. */
  status: string;
  reason?: string | null;
  appointmentId?: string;
  holdExpiresAt?: string | null;
  doctorId: string;
  date: string;
}

export interface DoctorShiftDto {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  shiftName: string | null;
  isActive: boolean;
  maxOverflow: number;
}

export interface ScheduleExceptionDto {
  id: string;
  doctorId: string;
  exceptionDate: string;
  exceptionType: "HOLIDAY" | "LEAVE" | "CONFERENCE" | "EXTRA_SHIFT";
  reason: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt?: string;
}

export interface SlotBlockDto {
  id: string;
  doctorId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdBy: string;
}

/** GET /api/patients — visit counts and dates are pre-computed by the route. */
export interface PatientListItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: PatientListGender;
  genderAr: string;
  age: number;
  address: string;
  notes: string;
  totalVisits: number;
  lastVisit: string;
  lastVisitAr: string;
  createdAt?: string;
}

/** GET /api/doctors — one entry per doctor in the caller's clinic. */
export interface DoctorListItem {
  id: string;
  name: string;
  /** No Arabic name column yet, so Arabic views fall back to `name`. */
  nameAr: string;
  specialty: string;
  specialtyAr: string;
  /** Initials and colour chip are derived from the id — the DB stores neither. */
  initials: string;
  avatarBg: string;
  /** Non-cancelled appointments booked with this doctor. */
  totalCases: number;
  totalReports: number;
  /** Reports still awaiting review (status is neither REVIEWED nor CLOSED). */
  pendingReviews: number;
  /** The doctor's weekly shifts; filter on `is_active` before rendering. */
  schedules: DoctorScheduleRow[];
}

/** A `reports` row as returned by GET /api/reports (joined with its patient). */
export interface ReportDbRow {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  content: string | null;
  /** Holds the doctor's review text plus a trailing `<!-- CLINICAL_META: ... -->` block. */
  doctor_review: string | null;
  triage_notes: string | null;
  status: ReportStatus | string;
  created_at?: string | null;
  patients?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
  } | null;
}

/** GET /api/whatsapp/conversations — one inbox row per patient thread. */
export interface WhatsAppConversationItem {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  waId: string;
  status: string;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
}

/** A row of a WhatsApp thread; `from` is "patient", "clinic" or "ai". */
export interface WhatsAppThreadMessage {
  id: string;
  conversationId: string;
  from: string;
  content: string;
  status: string;
  sentAt: string;
}

/** The staff chat shared by the doctor and secretary communications screens. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isUrgent?: boolean;
}

/** GET /api/messages — the persisted internal chat row. */
export interface InternalChatMessage {
  id: string;
  channelId: string;
  senderRole: "doctor" | "secretary";
  senderName: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  clinicId?: string;
}

// ----------------------------------------------------------------------------
// Finance — GET /api/doctor/finance (and its secretary-side consumers).
// `amount` fields are EGP: they come back already run through
// fromPiastres() at the route boundary. See lib/money.ts.
// ----------------------------------------------------------------------------
export type ExpenseCategory =
  | "SALARIES"
  | "UTILITIES"
  | "RENT"
  | "SUPPLIES"
  | "LAB"
  | "TRANSPORT"
  | "MAINTENANCE"
  | "MARKETING"
  | "SOFTWARE"
  | "TAXES"
  | "MISC"
  | "CAPEX";

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  categoryNameEn: string;
  categoryNameAr: string;
  titleEn: string;
  titleAr: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface RevenueItem {
  id: string;
  type: "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "REPORT" | "OTHER";
  typeNameEn: string;
  typeNameAr: string;
  patientName: string;
  patientNameAr: string;
  amount: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod | "INSURANCE";
  status: "PAID" | "PENDING";
}

/** One line of an invoice (EGP at the boundary). */
export interface InvoiceLineDto {
  id: string;
  itemType: string;
  descriptionAr: string;
  descriptionEn: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** A recorded payment against an invoice (EGP). */
export interface InvoicePaymentDto {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference: string | null;
}

/** GET /api/finance/invoices and /invoices/[id] — shared invoice shape (EGP). */
export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId: string | null;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  notes: string | null;
  patient: { name?: string; phone?: string } | null;
}

/** GET /api/finance/categories — one row for the expense selector. */
export interface ExpenseCategoryOption {
  id: string;
  clinicId: string | null;
  code: string;
  nameEn: string;
  nameAr: string;
  behaviorType: "FIXED" | "SEMI_VARIABLE" | "VARIABLE" | "STEP_FIXED" | "CAPEX" | "TAX";
  isClinicalCost: boolean;
  isPatientCare: boolean;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  icon: string | null;
  color: string | null;
}

/** Recurring expense template (plan §5.2.2) — amounts are EGP. */
export interface ExpenseTemplateDto {
  id: string;
  categoryId: string | null;
  titleEn: string;
  titleAr: string;
  amount: number;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  dueDayOfMonth: number | null;
  weekday: number | null;
  startDate: string | null;
  endDate: string | null;
  paymentMethod: string;
  payee: string | null;
  contractRef: string | null;
  postingMode: "AUTO" | "CONFIRM" | "MANUAL";
  accountingBasis: "CASH" | "ACCRUAL";
  lastPostedPeriod: string | null;
  nextDueAt: string | null;
  isActive: boolean;
}

/** One amortized line of the fixed-cost schedule (§5.2.3). */
export interface FixedCostRowDto {
  templateId: string;
  titleEn: string;
  titleAr: string;
  categoryCode: string | null;
  behavior: string;
  amount: number;
  monthly: number;
  frequency: string;
  variabilityPct: number;
}

/** GET /api/finance/templates — templates + the monthly fixed-cost view. */
export interface FixedCostBreakdownDto {
  rows: FixedCostRowDto[];
  monthlyTotal: number;
  unavailable: boolean;
}

/** POST /api/finance/templates/run — idempotent recurring-expense runner. */
export interface TemplateRunResultDto {
  periodKey: string;
  posted: { templateId: string; expenseId: string; amount: number }[];
  pending: { templateId: string; amount: number }[];
  skipped: { templateId: string; reason: "ALREADY_POSTED" | "NOT_DUE" | "INACTIVE" | "MANUAL" }[];
  unavailable?: boolean;
}

/** One line inside a P&L section (amounts are EGP). */
export interface ProfitAndLossSectionItem {
  key: string;
  labelEn: string;
  labelAr: string;
  amount: number;
}

/** GET /api/finance/pl — the rebuilt statement (all figures come from rows). */
export interface ProfitAndLossPayload {
  month: string;
  monthLabel: string;
  monthLabelAr: string;
  timeZone: string;
  currency: "EGP";
  revenue: {
    groups: ProfitAndLossSectionItem[];
    discounts: number;
    refunds: number;
    gross: number;
  };
  cogs: { items: ProfitAndLossSectionItem[]; total: number };
  grossProfit: number;
  grossMarginPct: number | null;
  fixedOverhead: { items: ProfitAndLossSectionItem[]; total: number };
  variableOpex: { items: ProfitAndLossSectionItem[]; total: number };
  capex: { items: ProfitAndLossSectionItem[]; total: number };
  totalOperatingExpenses: number;
  netProfit: number;
  netMarginPct: number | null;
  totalExpensesAll: number;
  analysis: {
    visits: number;
    avgRevenuePerVisit: number | null;
    directCostPerVisit: number | null;
    contributionPerVisit: number | null;
    contributionMarginPct: number | null;
    fixedMonthly: number;
    breakEvenVisits: number | null;
    breakEvenVisitsPerDay: number | null;
    workingDays: number;
    computable: boolean;
    reason: string | null;
    basis: string;
  };
  fixedCostTable: Array<{
    templateId: string;
    titleEn: string;
    titleAr: string;
    categoryCode: string | null;
    behavior: string;
    frequency: string;
    amount: number;
    monthly: number;
    variabilityPct: number;
  }>;
  comparison: {
    previousMonth: string;
    revenueGrowthPct: number | null;
    expenseGrowthPct: number | null;
  };
  alerts: Array<{
    code: string;
    level: "info" | "warning";
    messageEn: string;
    messageAr: string;
  }>;
  dataSources: {
    appointments: number;
    expenseRows: number;
    invoiceRows: number;
    refundRows: number;
    fixedCostTemplates: number;
  };
}

export interface MonthFinancialRecord {
  monthKey: string; // "2026-09"
  monthNameEn: string;
  monthNameAr: string;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  totalVisits: number;
  avgPerPatient: number;
  revenueGrowthMoM: number;
  expensesGrowthMoM: number;
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  weeklyTrend: {
    week: string;
    weekAr: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }[];
}

/** One row of GET /api/{doctor,secretary}/contacts — as returned, before sidebar enrichment. */
export interface ContactDto {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  role: string;
  type: "doctor" | "secretary" | "staff";
  avatar_url: string | null;
  clinic_id: string;
  isOnline: boolean;
}

/** A ContactDto (or the synthetic broadcast row) after both communications screens enrich it. */
export interface StaffContact {
  id: string;
  name: string;
  role: string;
  type: "doctor" | "secretary" | "staff" | "broadcast";
  avatarBg: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  channelId: string;
}

/** GET /api/notifications — notifications already filtered to the session role. */
export interface SystemNotification {
  id: string;
  clinicId?: string;
  role?: "doctor" | "secretary" | "all";
  doctorId?: string;
  secretaryId?: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  time: string;
  isRead: boolean;
  link: string;
  /** Absent only on notifications synthesized in the browser (realtime chat pings). */
  createdAt?: string;
}

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
