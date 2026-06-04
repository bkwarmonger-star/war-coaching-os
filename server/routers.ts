import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./passwordUtils";
import { ISSA_FORMS } from "./issaForms";
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
import { clients, programs, checkIns, messages, sessions, packages, subscriptions, leads, referrals, trainers, progressMetrics, consultations, localAuth, formTemplates, formSubmissions } from "../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { InsertClient } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { generateWorkoutPDF, generateMealPlanPDF } from "./pdfGenerator";

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
        const token = await sdk.signSession({ openId, appId: "war-coaching-os", name: input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

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
        const token = await sdk.signSession({ openId: user.openId, appId: "war-coaching-os", name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, name: user.name };
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
        responses: z.record(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");

        // Get or auto-create template
        let templateId = 0;
        let tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug))
        if (tRows.length === 0) {
          const formDef = ISSA_FORMS.find(f => f.slug === input.formSlug);
          if (formDef) {
            await db.insert(formTemplates).values({ slug: formDef.slug, name: formDef.name, description: formDef.description, category: formDef.category, fields: JSON.stringify(formDef.fields), isClientFacing: formDef.isClientFacing, isRequired: formDef.isRequired, sortOrder: formDef.sortOrder }).catch(() => {});
            tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug))
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
        responses: z.record(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");

        let templateId = 0;
        let tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug))
        if (tRows.length === 0) {
          const formDef = ISSA_FORMS.find(f => f.slug === input.formSlug);
          if (formDef) {
            await db.insert(formTemplates).values({ slug: formDef.slug, name: formDef.name, description: formDef.description, category: formDef.category, fields: JSON.stringify(formDef.fields), isClientFacing: formDef.isClientFacing, isRequired: formDef.isRequired, sortOrder: formDef.sortOrder }).catch(() => {});
            tRows = await db.select().from(formTemplates).where(eq(formTemplates.slug, input.formSlug))
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
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
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

        return { success: true, messageId: (result as any).insertId };
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
      const result = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
      return result.length > 0 ? result[0] : null;
    }),
    // Get my assigned programs
    getMyPrograms: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
      if (client.length === 0) return [];
      return await db.select().from(programs).where(eq(programs.clientId, client[0].id)).orderBy(desc(programs.createdAt));
    }),
    // Get my meal plans (nutrition programs)
    getMyMealPlans: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
      if (client.length === 0) return [];
      return await db.select().from(programs).where(and(eq(programs.clientId, client[0].id), eq(programs.programType, "nutrition"))).orderBy(desc(programs.createdAt));
    }),
    // Get my check-in history
    getMyCheckIns: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
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
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
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
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
      if (client.length === 0) return [];
      return await db.select().from(messages).where(eq(messages.clientId, client[0].id)).orderBy(messages.createdAt);
    }),
    // Send message to trainer
    sendMessage: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
        const result = await db.insert(messages).values({
          trainerId: client[0].trainerId,
          clientId: client[0].id,
          senderId: ctx.user.id,
          content: input.content,
          isRead: false,
        });
        return { success: true, messageId: (result as any)[0].insertId };
      }),
    // Get my progress metrics
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
      if (client.length === 0) return [];
      return await db.select().from(progressMetrics).where(eq(progressMetrics.clientId, client[0].id)).orderBy(desc(progressMetrics.createdAt));
    }),
    // Get my upcoming sessions
    getMySessions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
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
        if (!db) throw new Error("Database not available");
        // Validate base64 data
        const buffer = Buffer.from(input.photoData, "base64");
        if (buffer.length === 0) throw new Error("Invalid photo data");
        // Enforce 10MB limit server-side
        if (buffer.length > 10 * 1024 * 1024) throw new Error("Photo exceeds 10MB size limit");
        const client = await db.select().from(clients).where(eq(clients.email, ctx.user.email || ""))
        if (client.length === 0) throw new Error("Client profile not found. Contact your trainer.");
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
        
        const pdfStream = generateMealPlanPDF(
          content?.meals || [],
          programData.name
        );
        
        return { pdfStream, filename: `${programData.name.replace(/\s+/g, "_")}_meal_plan.pdf` };
      }),
  }),
});
export type AppRouter = typeof appRouter;
