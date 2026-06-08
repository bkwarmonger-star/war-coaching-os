import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

interface AuditOptions {
  userId?: number;
  trainerId?: number;
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(action: string, opts: AuditOptions = {}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      action,
      userId: opts.userId,
      trainerId: opts.trainerId,
      entityType: opts.entityType,
      entityId: opts.entityId,
      details: opts.details ? JSON.stringify(opts.details) : null,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
    });
  } catch {
    // Audit failures are non-fatal
  }
}
