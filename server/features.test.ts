import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-trainer",
    email: "trainer@example.com",
    name: "Test Trainer",
    loginMethod: "manus",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("W.A.R. Coaching OS - Feature Tests", () => {
  describe("Clients Management", () => {
    it("should create a new client", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.create({
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        sex: "male",
        weight: "185",
        height: "72",
        goals: ["Build muscle", "Increase strength"],
        injuries: [],
        fitnessLevel: "intermediate",
        trainingType: "in-person",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
      expect(result.age).toBe(30);
      expect(result.fitnessLevel).toBe("intermediate");
    });

    it("should list clients for trainer", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list({ limit: 100, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Programs Management", () => {
    it("should create an exercise program", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.programs.create({
        name: "12-Week Strength Building",
        description: "Progressive strength training program",
        programType: "exercise",
        duration: 12,
        content: JSON.stringify({
          weeks: [
            {
              week: 1,
              focus: "Foundation",
              exercises: ["Squats", "Bench Press", "Deadlifts"],
            },
          ],
        }),
        isTemplate: true,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("12-Week Strength Building");
      expect(result.programType).toBe("exercise");
      expect(result.duration).toBe(12);
    });

    it("should list programs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.programs.list({ limit: 100, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("AI Exercise Generator", () => {
    it("should generate exercise program from client profile", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateExerciseProgram({
        clientId: 1,
        age: 30,
        sex: "male",
        weight: 185,
        height: 72,
        goals: ["Build muscle", "Increase strength"],
        injuries: [],
        fitnessLevel: "intermediate",
        trainingType: "in-person",
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe("string");
    });
  });

  describe("AI Meal Plan Generator", () => {
    it("should generate meal plan from dietary preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateMealPlan({
        clientId: 1,
        dailyCalories: 2500,
        dietaryRestrictions: [],
        allergies: [],
        preferences: ["chicken", "rice", "vegetables"],
        mealsPerDay: 3,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });

  describe("Check-Ins Management", () => {
    it("should create a client check-in", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.checkIns.create({
        clientId: 1,
        weight: 180,
        energyLevel: "high",
        notes: "Feeling great this week",
        photoUrl: "https://example.com/photo.jpg",
      });

      expect(result).toBeDefined();
      expect(result.weight).toBe(180);
      expect(result.energyLevel).toBe("high");
    });

    it("should list check-ins for trainer", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.checkIns.list({ limit: 50, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Messaging System", () => {
    it("should send a message", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.messages.send({
        recipientId: 2,
        content: "Great work this week!",
      });

      expect(result).toBeDefined();
      expect(result.content).toBe("Great work this week!");
    });

    it("should list conversation messages", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.messages.list({ userId: 2, limit: 50, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Scheduling System", () => {
    it("should create a session", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);

      const result = await caller.sessions.create({
        clientId: 1,
        startTime,
        endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
        type: "training",
        notes: "Strength training session",
      });

      expect(result).toBeDefined();
      expect(result.type).toBe("training");
    });

    it("should list sessions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sessions.list({ limit: 50, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Revenue Tracking", () => {
    it("should create a package", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.revenue.createPackage({
        name: "12-Week Transformation",
        description: "Complete 12-week training and nutrition program",
        price: 1200,
        sessions: 24,
        duration: 12,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("12-Week Transformation");
      expect(result.price).toBe(1200);
    });

    it("should get revenue stats", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.revenue.getStats();

      expect(result).toBeDefined();
      expect(typeof result.totalRevenue).toBe("number");
      expect(typeof result.activeClients).toBe("number");
    });
  });

  describe("Leads Management", () => {
    it("should create a lead", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.create({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "555-1234",
        source: "referral",
        status: "new",
        notes: "Referred by John Doe",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Jane Smith");
      expect(result.status).toBe("new");
    });

    it("should list leads", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.list({ limit: 50, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Trainer Profile", () => {
    it("should get trainer profile", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trainer.getProfile();

      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it("should update trainer profile", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trainer.updateProfile({
        bio: "Certified strength and conditioning coach",
        qualifications: ["NASM-CPT", "Nutrition Specialist"],
        specialties: ["Strength Training", "Fat Loss"],
      });

      expect(result).toBeDefined();
      expect(result.bio).toBe("Certified strength and conditioning coach");
    });
  });

  describe("Authentication", () => {
    it("should get current user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.role).toBe("admin");
    });

    it("should logout user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });
});
