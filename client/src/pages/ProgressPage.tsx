import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function ProgressPage() {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [metricType, setMetricType] = useState<"weight" | "measurement" | "bloodwork" | "body_composition" | "photo">("weight");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const { data: metrics } = trpc.progress.getClientMetrics.useQuery(
    { clientId: selectedClientId || 0 },
    { enabled: !!selectedClientId }
  );

  const createMetric = trpc.progress.createMetric.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    await createMetric.mutateAsync({
      clientId: selectedClientId,
      metricType,
      value,
      unit: metricType === "weight" ? "lbs" : metricType === "measurement" ? "inches" : undefined,
      notes,
    });
    setValue("");
    setNotes("");
  };

  const clients = clientsData?.clients || [];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            Progress Tracking
          </h1>
          <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
            Log and review client metrics over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log Metric Form */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl border p-6"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
            >
              <h2
                className="font-oswald text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--muted)" }}
              >
                Log Metric
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block font-oswald text-xs uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--muted)" }}
                  >
                    Client
                  </label>
                  <select
                    value={selectedClientId || ""}
                    onChange={(e) => setSelectedClientId(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border font-rajdhani text-sm"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border-gold)",
                      color: "var(--white)",
                    }}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block font-oswald text-xs uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--muted)" }}
                  >
                    Metric Type
                  </label>
                  <select
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border font-rajdhani text-sm"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border-gold)",
                      color: "var(--white)",
                    }}
                  >
                    <option value="weight">Weight (lbs)</option>
                    <option value="measurement">Measurement (inches)</option>
                    <option value="bloodwork">Bloodwork</option>
                    <option value="body_composition">Body Composition</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block font-oswald text-xs uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--muted)" }}
                  >
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2.5 border font-rajdhani text-sm"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border-gold)",
                      color: "var(--white)",
                    }}
                    placeholder="Enter value"
                  />
                </div>

                <div>
                  <label
                    className="block font-oswald text-xs uppercase tracking-widest mb-1.5"
                    style={{ color: "var(--muted)" }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border font-rajdhani text-sm"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border-gold)",
                      color: "var(--white)",
                    }}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedClientId || createMetric.isPending}
                  className="w-full px-4 py-2.5 rounded-lg font-oswald text-sm uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ backgroundColor: "var(--gold)", color: "#000" }}
                >
                  {createMetric.isPending ? "Saving..." : "Log Metric"}
                </button>
              </form>
            </div>
          </div>

          {/* Metrics History */}
          <div className="lg:col-span-2">
            <div
              className="rounded-xl border p-6"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-gold)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
            >
              <h2
                className="font-oswald text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--muted)" }}
              >
                Progress History
              </h2>

              {metrics && metrics.length > 0 ? (
                <div className="space-y-3">
                  {metrics.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border-gold)" }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className="font-oswald text-sm uppercase tracking-wide capitalize"
                            style={{ color: "var(--white)" }}
                          >
                            {(m.metricType || "Unknown").replace("_", " ")}
                          </p>
                          {m.value && (
                            <p className="font-bebas text-2xl mt-0.5" style={{ color: "var(--gold)" }}>
                              {m.value} {m.unit}
                            </p>
                          )}
                          {m.notes && (
                            <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
                              {m.notes}
                            </p>
                          )}
                        </div>
                        <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                    {selectedClientId
                      ? "No metrics logged yet for this client."
                      : "Select a client and log a metric to get started."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
