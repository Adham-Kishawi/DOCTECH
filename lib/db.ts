// Prisma client - run `npx prisma generate` after setting up DATABASE_URL
// import { PrismaClient } from "@prisma/client";

// Temporary placeholder until Prisma is generated
const globalForPrisma = globalThis as unknown as { db: Record<string, unknown> | undefined };

export const db = globalForPrisma.db ?? ({} as Record<string, unknown>);

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;