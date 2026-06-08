import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.auth.clientLogin.useMutation({
    onSuccess: () => { window.location.href = "/portal"; },
    onError: (e) => setError(e.message),
  });
  const resetParam = new URLSearchParams(window.location.search).get("reset");
  return (
    <div className="hero-workout-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22vw", fontFamily: "'Bebas Neue',sans-serif", color: "var(--gold)", userSelect: "none", pointerEvents: "none" }}>W.A.R.</div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", boxShadow: "0 0 40px rgba(201,168,76,0.3)" }}>
            <span className="font-bebas text-3xl" style={{ color: "#000" }}>WAR</span>
          </div>
          <h1 className="font-bebas text-4xl tracking-widest" style={{ color: "var(--white)" }}>CLIENT PORTAL</h1>
          <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>W.A.R. Coaching — Justin Watson</p>
        </div>
        <div className="rounded-xl p-8" style={{ backgroundColor: "rgba(17,17,17,0.95)", border: "1px solid var(--border-gold)", backdropFilter: "blur(10px)" }}>
          {resetParam && <div className="mb-4 px-4 py-3 rounded" style={{ backgroundColor: "rgba(45,179,109,0.1)", border: "1px solid rgba(45,179,109,0.3)", color: "var(--success)" }}><p className="font-rajdhani text-sm">Password updated! Sign in with your new password.</p></div>}
          <h2 className="font-oswald text-xl uppercase mb-6" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>Sign In</h2>
          <form onSubmit={(e) => { e.preventDefault(); setError(""); loginMutation.mutate({ email, password }); }} className="space-y-4">
            <div>
              <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
            </div>
            <div>
              <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
            </div>
            {error && <div className="px-3 py-2 rounded" style={{ backgroundColor: "rgba(185,43,39,0.12)", border: "1px solid rgba(185,43,39,0.3)", color: "var(--red)" }}><p className="font-rajdhani text-sm">{error}</p></div>}
            <button type="submit" disabled={loginMutation.isPending} className="w-full py-3 rounded font-oswald text-sm uppercase tracking-widest transition-all hover:opacity-90" style={{ backgroundColor: "var(--gold)", color: "#000" }}>
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 space-y-3 text-center">
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
              New client? <a href="/register" style={{ color: "var(--gold)" }}>Create account</a>
              {" · "}<a href="/forgot-password" style={{ color: "var(--muted)" }}>Forgot password?</a>
            </p>
            <div className="flex items-center gap-3"><div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} /><span className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>trainer login</span><div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} /></div>
            <a href={getLoginUrl()} className="block w-full py-2.5 rounded font-oswald text-sm uppercase tracking-wider hover:opacity-80 transition-all" style={{ border: "1px solid var(--border-gold)", color: "var(--gold)" }}>
              Trainer Sign In (OAuth)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
