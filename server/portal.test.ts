import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createClientContext(email = "client@example.com"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "client-open-id",
    email,
    name: "Test Client",
    loginMethod: "manus",
    role: "user",
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

describe("portal router", () => {
  describe("portal.getMyProfile", () => {
    it("returns null when no client profile matches the user email", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyProfile();
      // Should return null since no client exists with this email
      expect(result).toBeNull();
    });

    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.portal.getMyProfile()).rejects.toThrow();
    });
  });

  describe("portal.getMyPrograms", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyPrograms();
      expect(result).toEqual([]);
    });

    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.portal.getMyPrograms()).rejects.toThrow();
    });
  });

  describe("portal.getMyMealPlans", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyMealPlans();
      expect(result).toEqual([]);
    });
  });

  describe("portal.getMyCheckIns", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyCheckIns();
      expect(result).toEqual([]);
    });
  });

  describe("portal.submitCheckIn", () => {
    it("throws error when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.submitCheckIn({
          weight: "180",
          energyLevel: 7,
          notes: "Feeling good this week",
        })
      ).rejects.toThrow("Client profile not found");
    });

    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.submitCheckIn({
          weight: "180",
          energyLevel: 7,
          notes: "Feeling good",
        })
      ).rejects.toThrow();
    });
  });

  describe("portal.getMyMessages", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyMessages();
      expect(result).toEqual([]);
    });
  });

  describe("portal.sendMessage", () => {
    it("throws error when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.sendMessage({ content: "Hello trainer!" })
      ).rejects.toThrow("Client profile not found");
    });

    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.sendMessage({ content: "Hello" })
      ).rejects.toThrow();
    });
  });

  describe("portal.getMyProgress", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMyProgress();
      expect(result).toEqual([]);
    });
  });

  describe("portal.getMySessions", () => {
    it("returns empty array when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.portal.getMySessions();
      expect(result).toEqual([]);
    });
  });

  describe("portal.uploadPhoto", () => {
    it("throws error when no client profile exists", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.uploadPhoto({
          pose: "front",
          photoData: "dGVzdA==", // base64 of "test"
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow("Client profile not found");
    });

    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.uploadPhoto({
          pose: "back",
          photoData: "dGVzdA==",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow();
    });

    it("validates pose enum values", async () => {
      const ctx = createClientContext("nonexistent@example.com");
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.portal.uploadPhoto({
          pose: "invalid_pose" as any,
          photoData: "dGVzdA==",
          mimeType: "image/jpeg",
        })
      ).rejects.toThrow();
    });
  });
});
