import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function CheckInsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    weight: "",
    energyLevel: "medium",
    notes: "",
  });

  const { data: checkInsData, refetch } = trpc.checkIns.getPending.useQuery();
  const createMutation = trpc.checkIns.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({ clientId: "", weight: "", energyLevel: "medium", notes: "" });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      clientId: parseInt(formData.clientId),
      weight: formData.weight,
      energyLevel: parseInt(formData.energyLevel),
      notes: formData.notes,
      photoUrls: [],
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            CLIENT CHECK-INS
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Check-In"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Client ID"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Weight"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <select
                    value={formData.energyLevel}
                    onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-2"
                  >
                    <option value="low">Low Energy</option>
                    <option value="medium">Medium Energy</option>
                    <option value="high">High Energy</option>
                  </select>
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-2"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  Submit Check-In
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="space-y-4">
          {checkInsData && checkInsData.length > 0 ? (
            checkInsData.map((checkIn: any) => (
              <Card key={checkIn.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bebas text-lg mb-2" style={{ color: "var(--gold)" }}>
                        Client {checkIn.clientId}
                      </h3>
                      <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--muted)" }}>
                        Weight: {checkIn.weight} | Energy: {["Low", "Medium", "High"][checkIn.energyLevel - 1]}
                      </p>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--white)" }}>
                        {checkIn.notes}
                      </p>
                    </div>
                    <Button variant="outline">Respond</Button>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                No check-ins yet. Clients can submit their weekly check-ins here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
