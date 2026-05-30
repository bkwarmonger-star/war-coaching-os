export default function NotFound() {
  return (
    <div
      style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="text-center">
        <h1 className="font-bebas text-6xl mb-4" style={{ color: "var(--gold)" }}>
          404
        </h1>
        <p className="font-rajdhani text-lg mb-8" style={{ color: "var(--muted)" }}>
          Page not found
        </p>
        <a
          href="/"
          style={{ backgroundColor: "var(--gold)", color: "#000" }}
          className="font-oswald font-bold uppercase tracking-wider px-6 py-3 rounded inline-block hover:bg-[var(--gold-bright)] transition-all"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
