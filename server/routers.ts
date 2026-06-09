import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { randomBytes } from "crypto";
import { parse as parseCookieHeader } from "cookie";

function getCurrentSessionToken(req: { headers: { cookie?: string } }): string | undefined {
  const parsed = parseCookieHeader(req.headers.cookie || "");
  return parsed[COOKIE_NAME];
}
import { hashPassword, verifyPassword } from "./passwordUtils";
import { ISSA_FORMS } from "./issaForms";
import { logAudit } from "./auditLogger";
import { sendPasswordResetEmail, sendVerificationEmail } from "./emailService";
import { sendPushToUser } from "./pushService";
import { notifyNewMessage } from "./messageNotify";
import { setTyping as setTypingStore, getTypingStatus as getTypingStatusStore } from "./typingStore";
import {
  getUserByOpenId,
  upsertUser,
  getOrCreateTrainer,
  getTrainerByUserId,
  getClientsByTrainer,
  getClientById,
  searchClients,
  getClientCountByTrainer,
  getProgramsByTrainer,
  getProgramsByClient,
  getProgramById,
  getCheckInsByClient,
  getPendingCheckIns,
  getMessageThread,
  getUnreadMessageCount,
  getSessionsByTrainer,
  getUpcomingSessions,
  getMonthlyRevenue,
  getActiveSubscriptions,
  getLeadsByTrainer,
  getLeadById,
  getReferralsByTrainer,
  getDb,
  getClientProgressMetrics,
  getTrainerConsultations,
  createProgressMetric,
} from "./db";
import {
  users, clients, programs, checkIns, messages, sessions, packages, subscriptions,
  leads, referrals, trainers, progressMetrics, consultations, localAuth,
  formTemplates, formSubmissions,
  passwordResetTokens, emailVerificationTokens, activeSessions,
  notifications, pushTokens,
  habitTemplates, habitEntries,
  achievements, achievementUnlocks,
  clientRiskScores, aiSummaries, weeklyCoachSummaries,
  groceryLists, foodSubstitutions, payments,
} from "../drizzle/schema";
import { eq, and, desc, gte, lt, lte, isNull, isNotNull, like, sql, ne, inArray } from "drizzle-orm";
import { InsertClient } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { generateWorkoutPDF, generateMealPlanPDF } from "./pdfGenerator";

/**
 * Generates (or refreshes) the AI weekly coach summary for a given trainer's current week.
 * Shared by the `aiCoach.generateWeeklySummary` tRPC mutation and the background scheduler
 * (server/scheduler.ts) so both paths produce identical upsert behavior.
 */
