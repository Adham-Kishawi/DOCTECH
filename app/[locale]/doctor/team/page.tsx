


"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  UserPlus,
  Mail,
  Phone,
  Clock,
  Edit2,
  Trash2,
  X,
  Search,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  CalendarCheck,
  Users,
  DollarSign,
  MessageCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";



interface Secretary {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  permissions: string[];
  avatar_url: string | null;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

const ALL_PERMISSION_ID = "all";
const CORE_PERMISSION_IDS = [
  "appointments",
  "patients",
  "billing",
  "whatsapp",
  "reports",
];

const AVAILABLE_PERMISSIONS = [
  {
    id: ALL_PERMISSION_ID,
    label: "All Permissions (كافة الصلاحيات)",
    nameEn: "All Permissions (Full Access)",
    nameAr: "كافة الصلاحيات (وصول إداري شامل)",
    desc: "Grant unrestricted administrative access to all reception, booking, cashier & clinical modules",
    icon: ShieldCheck,
    isMaster: true,
  },
  {
    id: "appointments",
    label: "Appointments & Booking (حجز وإدارة المواعيد)",
    nameEn: "Appointments & Booking",
    nameAr: "حجز وإدارة المواعيد",
    desc: "Manage slots, bookings & timetable",
    icon: CalendarCheck,
  },
  {
    id: "patients",
    label: "Patient Directory & EMR (ملفات وسجلات المرضى)",
    nameEn: "Patient Directory & EMR",
    nameAr: "ملفات وسجلات المرضى",
    desc: "View patient records, history & visits",
    icon: Users,
  },
  {
    id: "billing",
    label: "Billing & Cashier (الخزينة والتحصيل المالي)",
    nameEn: "Billing & Cashier",
    nameAr: "الخزينة والتحصيل المالي",
    desc: "Collect payments & track daily expenses",
    icon: DollarSign,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Chat & Comms (محادثات الواتساب والتواصل)",
    nameEn: "WhatsApp Chat & Comms",
    nameAr: "محادثات الواتساب والتواصل",
    desc: "Direct live patient communication",
    icon: MessageCircle,
  },
  {
    id: "reports",
    label: "Medical Inquiries & Reports (فرز التقارير الطبية)",
    nameEn: "Medical Inquiries & Reports",
    nameAr: "فرز التقارير الطبية",
    desc: "Triage patient reports & review lab tests",
    icon: FileText,
  },
];

const DEFAULT_PERMISSIONS = ["appointments", "patients"];



const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatLastActive = (date: string) => {
  if (!date) return "Unknown";

  const createdAt = new Date(date);

  if (Number.isNaN(createdAt.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return createdAt.toLocaleDateString();
};

const getStatusClasses = (status: Secretary["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";

    case "PENDING":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800";

    case "INACTIVE":
      return "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800";

    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700";
  }
};

export default function DoctorTeamPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [showPassword, setShowPassword] = useState(false);
  const [staffList, setStaffList] = useState<Secretary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Secretary | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Secretary | null>(null);

  // Create form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    permissions: DEFAULT_PERMISSIONS,
  });

