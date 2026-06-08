import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";
import ProgramAssignmentModal from "@/components/ProgramAssignmentModal";

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const clientId = params?.id;
  const clientIdNum = clientId ? parseInt(clientId) : 0;

  const [isEditing, setIsEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; data: any } | null>(null);
  const [macroEdit, setMacroEdit] = useState(false);
  const [macros, setMacros] = useState({ dailyCalorieTarget: "", proteinTargetG: "", carbsTargetG: "", fatTargetG: "", fiberTargetG: "", waterTargetOz: "" });

  const [formData, setFormData] = useState({
    name: "", email: "", age: "", sex: "", weight: "", height: "",
    goals: "", injuries: "", fitnessLevel: "", trainingType: "",
  });

  const { data: client, isLoading, refetch } = trpc.clients.get.useQuery({ clientId: clientIdNum }, { enabled: !!clientId });
  const { data: assignedPrograms, refetch: refetchPrograms } = trpc.programs.getByClient.useQuery({ clientId: clientIdNum }, { enabled: !!clientId });
  const { data: checkIns } = trpc.checkIns.getByClient.useQuery({ clientId: clientIdNum }, { enabled: !!clientId });

  const updateMutation = trpc.clients.update.useMutation({ onSuccess: () => { setIsEditing(false); refetch(); } });
  const unassignMutation = trpc.programs.unassign.useMutation({ onSuccess: () => refetchPrograms() });
  const macroMutation = trpc.clientMacros.update.useMutation({ onSuccess: () => { setMacroEdit(false); refetch(); } });

  // AI tools
  const analyzeCheckInMutation = trpc.aiCoach.analyzeCheckIn.useMutation({
    onSuccess: (data) => setAiResult({ type: "Check-In Analysis", data }),
  });
  const progressionMutation = trpc.aiCoach.generateProgramProgression.useMutation({
    onSuccess: (data) => setAiResult({ type: "Program Progression", data }),
  });
  const nutritionMutation = trpc.aiCoach.generateNutritionAdjustment.useMutation({
    onSuccess: (data) => setAiResult({ type: "Nutrition Adjustment", data }),
  });

  // Archive = soft delete (set status inactive)
  const archiveMutation = trpc.clients.update.useMutation({
    onSuccess: () => setLocation("/clients"),
  });

  useEffect(() => {
    if (client && !isEditing) {
      const g = typeof client.goals === "string" ? client.goals : (client.goals as any)?.[0] || "";
      const i = typeof client.injuries === "string" ? client.injuries : (client.injuries as any)?.[0] || "";
      setFormData({ name: client.name || "", email: client.email || "", age: client.age?.toString() || "", sex: client.sex || "", weight: client.weight || "", height: client.height || "", goals: g, injuries: i, fitnessLevel: client.fitnessLevel || "", trainingType: client.trainingType || "" });
      setMacros({
        dailyCalorieTarget: client.dailyCalorieTarget?.toString() ?? "",
        proteinTargetG: (client as any).proteinTargetG?.toString() ?? "",
        carbsTargetG: (client as any).carbsTargetG?.toString() ?? "",
        fatTargetG: (client as any).fatTargetG?.toString() ?? "",
        fiberTargetG: (client as any).fiberTargetG?.toString() ?? "",
        waterTargetOz: (client as any).waterTargetOz?.toString() ?? "",
      });
    }
  }, [client, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    updateMutation.mutate({ clientId: clientIdNum, name: formData.name, email: formData.email, age: parseInt(formData.age), sex: formData.sex as "male" | "female" | "other", weight: formData.weight, height: formData.height, goals: formData.goals ? [formData.goals] : [], injuries: formData.injuries ? [formData.injuries] : [], fitnessLevel: (formData.fitnessLevel || "beginner") as any, trainingType: (formData.trainingType || "in-person") as any });
  };

  const handleSaveMacros = () => {
    macroMutation.mutate({
      clientId: clientIdNum,
      dailyCalorieTarget: macros.dailyCalorieTarget ? parseInt(macros.dailyCalorieTarget) : undefined,
      proteinTargetG: macros.proteinTargetG ? parseInt(macros.proteinTargetG) : undefined,
      carbsTargetG: macros.carbsTargetG ? parseInt(macros.carbsTargetG) : undefined,
      fatTargetG: macros.fatTargetG ? parseInt(macros.fatTargetG) : undefined,
      fiberTargetG: macros.fiberTargetG ? parseInt(macros.fiberTargetG) : undefined,
      waterTargetOz: macros.waterTargetOz ? parseInt(macros.waterTargetOz) : undefined,
    });
  };

  const field = (label: string, val: string) => (
    <div key={label}>
      <p className="font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="font-rajdhani mt-0.5" style={{ color: "var(--white)" }}>{val || "—"}</p>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--black)", color: "var(--white)" }}>
      <div className="max-w-5xl mx-auto"><p className="font-rajdhani animate-pulse" style={{ color: "var(--muted)" }}>Loading client profile...</p></div>
    </div>
  );

  if (!client) return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--black)", color: "var(--white)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Client not found.</p>
        <Button variant="primary" onClick={() => setLocation("/clients")} className="mt-4">Back to Clients</Button>
      </div>
    </div>
  );

  const latestCheckIn = checkIns?.[0];
  const latestProgramId = assignedPrograms?.[0]?.id;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--black)", color: "var(--white)" }}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>{client.name}</h1>
            <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
              {client.email} · {client.status === "active" ? <span style={{ color: "var(--success)" }}>Active</span> : <span style={{ color: "var(--warn)" }}>{client.status}</span>}
            </p>
          </div>
          {!isEditing && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/public-profile/${clientId}`); alert("Profile link copied!"); }} style={{ backgroundColor: "var(--gold)", color: "#000" }}>📋 Share</Button>
              <a href={`/messaging?clientId=${clientId}`} className="inline-flex items-center px-4 py-2 rounded-lg font-oswald text-xs uppercase tracking-widest transition-all hover:brightness-110" style={{ backgroundColor: "var(--surface)", color: "var(--gold)", border: "1px solid var(--border-gold)" }}>💬 Message</a>
              {client.status !== "inactive" ? (
                <Button variant="danger" onClick={() => { if (confirm(`Archive ${client.name}? They will become inactive.`)) archiveMutation.mutate({ clientId: clientIdNum, status: "inactive" }); }} disabled={archiveMutation.isPending}>
                  {archiveMutation.isPending ? "Archiving..." : "Archive"}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => updateMutation.mutate({ clientId: clientIdNum, status: "active" })}>Reactivate</Button>
              )}
            </div>
          )}
          {isEditing && <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>}
        </div>

        {/* Edit form */}
        {isEditing && (
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { ph: "Name", k: "name", type: "text" }, { ph: "Email", k: "email", type: "email" },
                    { ph: "Age", k: "age", type: "number" }, { ph: "Weight (lbs)", k: "weight", type: "number" },
                    { ph: "Height (inches)", k: "height", type: "number" },
                  ].map(({ ph, k, type }) => (
                    <input key={k} type={type} placeholder={ph} value={(formData as any)[k]} onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                      className="border px-4 py-2.5 font-rajdhani" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }} />
                  ))}
                  <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })}
                    className="border px-4 py-2.5 font-rajdhani" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }}>
                    <option value="">Select Sex</option>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                  <select value={formData.fitnessLevel} onChange={e => setFormData({ ...formData, fitnessLevel: e.target.value })}
                    className="border px-4 py-2.5 font-rajdhani" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }}>
                    <option value="">Fitness Level</option>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option><option value="elite">Elite</option>
                  </select>
                  <select value={formData.trainingType} onChange={e => setFormData({ ...formData, trainingType: e.target.value })}
                    className="border px-4 py-2.5 font-rajdhani" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }}>
                    <option value="in-person">In-Person</option><option value="online">Online</option><option value="adaptive">Adaptive</option>
                  </select>
                  <textarea placeholder="Goals" value={formData.goals} onChange={e => setFormData({ ...formData, goals: e.target.value })}
                    className="border px-4 py-2.5 font-rajdhani col-span-2" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }} />
                  <textarea placeholder="Injuries / Limitations" value={formData.injuries} onChange={e => setFormData({ ...formData, injuries: e.target.value })}
                    className="border px-4 py-2.5 font-rajdhani col-span-2" style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)", color: "var(--white)" }} />
                </div>
                <Button variant="primary" type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {updateMutation.isError && <p className="font-rajdhani text-sm" style={{ color: "var(--red)" }}>{updateMutation.error?.message}</p>}
              </form>
            </CardBody>
          </Card>
        )}

        {!isEditing && (
          <>
            {/* Programs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-oswald uppercase text-lg" style={{ color: "var(--white)" }}>Assigned Programs</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)}>+ Assign Program</Button>
              </div>
              {assignedPrograms && assignedPrograms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedPrograms.map((p) => (
                    <Card key={p.id}>
                      <CardBody>
                        <h3 className="font-oswald" style={{ color: "var(--gold)" }}>{p.name}</h3>
                        <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>{p.programType} · {p.duration} weeks</p>
                        <button onClick={() => unassignMutation.mutate({ programId: p.id })} disabled={unassignMutation.isPending}
                          className="font-oswald text-xs uppercase mt-3 disabled:opacity-50" style={{ color: "var(--red)" }}>
                          {unassignMutation.isPending ? "Removing..." : "Unassign"}
                        </button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card><CardBody className="text-center py-8"><p className="font-rajdhani" style={{ color: "var(--muted)" }}>No programs assigned.</p></CardBody></Card>
              )}
            </div>

            {/* Profile cards */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader><h2 className="font-oswald uppercase text-sm" style={{ color: "var(--white)" }}>Personal Info</h2></CardHeader>
                <CardBody className="space-y-3">
                  {field("Age", client.age?.toString() ?? "")}
                  {field("Sex", client.sex ? client.sex.charAt(0).toUpperCase() + client.sex.slice(1) : "")}
                  {field("Weight", client.weight ? `${client.weight} lbs` : "")}
                  {field("Height", client.height ? `${client.height} in` : "")}
                </CardBody>
              </Card>
              <Card>
                <CardHeader><h2 className="font-oswald uppercase text-sm" style={{ color: "var(--white)" }}>Training Info</h2></CardHeader>
                <CardBody className="space-y-3">
                  {field("Fitness Level", client.fitnessLevel ? client.fitnessLevel.charAt(0).toUpperCase() + client.fitnessLevel.slice(1) : "")}
                  {field("Training Type", client.trainingType ? client.trainingType.charAt(0).toUpperCase() + client.trainingType.slice(1) : "")}
                  {field("Goals", typeof client.goals === "string" ? client.goals : (client.goals as any)?.join(", ") ?? "")}
                  {field("Injuries", typeof client.injuries === "string" ? client.injuries : (client.injuries as any)?.join(", ") ?? "")}
                </CardBody>
              </Card>
            </div>

            {/* Macro Targets */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-oswald uppercase text-sm" style={{ color: "var(--white)" }}>Macro Targets</h2>
                <button onClick={() => setMacroEdit(!macroEdit)} className="font-oswald text-xs uppercase" style={{ color: "var(--gold)" }}>
                  {macroEdit ? "Cancel" : "Edit Targets"}
                </button>
              </CardHeader>
              <CardBody>
                {macroEdit ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: "Calories / day", key: "dailyCalorieTarget", unit: "kcal" },
                        { label: "Protein", key: "proteinTargetG", unit: "g" },
                        { label: "Carbs", key: "carbsTargetG", unit: "g" },
                        { label: "Fat", key: "fatTargetG", unit: "g" },
                        { label: "Fiber", key: "fiberTargetG", unit: "g" },
                        { label: "Water", key: "waterTargetOz", unit: "oz" },
                      ].map(({ label, key, unit }) => (
                        <div key={key}>
                          <label className="block font-oswald text-xs uppercase mb-1" style={{ color: "var(--muted)" }}>{label} ({unit})</label>
                          <input type="number" value={(macros as any)[key]} onChange={e => setMacros({ ...macros, [key]: e.target.value })} placeholder="—"
                            className="w-full px-3 py-2 rounded font-rajdhani" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
                        </div>
                      ))}
                    </div>
                    <Button variant="primary" onClick={handleSaveMacros} disabled={macroMutation.isPending}>
                      {macroMutation.isPending ? "Saving..." : "Save Macro Targets"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                      { label: "Calories", val: client.dailyCalorieTarget, unit: "kcal" },
                      { label: "Protein", val: (client as any).proteinTargetG, unit: "g" },
                      { label: "Carbs", val: (client as any).carbsTargetG, unit: "g" },
                      { label: "Fat", val: (client as any).fatTargetG, unit: "g" },
                      { label: "Fiber", val: (client as any).fiberTargetG, unit: "g" },
                      { label: "Water", val: (client as any).waterTargetOz, unit: "oz" },
                    ].map(({ label, val, unit }) => (
                      <div key={label} className="text-center">
                        <p className="font-bebas text-2xl" style={{ color: val ? "var(--gold)" : "var(--muted)" }}>{val ?? "—"}</p>
                        <p className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>{label}{val ? ` ${unit}` : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* AI Tools */}
            <Card>
              <CardHeader>
                <h2 className="font-oswald uppercase text-sm" style={{ color: "var(--gold)" }}>🤖 AI Coaching Tools</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => { if (latestCheckIn) analyzeCheckInMutation.mutate({ checkInId: latestCheckIn.id }); else alert("No check-ins found for this client."); }}
                    disabled={analyzeCheckInMutation.isPending || !latestCheckIn}
                    className="px-4 py-3 rounded-lg text-left transition-all hover:brightness-110 disabled:opacity-40"
                    style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                    <p className="font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Analyze Check-In</p>
                    <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {analyzeCheckInMutation.isPending ? "Analyzing…" : latestCheckIn ? `Latest: ${new Date(latestCheckIn.createdAt).toLocaleDateString()}` : "No check-ins yet"}
                    </p>
                  </button>
                  <button
                    onClick={() => { if (latestProgramId) progressionMutation.mutate({ clientId: clientIdNum, currentProgramId: latestProgramId }); else alert("No program assigned."); }}
                    disabled={progressionMutation.isPending || !latestProgramId}
                    className="px-4 py-3 rounded-lg text-left transition-all hover:brightness-110 disabled:opacity-40"
                    style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                    <p className="font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Program Progression</p>
                    <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {progressionMutation.isPending ? "Generating…" : latestProgramId ? "Generate next phase" : "No program assigned"}
                    </p>
                  </button>
                  <button
                    onClick={() => nutritionMutation.mutate({ clientId: clientIdNum })}
                    disabled={nutritionMutation.isPending}
                    className="px-4 py-3 rounded-lg text-left transition-all hover:brightness-110 disabled:opacity-40"
                    style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                    <p className="font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Nutrition Adjustment</p>
                    <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {nutritionMutation.isPending ? "Analyzing…" : "Based on weight trend"}
                    </p>
                  </button>
                </div>

                {/* AI result panel */}
                {aiResult && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>{aiResult.type}</h3>
                      <button onClick={() => setAiResult(null)} className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>✕ Close</button>
                    </div>
                    {aiResult.data.summary && <p className="font-rajdhani mb-3" style={{ color: "var(--white)" }}>{aiResult.data.summary}</p>}
                    {aiResult.data.progressNote && <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--success)" }}>✓ {aiResult.data.progressNote}</p>}
                    {aiResult.data.rationale && <p className="font-rajdhani mb-3" style={{ color: "var(--white)" }}>{aiResult.data.rationale}</p>}
                    {aiResult.data.concerns?.length > 0 && (
                      <div className="mb-2">
                        <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--warn)" }}>Concerns</p>
                        {aiResult.data.concerns.map((c: string, i: number) => <p key={i} className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>• {c}</p>)}
                      </div>
                    )}
                    {aiResult.data.recommendations?.length > 0 && (
                      <div>
                        <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--gold)" }}>Recommendations</p>
                        {aiResult.data.recommendations.map((r: string, i: number) => <p key={i} className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>→ {r}</p>)}
                      </div>
                    )}
                    {(aiResult.data.calories || aiResult.data.proteinG || aiResult.data.carbsG) && (
                      <div className="flex gap-4 mt-2 flex-wrap">
                        {aiResult.data.calories && <span className="font-rajdhani text-sm" style={{ color: "var(--gold)" }}>Calories: {aiResult.data.calories > 0 ? "+" : ""}{aiResult.data.calories} kcal/day</span>}
                        {aiResult.data.proteinG && <span className="font-rajdhani text-sm" style={{ color: "var(--gold)" }}>Protein: {aiResult.data.proteinG > 0 ? "+" : ""}{aiResult.data.proteinG}g</span>}
                        {aiResult.data.carbsG && <span className="font-rajdhani text-sm" style={{ color: "var(--gold)" }}>Carbs: {aiResult.data.carbsG > 0 ? "+" : ""}{aiResult.data.carbsG}g</span>}
                        {aiResult.data.timeline && <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>Timeline: {aiResult.data.timeline}</span>}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}

        <Button variant="secondary" onClick={() => setLocation("/clients")} className="mt-4">Back to Clients</Button>

        <ProgramAssignmentModal clientId={clientIdNum} isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onAssignSuccess={() => refetchPrograms()} />
      </div>
    </div>
  );
}
