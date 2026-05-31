import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
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
import { clients, programs, checkIns, messages, sessions, packages, subscriptions, leads, referrals, trainers, progressMetrics, consultations } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { InsertClient } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
});

export type AppRouter = typeof appRouter;
