import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: "Awaiting Review", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  reviewed: { label: "Reviewed", color: "var(--success)", bg: "rgba(45,179,109,0.1)" },
  draft: { label: "Draft", color: "var(--warn)", bg: "rgba(232,148,58,0.1)" },
};

export default function TrainerFormsPage() {
  const { user, loading } = useAuth();
  const { data: allSubmissions, isLoading, refetch } = trpc.forms.trainerList.useQuery(undefined, { enabled: user?.role === "admin" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");

  if (loading) return null;
  if (!user || user.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
      <div className="text-center"><p className="font-bebas text-2xl" style={{ color: "var(--red)" }}>ACCESS DENIED</p><p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>This page is for trainers only.</p><a href="/portal" className="mt-4 inline-block font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Go to Client Portal</a></div>
    </div>
  );

  if (isLoading) return <div className="p-8 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg" style={{ backgroundColor: "var(--surface)" }} />)}</div>;

  if (selectedId) {
    const item = allSubmissions?.find((s: any) => s.submission.id === selectedId);
    if (item) return <SubmissionDetail item={item as any} onBack={() => { setSelectedId(null); refetch(); }} />;
  }

  const filtered = (allSubmissions ?? []).filter((s: any) => {
    if (filterStatus !== "all" && s.submission.status !== filterStatus) return false;
    if (filterClient && !(s.clientName ?? "").toLowerCase().includes(filterClient.toLowerCase())) return false;
    return true;
  });
  const newCount = (allSubmissions ?? []).filter((s: any) => s.submission.status === "submitted").length;

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>CLIENT FORMS</h1>
            <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Review and respond to client form submissions</p>
          </div>
          {newCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded" style={{ backgroundColor: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#60a5fa" }} />
              <span className="font-oswald text-sm uppercase" style={{ color: "#60a5fa" }}>{newCount} Awaiting Review</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <input type="text" value={filterClient} onChange={e => setFilterClient(e.target.value)} placeholder="Search by client..." className="px-4 py-2 rounded font-rajdhani text-sm flex-1 min-w-[180px]" style={{ backgroundColor: "var(--surface)", color: "var(--white)", border: "1px solid var(--border)" }} />
          {["all", "submitted", "reviewed", "draft"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className="px-4 py-2 rounded font-oswald text-xs uppercase tracking-wider transition-all"
              style={{ backgroundColor: filterStatus === s ? "var(--gold)" : "var(--surface)", color: filterStatus === s ? "#000" : "var(--muted)", border: `1px solid ${filterStatus === s ? "var(--gold)" : "var(--border)"}` }}>
              {s === "all" ? "All" : s === "submitted" ? "Needs Review" : s === "reviewed" ? "Reviewed" : "Drafts"}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><p className="font-bebas text-xl" style={{ color: "var(--muted)" }}>No submissions found</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item: any) => {
              const s = item.submission;
              const meta = STATUS_META[s.status] ?? { label: s.status, color: "var(--muted)", bg: "transparent" };
              return (
                <button key={s.id} className="w-full text-left rounded-lg p-4 flex items-center justify-between hover:opacity-90 transition-all"
                  style={{ backgroundColor: "var(--surface)", border: s.status === "submitted" ? "1px solid rgba(96,165,250,0.3)" : "1px solid var(--border)" }}
                  onClick={() => setSelectedId(s.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bebas text-base flex-shrink-0" style={{ backgroundColor: "var(--surface2)", color: "var(--gold)", border: "1px solid var(--border-gold)" }}>
                      {(item.clientName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-oswald text-base" style={{ color: "var(--white)" }}>{item.clientName ?? "Unknown"}</p>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                        {item.formName ?? `Form #${s.formTemplateId}`} · {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Draft"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="px-3 py-1 rounded text-xs font-oswald uppercase" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionDetail({ item, onBack }: { item: any; onBack: () => void }) {
  const s = item.submission;
  const [notes, setNotes] = useState(s.trainerNotes ?? "");
  const [done, setDone] = useState(s.status === "reviewed");
  const reviewMutation = trpc.forms.reviewSubmission.useMutation({ onSuccess: () => setDone(true) });
  const responses: Record<string, any> = (() => { try { return JSON.parse(s.responses); } catch { return {}; } })();
  const fields: any[] = (() => { try { return JSON.parse(item.formFields ?? "[]"); } catch { return []; } })();
  const getFieldLabel = (id: string) => { for (const f of fields) { if (f.id === id) return f.label; if (f.followUp?.id === id) return f.followUp.label; } return id; };
  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 font-oswald text-xs uppercase hover:opacity-60" style={{ color: "var(--muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back
          </button>
          <div><h2 className="font-bebas text-2xl" style={{ color: "var(--white)" }}>{item.clientName} — {item.formName ?? "Form"}</h2>
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>{item.clientEmail} · {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Draft"}</p></div>
        </div>
        <Card>
          <CardHeader><h3 className="font-oswald text-base uppercase" style={{ color: "var(--gold)" }}>Form Responses</h3></CardHeader>
          <CardBody className="space-y-3">
            {Object.entries(responses).map(([key, val]) => {
              const displayVal = Array.isArray(val) ? val.join(", ") : String(val ?? "—");
              return (
                <div key={key} className="py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--muted)" }}>{getFieldLabel(key)}</p>
                  <p className="font-rajdhani" style={{ color: displayVal === "—" ? "var(--muted)" : "var(--white)" }}>{displayVal}</p>
                </div>
              );
            })}
            {Object.keys(responses).length === 0 && <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No responses recorded.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h3 className="font-oswald text-base uppercase" style={{ color: "var(--gold)" }}>Trainer Notes</h3></CardHeader>
          <CardBody className="space-y-4">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={done} rows={5} placeholder="Private notes (not visible to client)..." className="w-full px-4 py-3 rounded font-rajdhani resize-none" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)", opacity: done ? 0.7 : 1 }} />
            {done ? (
              <div className="flex items-center gap-2 p-3 rounded" style={{ backgroundColor: "rgba(45,179,109,0.1)", border: "1px solid rgba(45,179,109,0.3)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--success)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <p className="font-rajdhani text-sm" style={{ color: "var(--success)" }}>Reviewed</p>
              </div>
            ) : (
              <Button onClick={() => reviewMutation.mutate({ submissionId: s.id, notes })} disabled={reviewMutation.isPending} variant="primary">
                {reviewMutation.isPending ? "Saving…" : "Mark as Reviewed"}
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
