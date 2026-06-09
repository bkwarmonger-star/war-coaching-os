import { useState, useRef, useEffect } from "react";
import * as React from "react";
import { trpc } from "@/lib/trpc";

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only poll when page is visible to reduce API calls
  const [isVisible, setIsVisible] = React.useState(true);
  React.useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  const { data: countData, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: isVisible ? 30000 : false });
  const { data: notifs, refetch: refetchList } = trpc.notifications.list.useQuery(undefined, { enabled: open });
  const markReadMutation = trpc.notifications.markRead.useMutation({ onSuccess: () => { refetchCount(); refetchList(); } });
  const markAllMutation = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { refetchCount(); refetchList(); } });

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = countData?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:opacity-70"
        style={{ backgroundColor: open ? "var(--surface2)" : "transparent", border: "1px solid " + (open ? "var(--border-gold)" : "transparent") }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: unread > 0 ? "var(--gold)" : "var(--muted)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-oswald text-xs" style={{ backgroundColor: "var(--red)", color: "#fff", fontSize: "0.6rem" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-gold)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="font-oswald text-sm uppercase tracking-widest" style={{ color: "var(--gold)" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={() => markAllMutation.mutate()} className="font-rajdhani text-xs hover:opacity-70 transition-opacity" style={{ color: "var(--muted)" }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
            {!notifs || notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No notifications yet</p>
              </div>
            ) : (
              notifs.map((n: any) => (
                <button key={n.id} className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all hover:brightness-110"
                  style={{ backgroundColor: n.isRead ? "transparent" : "rgba(201,168,76,0.05)", borderBottom: "1px solid var(--border)" }}
                  onClick={() => !n.isRead && markReadMutation.mutate({ notificationId: n.id })}>
                  <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: n.isRead ? "transparent" : "var(--gold)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald text-sm" style={{ color: n.isRead ? "var(--muted)" : "var(--white)" }}>{n.title}</p>
                    <p className="font-rajdhani text-xs truncate-2 mt-0.5" style={{ color: "var(--muted)" }}>{n.body}</p>
                    <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
