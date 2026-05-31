import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export function Navigation() {
  const { user, logout } = useAuth();

  const navItems = [
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

  return (
    <nav style={{ backgroundColor: "var(--surface)", borderBottomColor: "var(--border)" }} className="border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="font-bebas text-2xl" style={{ color: "var(--gold)", letterSpacing: "0.1em", cursor: "pointer" }}>
              W.A.R. COACHING
            </h1>
          </Link>

          {user && (
            <div className="flex items-center gap-8">
              <div className="flex gap-6 overflow-x-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: "var(--white)" }}
                    className="font-oswald text-sm uppercase hover:text-gold transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-4 border-l" style={{ borderColor: "var(--border)", paddingLeft: "1rem" }}>
                <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  {user.name}
                </span>
                <button
                  onClick={() => logout()}
                  style={{ backgroundColor: "var(--red)", color: "#fff" }}
                  className="px-3 py-1 rounded font-oswald text-xs uppercase hover:opacity-80 transition-opacity"
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
              className="px-4 py-2 rounded font-oswald text-sm uppercase hover:opacity-80 transition-opacity"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
