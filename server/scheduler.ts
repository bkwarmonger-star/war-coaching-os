/**
 * Lightweight in-process scheduler — no node-cron dependency required.
 *
 * Currently runs one job: weekly AI coach summary auto-generation.
 * Every trainer gets a fresh "Monday morning" summary generated automatically
 * once per week. We use a polling `setInterval` (checked hourly) rather than a
 * true cron expression to avoid adding new npm dependencies — the job simply
 * checks "has this trainer already received a summary for the current ISO week?"
 * and generates one if not. This makes it safe to run on any cadence: it will
 * never double-generate within the same week thanks to the upsert in
 * `generateWeeklySummaryForTrainer`.
 */
import { getDb } from "./db";
import { trainers, weeklyCoachSummaries } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateWeeklySummaryForTrainer } from "./routers";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly poll
let timer: ReturnType<typeof setInterval> | null = null;

function currentWeekStartStr(): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  return weekStart.toISOString().slice(0, 10);
}

/**
 * Generates this week's AI coach summary for any trainer that doesn't have one yet.
 * Safe to call repeatedly — it's a no-op for trainers already covered this week.
 */
export async function runWeeklySummaryCheck(): Promise<{ checked: number; generated: number }> {
  const db = await getDb();
  if (!db) return { checked: 0, generated: 0 };

  const weekStartStr = currentWeekStartStr();
  // Only bother running the (LLM-backed) generation job on Mondays, or for any
  // trainer who is missing this week's summary (covers restarts/missed windows).
  const allTrainers = await db.select({ id: trainers.id }).from(trainers);
  let generated = 0;

  for (const t of allTrainers) {
    try {
      const existing = await db.select({ id: weeklyCoachSummaries.id })
        .from(weeklyCoachSummaries)
        .where(and(eq(weeklyCoachSummaries.trainerId, t.id), eq(weeklyCoachSummaries.weekStartDate, weekStartStr)))
        .limit(1);
      if (existing.length > 0) continue;

      // Only auto-generate on/after Monday of the current week (don't pre-generate early)
      const now = new Date();
      const isMondayOrLater = now.getDay() !== 0; // Sunday = 0; everything else is Mon-Sat of the current ISO week
      if (!isMondayOrLater) continue;

      await generateWeeklySummaryForTrainer(t.id);
      generated++;
      console.log(`[Scheduler] Generated weekly coach summary for trainer #${t.id} (week of ${weekStartStr})`);
    } catch (err) {
      console.error(`[Scheduler] Failed to generate weekly summary for trainer #${t.id}:`, err);
    }
  }

  return { checked: allTrainers.length, generated };
}

/**
 * Starts the background scheduler. Call once at server boot.
 * Runs an initial check shortly after startup, then polls hourly.
 */
export function startScheduler() {
  if (timer) return; // already running

  // Run shortly after boot (give the DB connection pool time to warm up)
  setTimeout(() => {
    runWeeklySummaryCheck().catch(err => console.error("[Scheduler] Initial weekly summary check failed:", err));
  }, 30 * 1000);

  timer = setInterval(() => {
    runWeeklySummaryCheck().catch(err => console.error("[Scheduler] Weekly summary check failed:", err));
  }, CHECK_INTERVAL_MS);

  console.log("[Scheduler] Background scheduler started (weekly coach summary auto-generation, hourly poll)");
}

export function stopScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
