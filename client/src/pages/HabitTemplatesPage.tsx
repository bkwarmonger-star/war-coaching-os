import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { Button } from "@/components/Button";
import { useState } from "react";

const CATEGORIES = [
  { value: "steps", label: "Steps", icon: "👣", unit: "steps" },
  { value: "water", label: "Water", icon: "💧", unit: "oz" },
  { value: "sleep", label: "Sleep", icon: "😴", unit: "hours" },
  { value: "supplements", label: "Supplements", icon: "💊", unit: "doses" },
  { value: "meditation", label: "Meditation", icon: "🧘", unit: "minutes" },
  { value: "workout", label: "Workout", icon: "🏋️", unit: "sessions" },
  { value: "custom", label: "Custom", icon: "⭐", unit: "" },
] as const;

function categoryMeta(value: string) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

export default function HabitTemplatesPage() {
  const utils = trpc.useUtils();
  const [filterClientId, setFilterClientId] = useState<number | "all" | "global">("all");

  const { data: clientsData } = trpc.clients.list.useQuery({ limit: 200, offset: 0 });
  const { data: templates, isLoading } = trpc.habits.trainerList.useQuery({});

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("steps");
  const [unit, setUnit] = useState("steps");
  const [dailyTarget, setDailyTarget] = useState("");
  const [icon, setIcon] = useState("👣");
  const [assignTo, setAssignTo] = useState<number | "global">("global");

  const createMutation = trpc.habits.trainerCreate.useMutation({
    onSuccess: () => {
      utils.habits.trainerList.invalidate();
      setShowForm(false);
      setName(""); setDailyTarget(""); setAssignTo("global");
    },
  });
  const setActiveMutation = trpc.habits.trainerSetActive.useMutation({
    onSuccess: () => utils.habits.trainerList.invalidate(),
  });
  const deleteMutation = trpc.habits.trainerDelete.useMutation({
    onSuccess: () => utils.habits.trainerList.invalidate(),
  });

  const clients = clientsData?.clients || [];
  const allTemplates = templates || [];

  const filtered = allTemplates.filter((t: any) => {
    if (filterClientId === "all") return true;
    if (filterClientId === "global") return !t.clientId;
    return t.clientId === filterClientId;
  });

  const handleCategoryChange = (value: typeof CATEGORIES[number]["value"]) => {
    setCategory(value);
    const meta = categoryMeta(value);
    setIcon(meta.icon);
    setUnit(meta.unit);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      clientId: assignTo === "global" ? undefined : assignTo,
      name: name.trim(),
      category,
      unit: unit || undefined,
      dailyTarget: dailyTarget ? parseFloat(dailyTarget) : undefined,
      icon: icon || undefined,
    });
  };

  const clientName = (clientId: number | null) => {
    if (!clientId) return null;
    return clients.find((c: any) => c.id === clientId)?.name || `Client #${clientId}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "var(--black)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-bebas text-4xl md:text-5xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
              HABIT TEMPLATES
            </h1>
            <p className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>
              Build daily habits to assign across your roster, or target an individual client
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? "Cancel" : "+ New Template"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>CREATE HABIT TEMPLATE</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                      Habit Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Morning walk, Drink water, Lights out by 10pm"
                      className="w-full px-4 py-2.5 rounded font-rajdhani"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded font-rajdhani"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                      Daily Target
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full px-4 py-2.5 rounded font-rajdhani"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                      Unit
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="steps, oz, minutes…"
                      className="w-full px-4 py-2.5 rounded font-rajdhani"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                      Icon (emoji)
                    </label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      maxLength={4}
                      className="w-full px-4 py-2.5 rounded font-rajdhani text-center text-xl"
                      style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-oswald text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                    Assign To
                  </label>
                  <select
                    value={assignTo === "global" ? "global" : String(assignTo)}
                    onChange={(e) => setAssignTo(e.target.value === "global" ? "global" : parseInt(e.target.value, 10))}
                    className="w-full md:w-80 px-4 py-2.5 rounded font-rajdhani"
                    style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                  >
                    <option value="global">🌐 All clients (roster-wide template)</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="font-rajdhani text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                    Roster-wide templates appear for every active client. Assigning to a specific client makes it visible only to them.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={!name.trim() || createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Create Template"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>YOUR TEMPLATES</h3>
            <div className="flex gap-2">
              {(["all", "global"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterClientId(f)}
                  className="px-3 py-1.5 rounded font-oswald text-xs uppercase tracking-widest transition-all"
                  style={
                    filterClientId === f
                      ? { backgroundColor: "var(--gold)", color: "#000" }
                      : { backgroundColor: "var(--surface2)", color: "var(--muted)", border: "1px solid var(--border)" }
                  }
                >
                  {f === "all" ? "All" : "Roster-wide"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg" style={{ backgroundColor: "var(--surface2)" }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="font-rajdhani text-center py-8" style={{ color: "var(--muted)" }}>
                No habit templates yet. Create one to start building consistency with your clients.
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((t: any) => {
                  const meta = categoryMeta(t.category);
                  const assignee = clientName(t.clientId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg flex-wrap gap-3"
                      style={{ backgroundColor: "var(--surface2)", border: `1px solid ${t.isActive ? "var(--border)" : "var(--red)"}`, opacity: t.isActive ? 1 : 0.6 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon || meta.icon}</span>
                        <div>
                          <p className="font-oswald text-sm uppercase tracking-wide" style={{ color: "var(--white)" }}>
                            {t.name}
                            {!t.isActive && <span className="ml-2 font-rajdhani text-xs normal-case" style={{ color: "var(--red)" }}>(inactive)</span>}
                          </p>
                          <p className="font-rajdhani text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {meta.label}
                            {t.dailyTarget ? ` · Target: ${t.dailyTarget}${t.unit ? ` ${t.unit}` : ""}` : ""}
                            {" · "}
                            {assignee ? `Assigned to ${assignee}` : "🌐 Roster-wide"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setActiveMutation.mutate({ id: t.id, isActive: !t.isActive })}
                          disabled={setActiveMutation.isPending}
                        >
                          {t.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { if (confirm(`Delete habit template "${t.name}"? This cannot be undone.`)) deleteMutation.mutate({ id: t.id }); }}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
