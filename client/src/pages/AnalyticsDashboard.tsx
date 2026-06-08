import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/Button";

const RISK_COLORS: Record<string, string> = { low: "var(--success)", medium: "var(--warn)", high: "var(--red)" };

export default function AnalyticsDashboard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
      <div className="text-center">
        <p className="font-bebas text-2xl" style={{ color: "var(--red)" }}>TRAINER ONLY</p>
        <p className="font-rajdhani mt-1" style={{ color: "var(--muted)" }}>This page is restricted to trainers.</p>
        <a href="/portal" className="mt-4 inline-block font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>Go to your portal</a>
      </div>
    </div>
  );

  const { data: revenue } = trpc.analytics.getRevenueSummary.useQuery();
  const { data: funnel } = trpc.analytics.getLeadFunnel.useQuery();
  const { data: history } = trpc.analytics.getMonthlyRevenueHistory.useQuery();
  const { data: riskData, refetch: refetchRisk } = trpc.retention.getRiskDashboard.useQuery();
  const summaryMutation = trpc.aiCoach.generateWeeklySummary.useMutation();
  const calcRiskMutation = trpc.retention.calculateRiskScores.useMutation({ onSuccess: () => refetchRisk() });

  const highRisk = (riskData ?? []).filter((r: any) => r.score?.riskLevel === "high").length;
  const medRisk = (riskData ?? []).filter((r: any) => r.score?.riskLevel === "medium").length;
  const lowRisk = (riskData ?? []).filter((r: any) => r.score?.riskLevel === "low").length;

  const summary = summaryMutation.data;

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>BUSINESS ANALYTICS</h1>
          <p className="font-rajdhani" style={{ color: "var(--muted)" }}>W.A.R. Coaching — Executive Overview</p>
        </div>

        {/* Revenue KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Monthly Revenue", value: `$${(revenue?.mrr ?? 0).toFixed(0)}`, sub: "This month", color: "gold" },
            { label: "ARR (Projected)", value: `$${((revenue?.arr ?? 0) / 1000).toFixed(1)}k`, sub: "Annualized", color: "green" },
            { label: "Avg Client Value", value: `$${(revenue?.avgClientValue ?? 0).toFixed(0)}`, sub: "Total ÷ active", color: "warn" },
            { label: "Active Clients", value: String(revenue?.activeClients ?? 0), sub: "Currently enrolled", color: "gold" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>{label}</div>
              <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>{value}</div>
              <div className="font-rajdhani text-sm mt-1" style={{ color: "var(--muted)" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>MONTHLY REVENUE</h3></CardHeader>
            <CardBody>
              {history && history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={history}>
                    <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "Rajdhani" }} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)", borderRadius: "8px", color: "var(--white)", fontFamily: "Rajdhani" }} />
                    <Bar dataKey="revenue" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="font-rajdhani text-center py-8" style={{ color: "var(--muted)" }}>No revenue data yet</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>LEAD FUNNEL</h3></CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: "Total Leads", value: funnel?.total ?? 0, pct: 100, color: "var(--gold)" },
                { label: "Contacted", value: funnel?.contacted ?? 0, pct: (funnel?.contactedRate ?? 0) * 100, color: "#60a5fa" },
                { label: "Qualified", value: funnel?.qualified ?? 0, pct: (funnel?.qualifiedRate ?? 0) * 100, color: "var(--warn)" },
                { label: "Converted", value: funnel?.converted ?? 0, pct: (funnel?.conversionRate ?? 0) * 100, color: "var(--success)" },
              ].map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between font-rajdhani text-sm mb-1">
                    <span style={{ color: "var(--white)" }}>{label}</span>
                    <span style={{ color }}>{value} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface3)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Retention panel */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>CLIENT RETENTION & RISK</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-3 text-sm font-rajdhani">
                <span style={{ color: "var(--success)" }}>● {lowRisk} Low</span>
                <span style={{ color: "var(--warn)" }}>● {medRisk} Med</span>
                <span style={{ color: "var(--red)" }}>● {highRisk} High</span>
              </div>
              <Button variant="outline" onClick={() => calcRiskMutation.mutate()} disabled={calcRiskMutation.isPending}>
                {calcRiskMutation.isPending ? "Calculating…" : "↺ Recalculate"}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {(riskData ?? []).length === 0 ? (
              <p className="font-rajdhani text-center py-6" style={{ color: "var(--muted)" }}>Run retention analysis from the Clients page to see risk scores.</p>
            ) : (
              <div className="space-y-2">
                {(riskData ?? []).slice(0, 10).map((row: any) => (
                  <div key={row.score?.clientId} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[row.score?.riskLevel ?? "low"] }} />
                      <div>
                        <p className="font-oswald text-sm uppercase" style={{ color: "var(--white)" }}>{row.clientName ?? "Unknown"}</p>
                        <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>{row.clientEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bebas text-xl" style={{ color: RISK_COLORS[row.score?.riskLevel ?? "low"] }}>{row.score?.score ?? 0}</div>
                      <span className="px-2 py-0.5 rounded font-oswald text-xs uppercase" style={{ backgroundColor: RISK_COLORS[row.score?.riskLevel ?? "low"] + "20", color: RISK_COLORS[row.score?.riskLevel ?? "low"], border: `1px solid ${RISK_COLORS[row.score?.riskLevel ?? "low"]}44` }}>
                        {row.score?.riskLevel ?? "low"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* AI Weekly Summary */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-bebas text-lg" style={{ color: "var(--white)" }}>AI WEEKLY SUMMARY</h3>
            <Button variant="outline" onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending}>
              {summaryMutation.isPending ? "Generating..." : "↺ Regenerate"}
            </Button>
          </CardHeader>
          <CardBody>
            {!summary ? (
              <div className="text-center py-6">
                <p className="font-rajdhani mb-4" style={{ color: "var(--muted)" }}>Generate an AI-powered summary of your coaching business this week.</p>
                <Button variant="primary" onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending}>
                  {summaryMutation.isPending ? "Generating..." : "Generate Summary"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-rajdhani leading-relaxed" style={{ color: "var(--white)" }}>{(summary as any).summary}</p>
                {(summary as any).highlights?.length > 0 && (
                  <div>
                    <h4 className="font-oswald text-sm uppercase mb-2" style={{ color: "var(--gold)" }}>Highlights</h4>
                    <ul className="space-y-1">
                      {(summary as any).highlights.map((h: string, i: number) => (
                        <li key={i} className="font-rajdhani text-sm flex items-start gap-2" style={{ color: "var(--muted)" }}>
                          <span style={{ color: "var(--success)" }}>✓</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(summary as any).actions?.length > 0 && (
                  <div>
                    <h4 className="font-oswald text-sm uppercase mb-2" style={{ color: "var(--warn)" }}>Action Items</h4>
                    <ul className="space-y-1">
                      {(summary as any).actions.map((a: string, i: number) => (
                        <li key={i} className="font-rajdhani text-sm flex items-start gap-2" style={{ color: "var(--muted)" }}>
                          <span style={{ color: "var(--warn)" }}>→</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
