import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function RegisterPage() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState("");
  const mutation = trpc.auth.clientRegister.useMutation({ onSuccess: () => { window.location.href = "/portal"; }, onError: (e) => setError(e.message) });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    mutation.mutate({ name, email, password });
  };
  return (
    <div className="hero-workout-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22vw", fontFamily: "'Bebas Neue',sans-serif", color: "var(--gold)", userSelect: "none", pointerEvents: "none" }}>W.A.R.</div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", boxShadow: "0 0 40px rgba(201,168,76,0.3)" }}>
            <span className="font-bebas text-3xl" style={{ color: "#000" }}>WAR</span>
          </div>
          <h1 className="font-bebas text-4xl tracking-widest" style={{ color: "var(--white)" }}>JOIN THE TEAM</h1>
          <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>Create your W.A.R. Coaching account</p>
        </div>
        <div className="rounded-xl p-8" style={{ backgroundColor: "rgba(17,17,17,0.95)", border: "1px solid var(--border-gold)", backdropFilter: "blur(10px)" }}>
          <div className="mb-5 px-4 py-3 rounded" style={{ backgroundColor: "rgba(201,168,76,0.08)", border: "1px solid var(--border-gold)" }}>
            <p className="font-rajdhani text-sm" style={{ color: "var(--gold)" }}>Use the same email your trainer has on file — your account will auto-link to your profile.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{ label: "Full Name", value: name, setter: setName, type: "text", placeholder: "Your full name" }, { label: "Email Address", value: email, setter: setEmail, type: "email", placeholder: "your@email.com" }, { label: "Password", value: password, setter: setPassword, type: "password", placeholder: "Minimum 8 characters" }, { label: "Confirm Password", value: confirm, setter: setConfirm, type: "password", placeholder: "Re-enter password" }].map(({ label, value, setter, type, placeholder }) => (
              <div key={label}>
                <label className="block font-oswald text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>{label}</label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} required placeholder={placeholder} className="w-full px-4 py-3 rounded font-rajdhani text-base" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
              </div>
            ))}
            {error && <div className="px-3 py-2 rounded" style={{ backgroundColor: "rgba(185,43,39,0.12)", border: "1px solid rgba(185,43,39,0.3)", color: "var(--red)" }}><p className="font-rajdhani text-sm">{error}</p></div>}
            <button type="submit" disabled={mutation.isPending} className="w-full py-3 rounded font-oswald text-sm uppercase tracking-widest transition-all hover:opacity-90" style={{ backgroundColor: "var(--gold)", color: "#000" }}>
              {mutation.isPending ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-4 font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Already have an account? <a href="/login" style={{ color: "var(--gold)" }}>Sign in</a></p>
        </div>
      </div>
    </div>
  );
}
