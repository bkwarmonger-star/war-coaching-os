import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ConsultationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    consultationType: "initial",
    amount: "0",
  });

  const { data: consultations } = trpc.consultations.list.useQuery();
  const createConsultation = trpc.consultations.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConsultation.mutateAsync({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      consultationType: formData.consultationType,
      amount: formData.amount,
    });
    setFormData({ clientName: "", clientEmail: "", clientPhone: "", consultationType: "initial", amount: "0" });
    setShowForm(false);
  };

  const statusStyle: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "rgba(232,148,58,0.12)",  color: "var(--warn)" },
    scheduled: { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
    completed: { bg: "rgba(45,179,109,0.12)",  color: "var(--success)" },
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
              Consultations
            </h1>
            <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
              Manage intake and consultation bookings
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest hover:brightness-110 transition-all"
            style={{ backgroundColor: "var(--gold)", color: "#000" }}
          >
            {showForm ? "Cancel" : "New Consultation"}
          </button>
        </div>

        {showForm && (
          <div
            className="rounded-xl border p-6 mb-8"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border-gold)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <h2
              className="font-oswald text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--muted)" }}
            >
              New Consultation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="px-3 py-2.5 border font-rajdhani text-sm"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
                  required
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="px-3 py-2.5 border font-rajdhani text-sm"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
                  required
                />
                <input
                  type="tel"
                  placeholder="Client Phone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="px-3 py-2.5 border font-rajdhani text-sm"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
                />
                <select
                  value={formData.consultationType}
                  onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                  className="px-3 py-2.5 border font-rajdhani text-sm"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
                >
                  <option value="initial">Initial Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="assessment">Assessment</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="px-3 py-2.5 border font-rajdhani text-sm"
                  style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)", color: "var(--white)" }}
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createConsultation.isPending}
                className="w-full px-4 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all"
                style={{ backgroundColor: "var(--gold)", color: "#000" }}
              >
                {createConsultation.isPending ? "Creating..." : "Create Consultation"}
              </button>
            </form>
          </div>
        )}

        {consultations && consultations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consultations.map((c: any) => (
              <div
                key={c.id}
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-gold)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <h3 className="font-bebas text-xl mb-1" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
                  {c.clientName}
                </h3>
                <p className="font-rajdhani text-sm mb-0.5" style={{ color: "var(--muted)" }}>{c.clientEmail}</p>
                <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>{c.clientPhone}</p>
                <div className="flex justify-between items-center">
                  <p className="font-bebas text-xl" style={{ color: "var(--gold)" }}>${c.amount}</p>
                  <span
                    className="tag"
                    style={{
                      backgroundColor: (statusStyle[c.status] || statusStyle.pending).bg,
                      color: (statusStyle[c.status] || statusStyle.pending).color,
                      borderColor: (statusStyle[c.status] || statusStyle.pending).color + "50",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)" }}
          >
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
              No consultations yet. Create your first consultation above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
