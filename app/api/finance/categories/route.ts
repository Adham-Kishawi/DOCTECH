import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError, withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { SYSTEM_CATEGORIES, SYSTEM_CATEGORY_BY_CODE } from "@/lib/finance/expenseCategories";

export const dynamic = "force-dynamic";

const BEHAVIOR = ["FIXED", "SEMI_VARIABLE", "VARIABLE", "STEP_FIXED", "CAPEX", "TAX"] as const;

const CreateCategorySchema = z.object({
  code: z.string().trim().min(2).max(32).regex(/^[A-Z0-9_]+$/, "uppercase code required"),
  nameEn: z.string().trim().min(1).max(80),
  nameAr: z.string().trim().min(1).max(80),
  behaviorType: z.enum(BEHAVIOR).default("VARIABLE"),
  isClinicalCost: z.boolean().default(false),
  isPatientCare: z.boolean().default(false),
  parentId: z.string().trim().min(1).max(64).nullish(),
  icon: z.string().trim().max(40).nullish(),
  color: z.string().trim().max(20).nullish(),
});

const PatchCategorySchema = z.object({
  id: z.string().min(1),
  nameEn: z.string().trim().min(1).max(80).optional(),
  nameAr: z.string().trim().min(1).max(80).optional(),
  behaviorType: z.enum(BEHAVIOR).optional(),
  isClinicalCost: z.boolean().optional(),
  isPatientCare: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const toDto = (row: Record<string, unknown>) => ({
  id: String(row.id),
  clinicId: (row.clinic_id as string | null) ?? null,
  code: String(row.code ?? ""),
  nameEn: String(row.name_en ?? ""),
  nameAr: String(row.name_ar ?? ""),
  behaviorType: String(row.behavior_type ?? "VARIABLE"),
  isClinicalCost: Boolean(row.is_clinical_cost),
  isPatientCare: Boolean(row.is_patient_care),
  isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  sortOrder: Number(row.sort_order ?? 100),
  parentId: (row.parent_category_id as string | null) ?? null,
  icon: (row.icon as string | null) ?? null,
  color: (row.color as string | null) ?? null,
});

/**
 * GET /api/finance/categories — system categories (clinic_id NULL) plus the
 * clinic's own. Falls back to the compiled registry when the Phase 2
 * migration has not been applied yet, so the expense form still renders.
 */
export const GET = withSession(
  async (_request: Request, session) => {
    try {
      // System rows (clinic_id NULL) are visible to every tenant; clinic rows
      // only to their own — one query, never a cross-tenant leak.
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .or(`clinic_id.is.null,clinic_id.eq.${session.clinicId}`)
        .order("sort_order", { ascending: true });

      if (error) {
        if (!/does not exist|PGRST205|42P01/i.test(error.message)) {
          console.error("[finance/categories] load failed:", error.message);
        }
        return NextResponse.json({
          success: true,
          source: "registry",
          categories: SYSTEM_CATEGORIES.map((category) => ({
            id: category.id,
            clinicId: null,
            code: category.code,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            behaviorType: category.behavior,
            isClinicalCost: category.isClinicalCost,
            isPatientCare: category.isPatientCare,
            isActive: true,
            sortOrder: category.sortOrder,
            parentId: null,
            icon: category.icon,
            color: category.color,
          })),
        });
      }

      const rows = (data || []).map(toDto);
      const clinicRows = rows.filter((row) => row.clinicId);
      const systemRows = rows.filter((row) => !row.clinicId);
      const knownSystemIds = new Set(systemRows.map((row) => row.id));

      // A clinic's category may point at a system row the seed never created;
      // keep the registry entry visible so labels stay resolvable.
      const missingSystem = SYSTEM_CATEGORIES.filter((category) => !knownSystemIds.has(category.id));

      return NextResponse.json({
        success: true,
        source: "table",
        categories: [
          ...systemRows,
          ...clinicRows,
          ...missingSystem.map((category) => ({
            id: category.id,
            clinicId: null,
            code: category.code,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            behaviorType: category.behavior,
            isClinicalCost: category.isClinicalCost,
            isPatientCare: category.isPatientCare,
            isActive: true,
            sortOrder: category.sortOrder,
            parentId: null,
            icon: category.icon,
            color: category.color,
          })),
        ],
      });
    } catch (error) {
      return toErrorResponse(error, "finance/categories GET error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_VIEW }
);

/** POST /api/finance/categories — a clinic-defined category. */
export const POST = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();
      const parsed = CreateCategorySchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid category");
      }
      const input = parsed.data;

      if (SYSTEM_CATEGORY_BY_CODE[input.code]) {
        throw new ApiError(409, `Code ${input.code} belongs to a system category`);
      }

      const id = `cat-${randomUUID().slice(0, 8)}`;
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          id,
          clinic_id: session.clinicId,
          code: input.code,
          name_en: input.nameEn,
          name_ar: input.nameAr,
          behavior_type: input.behaviorType,
          is_clinical_cost: input.isClinicalCost,
          is_patient_care: input.isPatientCare,
          parent_category_id: input.parentId ?? null,
          icon: input.icon ?? null,
          color: input.color ?? null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") throw new ApiError(409, "This category code already exists");
        throw new ApiError(500, `Failed to create category: ${error.message}`);
      }

      return NextResponse.json({ success: true, category: toDto(data) });
    } catch (error) {
      return toErrorResponse(error, "finance/categories POST error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);

/** PATCH /api/finance/categories — rename, reclassify or archive (never delete). */
export const PATCH = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();
      const parsed = PatchCategorySchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid category update");
      }

      const { id, ...changes } = parsed.data;
      const payload: Record<string, unknown> = {};
      if (changes.nameEn !== undefined) payload.name_en = changes.nameEn;
      if (changes.nameAr !== undefined) payload.name_ar = changes.nameAr;
      if (changes.behaviorType !== undefined) payload.behavior_type = changes.behaviorType;
      if (changes.isClinicalCost !== undefined) payload.is_clinical_cost = changes.isClinicalCost;
      if (changes.isPatientCare !== undefined) payload.is_patient_care = changes.isPatientCare;
      if (changes.isActive !== undefined) payload.is_active = changes.isActive;
      if (changes.sortOrder !== undefined) payload.sort_order = changes.sortOrder;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("expense_categories")
        .update(payload)
        .eq("id", id)
        .eq("clinic_id", session.clinicId) // system categories are not editable
        .select()
        .maybeSingle();

      if (error) throw new ApiError(500, `Failed to update category: ${error.message}`);
      if (!data) throw new ApiError(404, "Category not found in this clinic");

      return NextResponse.json({ success: true, category: toDto(data) });
    } catch (error) {
      return toErrorResponse(error, "finance/categories PATCH error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);
