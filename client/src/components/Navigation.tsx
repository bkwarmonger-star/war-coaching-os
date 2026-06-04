import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const trainerNavItems = [
    { label: "Dashboard", href: "/" },
    { label: "Clients", href: "/clients" },
    { label: "Programs", href: "/programs" },
    { label: "Meals", href: "/meals" },
    { label: "Check-Ins", href: "/check-ins" },
    { label: "Messaging", href: "/messaging" },
    { label: "Scheduling", href: "/scheduling" },
    { label: "Revenue", href: "/revenue" },
    { label: "Leads", href: "/leads" },
    { label: "Photos", href: "/photos" },
    { label: "Progress", href: "/progress" },
    { label: "Video", href: "/video" },
    { label: "Profile", href: "/brand" },
  ];

  const isTrainer = user?.role === "admin";
  const navItems = isTrainer
    ? trainerNavItems
    : [{ label: "My Portal", href: "/portal" }];

  return (
    <nav
      style={{ backgroundColor: "var(--surface)", borderBottomColor: "var(--border-gold)" }}
      className="border-b"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1
              className="font-bebas text-2xl cursor-pointer"
              style={{ color: "var(--gold)", letterSpacing: "0.12em" }}
            >
              W.A.R. COACHING
            </h1>
          </Link>

          {user && (
            <div className="flex items-center gap-8">
              <div className="flex gap-5 overflow-x-auto pb-px">
                {navItems.map((item) => {
                  const isActive =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        color: isActive ? "var(--gold)" : "var(--muted)",
                        borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                        paddingBottom: "2px",
                      }}
                      className="font-oswald text-xs uppercase tracking-widest hover:text-gold transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div
                className="flex items-center gap-4 border-l pl-4"
                style={{ borderColor: "var(--border-gold)" }}
              >
                <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  {user.name}
                </span>
                <button
                  onClick={() => logout()}
                  style={{ backgroundColor: "var(--red)", color: "#fff" }}
                  className="px-3 py-1.5 rounded-lg font-oswald text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {!user && (
            <a
              href={getLoginUrl()}
              style={{ backgroundColor: "var(--gold)", color: "#000" }}
              className="px-4 py-2 rounded-lg font-oswald text-sm uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
