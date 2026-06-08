import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");

  const mutation = trpc.forgotPassword.useMutation({
    onSuccess: (data) => { setDone(true); if ((data as any).token) setDevToken((data as any).token); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="hero-workout-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22vw", fontFamily: "'Bebas Neue',sans-serif", color: "var(--gold)", userSelect: "none", pointerEvents: "none", letterSpacing: "0.1em" }}>W.A.R.</div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/login" className="inline-flex items-center gap-2 font-oswald text-xs uppercase tracking-widest hover:opacity-70 transition-opacity mb-6" style={{ color: "var(--muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Login
          </a>
          <h1 className="font-bebas text-4xl tracking-widest mt-2" style={{ color: "var(--white)" }}>RESET PASSWORD</h1>
          <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>Enter your email and we'll send a reset link</p>
        </div>
        <div className="rounded-xl p-8" style={{ backgroundColor: "rgba(17,17,17,0.95)", border: "1px solid var(--border-gold)", backdropFilter: "blur(10px)" }}>
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: "rgba(45,179,109,0.15)", border: "1px solid rgba(45,179,109,0.3)" }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--success)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-oswald text-lg uppercase" style={{ color: "var(--success)" }}>Reset Link Sent</p>
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Check your email for the reset link. It expires in 1 hour.</p>
              {devToken && (
                <div className="p-3 rounded text-left" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
                  <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--warn)" }}>Dev Mode — Token (use in reset URL)</p>
                  <code className="font-rajdhani text-xs break-all" style={{ color: "var(--gold)" }}>/reset-password?token={devToken}</code>
                </div>
              )}
              <a href="/login" className="block mt-4 font-oswald text-sm uppercase tracking-wider" style={{ color: "var(--gold)" }}>Back to Login</a>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setError(""); mutation.mutate({ email }); }} className="space-y-4">
              <div>
                <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
              </div>
              {error && <p className="font-rajdhani text-sm" style={{ color: "var(--red)" }}>{error}</p>}
              <button type="submit" disabled={mutation.isPending}
                className="w-full py-3 rounded font-oswald text-sm uppercase tracking-widest transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--gold)", color: "#000" }}>
                {mutation.isPending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
