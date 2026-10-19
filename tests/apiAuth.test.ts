import { describe, expect, it } from "vitest";
import { ApiError, PERMISSIONS, can, canAny } from "@/lib/apiAuth";
import type { ClinicUserSession } from "@/lib/clinicAuth";

const session = (
  role: ClinicUserSession["role"],
  permissions: string[] = []
): ClinicUserSession => ({
  userId: "user_test",
  role,
  clinicId: "clinic_test",
  permissions,
  user: {
    id: "user_test",
    name: "Test User",
    email: "test@example.com",
    clinic_id: "clinic_test",
  },
});

describe("PERMISSIONS catalog", () => {
  it("has unique keys", () => {
    const values = Object.values(PERMISSIONS);
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses module.action for granular keys", () => {
    expect(PERMISSIONS.APPOINTMENTS_MANAGE).toBe("appointments.manage");
    expect(PERMISSIONS.PATIENTS_MANAGE).toBe("patients.manage");
    expect(PERMISSIONS.FINANCE_EXPENSES_DELETE).toBe("finance.expenses.delete");
    expect(PERMISSIONS.STAFF_MANAGE).toBe("staff.manage");
  });
});

describe("can — doctors", () => {
  it("grants every permission implicitly", () => {
    const doctor = session("doctor");
    for (const permission of Object.values(PERMISSIONS)) {
      expect(can(doctor, permission)).toBe(true);
    }
    expect(can(doctor, "made.up.permission")).toBe(true);
  });
});

describe("can — secretaries", () => {
  it("accepts the master switches", () => {
    expect(can(session("secretary", ["*"]), PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(can(session("secretary", ["all"]), PERMISSIONS.STAFF_MANAGE)).toBe(true);
  });

  it("denies everything when nothing is granted", () => {
    const nobody = session("secretary", []);
    expect(nobody.permissions).toHaveLength(0);
    expect(can(nobody, PERMISSIONS.APPOINTMENTS_VIEW)).toBe(false);
    expect(can(nobody, PERMISSIONS.FINANCE_VIEW)).toBe(false);
  });

  it("denies when the session is missing", () => {
    expect(can(null as unknown as ClinicUserSession, PERMISSIONS.APPOINTMENTS_VIEW)).toBe(
      false
    );
  });

  it("accepts a directly granted legacy key", () => {
    const s = session("secretary", ["appointments"]);
    expect(can(s, PERMISSIONS.APPOINTMENTS_VIEW)).toBe(true);
  });

  it("maps a granular check onto the legacy grant", () => {
    const s = session("secretary", ["appointments"]);
    expect(can(s, PERMISSIONS.APPOINTMENTS_MANAGE)).toBe(true);
  });

  it("does not invent a grant the matrix never gave", () => {
    const s = session("secretary", ["appointments"]);
    expect(can(s, PERMISSIONS.PATIENTS_VIEW)).toBe(false);
    expect(can(s, PERMISSIONS.REPORTS_MANAGE)).toBe(false);
  });

  it("covers the finance module from the Billing toggle", () => {
    const s = session("secretary", ["billing"]);
    expect(can(s, PERMISSIONS.FINANCE_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.FINANCE_COLLECT)).toBe(true);
    expect(can(s, PERMISSIONS.FINANCE_EXPENSES)).toBe(true);
    expect(can(s, PERMISSIONS.FINANCE_EXPENSES_DELETE)).toBe(true);
    expect(can(s, PERMISSIONS.FINANCE_PAYMENTS)).toBe(true);
    expect(can(s, PERMISSIONS.FINANCE_REVENUE)).toBe(true);
  });

  it("covers reports and lab results from the Reports toggle", () => {
    const s = session("secretary", ["reports"]);
    expect(can(s, PERMISSIONS.REPORTS_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.REPORTS_MANAGE)).toBe(true);
    expect(can(s, PERMISSIONS.LAB_RESULTS_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.LAB_RESULTS_MANAGE)).toBe(true);
  });

  it("covers clinical, prescription and CRM leads from Patients", () => {
    const s = session("secretary", ["patients"]);
    expect(can(s, PERMISSIONS.PATIENTS_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.PRESCRIPTIONS_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.CLINICAL_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.CRM_LEADS)).toBe(true);
  });

  it("covers WhatsApp send and CRM campaigns from WhatsApp", () => {
    const s = session("secretary", ["whatsapp"]);
    expect(can(s, PERMISSIONS.WHATSAPP_VIEW)).toBe(true);
    expect(can(s, PERMISSIONS.WHATSAPP_SEND)).toBe(true);
    expect(can(s, PERMISSIONS.CRM_CAMPAIGNS)).toBe(true);
  });

  it("covers CRM tasks from Appointments", () => {
    const s = session("secretary", ["appointments"]);
    expect(can(s, PERMISSIONS.CRM_TASKS)).toBe(true);
  });

  it("does not let an unmapped module key pass", () => {
    const s = session("secretary", ["appointments"]);
    expect(can(s, PERMISSIONS.CRM_VIEW)).toBe(false);
    expect(can(s, PERMISSIONS.STAFF_VIEW)).toBe(false);
  });
});

describe("canAny", () => {
  it("passes when any one permission is granted", () => {
    const s = session("secretary", ["reports"]);
    expect(canAny(s, [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.REPORTS_VIEW])).toBe(true);
  });

  it("fails when none are granted", () => {
    const s = session("secretary", ["reports"]);
    expect(canAny(s, [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.APPOINTMENTS_VIEW])).toBe(
      false
    );
  });

  it("fails for an empty list", () => {
    expect(canAny(session("doctor"), [])).toBe(false);
  });
});

describe("ApiError", () => {
  it("carries an HTTP status", () => {
    const error = new ApiError(403, "Forbidden");
    expect(error.status).toBe(403);
    expect(error.message).toBe("Forbidden");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
  });
});