  /**
   * Fetch all secretaries belonging to the doctor's clinic.
   */
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch("/api/doctor/secretaries", {
        method: "GET",
        cache: "no-store",
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        users?: Secretary[];
        error?: string;
      };

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {
              success: false,
              error: `Empty response from server (${response.status})`,
            };
      } catch {
        console.error("Invalid JSON response:", responseText);

        throw new Error(
          `Server returned an invalid response (${response.status})`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load staff accounts");
      }

      setStaffList(data.users ?? []);
    } catch (error) {
      console.error("Failed to load staff:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load staff accounts";

      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetCreateForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      permissions: DEFAULT_PERMISSIONS,
    });
    setShowPassword(false);
  };

  const handleTogglePermission = (permissionId: string) => {
    setFormData((prev) => {
      if (permissionId === ALL_PERMISSION_ID) {
        const isAllActive = prev.permissions.includes(ALL_PERMISSION_ID);
        if (isAllActive) {
          return { ...prev, permissions: [] };
        }
        return {
          ...prev,
          permissions: [ALL_PERMISSION_ID, ...CORE_PERMISSION_IDS],
        };
      }

      const exists = prev.permissions.includes(permissionId);
      const nextPermissions = exists
        ? prev.permissions.filter(
            (p) => p !== permissionId && p !== ALL_PERMISSION_ID
          )
        : [...prev.permissions, permissionId];

      const allCoreSelected = CORE_PERMISSION_IDS.every((p) =>
        nextPermissions.includes(p)
      );
      if (allCoreSelected && !nextPermissions.includes(ALL_PERMISSION_ID)) {
        nextPermissions.push(ALL_PERMISSION_ID);
      }

      return {
        ...prev,
        permissions: nextPermissions,
      };
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [ALL_PERMISSION_ID, ...CORE_PERMISSION_IDS],
    }));
  };

  const handleClearPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleToggleEditPermission = (permissionId: string) => {
    if (!editingMember) return;
    const current = editingMember.permissions || [];

    if (permissionId === ALL_PERMISSION_ID) {
      const isAllActive = current.includes(ALL_PERMISSION_ID);
      setEditingMember({
        ...editingMember,
        permissions: isAllActive ? [] : [ALL_PERMISSION_ID, ...CORE_PERMISSION_IDS],
      });
      return;
    }

    const exists = current.includes(permissionId);
    let nextPermissions = exists
      ? current.filter((p) => p !== permissionId && p !== ALL_PERMISSION_ID)
      : [...current, permissionId];

    const allCoreSelected = CORE_PERMISSION_IDS.every((p) =>
      nextPermissions.includes(p)
    );
    if (allCoreSelected && !nextPermissions.includes(ALL_PERMISSION_ID)) {
      nextPermissions.push(ALL_PERMISSION_ID);
    }

    setEditingMember({
      ...editingMember,
      permissions: nextPermissions,
    });
  };

  const handleSelectAllEditPermissions = () => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      permissions: [ALL_PERMISSION_ID, ...CORE_PERMISSION_IDS],
    });
  };

  const handleClearEditPermissions = () => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      permissions: [],
    });
  };

  /**
   * CREATE
   *
   * Creates:
   * 1. Real Clerk user
   * 2. Real Supabase secretary record
   */
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    
if (formData.password.length < 15) {
  toast.error("Password must be at least 15 characters.");
  return;
}

if (!/[A-Z]/.test(formData.password)) {
  toast.error("Password must contain at least one uppercase letter.");
  return;
}

if (!/[a-z]/.test(formData.password)) {
  toast.error("Password must contain at least one lowercase letter.");
  return;
}

if (!/[0-9]/.test(formData.password)) {
  toast.error("Password must contain at least one number.");
  return;
}

