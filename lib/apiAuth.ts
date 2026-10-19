import "server-only";
import { NextResponse } from "next/server";
import { getClinicSession, type ClinicUserSession } from "./clinicAuth";
import { can, canAny, PERMISSIONS } from "./permissions";

export type ClinicRole = "doctor" | "secretary";

// Re-exported so existing `import { PERMISSIONS, can } from "@/lib/apiAuth"`
// call sites keep working after the RBAC catalog moved to lib/permissions.ts.
export { PERMISSIONS, can, canAny };
export type { PermissionKey, PermissionDefinition, RoleDefinition } from "./permissions";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Requires a signed-in clinic user. Throws `ApiError` (401/403) otherwise.
 *
 * The returned `clinicId` is the ONLY trustworthy tenant identifier — never
 * accept `?clinicId=` from the client.
 */
export async function requireSession(
  options: { role?: ClinicRole; permission?: string } = {}
): Promise<ClinicUserSession> {
  const session = await getClinicSession();

  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }

  if (options.role && session.role !== options.role) {
    throw new ApiError(403, `Forbidden: requires role ${options.role}`);
  }

  if (options.permission && !can(session, options.permission)) {
    throw new ApiError(403, `Forbidden: missing permission ${options.permission}`);
  }

  return session;
}

/**
 * Requires a session that holds `permission`.
 *
 * Thin sugar over `requireSession({ permission })` for routes that only guard
 * on one permission and don't need the doctor/secretary role split.
 */
export async function requirePermission(permission: string): Promise<ClinicUserSession> {
  return requireSession({ permission });
}

/** Serializes an `ApiError` / thrown value into a NextResponse. */
export function toErrorResponse(error: unknown, context?: string): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }

  if (context) {
    console.error(`[api] ${context}:`, error);
  } else {
    console.error("[api] Unhandled error:", error);
  }
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Wraps a route handler with the session guard.
 *
 * Usage:
 *   export const GET = withSession(async (request, session) => { ... });
 */
export function withSession(
  handler: (request: Request, session: ClinicUserSession) => Promise<NextResponse>,
  options: { role?: ClinicRole; permission?: string } = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const session = await requireSession(options);
      return await handler(request, session);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}