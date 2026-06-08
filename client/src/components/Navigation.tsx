import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import {
  BarChart3, Bot, CalendarDays, Camera, CheckCircle2, ClipboardCheck, CreditCard,
  Dumbbell, FileText, Home, LogOut, MessageSquare, Phone, ShieldCheck, Target,
  TrendingUp, UserRound, Users, Utensils,
} from "lucide-react";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const trainerNavItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Programs", href: "/programs", icon: Dumbbell },
    { label: "Meals", href: "/meals", icon: Utensils },
    { label: "Check-Ins", href: "/check-ins", icon: ClipboardCheck },
    { label: "Habits", href: "/habit-templates", icon: CheckCircle2 },
    { label: "Forms", href: "/trainer/forms", icon: FileText },
    { label: "Messaging", href: "/messaging", icon: MessageSquare },
    { label: "Scheduling", href: "/scheduling", icon: CalendarDays },
    { label: "Revenue", href: "/revenue", icon: CreditCard },
    { label: "Leads", href: "/leads", icon: Target },
    { label: "Photos", href: "/photos", icon: Camera },
    { label: "Progress", href: "/progress", icon: BarChart3 },
    { label: "Analytics", href: "/analytics", icon: TrendingUp },
    { label: "AI Coach", href: "/ai-coach", icon: Bot },
    { label: "Video", href: "/video", icon: Phone },
    { label: "Sessions", href: "/sessions", icon: ShieldCheck },
    { label: "Profile", href: "/brand", icon: UserRound },
  ];

  const isTrainer = user?.role === "admin";
  const navItems = isTrainer
    ? trainerNavItems
    : [
        { label: "My Portal", href: "/portal", icon: UserRound },
        { label: "Sessions", href: "/sessions", icon: ShieldCheck },
      ];

  return (
    <nav style={{ backgroundColor: "var(--surface)", borderBottomColor: "var(--border-gold)" }} className="sticky top-0 z-40 border-b backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/">
            <h1 className="font-bebas text-2xl cursor-pointer whitespace-nowrap" style={{ color: "var(--gold)", letterSpacing: "0.12em" }}>
              W.A.R. COACHING
            </h1>
          </Link>

          {user && (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between xl:justify-end xl:gap-6">
              <div className="flex gap-2 overflow-x-auto pb-px">
                {navItems.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}
                      style={{ color: isActive ? "var(--gold)" : "var(--muted)", backgroundColor: isActive ? "rgba(201,168,76,0.1)" : "transparent", borderColor: isActive ? "rgba(201,168,76,0.35)" : "transparent" }}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 font-oswald text-xs uppercase tracking-widest transition-colors whitespace-nowrap hover:bg-white/5"
                      title={item.label}>
                      <Icon size={14} strokeWidth={2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0" style={{ borderColor: "var(--border-gold)" }}>
                <NotificationBell />
                <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>{user.name}</span>
                <button onClick={() => logout().then(() => { window.location.href = "/login"; })}
                  style={{ backgroundColor: "var(--red)", color: "#fff" }}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-oswald text-xs uppercase tracking-widest hover:brightness-110 transition-all">
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}

          {!user && (
            <a href="/login" style={{ backgroundColor: "var(--gold)", color: "#000" }}
              className="px-4 py-2 rounded-lg font-oswald text-sm uppercase tracking-widest hover:brightness-110 transition-all">
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
