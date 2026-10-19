"use client";

import { useMemo } from "react";
import { Check, ShieldAlert, Lock, Layers } from "lucide-react";
import {
  ALL_PERMISSION_IDS,
  PERMISSION_CATALOG,
  permissionsByModule,
  isSensitivePermission,
  ROLES,
  expandRole,
} from "@/lib/permissions";

const ALL_PERMISSION_ID = "all";

/** Sensitive permissions need an explicit confirmation before being revoked. */
const SENSITIVE_CONFIRM: Record<string, { en: string; ar: string }> = {
  "patients.delete": { en: "Revoke permission to delete patients?", ar: "سحب صلاحية حذف المرضى؟" },
  "patients.clinical.manage": { en: "Revoke ability to edit clinical records?", ar: "سحب صلاحية تعديل السجل السريري؟" },
  "finance.expenses.delete": { en: "Revoke permission to delete expenses?", ar: "سحب صلاحية حذف المصروفات؟" },
  "finance.revenue": { en: "Hide revenue figures from this user?", ar: "إخفاء أرقام الإيرادات عن هذا المستخدم؟" },
  "finance.profit": { en: "Hide profit & margin from this user?", ar: "إخفاء الأرباح والهوامش عن هذا المستخدم؟" },
  "crm.campaigns": { en: "Revoke campaign management?", ar: "سحب إدارة الحملات؟" },
  "staff.manage": { en: "Revoke staff & permission management?", ar: "سحب إدارة الطاقم والصلاحيات؟" },
};

interface PermissionMatrixProps {
  value: string[];
  onChange: (next: string[]) => void;
  locale: string;
  /** Hide the role preset picker (e.g. when editing). */
  showPresets?: boolean;
}

/**
 * The granular access matrix (plan §6.7): every one of the 28 permissions is
 * toggleable, grouped by module, with a harmless "all" master switch and an
 * explicit warning when a sensitive permission is revoked.
 */
export function PermissionMatrix({ value, onChange, locale, showPresets = true }: PermissionMatrixProps) {
  const isAr = locale === "ar";
  const groups = useMemo(() => permissionsByModule(), []);

  const selected = useMemo(
    () => new Set(value.filter((id) => id !== ALL_PERMISSION_ID && id !== "*")),
    [value]
  );
  const isAll = value.includes(ALL_PERMISSION_ID) || value.includes("*") || ALL_PERMISSION_IDS.every((id) => selected.has(id));
  const selectedCount = ALL_PERMISSION_IDS.filter((id) => selected.has(id)).length;

  const setAll = (on: boolean) => {
    if (on) onChange([ALL_PERMISSION_ID, ...ALL_PERMISSION_IDS]);
    else onChange([]);
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      const warn = SENSITIVE_CONFIRM[id];
      if (warn && !window.confirm(isAr ? warn.ar : warn.en)) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    const arr = ALL_PERMISSION_IDS.filter((p) => next.has(p));
    const full = arr.length === ALL_PERMISSION_IDS.length;
    onChange(full ? [ALL_PERMISSION_ID, ...arr] : arr);
  };

  const toggleModule = (moduleId: string, items: { id: string }[]) => {
    const ids = items.map((i) => i.id);
    const allOn = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    for (const id of ids) {
      if (allOn) {
        const warn = SENSITIVE_CONFIRM[id];
        if (warn && !window.confirm(isAr ? warn.ar : warn.en)) return;
        next.delete(id);
      } else {
        next.add(id);
      }
    }
    const arr = ALL_PERMISSION_IDS.filter((p) => next.has(p));
    onChange(arr.length === ALL_PERMISSION_IDS.length ? [ALL_PERMISSION_ID, ...arr] : arr);
  };

  const applyPreset = (roleId: string) => {
    const defaults = expandRole(roleId);
    if (defaults.includes("*")) {
      onChange([ALL_PERMISSION_ID, ...ALL_PERMISSION_IDS]);
      return;
    }
    onChange(defaults.filter((id) => ALL_PERMISSION_IDS.includes(id)));
  };

  return (
    <div className="space-y-3">
      {/* Header + presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
            {isAr ? "صلاحيات الوصول الدقيقة:" : "Granular Permissions & Access:"}
          </label>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isAr
              ? "28 صلاحية قابلة للتخصيص لكل وحدة"
              : "28 fine-grained permissions grouped by module"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/70 dark:bg-blue-900/50 text-[#1A4B8C] dark:text-blue-300">
            {isAll ? (isAr ? "وصول كامل" : "Full Access") : `${selectedCount}/${ALL_PERMISSION_IDS.length}`}
          </span>
        </div>
      </div>

      {showPresets && (
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-slate-400 shrink-0" />
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyPreset(e.target.value);
              e.currentTarget.value = "";
            }}
            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="">{isAr ? "تطبيق دور جاهز…" : "Apply a role preset…"}</option>
            {ROLES.filter((r) => r.id !== "DOCTOR").map((r) => (
              <option key={r.id} value={r.id}>{isAr ? r.nameAr : r.nameEn}</option>
            ))}
          </select>
        </div>
      )}

      {/* Master switch */}
      <button
        type="button"
        onClick={() => setAll(!isAll)}
        className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
          isAll
            ? "bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-blue-600/5 dark:from-blue-900/40 dark:to-indigo-950/40 border-[#1A4B8C] dark:border-blue-400 ring-1 ring-blue-500/20"
            : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAll ? "bg-gradient-to-tr from-[#1A4B8C] to-blue-500 text-white" : "bg-blue-100 dark:bg-blue-900/60 text-[#1A4B8C] dark:text-blue-300"}`}>
            <Check size={17} className="stroke-[3]" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? "كافة الصلاحيات" : "All Permissions"}
            </span>
            <span className="ms-1.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              MASTER
            </span>
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full relative flex items-center p-0.5 ${isAll ? "bg-[#1A4B8C] dark:bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center ${isAll ? (isAr ? "-translate-x-5" : "translate-x-5") : "translate-x-0"}`}>
            {isAll && <Check size={11} className="text-[#1A4B8C] dark:text-blue-600 stroke-[3]" />}
          </div>
        </div>
      </button>

      {/* Module groups */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {groups.map(({ module, items }) => {
          const allOn = items.every((i) => selected.has(i.id));
          const someOn = items.some((i) => selected.has(i.id));
          return (
            <div key={module} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleModule(module, items)}
                className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                  {module.replace("_", " ")}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  allOn ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        : someOn ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}>
                  {items.filter((i) => selected.has(i.id)).length}/{items.length}
                </span>
              </button>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((perm) => {
                  const on = selected.has(perm.id);
                  const sensitive = isSensitivePermission(perm.id);
                  return (
                    <button
                      type="button"
                      key={perm.id}
                      onClick={() => toggle(perm.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                        on ? "bg-blue-50/60 dark:bg-blue-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {isAr ? perm.nameAr : perm.nameEn}
                          </span>
                          {sensitive && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                              <Lock size={8} />
                              {isAr ? "حساسة" : "Sensitive"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{perm.id}</span>
                      </div>
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        on ? "bg-[#1A4B8C] border-[#1A4B8C] text-white" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {on && <Check size={12} className="stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && !isAll && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] font-bold text-amber-800 dark:text-amber-300">
          <ShieldAlert size={14} className="shrink-0" />
          {isAr
            ? "لا صلاحيات = الموظف لن يرى أي قسم ولن يستطيع العمل."
            : "No permissions = this staff member will see nothing and cannot work."}
        </div>
      )}
    </div>
  );
}

export { ALL_PERMISSION_IDS, PERMISSION_CATALOG };