if (!/[^A-Za-z0-9]/.test(formData.password)) {
  toast.error("Password must contain at least one special character.");
  return;
}
    try {
      setIsCreating(true);

      const response = await fetch("/api/doctor/secretaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        user?: Secretary;
        error?: string;
      };

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {
              success: false,
              error: `Empty response from server (${response.status})`,
            };
      } catch {
        console.error("Invalid JSON response:", responseText);

        throw new Error(
          `Server returned an invalid response (${response.status})`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create staff account");
      }

      toast.success(
        `Staff member "${data.user?.name || formData.name}" account created successfully!`
      );

      setIsCreateModalOpen(false);
      resetCreateForm();

      await fetchStaff();
    } catch (error) {
      console.error("Create staff error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create staff account";

      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * EDIT
   *
   * The current backend supports GET + POST only.
   * We keep the existing UI modal without pretending that
   * changes were persisted to the database.
   */
  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMember) return;

    toast.info(
      "Staff editing will be connected to the database when the update API is added."
    );

    setEditingMember(null);
  };

  /**
   * DELETE
   *
   * The current backend does not expose DELETE yet.
   * Do not fake a successful deletion locally.
   */
  const handleConfirmDelete = () => {
    if (!memberToDelete) return;

    toast.info(
      "Staff deletion will be connected to Clerk and the database when the delete API is added."
    );

    setMemberToDelete(null);
  };

  /**
   * Search
   */
  const filtered = staffList.filter((member) => {
    const query = searchTerm.toLowerCase().trim();

    if (!query) return true;

    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (member.phone ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <ShieldCheck size={13} />

            <span>Clinic Staff & Access Management</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            My Clinic Team & Staff Accounts
          </h1>

          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Directly create staff accounts, assign granular permissions, and
            manage your clinic team
          </p>
        </div>

        {/* Create Staff Member Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />

          <span>Create New Staff Account</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />

          <input
            type="text"
            placeholder="Search staff name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {staffList.length} Staff
          </span>
        </div>
      </div>

      {/* Error State */}
      {loadError && !isLoading && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-400">
              Failed to load staff accounts
            </p>

            <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
              {loadError}
            </p>
          </div>

          <button
            onClick={fetchStaff}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />

                <div className="space-y-2 flex-1">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>

              <div className="space-y-2 mt-5">
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>

              <div className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl mt-5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {searchTerm
            ? "No staff members found matching your search."
            : "No staff accounts have been created yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-900 transition-all"
            >
              {/* Member Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1A4B8C] dark:text-blue-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </h3>

                    <p className="text-xs text-[#1A4B8C] dark:text-blue-400 font-semibold">
                      Secretary
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusClasses(
                    member.status
                  )}`}
                >
                  {member.status}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2 truncate">
                  <Mail
                    size={13}
                    className="text-slate-400 shrink-0"
                  />

                  <span className="truncate">{member.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone
                    size={13}
                    className="text-slate-400 shrink-0"
                  />

                  <span>{member.phone || "No phone number"}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock size={12} />

                  <span>
                    Created: {formatLastActive(member.created_at)}
                  </span>
                </div>
              </div>

              {/* Assigned Permissions Tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Assigned Permissions:
                </span>

                <div className="flex flex-wrap gap-1">
                  {member.permissions?.length > 0 ? (
                    member.permissions.includes("all") ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <ShieldCheck size={11} />
                        <span>{locale === "ar" ? "كافة الصلاحيات (Full Access)" : "All Permissions (Full Access)"}</span>
                      </span>
                    ) : (
                      member.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                        >
                          {permission}
                        </span>
                      ))
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      No permissions assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditingMember({ ...member })}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-[#1A4B8C] dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={13} />

                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setMemberToDelete(member)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-500 transition-all cursor-pointer"
                  title="Delete Staff Account"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131E2E] max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl animate-slide-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New Staff Account
                  </h3>

                  <p className="text-xs text-slate-400">
                    Direct account provisioning with immediate login access
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isCreating) {
                    setIsCreateModalOpen(false);
                  }
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Mariam Tarek"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    placeholder="staff@clinic.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone (WhatsApp)
                </label>

                <input
                  type="tel"
                  placeholder="+20 100 000 0000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                 <div className="relative">
                <input
                  // type="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={15}
                  placeholder="••••••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
                
                  <button
                   type="button"
                   onClick={() => setShowPassword((prev) => !prev)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                   aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                   {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                     </button>
                      </div>
               
                <p className="text-[10px] text-slate-400 mt-1">
                      Password must be at least 15 characters.

                </p>
              </div>

              {/* Permissions Header with Quick Actions */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                      {locale === "ar" ? "صلاحيات الوصول والمهام:" : "Granular Permissions & Access Control:"}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {locale === "ar"
                        ? "حدد الصلاحيات الممنوعة والممنوحة لهذا الحساب"
                        : "Enable or disable direct operational scopes"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#1A4B8C] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                    >
                      {locale === "ar" ? "تحديد الكل" : "Select All"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPermissions}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {locale === "ar" ? "مسح" : "Clear"}
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/70 dark:bg-blue-900/50 text-[#1A4B8C] dark:text-blue-300">
                      {formData.permissions.includes(ALL_PERMISSION_ID)
                        ? (locale === "ar" ? "وصول إداري كامل" : "Full Access")
                        : `${formData.permissions.filter((p) => p !== ALL_PERMISSION_ID).length}/${CORE_PERMISSION_IDS.length}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((permission) => {
                    const isChecked = formData.permissions.includes(
                      permission.id
                    );
                    const isMaster = permission.id === ALL_PERMISSION_ID;
                    const Icon = permission.icon;

                    return (
                      <div key={permission.id} className="space-y-2">
                        <div
                          onClick={() =>
                            handleTogglePermission(permission.id)
                          }
                          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 group ${
                            isMaster
                              ? isChecked
                                ? "bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-blue-600/5 dark:from-blue-900/40 dark:to-indigo-950/40 border-[#1A4B8C] dark:border-blue-400 shadow-md ring-1 ring-blue-500/20"
                                : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700"
                              : isChecked
                              ? "bg-blue-50/70 dark:bg-blue-950/30 border-[#1A4B8C] dark:border-blue-500/70 shadow-xs ring-1 ring-[#1A4B8C]/15"
                              : "bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                          }`}
                        >
                          {/* Left: Thematic Icon + Text Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                isMaster
                                  ? isChecked
                                    ? "bg-gradient-to-tr from-[#1A4B8C] to-blue-500 text-white shadow-md shadow-blue-600/30"
                                    : "bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300"
                                  : isChecked
                                  ? "bg-[#1A4B8C] text-white shadow-sm shadow-blue-500/25"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                              }`}
                            >
                              <Icon size={isMaster ? 18 : 17} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {permission.nameEn}
                                </span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  isMaster
                                    ? "bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300 font-bold"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                  {permission.nameAr}
                                </span>
                                {isMaster && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    MASTER
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {permission.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right: Modern iOS/SaaS Toggle Switch */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span
                              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                isChecked
                                  ? isMaster
                                    ? "bg-blue-100 dark:bg-blue-950/60 text-[#1A4B8C] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60"
                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent"
                              }`}
                            >
                              {isChecked && (
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                  isMaster ? "bg-[#1A4B8C] dark:bg-blue-400" : "bg-emerald-500"
                                }`} />
                              )}
                              {isChecked
                                ? isMaster
                                  ? locale === "ar" ? "شامل" : "Full Access"
                                  : locale === "ar" ? "مفعل" : "Granted"
                                : locale === "ar" ? "معطل" : "Disabled"}
                            </span>

                            <div
                              className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative flex items-center p-0.5 shrink-0 ${
                                isChecked
                                  ? "bg-[#1A4B8C] dark:bg-blue-600 shadow-sm shadow-blue-600/30"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                                  isChecked
                                    ? locale === "ar"
                                      ? "-translate-x-5"
                                      : "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              >
                                {isChecked && (
                                  <Check
                                    size={11}
                                    className="text-[#1A4B8C] dark:text-blue-600 stroke-[3]"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Divider after Master Card */}
                        {isMaster && (
                          <div className="flex items-center gap-2 py-1">
                            <div className="h-px bg-slate-200/80 dark:bg-slate-800 flex-1"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {locale === "ar" ? "أو حدد صلاحيات مخصصة" : "Or Custom Granular Scopes"}
                            </span>
                            <div className="h-px bg-slate-200/80 dark:bg-slate-800 flex-1"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isCreating && <Loader2 size={14} className="animate-spin" />}

                  <span>
                    {isCreating
                      ? "Creating Account..."
                      : "Create Staff Account"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131E2E] max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl animate-slide-up my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center">
                  <Edit2 size={18} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Staff Member
                  </h3>

                  <p className="text-xs text-slate-400">
                    Update contact details and permissions for{" "}
                    {editingMember.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>

                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      name: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        email: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={editingMember.phone ?? ""}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        phone: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Permissions Header with Quick Actions */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                      {locale === "ar" ? "صلاحيات الوصول المعينة:" : "Assigned Permissions & Access:"}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {locale === "ar"
                        ? "تعديل الصلاحيات المتاحة لهذا الموظف"
                        : "Modify assigned operational permissions"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllEditPermissions}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#1A4B8C] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                    >
                      {locale === "ar" ? "تحديد الكل" : "Select All"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearEditPermissions}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {locale === "ar" ? "مسح" : "Clear"}
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/70 dark:bg-blue-900/50 text-[#1A4B8C] dark:text-blue-300">
                      {(editingMember.permissions || []).includes(ALL_PERMISSION_ID)
                        ? (locale === "ar" ? "وصول إداري كامل" : "Full Access")
                        : `${(editingMember.permissions || []).filter((p) => p !== ALL_PERMISSION_ID).length}/${CORE_PERMISSION_IDS.length}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((permission) => {
                    const isChecked =
                      editingMember.permissions?.includes(permission.id);
                    const isMaster = permission.id === ALL_PERMISSION_ID;
                    const Icon = permission.icon;

                    return (
                      <div key={permission.id} className="space-y-2">
                        <div
                          onClick={() =>
                            handleToggleEditPermission(permission.id)
                          }
                          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 group ${
                            isMaster
                              ? isChecked
                                ? "bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-blue-600/5 dark:from-blue-900/40 dark:to-indigo-950/40 border-[#1A4B8C] dark:border-blue-400 shadow-md ring-1 ring-blue-500/20"
                                : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700"
                              : isChecked
                              ? "bg-blue-50/70 dark:bg-blue-950/30 border-[#1A4B8C] dark:border-blue-500/70 shadow-xs ring-1 ring-[#1A4B8C]/15"
                              : "bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                          }`}
                        >
                          {/* Left: Thematic Icon + Text Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                isMaster
                                  ? isChecked
                                    ? "bg-gradient-to-tr from-[#1A4B8C] to-blue-500 text-white shadow-md shadow-blue-600/30"
                                    : "bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300"
                                  : isChecked
                                  ? "bg-[#1A4B8C] text-white shadow-sm shadow-blue-500/25"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                              }`}
                            >
                              <Icon size={isMaster ? 18 : 17} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {permission.nameEn}
                                </span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  isMaster
                                    ? "bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300 font-bold"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                  {permission.nameAr}
                                </span>
                                {isMaster && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    MASTER
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {permission.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right: Modern iOS/SaaS Toggle Switch */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span
                              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                isChecked
                                  ? isMaster
                                    ? "bg-blue-100 dark:bg-blue-950/60 text-[#1A4B8C] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60"
                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent"
                              }`}
                            >
                              {isChecked && (
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                  isMaster ? "bg-[#1A4B8C] dark:bg-blue-400" : "bg-emerald-500"
                                }`} />
                              )}
                              {isChecked
                                ? isMaster
                                  ? locale === "ar" ? "شامل" : "Full Access"
                                  : locale === "ar" ? "مفعل" : "Granted"
                                : locale === "ar" ? "معطل" : "Disabled"}
                            </span>

                            <div
                              className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative flex items-center p-0.5 shrink-0 ${
                                isChecked
                                  ? "bg-[#1A4B8C] dark:bg-blue-600 shadow-sm shadow-blue-600/30"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                                  isChecked
                                    ? locale === "ar"
                                      ? "-translate-x-5"
                                      : "translate-x-5"
                                    : "translate-x-0"
                                }`}
                              >
                                {isChecked && (
                                  <Check
                                    size={11}
                                    className="text-[#1A4B8C] dark:text-blue-600 stroke-[3]"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Divider after Master Card */}
                        {isMaster && (
                          <div className="flex items-center gap-2 py-1">
                            <div className="h-px bg-slate-200/80 dark:bg-slate-800 flex-1"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {locale === "ar" ? "أو حدد صلاحيات مخصصة" : "Or Custom Granular Scopes"}
                            </span>
                            <div className="h-px bg-slate-200/80 dark:bg-slate-800 flex-1"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131E2E] max-w-sm w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Staff Account?
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-200">
                  {memberToDelete.name}
                </span>
                ?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}