import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { initSentryServer } from "./sentry";
import * as Sentry from "@sentry/node";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Initialize Sentry (if configured)
  try {
    initSentryServer();
    if ((Sentry as any).getCurrentHub && (Sentry as any).getCurrentHub().getClient()) {
      app.use((Sentry as any).Handlers.requestHandler());
    }
  } catch (err) {
    console.warn("Sentry init failed:", err);
  }
  // In production ensure required environment variables are present
  if (process.env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!ENV.forgeApiKey) missing.push("FORGE_API_KEY");
    if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for production: ${missing.join(", ")}`);
    }
  }
  // Register Stripe webhook BEFORE body parsers (needs raw body)
  const { registerStripeRoutes } = await import("../stripe");
  registerStripeRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Generator endpoints
  // Health endpoint for readiness checks (returns DB availability)
  app.get("/health", async (_req, res) => {
    try {
      const db = await getDb();
      const dbAvailable = !!db;

      // Storage health: try presign if forge config present
      const storageConfigured = !!(ENV.forgeApiUrl && ENV.forgeApiKey);
      let storageOk = false;
      if (storageConfigured) {
        try {
          const presignUrl = new URL("v1/storage/presign/put", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
          presignUrl.searchParams.set("path", `health-check-${Date.now()}.txt`);
          const presignResp = await fetch(presignUrl.toString(), {
            headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
            method: "GET",
          });
          storageOk = presignResp.ok;
        } catch (err) {
          console.error("Storage health check failed:", err);
          storageOk = false;
        }
      }

      // LLM configured flag
      const llmConfigured = !!ENV.forgeApiKey;

      res.json({ ok: true, db: dbAvailable, storage: storageConfigured ? storageOk : "not_configured", llm: llmConfigured });
    } catch (err) {
      console.error("Health check failed:", err);
      res.status(500).json({ ok: false });
    }
  });

  app.post("/api/generate-exercises", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt required" });
      const { generateExercises } = await import("../generators");
      const result = await generateExercises(prompt);
      res.json(result);
    } catch (error) {
      console.error("Exercise generation error:", error);
      res.status(500).json({ error: "Failed to generate exercises" });
    }
  });
  
  app.post("/api/generate-nutrition", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt required" });
      const { generateNutrition } = await import("../generators");
      const result = await generateNutrition(prompt);
      res.json(result);
    } catch (error) {
      console.error("Nutrition generation error:", error);
      res.status(500).json({ error: "Failed to generate nutrition" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Sentry error handler (should be after all routes)
  try {
    if ((Sentry as any).getCurrentHub && (Sentry as any).getCurrentHub().getClient()) {
      app.use((Sentry as any).Handlers.errorHandler());
    }
  } catch (err) {
    console.warn("Sentry error handler setup failed:", err);
  }
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
