import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_IDS,
  PERMISSIONS,
  PERMISSION_CATALOG,
  ROLES,
  ROLE_BY_ID,
  SENSITIVE_PERMISSION_IDS,
  can,
  canAny,
  expandRole,
  isKnownPermission,
  isSensitivePermission,
  permissionsByModule,
} from "@/lib/permissions";
import type { ClinicUserSession } from "@/lib/clinicAuth";

const session = (permissions: string[] = []): ClinicUserSession => ({
  userId: "user_test",
  role: "secretary",
  clinicId: "clinic_test",
  permissions,
  user: {
    id: "user_test",
    name: "Test Secretary",
    email: "test@example.com",
    clinic_id: "clinic_test",
  },
});

describe("PERMISSION_CATALOG", () => {
  it("holds exactly the 28 atomic permissions", () => {
    expect(PERMISSION_CATALOG).toHaveLength(28);
    expect(ALL_PERMISSION_IDS).toHaveLength(28);
  });

  it("has unique ids that match the PERMISSIONS object", () => {
    const ids = PERMISSION_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(Object.values(PERMISSIONS)));
  });

  it("labels every permission in both languages", () => {
    for (const p of PERMISSION_CATALOG) {
      expect(p.nameEn.length).toBeGreaterThan(0);
      expect(p.nameAr.length).toBeGreaterThan(0);
      expect(p.module.length).toBeGreaterThan(0);
    }
  });

  it("groups every permission by module, ordered by sortOrder", () => {
    const groups = permissionsByModule();
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(PERMISSION_CATALOG.length);

    const modules = groups.map((g) => g.module);
    expect(new Set(modules).size).toBe(modules.length);

    for (const group of groups) {
      const orders = group.items.map((i) => i.sortOrder);
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
      for (const item of group.items) expect(item.module).toBe(group.module);
    }
  });
});

describe("isKnownPermission / isSensitivePermission", () => {
  it("recognises catalog ids and rejects made-up ones", () => {
    expect(isKnownPermission(PERMISSIONS.FINANCE_VIEW)).toBe(true);
    expect(isKnownPermission("finance.nope")).toBe(false);
    expect(isKnownPermission("")).toBe(false);
  });

  it("marks exactly the sensitive permissions", () => {
    expect(isSensitivePermission(PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(isSensitivePermission(PERMISSIONS.PATIENTS_DELETE)).toBe(true);
    expect(isSensitivePermission(PERMISSIONS.APPOINTMENTS_VIEW)).toBe(false);
    expect(SENSITIVE_PERMISSION_IDS.every(isKnownPermission)).toBe(true);
  });
});

describe("ROLES / expandRole", () => {
  it("ships six unique system roles indexed by id", () => {
    expect(ROLES).toHaveLength(6);
    const ids = ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const role of ROLES) {
      expect(ROLE_BY_ID[role.id]).toBe(role);
      expect(role.isSystemRole).toBe(true);
    }
  });

  it("gives the doctor the wildcard and maps every preset to real ids", () => {
    expect(expandRole("DOCTOR")).toEqual(["*"]);

    for (const role of ROLES.filter((r) => r.id !== "DOCTOR")) {
      const defaults = expandRole(role.id);
      expect(defaults.length).toBeGreaterThan(0);
      for (const id of defaults) expect(isKnownPermission(id)).toBe(true);
      expect(new Set(defaults).size).toBe(defaults.length);
    }
  });

  it("keeps profit hidden from the head secretary", () => {
    const head = expandRole("HEAD_SECRETARY");
    expect(head).not.toContain(PERMISSIONS.FINANCE_PROFIT);
    expect(head).toContain(PERMISSIONS.FINANCE_REVENUE);
  });

  it("returns an isolated copy and an empty list for unknown roles", () => {
    const first = expandRole("RECEPTIONIST");
    first.push("tampered");
    expect(expandRole("RECEPTIONIST")).not.toContain("tampered");
    expect(expandRole("NOPE")).toEqual([]);
  });
});

describe("can — enforcement", () => {
  it("always allows a doctor", () => {
    const doctor: ClinicUserSession = { ...session(), role: "doctor" };
    expect(can(doctor, "anything.at.all")).toBe(true);
  });

  it("denies an empty session and a null session", () => {
    expect(can(session([]), PERMISSIONS.FINANCE_VIEW)).toBe(false);
    expect(can(null, PERMISSIONS.FINANCE_VIEW)).toBe(false);
  });

  it("honours the master switches and staff.manage", () => {
    expect(can(session(["*"]), PERMISSIONS.FINANCE_PROFIT)).toBe(true);
    expect(can(session(["all"]), PERMISSIONS.FINANCE_PROFIT)).toBe(true);
    expect(can(session([PERMISSIONS.STAFF_MANAGE]), PERMISSIONS.FINANCE_PROFIT)).toBe(true);
  });

  it("grants the exact granular permission", () => {
    expect(can(session([PERMISSIONS.FINANCE_COLLECT]), PERMISSIONS.FINANCE_COLLECT)).toBe(true);
    expect(can(session([PERMISSIONS.FINANCE_COLLECT]), PERMISSIONS.FINANCE_PROFIT)).toBe(false);
  });

  it("keeps legacy coarse keys working (backward compatibility)", () => {
    expect(can(session(["appointments"]), PERMISSIONS.APPOINTMENTS_MANAGE)).toBe(true);
    expect(can(session(["patients"]), PERMISSIONS.PATIENTS_DELETE)).toBe(true);
    expect(can(session(["billing"]), PERMISSIONS.FINANCE_PROFIT)).toBe(true);
    expect(can(session(["reports"]), PERMISSIONS.LAB_RESULTS_MANAGE)).toBe(true);
    expect(can(session(["whatsapp"]), PERMISSIONS.WHATSAPP_SEND)).toBe(true);
  });

  it("canAny is true when at least one permission matches", () => {
    const s = session([PERMISSIONS.REPORTS_VIEW]);
    expect(canAny(s, [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.REPORTS_VIEW])).toBe(true);
    expect(canAny(s, [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.CRM_VIEW])).toBe(false);
  });
});
