import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { Button } from "@/components/Button";
import { useState } from "react";

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function deviceLabel(ua?: string | null) {
  if (!ua) return "Unknown device";
  if (/iphone/i.test(ua)) return "📱 iPhone";
  if (/ipad/i.test(ua)) return "📱 iPad";
  if (/android/i.test(ua)) return "📱 Android device";
  if (/macintosh|mac os/i.test(ua)) return "💻 Mac";
  if (/windows/i.test(ua)) return "💻 Windows PC";
  if (/linux/i.test(ua)) return "💻 Linux";
  return "🖥️ Browser";
}

function browserLabel(ua?: string | null) {
  if (!ua) return "";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "";
}

export default function SessionsPage() {
  const utils = trpc.useUtils();
  const [confirmingAll, setConfirmingAll] = useState(false);
  const { data: sessionsList, isLoading } = trpc.auth.getSessions.useQuery();

  const revokeMutation = trpc.auth.revokeSession.useMutation({
    onSuccess: () => utils.auth.getSessions.invalidate(),
  });
  const revokeAllMutation = trpc.auth.revokeAllSessions.useMutation({
    onSuccess: () => { utils.auth.getSessions.invalidate(); setConfirmingAll(false); },
  });

  const sessions = sessionsList ?? [];
  const otherSessions = sessions.filter((s: any) => !s.isCurrent);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            ACTIVE SESSIONS
          </h1>
          <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
            Devices and browsers currently signed in to your account
          </p>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>YOUR DEVICES</h3>
            {otherSessions.length > 0 && (
              confirmingAll ? (
                <div className="flex items-center gap-2">
                  <span className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>Sign out everywhere else?</span>
                  <Button variant="outline" onClick={() => setConfirmingAll(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => revokeAllMutation.mutate()} disabled={revokeAllMutation.isPending}>
                    {revokeAllMutation.isPending ? "Signing out…" : "Confirm"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setConfirmingAll(true)}>
                  Sign out all other devices
                </Button>
              )
            )}
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-16 rounded-lg" style={{ backgroundColor: "var(--surface2)" }} />)}
              </div>
            ) : sessions.length === 0 ? (
              <p className="font-rajdhani text-center py-6" style={{ color: "var(--muted)" }}>No active sessions found.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg flex-wrap gap-3"
                    style={{ backgroundColor: "var(--surface2)", border: `1px solid ${s.isCurrent ? "var(--gold)" : "var(--border)"}` }}
                  >
                    <div>
                      <p className="font-oswald text-sm uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--white)" }}>
                        {deviceLabel(s.deviceInfo)}
                        {browserLabel(s.deviceInfo) && <span style={{ color: "var(--muted)" }}>· {browserLabel(s.deviceInfo)}</span>}
                        {s.isCurrent && (
                          <span className="px-2 py-0.5 rounded font-oswald text-[10px] uppercase" style={{ backgroundColor: "var(--gold)", color: "#000" }}>
                            This device
                          </span>
                        )}
                      </p>
                      <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                        {s.ipAddress ? `${s.ipAddress} · ` : ""}Last active {timeAgo(s.lastActiveAt)} · Signed in {timeAgo(s.createdAt)}
                      </p>
                    </div>
                    {!s.isCurrent && (
                      <Button
                        variant="outline"
                        onClick={() => revokeMutation.mutate({ sessionId: s.id })}
                        disabled={revokeMutation.isPending}
                      >
                        {revokeMutation.isPending && revokeMutation.variables?.sessionId === s.id ? "Signing out…" : "Sign out"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
          Don't recognize a device? Sign it out immediately and change your password from the login screen.
        </p>
      </div>
    </div>
  );
}
