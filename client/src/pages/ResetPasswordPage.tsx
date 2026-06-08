import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const mutation = trpc.resetPassword.useMutation({
    onSuccess: () => { window.location.href = "/login?reset=1"; },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!token) { setError("Missing reset token. Request a new reset link."); return; }
    mutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="hero-workout-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22vw", fontFamily: "'Bebas Neue',sans-serif", color: "var(--gold)", userSelect: "none", pointerEvents: "none" }}>W.A.R.</div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-bebas text-4xl tracking-widest" style={{ color: "var(--white)" }}>NEW PASSWORD</h1>
          <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>Choose a strong password for your account</p>
        </div>
        <div className="rounded-xl p-8" style={{ backgroundColor: "rgba(17,17,17,0.95)", border: "1px solid var(--border-gold)", backdropFilter: "blur(10px)" }}>
          {!token ? (
            <div className="text-center">
              <p className="font-rajdhani" style={{ color: "var(--red)" }}>Invalid or missing reset token.</p>
              <a href="/forgot-password" className="block mt-4 font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Request New Link</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
              </div>
              <div>
                <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Re-enter password"
                  className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
              </div>
              {error && <p className="font-rajdhani text-sm px-3 py-2 rounded" style={{ color: "var(--red)", backgroundColor: "rgba(185,43,39,0.12)", border: "1px solid rgba(185,43,39,0.3)" }}>{error}</p>}
              <button type="submit" disabled={mutation.isPending}
                className="w-full py-3 rounded font-oswald text-sm uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--gold)", color: "#000" }}>
                {mutation.isPending ? "Updating..." : "Set New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
