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
      value: value,
      unit: metricType === "weight" ? "lbs" : metricType === "measurement" ? "inches" : undefined,
      notes,
    });

    setValue("");
    setNotes("");
  };

  const clients = clientsData?.clients || [];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gold mb-8">Client Progress Tracking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-6 border border-gold/20">
              <h2 className="text-xl font-bold text-gold mb-4">Log Metric</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Select Client</label>
                  <select
                    value={selectedClientId || ""}
                    onChange={(e) => setSelectedClientId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Metric Type</label>
                  <select
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                  >
                    <option value="weight">Weight (lbs)</option>
                    <option value="measurement">Measurement (inches)</option>
                    <option value="bloodwork">Bloodwork</option>
                    <option value="body_composition">Body Composition</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                    placeholder="Enter value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gold/30 rounded text-white"
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedClientId || createMetric.isPending}
                  className="w-full px-4 py-2 bg-gold text-black font-bold rounded hover:bg-gold/90 disabled:opacity-50"
                >
                  {createMetric.isPending ? "Saving..." : "Log Metric"}
                </button>
              </form>
            </div>
          </div>

          {/* Metrics List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg p-6 border border-gold/20">
              <h2 className="text-xl font-bold text-gold mb-4">Progress History</h2>

              {metrics && metrics.length > 0 ? (
                <div className="space-y-3">
                  {metrics.map((m: any) => (
                    <div key={m.id} className="bg-gray-800 p-4 rounded border border-gold/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white capitalize">{(m.metricType || 'Unknown').replace("_", " ")}</p>
                          {m.value && <p className="text-gold text-lg">{m.value} {m.unit}</p>}
                          {m.notes && <p className="text-gray-400 text-sm mt-1">{m.notes}</p>}
                        </div>
                        <p className="text-gray-500 text-sm">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No metrics logged yet. Select a client and log a metric to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