export async function generateWeeklySummaryForTrainer(trainerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekStartDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const activeClients = await db.select({ count: sql<number>`count(*)` }).from(clients).where(and(eq(clients.trainerId, trainerId), eq(clients.status, "active")));
  const newLeads = await db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.trainerId, trainerId), gte(leads.createdAt, weekStartDate)));
  const weekCheckIns = await db.select({ count: sql<number>`count(*)` }).from(checkIns).where(and(eq(checkIns.trainerId, trainerId), gte(checkIns.createdAt, weekStartDate)));
  const atRisk = await db.select({ count: sql<number>`count(*)` }).from(clientRiskScores).where(and(eq(clientRiskScores.trainerId, trainerId), ne(clientRiskScores.riskLevel, "low")));
  const totalClients = Number(activeClients[0]?.count ?? 0);
  const prompt = `Generate a Monday morning coach summary for W.A.R. Coaching.
Stats: ${totalClients} active clients, ${Number(atRisk[0]?.count ?? 0)} at risk, ${Number(newLeads[0]?.count ?? 0)} new leads this week, ${Number(weekCheckIns[0]?.count ?? 0)} check-ins received.
Return JSON: {"summary":"2-3 sentence narrative","highlights":["string"],"actions":["actionable item"]}`;
  const resp = await invokeLLM({ messages: [{ role: "system", content: "You are a business coach. Return valid JSON only." }, { role: "user", content: prompt }] });
  let content: any = {};
  const msgContent = resp.choices[0]?.message?.content;
  const contentStr = typeof msgContent === 'string' ? msgContent : (Array.isArray(msgContent) && msgContent.length > 0 && 'text' in msgContent[0] ? (msgContent[0] as any).text ?? '{}' : '{}');
  try { content = JSON.parse(contentStr); } catch { content = { summary: contentStr }; }
  // Upsert: update this week's row if it already exists, otherwise insert
  const existingSummary = await db.select({ id: weeklyCoachSummaries.id })
    .from(weeklyCoachSummaries)
    .where(and(eq(weeklyCoachSummaries.trainerId, trainerId), eq(weeklyCoachSummaries.weekStartDate, weekStartStr)))
    .limit(1);
  const summaryPayload = {
    trainerId, weekStartDate: weekStartStr, activeClients: totalClients,
    atRiskClients: Number(atRisk[0]?.count ?? 0), newLeads: Number(newLeads[0]?.count ?? 0),
    aiSummary: content.summary, highlights: JSON.stringify(content.highlights ?? []), actions: JSON.stringify(content.actions ?? []),
  };
  if (existingSummary.length > 0) {
    await db.update(weeklyCoachSummaries).set({ aiSummary: content.summary, highlights: JSON.stringify(content.highlights ?? []), actions: JSON.stringify(content.actions ?? []) })
      .where(eq(weeklyCoachSummaries.id, existingSummary[0].id));
  } else {
    await db.insert(weeklyCoachSummaries).values(summaryPayload);
  }
  return { ...content, weekStartDate: weekStartStr };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ── Client self-registration (email + password) ──────────────────────────
    clientRegister: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if email already exists in localAuth
        const existing = await db.select().from(localAuth).where(eq(localAuth.email, input.email.toLowerCase()))
        if (existing.length > 0) throw new Error("An account with this email already exists. Please sign in.");

        // Create user record with a local openId
        const openId = `local:${input.email.toLowerCase()}`;
        await upsertUser({ openId, name: input.name, email: input.email.toLowerCase(), loginMethod: "email", lastSignedIn: new Date() });
        const user = await getUserByOpenId(openId);
        if (!user) throw new Error("Failed to create account");

        // Store password hash
        const passwordHash = await hashPassword(input.password);
        await db.insert(localAuth).values({ userId: user.id, email: input.email.toLowerCase(), passwordHash });

        // Issue session cookie
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.signSession({ openId, appId: "war-coaching-os", name: input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        // Track this session for the "manage devices" UI
        await db.insert(activeSessions).values({
          userId: user.id,
          sessionToken,
          deviceInfo: (ctx.req.headers["user-agent"] as string | undefined)?.slice(0, 255),
          ipAddress: ctx.req.ip,
          expiresAt: new Date(Date.now() + ONE_YEAR_MS),
        }).catch(() => {}); // never block signup on session-tracking failure

        // Send a verification email (best-effort — never blocks signup)
        const verifyToken = randomBytes(32).toString("hex");
        await db.insert(emailVerificationTokens).values({
          userId: user.id,
          token: verifyToken,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        }).catch(() => {});
        await sendVerificationEmail(input.email.toLowerCase(), input.name, verifyToken);
        await logAudit("client_register", { userId: user.id, ipAddress: ctx.req.ip });

        return { success: true, name: user.name };
      }),

    // ── Client login (email + password) ─────────────────────────────────────
    clientLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const authRecord = await db.select().from(localAuth).where(eq(localAuth.email, input.email.toLowerCase()))
        if (authRecord.length === 0) throw new Error("Invalid email or password");

        const valid = await verifyPassword(authRecord[0].passwordHash, input.password);
        if (!valid) throw new Error("Invalid email or password");

        const user = await getUserByOpenId(`local:${input.email.toLowerCase()}`);
        if (!user) throw new Error("Account not found");

        // Update last signed in
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });

        // Issue session cookie
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.signSession({ openId: user.openId, appId: "war-coaching-os", name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        // Track this session for the "manage devices" UI
        await db.insert(activeSessions).values({
          userId: user.id,
          sessionToken,
          deviceInfo: (ctx.req.headers["user-agent"] as string | undefined)?.slice(0, 255),
          ipAddress: ctx.req.ip,
          expiresAt: new Date(Date.now() + ONE_YEAR_MS),
        }).catch(() => {});
        await logAudit("client_login", { userId: user.id, ipAddress: ctx.req.ip });

        return { success: true, name: user.name };
      }),

    // ── Session management ("Manage Devices") ────────────────────────────────
    getSessions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const currentToken = getCurrentSessionToken(ctx.req);
      const rows = await db.select().from(activeSessions)
        .where(eq(activeSessions.userId, ctx.user.id))
        .orderBy(desc(activeSessions.lastActiveAt));
      return rows.map(r => ({
        id: r.id,
        deviceInfo: r.deviceInfo,
        ipAddress: r.ipAddress,
        lastActiveAt: r.lastActiveAt,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        isCurrent: !!currentToken && r.sessionToken === currentToken,
      }));
    }),

    revokeSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const rows = await db.select().from(activeSessions)
          .where(and(eq(activeSessions.id, input.sessionId), eq(activeSessions.userId, ctx.user.id))).limit(1);
        if (rows.length === 0) throw new Error("Session not found");
        const currentToken = getCurrentSessionToken(ctx.req);
        await db.delete(activeSessions).where(eq(activeSessions.id, input.sessionId));
        await logAudit("session_revoked", { userId: ctx.user.id, entityType: "session", entityId: input.sessionId, ipAddress: ctx.req.ip });
        // If revoking the session we're currently using, log the browser out too
        if (currentToken && rows[0].sessionToken === currentToken) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        }
        return { success: true };
      }),

    revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const currentToken = getCurrentSessionToken(ctx.req);
      if (currentToken) {
        await db.delete(activeSessions).where(and(eq(activeSessions.userId, ctx.user.id), ne(activeSessions.sessionToken, currentToken)));
      } else {
        await db.delete(activeSessions).where(eq(activeSessions.userId, ctx.user.id));
      }
      await logAudit("all_sessions_revoked", { userId: ctx.user.id, ipAddress: ctx.req.ip });
      return { success: true };
    }),
  }),

  // ── Forms Router ──────────────────────────────────────────────────────────
  forms: router({
    // Seed all ISSA form templates (idempotent, call once on setup)
    seed: protectedProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      for (const form of ISSA_FORMS) {
        const existing = await db.select().from(formTemplates).where(eq(formTemplates.slug, form.slug))
        if (existing.length === 0) {
          await db.insert(formTemplates).values({
            slug: form.slug,
            name: form.name,
            description: form.description,
            category: form.category,
            fields: JSON.stringify(form.fields),
            isClientFacing: form.isClientFacing,
            isRequired: form.isRequired,
            sortOrder: form.sortOrder,
          });
        }
      }
      return { success: true, seeded: ISSA_FORMS.length };
    }),

    // List all client-facing form templates (auto-seeds DB on first call)
    listTemplates: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return ISSA_FORMS.map((f, i) => ({ ...f, id: i + 1, fields: JSON.stringify(f.fields), createdAt: new Date(), sortOrder: f.sortOrder, isClientFacing: f.isClientFacing, isRequired: f.isRequired }));
      let rows = await db.select().from(formTemplates).where(eq(formTemplates.isClientFacing, true));
      if (rows.length === 0) {
        // Auto-seed
        for (const form of ISSA_FORMS) {
          await db.insert(formTemplates).values({
            slug: form.slug, name: form.name, description: form.description, category: form.category,
            fields: JSON.stringify(form.fields), isClientFacing: form.isClientFacing, isRequired: form.isRequired, sortOrder: form.sortOrder,
          }).catch(() => {}); // ignore duplicate errors
        }
        rows = await db.select().from(formTemplates).where(eq(formTemplates.isClientFacing, true));
      }
      return rows;
    }),

    // Get a single template
    getTemplate: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const form = ISSA_FORMS.find(f => f.slug === input.slug);
        if (!form) throw new Error("Form not found");
        return { ...form, id: 0, fields: JSON.stringify(form.fields), createdAt: new Date() };
      }
      const rows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.slug))
      if (rows.length > 0) return rows[0];
      // Fallback to static
      const form = ISSA_FORMS.find(f => f.slug === input.slug);
      if (!form) throw new Error("Form not found");
      return { ...form, id: 0, fields: JSON.stringify(form.fields), createdAt: new Date() };
    }),

    // Save/update draft responses
    saveDraft: protectedProcedure
      .input(z.object({
        formSlug: z.string(),
        responses: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");

        // Get or auto-create template
        let templateId = 0;
        let tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug)).execute()
        if (tRows.length === 0) {
          const formDef = ISSA_FORMS.find(f => f.slug === input.formSlug);
          if (formDef) {
            await db.insert(formTemplates).values({ slug: formDef.slug, name: formDef.name, description: formDef.description, category: formDef.category, fields: JSON.stringify(formDef.fields), isClientFacing: formDef.isClientFacing, isRequired: formDef.isRequired, sortOrder: formDef.sortOrder }).catch(() => {});
            tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug)).execute()
          }
        }
        if (tRows.length > 0) templateId = tRows[0].id;

        // Check for existing draft
        const existing = await db.select().from(formSubmissions)
          .where(and(eq(formSubmissions.clientId, client[0].id), eq(formSubmissions.formTemplateId, templateId)))
          

        if (existing.length > 0) {
          await db.update(formSubmissions).set({ responses: JSON.stringify(input.responses) }).where(eq(formSubmissions.id, existing[0].id));
          return { success: true, id: existing[0].id };
        } else {
          const result = await db.insert(formSubmissions).values({
            formTemplateId: templateId,
            clientId: client[0].id,
            trainerId: client[0].trainerId,
            responses: JSON.stringify(input.responses),
            status: "draft",
          });
          return { success: true, id: (result as any).insertId };
        }
      }),

    // Submit a completed form
    submit: protectedProcedure
      .input(z.object({
        formSlug: z.string(),
        responses: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");

        let templateId = 0;
        let tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug)).execute()
        if (tRows.length === 0) {
          const formDef = ISSA_FORMS.find(f => f.slug === input.formSlug);
          if (formDef) {
            await db.insert(formTemplates).values({ slug: formDef.slug, name: formDef.name, description: formDef.description, category: formDef.category, fields: JSON.stringify(formDef.fields), isClientFacing: formDef.isClientFacing, isRequired: formDef.isRequired, sortOrder: formDef.sortOrder }).catch(() => {});
            tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug)).execute()
          }
        }
        if (tRows.length > 0) templateId = tRows[0].id;

        const existing = await db.select().from(formSubmissions)
          .where(and(eq(formSubmissions.clientId, client[0].id), eq(formSubmissions.formTemplateId, templateId)))
          

        if (existing.length > 0) {
          await db.update(formSubmissions).set({
            responses: JSON.stringify(input.responses),
            status: "submitted",
            submittedAt: new Date(),
          }).where(eq(formSubmissions.id, existing[0].id));
          return { success: true, id: existing[0].id };
        } else {
          const result = await db.insert(formSubmissions).values({
            formTemplateId: templateId,
            clientId: client[0].id,
            trainerId: client[0].trainerId,
            responses: JSON.stringify(input.responses),
            status: "submitted",
            submittedAt: new Date(),
          });
          return { success: true, id: (result as any).insertId };
        }
      }),

    // Client: get my submissions
    getMySubmissions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(formSubmissions).where(eq(formSubmissions.clientId, client[0].id)).orderBy(desc(formSubmissions.updatedAt));
    }),

    // Trainer: list all submissions across clients
    trainerList: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");
      const rows = await db.select({
        submission: formSubmissions,
        clientName: clients.name,
        clientEmail: clients.email,
        formName: formTemplates.name,
        formSlug: formTemplates.slug,
        formFields: formTemplates.fields,
      })
        .from(formSubmissions)
        .leftJoin(clients, eq(formSubmissions.clientId, clients.id))
        .leftJoin(formTemplates, eq(formSubmissions.formTemplateId, formTemplates.id))
        .where(eq(formSubmissions.trainerId, trainer.id))
        .orderBy(desc(formSubmissions.updatedAt));
      // Fallback: if formTemplates not seeded, inject static form names
      return rows.map(r => ({
        ...r,
        formName: r.formName ?? ISSA_FORMS[r.submission.formTemplateId - 1]?.name ?? "Form",
        formFields: r.formFields ?? JSON.stringify(ISSA_FORMS[r.submission.formTemplateId - 1]?.fields ?? []),
      }));
    }),

    // Trainer: get a single submission (with template for context)
    trainerGetSubmission: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");
        const rows = await db.select().from(formSubmissions).where(and(eq(formSubmissions.id, input.submissionId), eq(formSubmissions.trainerId, trainer.id)))
        if (rows.length === 0) throw new Error("Submission not found");
        return rows[0];
      }),

    // Trainer: mark submission as reviewed + add notes
    reviewSubmission: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");
        await db.update(formSubmissions).set({
          status: "reviewed",
          reviewedAt: new Date(),
          trainerNotes: input.notes,
        }).where(and(eq(formSubmissions.id, input.submissionId), eq(formSubmissions.trainerId, trainer.id)));
        return { success: true };
      }),
  }),

  // Trainer profile
  trainer: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getOrCreateTrainer(ctx.user.id);
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          qualifications: z.array(z.string()).optional(),
          specialties: z.array(z.string()).optional(),
          monthlyIncomeGoal: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const updateData: any = {};
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.qualifications !== undefined) updateData.qualifications = JSON.stringify(input.qualifications);
        if (input.specialties !== undefined) updateData.specialties = JSON.stringify(input.specialties);
        if (input.monthlyIncomeGoal !== undefined) updateData.monthlyIncomeGoal = input.monthlyIncomeGoal;

        await db.update(trainers).set(updateData).where(eq(trainers.id, trainer.id));
        return { success: true };
      }),
  }),

  // Clients
  clients: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const clientList = await getClientsByTrainer(trainer.id, input.limit, input.offset);
        const total = await getClientCountByTrainer(trainer.id);

        return { clients: clientList, total };
      }),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await searchClients(trainer.id, input.query);
      }),
    get: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await getClientById(input.clientId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          age: z.number().optional(),
          sex: z.enum(["male", "female", "other"]).optional(),
          weight: z.string().optional(),
          height: z.string().optional(),
          fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
          trainingType: z.enum(["in-person", "online", "adaptive"]).optional(),
          goals: z.array(z.string()).optional(),
          injuries: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
          dietaryRestrictions: z.array(z.string()).optional(),
          dailyCalorieTarget: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(clients).values({
          trainerId: trainer.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          age: input.age,
          sex: input.sex,
          weight: input.weight as any,
          height: input.height as any,
          fitnessLevel: input.fitnessLevel,
          trainingType: input.trainingType,
          goals: JSON.stringify(input.goals || []),
          injuries: JSON.stringify(input.injuries || []),
          allergies: JSON.stringify(input.allergies || []),
          dietaryRestrictions: JSON.stringify(input.dietaryRestrictions || []),
          dailyCalorieTarget: input.dailyCalorieTarget,
        });

        return { success: true, clientId: (result as any).insertId };
      }),
    update: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          age: z.number().optional(),
          sex: z.enum(["male", "female", "other"]).optional(),
          weight: z.string().optional(),
          height: z.string().optional(),
          fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
          trainingType: z.enum(["in-person", "online", "adaptive"]).optional(),
          goals: z.array(z.string()).optional(),
          injuries: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
          dietaryRestrictions: z.array(z.string()).optional(),
          dailyCalorieTarget: z.number().optional(),
          status: z.enum(["active", "inactive", "paused"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const client = await getClientById(input.clientId);
        if (!client || client.trainerId !== trainer.id) throw new Error("Client not found or unauthorized");

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.age !== undefined) updateData.age = input.age;
        if (input.sex !== undefined) updateData.sex = input.sex;
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.height !== undefined) updateData.height = input.height;
        if (input.fitnessLevel !== undefined) updateData.fitnessLevel = input.fitnessLevel;
        if (input.trainingType !== undefined) updateData.trainingType = input.trainingType;
        if (input.goals !== undefined) updateData.goals = JSON.stringify(input.goals);
        if (input.injuries !== undefined) updateData.injuries = JSON.stringify(input.injuries);
        if (input.allergies !== undefined) updateData.allergies = JSON.stringify(input.allergies);
        if (input.dietaryRestrictions !== undefined) updateData.dietaryRestrictions = JSON.stringify(input.dietaryRestrictions);
        if (input.dailyCalorieTarget !== undefined) updateData.dailyCalorieTarget = input.dailyCalorieTarget;
        if (input.status !== undefined) updateData.status = input.status;

        await db.update(clients).set(updateData).where(eq(clients.id, input.clientId));
        return { success: true };
      }),
  }),

  // Programs
  programs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getProgramsByTrainer(trainer.id, input.limit, input.offset);
      }),
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await getProgramsByClient(input.clientId);
      }),
    get: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        return await getProgramById(input.programId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          programType: z.enum(["exercise", "nutrition", "hybrid"]),
          duration: z.number().optional(),
          content: z.any(),
          clientId: z.number().optional(),
          isTemplate: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(programs).values({
          trainerId: trainer.id,
          clientId: input.clientId,
          name: input.name,
          description: input.description,
          programType: input.programType,
          duration: input.duration,
          content: JSON.stringify(input.content),
          isTemplate: input.isTemplate,
        });

        return { success: true, programId: (result as any).insertId };
      }),
    update: protectedProcedure
      .input(
        z.object({
          programId: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          duration: z.number().optional(),
          content: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const program = await getProgramById(input.programId);
        if (!program || program.trainerId !== trainer.id) throw new Error("Program not found or unauthorized");

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.duration !== undefined) updateData.duration = input.duration;
        if (input.content !== undefined) updateData.content = JSON.stringify(input.content);

        await db.update(programs).set(updateData).where(eq(programs.id, input.programId));
        return { success: true };
      }),
    assign: protectedProcedure
      .input(
        z.object({
          programId: z.number(),
          clientId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const program = await getProgramById(input.programId);
        if (!program || program.trainerId !== trainer.id) throw new Error("Program not found or unauthorized");

        const client = await db.select().from(clients).where(eq(clients.id, input.clientId));
        if (!client || client.length === 0 || client[0].trainerId !== trainer.id) throw new Error("Client not found or unauthorized");

        await db.update(programs).set({ clientId: input.clientId }).where(eq(programs.id, input.programId));
        return { success: true, programId: input.programId, clientId: input.clientId };
      }),
    unassign: protectedProcedure
      .input(
        z.object({
          programId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const program = await getProgramById(input.programId);
        if (!program || program.trainerId !== trainer.id) throw new Error("Program not found or unauthorized");

        await db.update(programs).set({ clientId: null }).where(eq(programs.id, input.programId));
        return { success: true };
      }),
  }),

  // AI Exercise Generator
  ai: router({
    generateExerciseProgram: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          age: z.number(),
          sex: z.enum(["male", "female", "other"]),
          weight: z.number(),
          goals: z.array(z.string()),
          injuries: z.array(z.string()),
          fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
          duration: z.number().default(12),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const prompt = `Create a detailed ${input.duration}-week workout program for a ${input.age}-year-old ${input.sex} weighing ${input.weight} lbs with ${input.fitnessLevel} fitness level.

Goals: ${input.goals.join(", ")}
Injuries/Limitations: ${input.injuries.length > 0 ? input.injuries.join(", ") : "None"}

Generate a structured weekly program with:
- Daily workout splits
- Specific exercises with sets, reps, and rest periods
- Progressive overload guidelines
- Warm-up and cool-down recommendations
- Coaching notes and form tips

Return as JSON with structure: { weeks: [{ day: string, exercises: [{ name, sets, reps, restSeconds, notes }] }] }`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert fitness coach creating personalized workout programs. Always return valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        let programContent;
        try {
          const content = response.choices[0]?.message?.content;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          programContent = JSON.parse(contentStr || "{}");
        } catch {
          programContent = { error: "Failed to parse program", raw: response.choices[0]?.message?.content };
        }

        return { success: true, program: programContent };
      }),

    generateMealPlan: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          dailyCalories: z.number(),
          allergies: z.array(z.string()),
          dietaryRestrictions: z.array(z.string()),
          preferences: z.array(z.string()),
          goals: z.array(z.string()),
          duration: z.number().default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const prompt = `Create a detailed ${input.duration}-day meal plan for ${input.dailyCalories} calories per day.

Allergies: ${input.allergies.length > 0 ? input.allergies.join(", ") : "None"}
Dietary Restrictions: ${input.dietaryRestrictions.length > 0 ? input.dietaryRestrictions.join(", ") : "None"}
Food Preferences: ${input.preferences.join(", ")}
Goals: ${input.goals.join(", ")}

For each day, provide:
- Breakfast, lunch, dinner, and 2 snacks
- Macros (protein, carbs, fats) for each meal
- Simple recipes with ingredients
- Grocery list for the week

Return as JSON with structure: { 
  days: [{ day: number, meals: [{ name, recipe, ingredients, macros: { protein, carbs, fats, calories } }] }],
  shoppingList: [{ item, quantity, category }]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert nutritionist creating personalized meal plans. Always return valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        let mealPlanContent;
        try {
          const content = response.choices[0]?.message?.content;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          mealPlanContent = JSON.parse(contentStr || "{}");
        } catch {
          mealPlanContent = { error: "Failed to parse meal plan", raw: response.choices[0]?.message?.content };
        }

        return { success: true, mealPlan: mealPlanContent };
      }),
  }),

  // Check-ins
  checkIns: router({
    getByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await getCheckInsByClient(input.clientId);
      }),
    getPending: protectedProcedure.query(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");

      return await getPendingCheckIns(trainer.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          weight: z.string().optional(),
          energyLevel: z.number().optional(),
          notes: z.string().optional(),
          photoUrls: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(checkIns).values({
          clientId: input.clientId,
          trainerId: trainer.id,
          weight: input.weight as any,
          energyLevel: input.energyLevel,
          notes: input.notes,
          photoUrls: JSON.stringify(input.photoUrls || []),
          status: "pending",
        });

        return { success: true, checkInId: (result as any).insertId };
      }),
    respond: protectedProcedure
      .input(
        z.object({
          checkInId: z.number(),
          feedback: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        await db
          .update(checkIns)
          .set({
            trainerFeedback: input.feedback,
            status: "responded",
            respondedAt: new Date(),
          })
          .where(eq(checkIns.id, input.checkInId));

        return { success: true };
      }),
  }),

  // Messages
  messages: router({
    getThread: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getMessageThread(trainer.id, input.clientId);
      }),
    getUnreadCount: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getUnreadMessageCount(trainer.id, input.clientId);
      }),
    send: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(messages).values({
          trainerId: trainer.id,
          clientId: input.clientId,
          senderId: ctx.user.id,
          content: input.content,
          isRead: false,
        });

        // Notify the client (in-app + push + email), best-effort
        const client = await getClientById(input.clientId);
        if (client?.email) {
          const recipientUser = await getUserByOpenId(`local:${client.email.toLowerCase()}`);
          if (recipientUser) {
            await notifyNewMessage({
              recipientUserId: recipientUser.id,
              trainerId: trainer.id,
              fromName: ctx.user.name || "Your coach",
              content: input.content,
            });
          }
        }
        setTypingStore(trainer.id, input.clientId, "trainer", false);

        return { success: true, messageId: (result as any).insertId };
      }),

    sendWithAttachment: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          content: z.string().optional().default(""),
          attachmentData: z.string(), // base64-encoded file content
          attachmentName: z.string(),
          attachmentType: z.string(), // MIME type
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const buffer = Buffer.from(input.attachmentData, "base64");
        if (buffer.length === 0) throw new Error("Invalid attachment data");
        if (buffer.length > 15 * 1024 * 1024) throw new Error("Attachment exceeds 15MB size limit");

        const { storagePut } = await import("./storage");
        const safeName = input.attachmentName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `message-attachments/${trainer.id}/${input.clientId}/${Date.now()}_${safeName}`;
        const { url } = await storagePut(fileKey, buffer, input.attachmentType || "application/octet-stream");

        const messageContent = input.content?.trim() || `📎 Sent an attachment: ${input.attachmentName}`;
        const result = await db.insert(messages).values({
          trainerId: trainer.id,
          clientId: input.clientId,
          senderId: ctx.user.id,
          content: messageContent,
          isRead: false,
          attachmentUrl: url,
          attachmentType: input.attachmentType,
          attachmentName: input.attachmentName,
        });

        const client = await getClientById(input.clientId);
        if (client?.email) {
          const recipientUser = await getUserByOpenId(`local:${client.email.toLowerCase()}`);
          if (recipientUser) {
            await notifyNewMessage({
              recipientUserId: recipientUser.id,
              trainerId: trainer.id,
              fromName: ctx.user.name || "Your coach",
              content: messageContent,
            });
          }
        }
        setTypingStore(trainer.id, input.clientId, "trainer", false);

        return { success: true, messageId: (result as any).insertId, url };
      }),

    markThreadRead: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Mark every message in this thread NOT sent by the current user as read.
        // Works for both the trainer (marking client messages read) and the
        // client (marking trainer messages read) — the thread is scoped by clientId.
        await db.update(messages)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            eq(messages.clientId, input.clientId),
            ne(messages.senderId, ctx.user.id),
            isNull(messages.readAt)
          ));
        return { success: true };
      }),

    setTyping: protectedProcedure
      .input(z.object({ clientId: z.number(), isTyping: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (trainer) {
          setTypingStore(trainer.id, input.clientId, "trainer", input.isTyping);
        } else {
          const client = await getClientById(input.clientId);
          if (client) setTypingStore(client.trainerId, client.id, "client", input.isTyping);
        }
        return { success: true };
      }),

    getTypingStatus: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        let trainerId: number | undefined = trainer?.id;
        if (!trainerId) {
          const client = await getClientById(input.clientId);
          trainerId = client?.trainerId;
        }
        if (!trainerId) return { trainerTyping: false, clientTyping: false };
        return getTypingStatusStore(trainerId, input.clientId);
      }),
  }),

  // Sessions
  sessions: router({
    getUpcoming: protectedProcedure.query(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");

      return await getUpcomingSessions(trainer.id);
    }),
    getByDateRange: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getSessionsByTrainer(trainer.id, input.startDate, input.endDate);
      }),
    create: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          sessionType: z.enum(["in-person", "online", "adaptive"]),
          startTime: z.date(),
          endTime: z.date(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(sessions).values({
          trainerId: trainer.id,
          clientId: input.clientId,
          sessionType: input.sessionType,
          startTime: input.startTime,
          endTime: input.endTime,
          notes: input.notes,
          status: "scheduled",
        });

        return { success: true, sessionId: (result as any).insertId };
      }),
  }),

  // Revenue
  revenue: router({
    getMonthlyRevenue: protectedProcedure
      .input(z.object({ month: z.date() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const revenue = await getMonthlyRevenue(trainer.id, input.month);
        return { revenue, goal: trainer.monthlyIncomeGoal };
      }),
    getActiveSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");

      return await getActiveSubscriptions(trainer.id);
    }),
  }),

  // Leads
  leads: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getLeadsByTrainer(trainer.id, input.limit, input.offset);
      }),
    get: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await getLeadById(input.leadId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          source: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(leads).values({
          trainerId: trainer.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          source: input.source,
          notes: input.notes,
          status: "new",
        });

        return { success: true, leadId: (result as any).insertId };
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.leadId));

        return { success: true };
      }),
  }),

  // Referrals
  referrals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");

      return await getReferralsByTrainer(trainer.id);
    }),
  }),

  // Progress Tracking
  progress: router({
    createMetric: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          metricType: z.enum(["weight", "measurement", "bloodwork", "body_composition", "photo"]),
          value: z.string().optional(),
          unit: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(progressMetrics).values({
          clientId: input.clientId,
          trainerId: trainer.id,
          metricType: input.metricType as any,
          value: input.value as any,
          unit: input.unit,
          notes: input.notes,
        });

        return { success: true, metricId: (result as any).insertId };
      }),
    getClientMetrics: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        return await getClientProgressMetrics(input.clientId, trainer.id);
      }),
    uploadProgressPhoto: protectedProcedure
      .input(
        z.object({
          clientId: z.number(),
          pose: z.enum(["front", "back", "left_side", "right_side"]),
          photoData: z.string(), // base64 encoded image data
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const { storagePut } = await import("./storage");
        const timestamp = Date.now();
        const fileKey = `progress-photos/${input.clientId}/${input.pose}_${timestamp}.jpg`;
        const buffer = Buffer.from(input.photoData, "base64");
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");

        // Get existing photo set for this month or create new one
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const existingMetrics = await db.select().from(progressMetrics)
          .where(and(
            eq(progressMetrics.clientId, input.clientId),
            eq(progressMetrics.trainerId, trainer.id),
            eq(progressMetrics.metricType, "photo"),
            gte(progressMetrics.createdAt, monthStart),
          ))
          .orderBy(desc(progressMetrics.createdAt))
          

        if (existingMetrics.length > 0) {
          // Add to existing photo set
          const existing = existingMetrics[0];
          const currentPhotos = existing.photoUrls ? JSON.parse(existing.photoUrls) : [];
          currentPhotos.push({ pose: input.pose, url, timestamp });
          await db.update(progressMetrics)
            .set({ photoUrls: JSON.stringify(currentPhotos), notes: input.notes || existing.notes })
            .where(eq(progressMetrics.id, existing.id));
          return { success: true, metricId: existing.id, photoUrl: url };
        } else {
          // Create new photo set
          const photos = [{ pose: input.pose, url, timestamp }];
          const result = await db.insert(progressMetrics).values({
            clientId: input.clientId,
            trainerId: trainer.id,
            metricType: "photo",
            photoUrls: JSON.stringify(photos),
            notes: input.notes,
          });
          return { success: true, metricId: (result as any).insertId, photoUrl: url };
        }
      }),
    getPhotoSets: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const photoMetrics = await db.select().from(progressMetrics)
          .where(and(
            eq(progressMetrics.clientId, input.clientId),
            eq(progressMetrics.trainerId, trainer.id),
            eq(progressMetrics.metricType, "photo"),
          ))
          .orderBy(desc(progressMetrics.createdAt));

        return photoMetrics.map((m) => ({
          id: m.id,
          date: m.createdAt,
          photos: m.photoUrls ? JSON.parse(m.photoUrls) : [],
          notes: m.notes,
        }));
      }),
  }),

  // Consultations
  consultations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer profile not found");

      return await getTrainerConsultations(trainer.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          clientName: z.string(),
          clientEmail: z.string().email(),
          clientPhone: z.string().optional(),
          consultationType: z.string().optional(),
          amount: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer profile not found");

        const result = await db.insert(consultations).values({
          trainerId: trainer.id,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          consultationType: input.consultationType,
          amount: input.amount,
          status: "pending",
        });

        return { success: true, consultationId: (result as any).insertId };
      }),
    createCheckout: protectedProcedure
      .input(
        z.object({
          serviceId: z.number().optional(),
          packageId: z.number().optional(),
          description: z.string(),
          amount: z.number(), // in cents
          origin: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession } = await import("./stripe");
        const session = await createCheckoutSession({
          serviceId: input.serviceId,
          packageId: input.packageId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "",
          origin: input.origin,
          description: input.description,
          amount: input.amount,
        });
        return { checkoutUrl: session.url };
      }),
  }),

  // Services and packages (public)
  services: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { services } = await import("../drizzle/schema");
      return await db.select().from(services).where(eq(services.isActive, true));
    }),
    packages: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { packages } = await import("../drizzle/schema");
      return await db.select().from(packages);
    }),
  }),

  // Client Portal - procedures for clients to view their own data
  portal: router({
    // Get client profile linked to logged-in user
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      return result.length > 0 ? result[0] : null;
    }),
    // Get my assigned programs
    getMyPrograms: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(programs).where(eq(programs.clientId, client[0].id)).orderBy(desc(programs.createdAt));
    }),
    // Get my meal plans (nutrition programs)
    getMyMealPlans: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(programs).where(and(eq(programs.clientId, client[0].id), eq(programs.programType, "nutrition"))).orderBy(desc(programs.createdAt));
    }),
    // Get my check-in history
    getMyCheckIns: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(checkIns).where(eq(checkIns.clientId, client[0].id)).orderBy(desc(checkIns.createdAt));
    }),
    // Submit a weekly check-in
    submitCheckIn: protectedProcedure
      .input(z.object({
        weight: z.string().optional(),
        energyLevel: z.number().min(1).max(10).optional(),
        notes: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const client = db
          ? await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
          : [];
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
        if (!db) throw new Error("Database not available");
        const result = await db.insert(checkIns).values({
          clientId: client[0].id,
          trainerId: client[0].trainerId,
          weight: input.weight as any,
          energyLevel: input.energyLevel,
          notes: input.notes,
          photoUrls: JSON.stringify(input.photoUrls || []),
          status: "pending",
        });
        return { success: true, checkInId: (result as any)[0].insertId };
      }),
    // Get my messages with trainer
    getMyMessages: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(messages).where(eq(messages.clientId, client[0].id)).orderBy(messages.createdAt);
    }),
    // Send message to trainer
    sendMessage: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const client = db
          ? await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
          : [];
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
        if (!db) throw new Error("Database not available");
        const result = await db.insert(messages).values({
          trainerId: client[0].trainerId,
          clientId: client[0].id,
          senderId: ctx.user.id,
          content: input.content,
          isRead: false,
        });

        // Notify the trainer (in-app + push + email), best-effort
        const trainerRows = await db.select().from(trainers).where(eq(trainers.id, client[0].trainerId)).limit(1);
        if (trainerRows.length > 0) {
          await notifyNewMessage({
            recipientUserId: trainerRows[0].userId,
            trainerId: client[0].trainerId,
            fromName: ctx.user.name || client[0].name || "Your client",
            content: input.content,
          });
        }
        setTypingStore(client[0].trainerId, client[0].id, "client", false);

        return { success: true, messageId: (result as any)[0].insertId };
      }),
    // Get my progress metrics
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(progressMetrics).where(eq(progressMetrics.clientId, client[0].id)).orderBy(desc(progressMetrics.createdAt));
    }),
    // Get my upcoming sessions
    getMySessions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
      if (client.length === 0) return [];
      return await db.select().from(sessions).where(and(eq(sessions.clientId, client[0].id), gte(sessions.startTime, new Date()))).orderBy(sessions.startTime);
    }),
    // Upload progress photo from client portal
    uploadPhoto: protectedProcedure
      .input(z.object({
        pose: z.enum(["front", "back", "left_side", "right_side"]),
        photoData: z.string(), // base64 encoded image data
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const buffer = Buffer.from(input.photoData, "base64");
        if (buffer.length === 0) throw new Error("Invalid photo data");
        if (buffer.length > 10 * 1024 * 1024) throw new Error("Photo exceeds 10MB size limit");
        const client = db
          ? await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).execute()
          : [];
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
        if (!db) throw new Error("Database not available");
        const { storagePut } = await import("./storage");
        const timestamp = Date.now();
        const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
        const fileKey = `check-in-photos/${client[0].id}/${input.pose}_${timestamp}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { success: true, url, pose: input.pose };
            }),
    // Get public client profile (no auth required)
    getPublicProfile: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db
          .select()
          .from(clients)
          .where(eq(clients.id, input.clientId))
          
        if (client.length === 0) throw new Error("Client not found");
        const clientData = client[0];
        // Get assigned programs
        const assignedPrograms = await db
          .select()
          .from(programs)
          .where(eq(programs.clientId, input.clientId))
          
        // Get recent check-ins
        const recentCheckIns = await db
          .select()
          .from(checkIns)
          .where(eq(checkIns.clientId, input.clientId))
          .orderBy(desc(checkIns.createdAt))
          .limit(3);
        return {
          client: clientData,
          programs: assignedPrograms,
          checkIns: recentCheckIns,
        };
      }),
  }),

  // PDF Export
  export: router({
    downloadWorkout: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const program = await db
          .select()
          .from(programs)
          .where(eq(programs.id, input.programId))
          
        
        if (program.length === 0) throw new Error("Program not found");
        const programData = program[0];
        
        // Parse content
        const content = typeof programData.content === "string" 
          ? JSON.parse(programData.content) 
          : programData.content;
        
        const pdfStream = generateWorkoutPDF({
          name: programData.name,
          description: programData.description || "",
          programType: programData.programType,
          duration: programData.duration || 0,
          exercises: content?.exercises || [],
          meals: content?.meals || [],
        });
        
        // Return base64 encoded PDF for tRPC compatibility
        return { success: true, filename: `${programData.name.replace(/\s+/g, "_")}_workout.pdf` };
      }),
    
    downloadMealPlan: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const program = await db.select().from(programs).where(eq(programs.id, input.programId));
        if (program.length === 0) throw new Error("Program not found");
        const programData = program[0];
        const content = typeof programData.content === "string" ? JSON.parse(programData.content) : programData.content;
        const pdfStream = generateMealPlanPDF(content?.meals || [], programData.name);
        return { pdfStream, filename: `${programData.name.replace(/\s+/g, "_")}_meal_plan.pdf` };
      }),
  }),

  // ── PASSWORD RESET ──────────────────────────────────────────────────────────
  // (added to the top-level router so clients can reset without being authed)
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true, message: "If that email exists, a reset link was sent." };
      const userRows = await db.select().from(localAuth).where(eq(localAuth.email, input.email.toLowerCase())).limit(1);
      if (userRows.length > 0) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.insert(passwordResetTokens).values({ userId: userRows[0].userId, token, expiresAt });
        await logAudit("password_reset_request", { userId: userRows[0].userId, ipAddress: ctx.req.ip });

        const userRow = await db.select().from(users).where(eq(users.id, userRows[0].userId)).limit(1);
        const emailSent = await sendPasswordResetEmail(input.email.toLowerCase(), userRow[0]?.name || "", token);

        // In dev (no email provider configured) we also return the raw token
        // so the flow can be tested without a real inbox.
        return {
          success: true,
          message: "Reset link sent. Check your email.",
          ...(emailSent ? {} : { token }),
        };
      }
      return { success: true, message: "If that email exists, a reset link was sent." };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const tokenRows = await db.select().from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.token, input.token), isNull(passwordResetTokens.usedAt), gte(passwordResetTokens.expiresAt, new Date())))
        .limit(1);
      if (tokenRows.length === 0) throw new Error("Invalid or expired reset link.");
      const newHash = await hashPassword(input.newPassword);
      await db.update(localAuth).set({ passwordHash: newHash }).where(eq(localAuth.userId, tokenRows[0].userId));
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenRows[0].id));
      await logAudit("password_reset_complete", { userId: tokenRows[0].userId, ipAddress: ctx.req.ip });
      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(emailVerificationTokens)
        .where(and(eq(emailVerificationTokens.token, input.token), isNull(emailVerificationTokens.usedAt), gte(emailVerificationTokens.expiresAt, new Date())))
        .limit(1);
      if (rows.length === 0) throw new Error("Invalid or expired verification link.");
      await db.update(localAuth).set({} as any).where(eq(localAuth.userId, rows[0].userId)); // noop to trigger update
      // Mark user verified
      const userRow = await db.select().from(localAuth).where(eq(localAuth.userId, rows[0].userId)).limit(1);
      if (userRow.length > 0) {
        // Update users.emailVerified — use raw update since schema was updated
        await db.execute(sql`UPDATE users SET emailVerified = true WHERE id = ${rows[0].userId}`);
      }
      await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, rows[0].id));
      return { success: true };
    }),

  // ── NOTIFICATIONS ───────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
      return { count: Number(rows[0]?.count ?? 0) };
    }),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(notifications).set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(notifications).set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
      return { success: true };
    }),
    registerPushToken: protectedProcedure
      .input(z.object({ token: z.string(), platform: z.enum(["ios", "android", "web"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(pushTokens).values({ userId: ctx.user.id, token: input.token, platform: input.platform });
        return { success: true };
      }),
  }),

  // ── HABITS ──────────────────────────────────────────────────────────────────
  habits: router({
    listForClient: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
      if (clientRows.length === 0) return [];
      const client = clientRows[0];
      const today = new Date().toISOString().slice(0, 10);
      const habits = await db.select().from(habitTemplates)
        .where(and(eq(habitTemplates.trainerId, client.trainerId), eq(habitTemplates.isActive, true)));
      const todayEntries = await db.select().from(habitEntries)
        .where(and(eq(habitEntries.clientId, client.id), eq(habitEntries.date, today)));
      const entryMap: Record<number, typeof todayEntries[0]> = {};
      todayEntries.forEach(e => { entryMap[e.habitTemplateId] = e; });
      return habits.map(h => ({ ...h, todayEntry: entryMap[h.id] ?? null }));
    }),
    logEntry: protectedProcedure
      .input(z.object({ habitTemplateId: z.number(), date: z.string(), value: z.number().optional(), completed: z.boolean(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
        if (clientRows.length === 0) throw new Error("Client not found");
        const existing = await db.select().from(habitEntries)
          .where(and(eq(habitEntries.clientId, clientRows[0].id), eq(habitEntries.habitTemplateId, input.habitTemplateId), eq(habitEntries.date, input.date))).limit(1);
        if (existing.length > 0) {
          await db.update(habitEntries).set({ value: input.value as any, completed: input.completed, notes: input.notes }).where(eq(habitEntries.id, existing[0].id));
        } else {
          await db.insert(habitEntries).values({ habitTemplateId: input.habitTemplateId, clientId: clientRows[0].id, date: input.date, value: input.value as any, completed: input.completed, notes: input.notes });
        }
        return { success: true };
      }),
    getWeekEntries: protectedProcedure
      .input(z.object({ weekStartDate: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
        if (clientRows.length === 0) return [];
        const weekEnd = new Date(input.weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);
        return await db.select().from(habitEntries)
          .where(and(eq(habitEntries.clientId, clientRows[0].id), gte(habitEntries.date, input.weekStartDate), lte(habitEntries.date, weekEndStr)));
      }),
    getStreak: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { currentStreak: 0, longestStreak: 0 };
      const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
      if (clientRows.length === 0) return { currentStreak: 0, longestStreak: 0 };
      const entries = await db.select({ date: habitEntries.date }).from(habitEntries)
        .where(and(eq(habitEntries.clientId, clientRows[0].id), eq(habitEntries.completed, true)))
        .orderBy(desc(habitEntries.date));
      const dates = new Set(entries.map(e => e.date));
      let streak = 0; let longest = 0; let current = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        if (dates.has(ds)) { current++; if (i === streak) streak = current; longest = Math.max(longest, current); }
        else { if (i === 0 || i === 1) streak = current; current = 0; }
      }
      return { currentStreak: streak, longestStreak: longest };
    }),
    trainerCreate: protectedProcedure
      .input(z.object({ clientId: z.number().optional(), name: z.string(), category: z.enum(["steps","water","sleep","supplements","meditation","workout","custom"]), unit: z.string().optional(), dailyTarget: z.number().optional(), icon: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        const result = await db.insert(habitTemplates).values({ trainerId: trainer.id, clientId: input.clientId, name: input.name, category: input.category, unit: input.unit, dailyTarget: input.dailyTarget as any, icon: input.icon });
        return { success: true, id: (result as any).insertId };
      }),
    trainerList: protectedProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        const conditions = input.clientId
          ? and(eq(habitTemplates.trainerId, trainer.id), eq(habitTemplates.clientId, input.clientId))
          : eq(habitTemplates.trainerId, trainer.id);
        return await db.select().from(habitTemplates).where(conditions).orderBy(habitTemplates.name);
      }),
    trainerSetActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        await db.update(habitTemplates).set({ isActive: input.isActive })
          .where(and(eq(habitTemplates.id, input.id), eq(habitTemplates.trainerId, trainer.id)));
        return { success: true };
      }),
    trainerDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        await db.delete(habitTemplates).where(and(eq(habitTemplates.id, input.id), eq(habitTemplates.trainerId, trainer.id)));
        return { success: true };
      }),
  }),

  // ── ACHIEVEMENTS ────────────────────────────────────────────────────────────
  achievements: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
      const allAchievements = await db.select().from(achievements).orderBy(achievements.category);
      if (clientRows.length === 0) return allAchievements.map(a => ({ ...a, unlocked: false, unlockedAt: null }));
      const unlocks = await db.select().from(achievementUnlocks).where(eq(achievementUnlocks.clientId, clientRows[0].id));
      const unlockMap: Record<number, Date> = {};
      unlocks.forEach(u => { unlockMap[u.achievementId] = u.unlockedAt; });
      return allAchievements.map(a => ({ ...a, unlocked: !!unlockMap[a.id], unlockedAt: unlockMap[a.id] ?? null }));
    }),
    getPoints: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, recentUnlocks: [] };
      const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
      if (clientRows.length === 0) return { total: 0, recentUnlocks: [] };
      const unlocks = await db.select({ achievementId: achievementUnlocks.achievementId, unlockedAt: achievementUnlocks.unlockedAt })
        .from(achievementUnlocks).where(eq(achievementUnlocks.clientId, clientRows[0].id));
      const achievementIds = unlocks.map(u => u.achievementId);
      if (achievementIds.length === 0) return { total: 0, recentUnlocks: [] };
      const earned = await db.select().from(achievements).where(inArray(achievements.id, achievementIds));
      const total = earned.reduce((sum, a) => sum + (a.points ?? 0), 0);
      const recentUnlocks = earned.slice(-3).reverse();
      return { total, recentUnlocks };
    }),
    manualUnlock: protectedProcedure
      .input(z.object({ clientId: z.number(), achievementSlug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        const ach = await db.select().from(achievements).where(eq(achievements.slug, input.achievementSlug)).limit(1);
        if (ach.length === 0) throw new Error("Achievement not found");
        const exists = await db.select().from(achievementUnlocks).where(and(eq(achievementUnlocks.clientId, input.clientId), eq(achievementUnlocks.achievementId, ach[0].id))).limit(1);
        if (exists.length > 0) return { success: true, alreadyUnlocked: true };
        await db.insert(achievementUnlocks).values({ achievementId: ach[0].id, clientId: input.clientId, notified: true });

        // Notify the client they unlocked something — in-app + push, best-effort
        const client = await getClientById(input.clientId);
        if (client?.email) {
          const recipientUser = await getUserByOpenId(`local:${client.email.toLowerCase()}`);
          if (recipientUser) {
            const title = `Achievement Unlocked: ${ach[0].name}`;
            const body = ach[0].description || "You've earned a new badge!";
            await db.insert(notifications).values({
              userId: recipientUser.id, trainerId: trainer.id, type: "achievement_unlock",
              title, body, data: JSON.stringify({ kind: "achievement", slug: ach[0].slug }), isRead: false,
            }).catch(() => {});
            await sendPushToUser(recipientUser.id, { title, body: `${ach[0].icon ?? "🏆"} ${body}`, data: { type: "achievement_unlock", slug: ach[0].slug } });
          }
        }
        return { success: true, alreadyUnlocked: false };
      }),
  }),

  // ── RETENTION / CHURN RISK ─────────────────────────────────────────────────
  retention: router({
    calculateRiskScores: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      const activeClients = await db.select().from(clients).where(and(eq(clients.trainerId, trainer.id), eq(clients.status, "active")));
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const updated: any[] = [];
      for (const client of activeClients) {
        const recentCheckIns = await db.select().from(checkIns).where(and(eq(checkIns.clientId, client.id), gte(checkIns.createdAt, thirtyDaysAgo)));
        const recentMessages = await db.select().from(messages).where(and(eq(messages.clientId, client.id), gte(messages.createdAt, thirtyDaysAgo))).orderBy(desc(messages.createdAt)).limit(1);
        const lastMsg = recentMessages[0];
        const daysSinceMsg = lastMsg ? Math.floor((now.getTime() - new Date(lastMsg.createdAt).getTime()) / 86400000) : 30;
        const missedCheckIns = Math.max(0, 4 - recentCheckIns.length); // expect weekly
        let score = 0;
        score += Math.min(40, missedCheckIns * 10);
        score += Math.min(30, daysSinceMsg * 2);
        score += recentCheckIns.length === 0 ? 20 : 0;
        const riskLevel = score < 30 ? "low" : score < 60 ? "medium" : "high";
        await db.insert(clientRiskScores).values({ clientId: client.id, trainerId: trainer.id, score, riskLevel, missedCheckIns, messageResponseDays: daysSinceMsg as any, lastCalculatedAt: now })
          .onDuplicateKeyUpdate({ set: { score, riskLevel, missedCheckIns, messageResponseDays: daysSinceMsg as any, lastCalculatedAt: now } });
        if (riskLevel !== "low") updated.push({ clientId: client.id, name: client.name, riskLevel, score });
      }
      const highRisk = updated.filter(c => c.riskLevel === "high");
      // Alert the trainer about newly-flagged high-risk clients — in-app + push, best-effort
      if (highRisk.length > 0) {
        const title = `${highRisk.length} client${highRisk.length > 1 ? "s" : ""} at high churn risk`;
        const body = highRisk.map(c => c.name).slice(0, 5).join(", ");
        await db.insert(notifications).values({
          userId: ctx.user.id, trainerId: trainer.id, type: "risk_alert",
          title, body, data: JSON.stringify({ kind: "risk_alert", clientIds: highRisk.map(c => c.clientId) }), isRead: false,
        }).catch(() => {});
        await sendPushToUser(ctx.user.id, { title, body, data: { type: "risk_alert" } });
      }
      return { updated: activeClients.length, highRisk };
    }),
    getRiskDashboard: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      return await db.select({ score: clientRiskScores, clientName: clients.name, clientEmail: clients.email })
        .from(clientRiskScores)
        .leftJoin(clients, eq(clientRiskScores.clientId, clients.id))
        .where(eq(clientRiskScores.trainerId, trainer.id))
        .orderBy(desc(clientRiskScores.score));
    }),
    getAtRiskClients: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      return await db.select({ score: clientRiskScores, clientName: clients.name, clientEmail: clients.email, clientId: clients.id })
        .from(clientRiskScores)
        .leftJoin(clients, eq(clientRiskScores.clientId, clients.id))
        .where(and(eq(clientRiskScores.trainerId, trainer.id), ne(clientRiskScores.riskLevel, "low")))
        .orderBy(desc(clientRiskScores.score));
    }),
  }),

  // ── NUTRITION ───────────────────────────────────────────────────────────────
  nutrition: router({
    generateGroceryList: protectedProcedure
      .input(z.object({ programId: z.number(), weekStartDate: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        const program = await getProgramById(input.programId);
        if (!program) throw new Error("Program not found");
        const content = program.content ? (typeof program.content === "string" ? JSON.parse(program.content) : program.content) : {};
        const meals = content?.days?.flatMap((d: any) => d.meals ?? []) ?? content?.meals ?? [];
        const prompt = `Extract a grocery shopping list from this meal plan. Return JSON array of {name: string, quantity: string, category: "proteins"|"produce"|"grains"|"dairy"|"pantry"|"other"}.
Meals: ${JSON.stringify(meals).slice(0, 3000)}`;
        const response = await invokeLLM({ messages: [{ role: "system", content: "You extract grocery lists from meal plans. Return valid JSON only." }, { role: "user", content: prompt }] });
        let items: any[] = [];
        const respContent = response.choices[0]?.message?.content;
        const respStr = typeof respContent === 'string' ? respContent : (Array.isArray(respContent) && respContent.length > 0 && 'text' in respContent[0] ? (respContent[0] as any).text ?? '[]' : '[]');
        try { items = JSON.parse(respStr); } catch { items = []; }
        const result = await db.insert(groceryLists).values({ programId: input.programId, clientId: program.clientId ?? 0, trainerId: trainer.id, items: JSON.stringify(items), weekStartDate: input.weekStartDate });
        return { id: (result as any).insertId, items };
      }),
    getGroceryList: protectedProcedure.input(z.object({ programId: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(groceryLists).where(eq(groceryLists.programId, input.programId)).orderBy(desc(groceryLists.createdAt)).limit(1);
      if (rows.length === 0) return null;
      return { ...rows[0], items: JSON.parse(rows[0].items) };
    }),
    addSubstitution: protectedProcedure
      .input(z.object({ primaryFood: z.string(), substituteFood: z.string(), caloriesMatch: z.boolean().default(true), proteinMatch: z.boolean().default(false), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        await db.insert(foodSubstitutions).values({ trainerId: trainer.id, primaryFood: input.primaryFood, substituteFood: input.substituteFood, caloriesMatch: input.caloriesMatch, proteinMatch: input.proteinMatch, notes: input.notes });
        return { success: true };
      }),
    getSubstitutions: protectedProcedure.input(z.object({ food: z.string() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) return [];
      return await db.select().from(foodSubstitutions).where(and(eq(foodSubstitutions.trainerId, trainer.id), like(foodSubstitutions.primaryFood, `%${input.food}%`)));
    }),
  }),

  // ── ANALYTICS ───────────────────────────────────────────────────────────────
  analytics: router({
    getRevenueSummary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { mrr: 0, arr: 0, avgClientValue: 0, activeClients: 0 };
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthRevRows = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(payments)
        .where(and(eq(payments.trainerId, trainer.id), eq(payments.status, "succeeded"), gte(payments.createdAt, monthStart)));
      const activeClientsRows = await db.select({ count: sql<number>`count(*)` }).from(clients)
        .where(and(eq(clients.trainerId, trainer.id), eq(clients.status, "active")));
      const mrr = parseFloat(monthRevRows[0]?.total ?? "0");
      const activeClients = Number(activeClientsRows[0]?.count ?? 0);
      const totalRevRows = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(payments).where(and(eq(payments.trainerId, trainer.id), eq(payments.status, "succeeded")));
      const totalRev = parseFloat(totalRevRows[0]?.total ?? "0");
      return { mrr, arr: mrr * 12, avgClientValue: activeClients > 0 ? totalRev / activeClients : 0, activeClients };
    }),
    getLeadFunnel: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, contacted: 0, qualified: 0, converted: 0 };
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      const allLeads = await db.select({ status: leads.status }).from(leads).where(eq(leads.trainerId, trainer.id));
      const total = allLeads.length;
      const contacted = allLeads.filter(l => ["contacted","qualified","converted"].includes(l.status ?? "")).length;
      const qualified = allLeads.filter(l => ["qualified","converted"].includes(l.status ?? "")).length;
      const converted = allLeads.filter(l => l.status === "converted").length;
      return {
        total, contacted, qualified, converted,
        contactedRate: total > 0 ? contacted / total : 0,
        qualifiedRate: total > 0 ? qualified / total : 0,
        conversionRate: total > 0 ? converted / total : 0,
      };
    }),
    getMonthlyRevenueHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const rows = await db.select({
        month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
        revenue: sql<string>`SUM(amount)`,
      }).from(payments)
        .where(and(eq(payments.trainerId, trainer.id), eq(payments.status, "succeeded"), gte(payments.createdAt, sixMonthsAgo)))
        .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);
      return rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue ?? "0") }));
    }),
  }),

  // ── AI (EXPANDED) ───────────────────────────────────────────────────────────
  // (these are added to the existing ai router via separate procedures at top level
  //  since modifying the existing ai block is complex — these are top-level aliases)
  aiCoach: router({
    analyzeCheckIn: protectedProcedure.input(z.object({ checkInId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      const checkInRows = await db.select().from(checkIns).where(eq(checkIns.id, input.checkInId)).limit(1);
      if (checkInRows.length === 0) throw new Error("Check-in not found");
      const ci = checkInRows[0];
      const clientRows = await db.select().from(clients).where(eq(clients.id, ci.clientId)).limit(1);
      const client = clientRows[0];
      const history = await db.select().from(checkIns).where(eq(checkIns.clientId, ci.clientId)).orderBy(desc(checkIns.createdAt)).limit(5);
      const weights = history.map(h => `${new Date(h.createdAt).toLocaleDateString()}: ${h.weight ?? "N/A"} lbs`).join(", ");
      const prompt = `Analyze this fitness check-in for ${client?.name ?? "Client"}.
Profile: age=${client?.age}, fitnessLevel=${client?.fitnessLevel}, goals=${client?.goals}
Latest: weight=${ci.weight} lbs, energy=${ci.energyLevel}/10, notes="${ci.notes}"
Weight history: ${weights}

Return JSON: {"summary":"2-3 sentences","concerns":["string"],"recommendations":["string"],"progressNote":"positive note for client"}`;
      const resp = await invokeLLM({ messages: [{ role: "system", content: "You are an expert fitness coach. Return valid JSON only." }, { role: "user", content: prompt }] });
      let analysis: any = {};
      const respContent = typeof resp.choices[0]?.message?.content === 'string' ? resp.choices[0].message.content : JSON.stringify(resp.choices[0]?.message?.content ?? "{}");
      try { analysis = JSON.parse(respContent); } catch { analysis = { summary: respContent, concerns: [], recommendations: [] }; }
      await db.insert(aiSummaries).values({ clientId: ci.clientId, trainerId: trainer.id, summaryType: "check_in", content: JSON.stringify(analysis), sourceId: ci.id });
      await db.update(checkIns).set({ aiAnalysis: analysis.progressNote ?? "" }).where(eq(checkIns.id, ci.id));
      return analysis;
    }),
    generateProgramProgression: protectedProcedure.input(z.object({ clientId: z.number(), currentProgramId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const client = await getClientById(input.clientId);
      if (!client) throw new Error("Client not found");
      const program = await getProgramById(input.currentProgramId);
      if (!program) throw new Error("Program not found");
      const recentCheckIns = await db.select().from(checkIns).where(eq(checkIns.clientId, input.clientId)).orderBy(desc(checkIns.createdAt)).limit(4);
      const weightTrend = recentCheckIns.map(c => `${new Date(c.createdAt).toLocaleDateString()}: ${c.weight} lbs, energy ${c.energyLevel}/10`).join("; ");
      const content = program.content ? JSON.parse(program.content) : {};
      const prompt = `Generate a program progression for ${client.name} (${client.fitnessLevel}, goal: ${client.goals}).
Current program: ${program.name}. Recent check-ins: ${weightTrend}
Return JSON: {"weeklyAdjustments":["string"],"loadIncreases":["exercise: change"],"exerciseChanges":["swap or modify"],"rationale":"string"}`;
      const resp = await invokeLLM({ messages: [{ role: "system", content: "You are an expert strength coach. Return valid JSON only." }, { role: "user", content: prompt }] });
      let progression: any = {};
      const respContent = typeof resp.choices[0]?.message?.content === 'string' ? resp.choices[0].message.content : JSON.stringify(resp.choices[0]?.message?.content ?? "{}");
      try { progression = JSON.parse(respContent); } catch { progression = { rationale: respContent }; }
      await db.insert(aiSummaries).values({ clientId: input.clientId, trainerId: (await getTrainerByUserId(ctx.user.id))!.id, summaryType: "program_progression", content: JSON.stringify(progression), sourceId: input.currentProgramId });
      return progression;
    }),
    generateNutritionAdjustment: protectedProcedure.input(z.object({ clientId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const client = await getClientById(input.clientId);
      if (!client) throw new Error("Client not found");
      const recentCheckIns = await db.select().from(checkIns).where(eq(checkIns.clientId, input.clientId)).orderBy(desc(checkIns.createdAt)).limit(4);
      const weights = recentCheckIns.map(c => parseFloat(c.weight?.toString() ?? "0")).filter(w => w > 0);
      const weightTrend = weights.length >= 2 ? weights[0] - weights[weights.length - 1] : 0;
      const daySpan = recentCheckIns.length >= 2 ? (new Date(recentCheckIns[0].createdAt).getTime() - new Date(recentCheckIns[recentCheckIns.length - 1].createdAt).getTime()) / 86400000 : 0;
      const prompt = `Generate a nutrition adjustment for ${client.name}.
Goal: ${client.goals}, current calories: ${client.dailyCalorieTarget ?? "unknown"}.
Weight trend: ${weightTrend >= 0 ? "+" : ""}${weightTrend.toFixed(1)} lbs over ${Math.round(daySpan)} days.
Macros: protein ${client.proteinTargetG}g, carbs ${client.carbsTargetG}g, fat ${client.fatTargetG}g.
Return JSON: {"calories":number_change,"proteinG":number_change,"carbsG":number_change,"rationale":"string","timeline":"string","foodSuggestions":["string"]}`;
      const resp = await invokeLLM({ messages: [{ role: "system", content: "You are an expert nutritionist. Return valid JSON only." }, { role: "user", content: prompt }] });
      let adjustment: any = {};
      try { const content = resp.choices[0]?.message?.content; const contentStr = typeof content === 'string' ? content : JSON.stringify(content); adjustment = JSON.parse(contentStr ?? "{}"); } catch { const content = resp.choices[0]?.message?.content; adjustment = { rationale: typeof content === 'string' ? content : JSON.stringify(content) }; }
      await db.insert(aiSummaries).values({ clientId: input.clientId, trainerId: (await getTrainerByUserId(ctx.user.id))!.id, summaryType: "nutrition_adjustment", content: JSON.stringify(adjustment) });
      return adjustment;
    }),
    assistant: protectedProcedure.input(z.object({ prompt: z.string(), clientId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      let context = "";
      if (input.clientId) {
        const client = await getClientById(input.clientId);
        if (client) context = `Context — Client: ${client.name}, ${client.age}yo ${client.sex}, ${client.fitnessLevel}, goals: ${client.goals}. `;
      }
      const resp = await invokeLLM({ messages: [
        { role: "system", content: "You are Justin Watson's AI coaching assistant for W.A.R. Coaching. Be direct, tactical, results-focused. Help with program design, client analysis, and coaching decisions." },
        { role: "user", content: context + input.prompt }
      ]});
      return { response: resp.choices[0]?.message?.content ?? "" };
    }),
    generateWeeklySummary: protectedProcedure.mutation(async ({ ctx }) => {
      const trainer = await getTrainerByUserId(ctx.user.id);
      if (!trainer) throw new Error("Trainer not found");
      return await generateWeeklySummaryForTrainer(trainer.id);
    }),
  }),

  // ── MACRO TARGETS (added to clients router via alias) ──────────────────────
  clientMacros: router({
    update: protectedProcedure
      .input(z.object({ clientId: z.number(), dailyCalorieTarget: z.number().optional(), proteinTargetG: z.number().optional(), carbsTargetG: z.number().optional(), fatTargetG: z.number().optional(), fiberTargetG: z.number().optional(), waterTargetOz: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const trainer = await getTrainerByUserId(ctx.user.id);
        if (!trainer) throw new Error("Trainer not found");
        const client = await getClientById(input.clientId);
        if (!client || client.trainerId !== trainer.id) throw new Error("Client not found");
        const updateData: any = {};
        if (input.dailyCalorieTarget !== undefined) updateData.dailyCalorieTarget = input.dailyCalorieTarget;
        if (input.proteinTargetG !== undefined) updateData.proteinTargetG = input.proteinTargetG;
        if (input.carbsTargetG !== undefined) updateData.carbsTargetG = input.carbsTargetG;
        if (input.fatTargetG !== undefined) updateData.fatTargetG = input.fatTargetG;
        if (input.fiberTargetG !== undefined) updateData.fiberTargetG = input.fiberTargetG;
        if (input.waterTargetOz !== undefined) updateData.waterTargetOz = input.waterTargetOz;
        await db.update(clients).set(updateData).where(eq(clients.id, input.clientId));
        return { success: true };
      }),
    get: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client) throw new Error("Client not found");
      return { dailyCalorieTarget: client.dailyCalorieTarget, proteinTargetG: client.proteinTargetG, carbsTargetG: client.carbsTargetG, fatTargetG: client.fatTargetG, fiberTargetG: client.fiberTargetG, waterTargetOz: client.waterTargetOz };
    }),
    getMyTargets: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const clientRows = await db.select().from(clients).where(eq(clients.email, ctx.user.email || "")).limit(1);
      if (clientRows.length === 0) return null;
      const c = clientRows[0];
      return { dailyCalorieTarget: c.dailyCalorieTarget, proteinTargetG: c.proteinTargetG, carbsTargetG: c.carbsTargetG, fatTargetG: c.fatTargetG, fiberTargetG: c.fiberTargetG, waterTargetOz: c.waterTargetOz };
    }),
  }),
});
export type AppRouter = typeof appRouter;
