import { useState } from "react";
import { trpc } from "@/lib/trpc";

const CAT_COLORS: Record<string, string> = { streak: "var(--gold)", workout: "var(--red)", weight: "#60a5fa", nutrition: "var(--success)", engagement: "var(--warn)", milestone: "#a78bfa" };

export default function AchievementsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: allAchievements, isLoading } = trpc.achievements.list.useQuery();
  const { data: pointsData } = trpc.achievements.getPoints.useQuery();

  const filters = ["all", "unlocked", "streak", "workout", "weight", "nutrition", "engagement", "milestone"];

  const visible = (allAchievements ?? []).filter((a: any) => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.unlocked;
    return a.category === filter;
  });

  const unlockedCount = (allAchievements ?? []).filter((a: any) => a.unlocked).length;
  const total = allAchievements?.length ?? 0;

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-lg" style={{ backgroundColor: "var(--surface)" }} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY ACHIEVEMENTS</h2>
          <p className="font-rajdhani" style={{ color: "var(--muted)" }}>{unlockedCount} of {total} unlocked</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-gold)" }}>
            <p className="font-bebas text-xl" style={{ color: "var(--gold)" }}>⭐ {pointsData?.total ?? 0} pts</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between font-rajdhani text-xs mb-1" style={{ color: "var(--muted)" }}>
          <span>Progress</span><span>{total > 0 ? Math.round((unlockedCount / total) * 100) : 0}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface3)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? `${(unlockedCount / total) * 100}%` : "0%", background: "linear-gradient(90deg, var(--gold-dim), var(--gold))" }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded font-oswald text-xs uppercase tracking-wide transition-all capitalize"
            style={{ backgroundColor: filter === f ? "var(--gold)" : "var(--surface)", color: filter === f ? "#000" : "var(--muted)", border: `1px solid ${filter === f ? "var(--gold)" : "var(--border)"}` }}>
            {f}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((a: any) => (
          <div key={a.id} className="rounded-xl p-4 flex items-start gap-4" style={{
            backgroundColor: "var(--surface)",
            border: `1px solid ${a.unlocked ? (CAT_COLORS[a.category] + "55") : "var(--border)"}`,
            opacity: a.unlocked ? 1 : 0.55,
          }}>
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: a.unlocked ? (CAT_COLORS[a.category] + "20") : "var(--surface2)", border: `1px solid ${a.unlocked ? CAT_COLORS[a.category] : "var(--border)"}` }}>
              {a.unlocked ? (a.icon ?? "🏆") : "🔒"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-oswald text-sm uppercase" style={{ color: a.unlocked ? "var(--white)" : "var(--muted)" }}>{a.name}</h4>
                <span className="px-2 py-0.5 rounded text-xs font-oswald uppercase" style={{ backgroundColor: "transparent", color: CAT_COLORS[a.category] ?? "var(--muted)", border: `1px solid ${CAT_COLORS[a.category] ?? "var(--border)"}55` }}>{a.category}</span>
              </div>
              <p className="font-rajdhani text-sm mt-0.5" style={{ color: "var(--muted)" }}>{a.unlocked ? a.description : "Keep going to unlock this achievement"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-rajdhani text-xs" style={{ color: "var(--gold)" }}>⭐ {a.points} pts</span>
                {a.unlocked && a.unlockedAt && (
                  <span className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                    Unlocked {new Date(a.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="col-span-2 text-center py-10">
            <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No achievements match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
