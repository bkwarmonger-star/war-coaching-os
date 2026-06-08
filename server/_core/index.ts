import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { ENV } from "./env";
import { loginLimiter, signupLimiter, messagingLimiter, uploadLimiter, generalApiLimiter } from "../rateLimiter";
import { startScheduler } from "../scheduler";

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
  // Sentry initialization removed - not critical for MVP
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

  // Rate limiting — applied before tRPC handler
  app.use("/api/trpc/auth.clientLogin", loginLimiter);
  app.use("/api/trpc/auth.clientRegister", signupLimiter);
  app.use("/api/trpc/forgotPassword", loginLimiter);
  app.use("/api/trpc/messages.send", messagingLimiter);
  app.use("/api/trpc/portal.sendMessage", messagingLimiter);
  app.use("/api/storage", uploadLimiter);
  app.use("/api/trpc", generalApiLimiter);

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
      
      console.log("[Nutrition Generator] Starting with prompt:", prompt.substring(0, 50));
      const { generateNutrition } = await import("../generators");
      const result = await generateNutrition(prompt);
      
      if (!result || !result.meals) {
        console.error("[Nutrition Generator] Invalid response:", result);
        return res.status(500).json({ error: "Invalid response from generator" });
      }
      
      console.log("[Nutrition Generator] Success, returning", result.meals.length, "meals");
      res.json(result);
    } catch (error) {
      console.error("[Nutrition Generator] Error:", error instanceof Error ? error.message : error);
      if (error instanceof Error) {
        console.error("[Nutrition Generator] Stack:", error.stack);
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate nutrition" });
    }
  });
  
  // Static HTML client profile endpoint
  app.get("/client-profile/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) return res.status(400).send("Invalid client ID");
      
      const { getClientById, getProgramsByClient, getCheckInsByClient } = await import("../db");
      const client = await getClientById(clientId);
      if (!client) return res.status(404).send("Client not found");
      
      const programs = await getProgramsByClient(clientId);
      const currentProgram = programs[0];
      let exercises = [];
      let meals = [];
      
      if (currentProgram?.content) {
        try {
          const parsed = typeof currentProgram.content === "string" ? JSON.parse(currentProgram.content) : currentProgram.content;
          exercises = parsed.exercises || [];
          meals = parsed.meals || [];
        } catch (e) {}
      }
      
      const checkIns = await getCheckInsByClient(clientId);
      const recentCheckIns = checkIns.slice(0, 5);
      
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${client.name} - W.A.R. Coaching</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Rajdhani,sans-serif;background:#0a0a0a;color:#e0e0e0}html,body{width:100%;height:100%}.container{max-width:1200px;margin:0 auto;padding:2rem}.header{background:linear-gradient(135deg,#1a1a1a,#2a2a2a);padding:2rem;border-bottom:2px solid #d4af37;margin-bottom:2rem;border-radius:8px}.header h1{font-family:Bebas Neue,sans-serif;font-size:2.5rem;color:#d4af37;margin-bottom:.5rem}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem}.stat-card{background:#1a1a1a;padding:1.5rem;border-left:4px solid #d4af37;border-radius:4px}.stat-label{font-size:.85rem;color:#999;text-transform:uppercase}.stat-value{font-size:1.8rem;color:#d4af37;font-weight:bold;margin-top:.5rem}.section{background:#1a1a1a;padding:2rem;margin-bottom:2rem;border-radius:8px;border:1px solid #333}.section h2{font-family:Oswald,sans-serif;font-size:1.5rem;color:#d4af37;margin-bottom:1.5rem;text-transform:uppercase;border-bottom:2px solid #d4af37;padding-bottom:.5rem}.item{background:#0a0a0a;padding:1rem;margin-bottom:1rem;border-left:3px solid #d4af37;border-radius:4px}.item strong{color:#d4af37}.item .details{font-size:.9rem;color:#999;margin-top:.5rem}.empty{color:#666;font-style:italic}footer{text-align:center;padding:2rem;color:#666;border-top:1px solid #333;margin-top:3rem}</style></head><body><div class="container"><div class="header"><h1>${client.name}</h1><p>W.A.R. Coaching OS - Client Profile</p></div><div class="stats"><div class="stat-card"><div class="stat-label">Weight</div><div class="stat-value">${client.weight || 'N/A'} lbs</div></div><div class="stat-card"><div class="stat-label">Height</div><div class="stat-value">${client.height || 'N/A'}"</div></div><div class="stat-card"><div class="stat-label">Age</div><div class="stat-value">${client.age || 'N/A'}</div></div></div>${currentProgram ? `<div class="section"><h2>${currentProgram.name}</h2><h3 style="color:#d4af37;margin-bottom:1rem">Exercises</h3>${exercises.length > 0 ? exercises.map((e: any) => `<div class="item"><strong>${e.name}</strong><div class="details">${e.sets}x${e.reps} | Rest: ${e.rest || 60}s</div></div>`).join('') : '<p class="empty">No exercises</p>'}<h3 style="color:#d4af37;margin-top:2rem;margin-bottom:1rem">Meals</h3>${meals.length > 0 ? meals.map((m: any) => `<div class="item"><strong>${m.timing || 'Meal'}</strong><div class="details">${m.description || 'Custom meal'}</div></div>`).join('') : '<p class="empty">No meals</p>'}</div>` : '<p class="empty">No program assigned</p>'}${recentCheckIns.length > 0 ? `<div class="section"><h2>Recent Check-Ins</h2>${recentCheckIns.map((c) => `<div class="item"><strong>${new Date(c.createdAt).toLocaleDateString()}</strong><div class="details">Weight: ${c.weight || 'N/A'} | Energy: ${c.energyLevel || 'N/A'}</div></div>`).join('')}</div>` : ''}<footer><p>W.A.R. Coaching OS &copy; 2026</p></footer></div></body></html>`;
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).send("Error loading profile");
    }
  });
  
  // PDF Download endpoints
  app.get("/api/export/workout/:programId", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      if (isNaN(programId)) return res.status(400).json({ error: "Invalid program ID" });
      
      const { getDb } = await import("../db");
      const { programs } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { generateWorkoutPDF } = await import("../pdfGenerator");
      
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });
      
      const result = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
      if (result.length === 0) return res.status(404).json({ error: "Program not found" });
      
      const programData = result[0];
      const content = typeof programData.content === "string" ? JSON.parse(programData.content) : programData.content;
      
      const pdfStream = generateWorkoutPDF({
        name: programData.name,
        description: programData.description || "",
        programType: programData.programType,
        duration: programData.duration || 0,
        exercises: content?.exercises || [],
        meals: content?.meals || [],
      });
      
      const filename = `${programData.name.replace(/\s+/g, "_")}_workout.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Workout PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  
  app.get("/api/export/meal-plan/:programId", async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      if (isNaN(programId)) return res.status(400).json({ error: "Invalid program ID" });
      
      const { getDb } = await import("../db");
      const { programs } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { generateMealPlanPDF } = await import("../pdfGenerator");
      
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });
      
      const result = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
      if (result.length === 0) return res.status(404).json({ error: "Program not found" });
      
      const programData = result[0];
      const content = typeof programData.content === "string" ? JSON.parse(programData.content) : programData.content;
      
      const pdfStream = generateMealPlanPDF(
        content?.meals || [],
        programData.name
      );
      
      const filename = `${programData.name.replace(/\s+/g, "_")}_meal_plan.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Meal plan PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  
  // Client signup endpoint
  app.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const { name, email, password, phone, age } = req.body;
      
      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      const db = await getDb();
      if (!db) return res.status(500).json({ message: "Database unavailable" });
      
      const { users, clients, localAuth } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const bcrypt = await import("bcryptjs");
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.default.hash(password, 10);
      
      // Create user
      const newUserResult = await db.insert(users).values({
        email,
        name,
        role: "user",
        emailVerified: false,
        loginMethod: "local",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const userId = (newUserResult as any).insertId || (newUserResult as any)[0]?.id;
      
      // Create local auth record
      await db.insert(localAuth).values({
        userId: userId as number,
        email,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      });
      
      // Create client profile
      await db.insert(clients).values({
        userId: userId as number,
        name,
        email,
        phone: phone || null,
        age: age ? Number(age) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      res.status(201).json({ message: "Account created successfully", userId });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
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

  // Sentry error handler removed - not critical for MVP
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

  // Background jobs (weekly AI coach summary auto-generation, etc.)
  startScheduler();
}

startServer().catch(console.error);
