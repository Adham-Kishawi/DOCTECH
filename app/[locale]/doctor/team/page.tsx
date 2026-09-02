"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users, UserPlus, Mail, Phone, Clock, Shield, Edit2, Trash2,
  Check, X, Search, Lock, ShieldCheck, Plus, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Head Secretary" | "Receptionist" | "Clinical Assistant" | "Billing Officer";
  status: "ACTIVE" | "SUSPENDED";
  lastActive: string;
  permissions: string[]; // ["appointments", "patients", "billing", "whatsapp", "reports"]
}

const AVAILABLE_PERMISSIONS = [
  { id: "appointments", label: "Appointments & Booking (حجز وإدارة المواعيد)" },
  { id: "patients", label: "Patient Directory & EMR (ملفات وسجلات المرضى)" },
  { id: "billing", label: "Billing & Cashier (الخزينة والتحصيل المالي)" },
  { id: "whatsapp", label: "WhatsApp Chat & Comms (محادثات الواتساب والتواصل)" },
  { id: "reports", label: "Medical Inquiries & Reports (فرز التقارير الطبية)" },
];

const initialStaff: StaffMember[] = [
  {
    id: "STF-01",
    name: "Sarah Jenkins",
    email: "sarah.j@doctech-clinic.com",
    phone: "+20 101 234 5678",
    role: "Head Secretary",
    status: "ACTIVE",
    lastActive: "Just now",
    permissions: ["appointments", "patients", "billing", "whatsapp", "reports"],
  },
  {
    id: "STF-02",
    name: "Dina Mansour",
    email: "dina.m@doctech-clinic.com",
    phone: "+20 102 345 6789",
    role: "Receptionist",
    status: "ACTIVE",
    lastActive: "2 hours ago",
    permissions: ["appointments", "patients", "whatsapp"],
  },
  {
    id: "STF-03",
    name: "Hossam Zaki",
    email: "hossam.z@doctech-clinic.com",
    phone: "+20 103 456 7890",
    role: "Billing Officer",
    status: "ACTIVE",
    lastActive: "Yesterday",
    permissions: ["appointments", "billing"],
  },
];

export default function DoctorTeamPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);

  // Form State for Create
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Receptionist" as StaffMember["role"],
    password: "",
    permissions: ["appointments", "patients"] as string[],
  });

  const handleTogglePermission = (permId: string, isEditing = false) => {
    if (isEditing && editingMember) {
      const exists = editingMember.permissions.includes(permId);
      const updated = exists
        ? editingMember.permissions.filter((p) => p !== permId)
        : [...editingMember.permissions, permId];
      setEditingMember({ ...editingMember, permissions: updated });
    } else {
      const exists = formData.permissions.includes(permId);
      const updated = exists
        ? formData.permissions.filter((p) => p !== permId)
        : [...formData.permissions, permId];
      setFormData({ ...formData, permissions: updated });
    }
  };

  // 1. CREATE
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newMember: StaffMember = {
      id: `STF-0${staffList.length + 1}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "+20 100 000 0000",
      role: formData.role,
      status: "ACTIVE",
      lastActive: "Never",
      permissions: formData.permissions,
    };

    setStaffList([...staffList, newMember]);
    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "Receptionist",
      password: "",
      permissions: ["appointments", "patients"],
    });
    toast.success(`✅ Staff member "${newMember.name}" account created successfully! Credentials active.`);
  };

  // 2. UPDATE
  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setStaffList((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    setEditingMember(null);
    toast.success(`✅ Staff member "${editingMember.name}" updated successfully!`);
  };

  // 3. DELETE
  const handleConfirmDelete = () => {
    if (!memberToDelete) return;

    setStaffList((prev) => prev.filter((m) => m.id !== memberToDelete.id));
    toast.success(`Staff account for "${memberToDelete.name}" deleted.`);
    setMemberToDelete(null);
  };

  // Toggle status
  const handleToggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
          : m
      )
    );
    toast.info("Staff member status updated.");
  };

  const filtered = staffList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const matchesRole = filterRole === "all" || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <ShieldCheck size={13} />
            <span>Clinic Staff & Role Management (CRUD)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            My Clinic Team & Staff Accounts
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Directly create staff accounts, assign granular permissions, edit credentials, or deactivate members
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["all", "Head Secretary", "Receptionist", "Billing Officer", "Clinical Assistant"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterRole === role
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {role === "all" ? "All Roles" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800">
            No staff members found matching criteria.
          </div>
        ) : (
          filtered.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-900 transition-all"
            >
              {/* Member Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1A4B8C] dark:text-blue-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                    {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#1A4B8C] dark:text-blue-400 font-semibold">{member.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(member.id)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                    member.status === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                  }`}
                  title="Click to toggle Active/Suspended"
                >
                  {member.status}
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-2 truncate">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock size={12} />
                  <span>Last active: {member.lastActive}</span>
                </div>
              </div>

              {/* Assigned Permissions Tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Permissions:</span>
                <div className="flex flex-wrap gap-1">
                  {member.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons (Edit / Delete) */}
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
          ))
        )}
      </div>

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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Staff Account</h3>
                  <p className="text-xs text-slate-400">Direct account provisioning with immediate login access</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mariam Tarek"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffMember["role"] })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Head Secretary">Head Secretary (رئيسة الاستقبال)</option>
                    <option value="Receptionist">Receptionist (سكرتيرة استقبال)</option>
                    <option value="Clinical Assistant">Clinical Assistant (مساعد طبي)</option>
                    <option value="Billing Officer">Billing Officer (محاسب / مسؤول الخزينة)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@clinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+20 100 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Permissions Checkbox Matrix */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Granular Permissions & Access Control:
                </label>
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id, false)}
                          className="w-4 h-4 text-[#1A4B8C] rounded cursor-pointer"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 cursor-pointer"
                >
                  Create Staff Account
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Staff Member</h3>
                  <p className="text-xs text-slate-400">Update role, contact details and permissions for {editingMember.name}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as StaffMember["role"] })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Head Secretary">Head Secretary</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Clinical Assistant">Clinical Assistant</option>
                    <option value="Billing Officer">Billing Officer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Permissions Checkbox Matrix */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assigned Permissions:
                </label>
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editingMember.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id, true)}
                          className="w-4 h-4 text-[#1A4B8C] rounded cursor-pointer"
                        />
                        <span>{perm.label}</span>
                      </label>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Staff Account?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-200">{memberToDelete.name}</span>? This account will immediately lose access to DOCTECH.
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
