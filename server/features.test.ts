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

function createUnauthContext(): TrpcContext {
  return {
    user: null,
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
  describe("Router Structure", () => {
    it("should have all required routers defined", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.auth).toBeDefined();
      expect(caller.clients).toBeDefined();
      expect(caller.programs).toBeDefined();
      expect(caller.exercises).toBeDefined();
      expect(caller.meals).toBeDefined();
      expect(caller.checkIns).toBeDefined();
      expect(caller.messages).toBeDefined();
      expect(caller.sessions).toBeDefined();
      expect(caller.revenue).toBeDefined();
      expect(caller.leads).toBeDefined();
      expect(caller.trainer).toBeDefined();
      expect(caller.progress).toBeDefined();
      expect(caller.consultations).toBeDefined();
    });

    it("should have client CRUD procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.clients.list).toBeDefined();
      expect(caller.clients.create).toBeDefined();
      expect(caller.clients.update).toBeDefined();
      expect(caller.clients.get).toBeDefined();
      expect(caller.clients.search).toBeDefined();
    });

    it("should have programs procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.programs.list).toBeDefined();
      expect(caller.programs.create).toBeDefined();
      expect(caller.programs.get).toBeDefined();
      expect(caller.programs.assign).toBeDefined();
    });

    it("should have AI generator procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.exercises.generate).toBeDefined();
      expect(caller.meals.generate).toBeDefined();
    });

    it("should have messaging procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.messages.send).toBeDefined();
      expect(caller.messages.getThread).toBeDefined();
      expect(caller.messages.getUnreadCount).toBeDefined();
    });

    it("should have scheduling procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.sessions.list).toBeDefined();
      expect(caller.sessions.create).toBeDefined();
      expect(caller.sessions.getUpcoming).toBeDefined();
    });

    it("should have revenue procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.revenue.createPackage).toBeDefined();
      expect(caller.revenue.getMonthlyRevenue).toBeDefined();
      expect(caller.revenue.getPackages).toBeDefined();
    });

    it("should have leads procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.leads.list).toBeDefined();
      expect(caller.leads.create).toBeDefined();
      expect(caller.leads.get).toBeDefined();
    });

    it("should have progress tracking procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.progress.getClientMetrics).toBeDefined();
      expect(caller.progress.createMetric).toBeDefined();
    });

    it("should have consultations procedures", () => {
      const caller = appRouter.createCaller(createAuthContext());
      expect(caller.consultations.list).toBeDefined();
      expect(caller.consultations.book).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should return user from auth.me when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.email).toBe("trainer@example.com");
      expect(result?.name).toBe("Test Trainer");
    });

    it("should return null from auth.me when unauthenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("should clear cookie on logout", async () => {
      const clearedCookies: string[] = [];
      const ctx: TrpcContext = {
        user: {
          id: 1,
          openId: "test",
          email: "test@test.com",
          name: "Test",
          loginMethod: "manus",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {
          clearCookie: (name: string) => { clearedCookies.push(name); },
        } as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
      expect(clearedCookies.length).toBe(1);
    });
  });

  describe("Input Validation", () => {
    it("should reject client creation with invalid email", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.clients.create({
          name: "Test Client",
          email: "not-an-email",
        })
      ).rejects.toThrow();
    });

    it("should reject client creation without name", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        (caller.clients.create as any)({})
      ).rejects.toThrow();
    });

    it("should reject invalid fitness level", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.clients.create({
          name: "Test",
          fitnessLevel: "superhuman" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject invalid training type", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.clients.create({
          name: "Test",
          trainingType: "teleportation" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject invalid sex value", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.clients.create({
          name: "Test",
          sex: "invalid" as any,
        })
      ).rejects.toThrow();
    });
  });
});
