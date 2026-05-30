import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function ProgramsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    programType: "exercise",
    duration: "12",
  });

  const { data: programsData, refetch } = trpc.programs.list.useQuery({ limit: 100, offset: 0 });
  const createMutation = trpc.programs.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({ name: "", description: "", programType: "exercise", duration: "12" });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      programType: formData.programType as "exercise" | "nutrition" | "hybrid",
      duration: parseInt(formData.duration),
      content: JSON.stringify({ template: true }),
      isTemplate: true,
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            PROGRAMS LIBRARY
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Program"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Program Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    backgroundColor: "var(--surface2)",
                    borderColor: "var(--border)",
                    color: "var(--white)",
                  }}
                  className="border rounded px-4 py-2 font-rajdhani w-full"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    backgroundColor: "var(--surface2)",
                    borderColor: "var(--border)",
                    color: "var(--white)",
                  }}
                  className="border rounded px-4 py-2 font-rajdhani w-full"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.programType}
                    onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  >
                    <option value="exercise">Exercise</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Duration (weeks)"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  Create Program
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programsData && programsData.length > 0 ? (
            programsData.map((program: any) => (
              <Card key={program.id}>
                <CardBody>
                  <h3 className="font-bebas text-lg mb-2" style={{ color: "var(--gold)" }}>
                    {program.name}
                  </h3>
                  <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
                    {program.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="tag tag-gold">{program.programType}</span>
                    <span className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                      {program.duration} weeks
                    </span>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                No programs yet. Create your first program template.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
