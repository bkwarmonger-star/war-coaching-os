import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const clientId = params?.id;

  const [isEditing, setIsEditing] = useState(false);
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
    trainingType: "",
  });

  const { data: client, isLoading, refetch } = trpc.clients.get.useQuery(
    { clientId: clientId ? parseInt(clientId) : 0 },
    { enabled: !!clientId }
  );

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  // Delete is not implemented yet - will add later
  const deleteMutation = { isPending: false, mutate: () => {}, isError: false, error: null } as any;

  // Initialize form when client data loads
  useEffect(() => {
    if (client && !isEditing) {
      const goalsStr = typeof client.goals === "string" ? client.goals : (client.goals as any)?.[0] || "";
      const injuriesStr = typeof client.injuries === "string" ? client.injuries : (client.injuries as any)?.[0] || "";
      setFormData({
        name: client.name || "",
        email: client.email || "",
        age: client.age?.toString() || "",
        sex: client.sex || "",
        weight: client.weight || "",
        height: client.height || "",
        goals: goalsStr,
        injuries: injuriesStr,
        fitnessLevel: client.fitnessLevel || "",
        trainingType: client.trainingType || "",
      });
    }
  }, [client, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    updateMutation.mutate({
      clientId: clientId ? parseInt(clientId) : 0,
      name: formData.name,
      email: formData.email,
      age: parseInt(formData.age),
      sex: formData.sex as "male" | "female" | "other",
      weight: formData.weight,
      height: formData.height,
      goals: formData.goals ? [formData.goals] : [],
      injuries: formData.injuries ? [formData.injuries] : [],
      fitnessLevel: (formData.fitnessLevel || "beginner") as "beginner" | "intermediate" | "advanced" | "elite",
      trainingType: (formData.trainingType || "in-person") as "in-person" | "online" | "adaptive",
    });
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p style={{ color: "var(--muted)" }}>Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <p style={{ color: "var(--muted)" }}>Client not found.</p>
          <Button variant="primary" onClick={() => setLocation("/clients")} className="mt-4">
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
              {client.name}
            </h1>
            <p style={{ color: "var(--muted)" }} className="text-sm mt-2">
              {client.email}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this client?")) {
                      // Delete functionality coming soon
                      alert("Delete functionality coming soon");
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
            {isEditing && (
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
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
                    <option value="elite">Elite</option>
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
                <Button variant="primary" type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {updateMutation.isError && (
                  <div style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", borderLeft: "3px solid #dc2626", padding: "12px" }} className="rounded">
                    <p style={{ color: "#fca5a5", fontSize: "14px" }}>
                      Error: {updateMutation.error?.message || "Failed to update client"}
                    </p>
                  </div>
                )}
              </form>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="font-oswald uppercase text-sm" style={{ color: "var(--white)" }}>
                  Personal Info
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Age
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.age || "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Sex
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.sex ? client.sex.charAt(0).toUpperCase() + client.sex.slice(1) : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Weight
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.weight ? `${client.weight} lbs` : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Height
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.height ? `${client.height} in` : "—"}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-oswald uppercase text-sm" style={{ color: "var(--white)" }}>
                  Training Info
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Fitness Level
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.fitnessLevel ? client.fitnessLevel.charAt(0).toUpperCase() + client.fitnessLevel.slice(1) : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Training Type
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.trainingType ? client.trainingType.charAt(0).toUpperCase() + client.trainingType.slice(1) : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Goals
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.goals ? (typeof client.goals === "string" ? client.goals : (client.goals as any).join(", ")) : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase font-oswald">
                    Injuries / Limitations
                  </p>
                  <p className="font-rajdhani" style={{ color: "var(--white)" }}>
                    {client.injuries ? (typeof client.injuries === "string" ? client.injuries : (client.injuries as any).join(", ")) : "—"}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        <Button variant="secondary" onClick={() => setLocation("/clients")} className="mt-8">
          Back to Clients
        </Button>
      </div>
    </div>
  );
}
