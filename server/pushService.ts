// Lightweight push-notification delivery — no extra npm dependencies.
// Uses fetch() (built into Node 18+) against Firebase Cloud Messaging's
// legacy HTTP API for Android/iOS/Web tokens registered via notifications.registerPushToken.
//
// Configure with FCM_SERVER_KEY (from the Firebase console → Project Settings → Cloud Messaging).
// If not configured, pushes are logged to the console so the app keeps working without it.

import { getDb } from "./db";
import { pushTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | undefined>;
};

async function deliverToToken(token: string, payload: PushPayload): Promise<boolean> {
  if (!FCM_SERVER_KEY) {
    console.log(`[PushService] (no FCM_SERVER_KEY configured — logging only) -> token=${token.slice(0, 12)}… "${payload.title}: ${payload.body}"`);
    return false;
  }
  try {
    const resp = await fetch(FCM_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error(`[PushService] FCM send failed (${resp.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[PushService] Push delivery error:", err);
    return false;
  }
}

/**
 * Sends a push notification to every active device registered for a user.
 * Never throws — push delivery is best-effort and must never break the
 * calling flow (e.g. sending a message, unlocking an achievement).
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<{ sent: number; total: number }> {
  try {
    const db = await getDb();
    if (!db) return { sent: 0, total: 0 };
    const tokens = await db.select().from(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
    if (tokens.length === 0) return { sent: 0, total: 0 };
    let sent = 0;
    for (const t of tokens) {
      const ok = await deliverToToken(t.token, payload);
      if (ok) sent++;
    }
    return { sent, total: tokens.length };
  } catch (err) {
    console.error("[PushService] sendPushToUser failed:", err);
    return { sent: 0, total: 0 };
  }
}
