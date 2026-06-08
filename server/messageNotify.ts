// Fan-out helper: when a message is sent, create an in-app notification,
// fire a push to the recipient's registered devices, and (best-effort) send
// an email. All three are "fire and forget" — failures are logged, never
// thrown, so a flaky provider can never break message sending.

import { getDb } from "./db";
import { users, notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPushToUser } from "./pushService";
import { sendNewMessageEmail } from "./emailService";

function preview(content: string, max = 120) {
  return content.length > max ? content.slice(0, max - 1) + "…" : content;
}

/**
 * Notify a recipient (by their `users.id`) that a new message has arrived.
 * `trainerId` is attached to the notification row for trainer-side filtering.
 */
export async function notifyNewMessage(opts: {
  recipientUserId: number;
  trainerId?: number;
  fromName: string;
  content: string;
}) {
  try {
    const db = await getDb();
    if (!db) return;

    const title = `New message from ${opts.fromName}`;
    const body = preview(opts.content);

    await db.insert(notifications).values({
      userId: opts.recipientUserId,
      trainerId: opts.trainerId,
      type: "new_message",
      title,
      body,
      data: JSON.stringify({ kind: "message" }),
      isRead: false,
    });

    // Fire push + email in parallel; never block/throw on either
    const recipientRows = await db.select().from(users).where(eq(users.id, opts.recipientUserId)).limit(1);
    const recipient = recipientRows[0];

    await Promise.allSettled([
      sendPushToUser(opts.recipientUserId, { title, body, data: { type: "new_message" } }),
      recipient?.email ? sendNewMessageEmail(recipient.email, recipient.name || "", opts.fromName, body) : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("[messageNotify] Failed to notify recipient:", err);
  }
}
