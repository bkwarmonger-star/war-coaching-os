import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function SchedulingPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    date: "",
    time: "",
    sessionType: "in-person",
    notes: "",
  });

  const { data: sessionsData, refetch } = trpc.sessions.getUpcoming.useQuery();

  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({ clientId: "", date: "", time: "", sessionType: "in-person", notes: "" });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    createMutation.mutate({
      clientId: parseInt(formData.clientId),
      startTime,
      endTime,
      sessionType: formData.sessionType as "in-person" | "online" | "adaptive",
      notes: formData.notes,
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            SCHEDULING
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Schedule Session"}
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
                    className="border px-4 py-2.5 font-rajdhani"
                    required
                  />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border px-4 py-2.5 font-rajdhani"
                    required
                  />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border px-4 py-2.5 font-rajdhani"
                    required
                  />
                  <select
                    value={formData.sessionType}
                    onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border px-4 py-2.5 font-rajdhani"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="online">Online</option>
                    <option value="adaptive">Adaptive</option>
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
                    className="border px-4 py-2.5 font-rajdhani col-span-2"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  Schedule Session
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="space-y-4">
          {sessionsData && sessionsData.length > 0 ? (
            sessionsData.map((session: any) => (
              <Card key={session.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bebas text-lg mb-2" style={{ color: "var(--gold)" }}>
                        Client {session.clientId}
                      </h3>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                        {new Date(session.startTime).toLocaleString()} | {session.sessionType}
                      </p>
                      {session.notes && (
                        <p className="font-rajdhani text-sm mt-2" style={{ color: "var(--white)" }}>
                          {session.notes}
                        </p>
                      )}
                    </div>
                    <span className="tag tag-gold">{session.sessionType}</span>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                No sessions scheduled. Add your first session.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
