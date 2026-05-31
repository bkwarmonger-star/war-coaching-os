import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";
import ProgramAssignmentModal from "@/components/ProgramAssignmentModal";

export default function ClientsPage() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedClientForAssignment, setSelectedClientForAssignment] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    sex: "",
    weight: "",
    height: "",
    goals: "",
    injuries: "",
    fitnessLevel: "",
    trainingType: "in-person",
  });

  const { data: clientsData, refetch } = trpc.clients.list.useQuery({ limit: 100, offset: 0 });
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        age: "",
        sex: "",
        weight: "",
        height: "",
        goals: "",
        injuries: "",
        fitnessLevel: "",
        trainingType: "in-person",
      });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age),
      sex: formData.sex as "male" | "female" | "other",
      weight: parseFloat(formData.weight).toString(),
      height: parseFloat(formData.height).toString(),
      goals: formData.goals ? [formData.goals] : [],
      injuries: formData.injuries ? [formData.injuries] : [],
      fitnessLevel: (formData.fitnessLevel || "beginner") as "beginner" | "intermediate" | "advanced" | "elite",
      trainingType: (formData.trainingType || "in-person") as "in-person" | "online" | "adaptive",
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            CLIENT MANAGEMENT
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Client"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    step="0.01"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <input
                    type="number"
                    placeholder="Height (inches)"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    step="0.01"
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <textarea
                    placeholder="Goals"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-2"
                  />
                  <textarea
                    placeholder="Injuries / Limitations"
                    value={formData.injuries}
                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-2"
                  />
                  <select
                    value={formData.fitnessLevel}
                    onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  >
                    <option value="">Select Fitness Level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select
                    value={formData.trainingType}
                    onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  >
                    <option value="in-person">In-Person</option>
                    <option value="online">Online</option>
                    <option value="adaptive">Adaptive</option>
                  </select>
                </div>
                <Button variant="primary" type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
                {createMutation.isError && (
                  <div style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", borderLeft: "3px solid #dc2626", padding: "12px" }} className="rounded">
                    <p style={{ color: "#fca5a5", fontSize: "14px" }}>
                      Error: {createMutation.error?.message || "Failed to create client"}
                    </p>
                  </div>
                )}
              </form>
            </CardBody>
          </Card>
        )}

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <h2 className="font-bebas text-xl" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              ALL CLIENTS ({clientsData?.clients?.length || 0})
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottomColor: "var(--border)" }} className="border-b">
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Age
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Type
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Fitness Level
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientsData?.clients && clientsData.clients.length > 0 ? (
                    clientsData.clients.map((client) => (
                      <tr
                        key={client.id}
                        style={{ borderBottomColor: "rgba(255,255,255,0.04)" }}
                        className="border-b hover:bg-surface2 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/clients/${client.id}`)}
                      >
                        <td className="px-6 py-4 font-oswald" style={{ color: "var(--white)" }}>
                          {client.name}
                        </td>
                        <td className="px-6 py-4 font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                          {client.email}
                        </td>
                        <td className="px-6 py-4 font-rajdhani text-sm" style={{ color: "var(--white)" }}>
                          {client.age}
                        </td>
                        <td className="px-6 py-4">
                          <span className="tag tag-gold">{client.trainingType}</span>
                        </td>
                        <td className="px-6 py-4 font-rajdhani text-sm" style={{ color: "var(--white)" }}>
                          {client.fitnessLevel}
                        </td>
                        <td className="px-6 py-4">
                          <span className="tag tag-green">Active</span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert("Messaging coming soon");
                            }}
                            style={{ backgroundColor: "var(--blue)", color: "#fff" }}
                            className="px-3 py-1 rounded font-oswald text-xs uppercase hover:opacity-80 transition-opacity"
                          >
                            Message
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientForAssignment(client.id);
                            }}
                            style={{ backgroundColor: "var(--gold)", color: "#000" }}
                            className="px-3 py-1 rounded font-oswald text-xs uppercase hover:opacity-80 transition-opacity"
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                          No clients yet. Create your first client to get started.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {selectedClientForAssignment && (
        <ProgramAssignmentModal
          clientId={selectedClientForAssignment}
          isOpen={true}
          onClose={() => setSelectedClientForAssignment(null)}
          onAssignSuccess={() => {
            setSelectedClientForAssignment(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
