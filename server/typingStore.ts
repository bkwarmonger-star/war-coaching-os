/**
 * In-memory "is typing…" presence store for the messaging UI.
 * Keyed by `${trainerId}:${clientId}` -> who is currently typing and when
 * their last keystroke was registered. Entries expire after a short TTL so
 * a closed tab doesn't leave a stale "typing…" indicator behind.
 *
 * Production note: swap this Map for Redis (or a pub/sub channel) if the
 * app is ever run across multiple server instances.
 */

const TYPING_TTL_MS = 6000;

interface TypingRecord {
  trainerTyping: number; // timestamp, 0 = not typing
  clientTyping: number;
}

const store = new Map<string, TypingRecord>();

function key(trainerId: number, clientId: number) {
  return `${trainerId}:${clientId}`;
}

export function setTyping(trainerId: number, clientId: number, who: "trainer" | "client", isTyping: boolean) {
  const k = key(trainerId, clientId);
  const rec: TypingRecord = store.get(k) ?? { trainerTyping: 0, clientTyping: 0 };
  const now = Date.now();
  if (who === "trainer") rec.trainerTyping = isTyping ? now : 0;
  else rec.clientTyping = isTyping ? now : 0;
  store.set(k, rec);
}

export function getTypingStatus(trainerId: number, clientId: number) {
  const rec = store.get(key(trainerId, clientId));
  const now = Date.now();
  const trainerTyping = !!rec && rec.trainerTyping > 0 && now - rec.trainerTyping < TYPING_TTL_MS;
  const clientTyping = !!rec && rec.clientTyping > 0 && now - rec.clientTyping < TYPING_TTL_MS;
  return { trainerTyping, clientTyping };
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [k, rec] of Array.from(store.entries())) {
    if (now - rec.trainerTyping > TYPING_TTL_MS) rec.trainerTyping = 0;
    if (now - rec.clientTyping > TYPING_TTL_MS) rec.clientTyping = 0;
    if (rec.trainerTyping === 0 && rec.clientTyping === 0) store.delete(k);
  }
}, 10_000).unref?.();
