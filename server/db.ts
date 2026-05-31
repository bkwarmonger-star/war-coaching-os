import { eq, and, desc, asc, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, trainers, clients, programs, checkIns, messages, sessions, packages, subscriptions, leads, referrals, progressMetrics, InsertProgressMetric, bodyComposition, InsertBodyComposition, consultations, InsertConsultation, services, InsertService, documents, InsertDocument, payments, InsertPayment } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Trainer queries
export async function getOrCreateTrainer(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(trainers).where(eq(trainers.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create new trainer profile
  await db.insert(trainers).values({
    userId,
    bio: '',
    qualifications: JSON.stringify([]),
    specialties: JSON.stringify([]),
    monthlyIncomeGoal: '0',
  });

  const created = await db.select().from(trainers).where(eq(trainers.userId, userId)).limit(1);
  return created[0];
}

export async function getTrainerByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(trainers).where(eq(trainers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Client queries
export async function getClientsByTrainer(trainerId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clients)
    .where(eq(clients.trainerId, trainerId))
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchClients(trainerId: number, query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.trainerId, trainerId),
        like(clients.name, `%${query}%`)
      )
    )
    .limit(limit);
}

export async function getClientCountByTrainer(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: clients.id })
    .from(clients)
    .where(eq(clients.trainerId, trainerId));

  return result[0]?.count || 0;
}

// Program queries
export async function getProgramsByTrainer(trainerId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(programs)
    .where(eq(programs.trainerId, trainerId))
    .orderBy(desc(programs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getProgramsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(programs)
    .where(eq(programs.clientId, clientId))
    .orderBy(desc(programs.createdAt));
}

export async function getProgramById(programId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Check-in queries
export async function getCheckInsByClient(clientId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.clientId, clientId))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit);
}

export async function getPendingCheckIns(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(checkIns)
    .where(
      and(
        eq(checkIns.trainerId, trainerId),
        eq(checkIns.status, 'pending')
      )
    )
    .orderBy(asc(checkIns.createdAt));
}

// Message queries
export async function getMessageThread(trainerId: number, clientId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.trainerId, trainerId),
        eq(messages.clientId, clientId)
      )
    )
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function getUnreadMessageCount(trainerId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.trainerId, trainerId),
        eq(messages.clientId, clientId),
        eq(messages.isRead, false)
      )
    );

  return result[0]?.count || 0;
}

// Session queries
export async function getSessionsByTrainer(trainerId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.trainerId, trainerId),
        gte(sessions.startTime, startDate),
        lte(sessions.startTime, endDate)
      )
    )
    .orderBy(asc(sessions.startTime));
}

export async function getUpcomingSessions(trainerId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  return await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.trainerId, trainerId),
        gte(sessions.startTime, now),
        eq(sessions.status, 'scheduled')
      )
    )
    .orderBy(asc(sessions.startTime))
    .limit(limit);
}

// Revenue queries
export async function getMonthlyRevenue(trainerId: number, month: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const result = await db
    .select({ total: subscriptions.totalAmount })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.trainerId, trainerId),
        gte(subscriptions.createdAt, startOfMonth),
        lte(subscriptions.createdAt, endOfMonth)
      )
    );

  return result.reduce((sum, row) => {
    const amount = typeof row.total === 'string' ? parseFloat(row.total) : (row.total || 0);
    return sum + amount;
  }, 0);
}

export async function getActiveSubscriptions(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  return await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.trainerId, trainerId),
        eq(subscriptions.status, 'active'),
        lte(subscriptions.startDate, now)
      )
    );
}

// Lead queries
export async function getLeadsByTrainer(trainerId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(leads)
    .where(eq(leads.trainerId, trainerId))
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getLeadById(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Referral queries
export async function getReferralsByTrainer(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(referrals)
    .where(eq(referrals.trainerId, trainerId))
    .orderBy(desc(referrals.createdAt));
}

// Progress Metrics
export async function createProgressMetric(data: InsertProgressMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(progressMetrics).values(data);
  return result;
}

export async function getClientProgressMetrics(clientId: number, trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(progressMetrics)
    .where(and(eq(progressMetrics.clientId, clientId), eq(progressMetrics.trainerId, trainerId)))
    .orderBy(desc(progressMetrics.createdAt));
}

// Body Composition
export async function createBodyComposition(data: InsertBodyComposition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(bodyComposition).values(data);
}

export async function getClientBodyComposition(clientId: number, trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(bodyComposition)
    .where(and(eq(bodyComposition.clientId, clientId), eq(bodyComposition.trainerId, trainerId)))
    .orderBy(desc(bodyComposition.createdAt));
}

// Consultations
export async function createConsultation(data: InsertConsultation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(consultations).values(data);
}

export async function getTrainerConsultations(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(consultations)
    .where(eq(consultations.trainerId, trainerId))
    .orderBy(desc(consultations.createdAt));
}

// Services
export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(services).values(data);
}

export async function getTrainerServices(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(services)
    .where(and(eq(services.trainerId, trainerId), eq(services.isActive, true)));
}

// Documents
export async function uploadDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(documents).values(data);
}

export async function getTrainerDocuments(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(documents)
    .where(eq(documents.trainerId, trainerId))
    .orderBy(desc(documents.createdAt));
}

// Payments
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
}

export async function getTrainerPayments(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(payments)
    .where(eq(payments.trainerId, trainerId))
    .orderBy(desc(payments.createdAt));
}
