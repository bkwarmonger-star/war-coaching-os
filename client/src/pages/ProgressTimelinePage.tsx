import { trpc } from "@/lib/trpc";

type TimelineEvent = {
  id: string;
  type: "checkin" | "photo" | "achievement" | "weight";
  date: Date;
  title: string;
  description: string;
  color: string;
  icon: string;
  data?: any;
};

export default function ProgressTimelinePage() {
  const { data: checkIns } = trpc.portal.getMyCheckIns.useQuery();
  const { data: achievements } = trpc.achievements.list.useQuery();

  const events: TimelineEvent[] = [];

  (checkIns ?? []).forEach((ci: any) => {
    if (ci.photoUrls) {
      try {
        const photos = JSON.parse(ci.photoUrls);
        if (photos.length > 0) {
          events.push({ id: `photo-${ci.id}`, type: "photo", date: new Date(ci.createdAt), title: "Progress Photos", description: `${photos.length} photo${photos.length > 1 ? "s" : ""} submitted`, color: "#60a5fa", icon: "📸", data: photos });
        }
      } catch {}
    }
    events.push({
      id: `ci-${ci.id}`, type: "checkin", date: new Date(ci.createdAt),
      title: `Weekly Check-In ${ci.weight ? `— ${ci.weight} lbs` : ""}`,
      description: ci.notes ?? (ci.energyLevel ? `Energy: ${ci.energyLevel}/10` : "Check-in submitted"),
      color: ci.status === "responded" ? "var(--success)" : "var(--gold)", icon: "📋", data: ci
    });
  });

  (achievements ?? []).filter((a: any) => a.unlocked).forEach((a: any) => {
    events.push({ id: `ach-${a.id}`, type: "achievement", date: new Date(a.unlockedAt), title: `Achievement: ${a.name}`, description: a.description ?? "", color: "var(--gold)", icon: a.icon ?? "🏆", data: a });
  });

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">📈</p>
        <h3 className="font-bebas text-2xl mb-2" style={{ color: "var(--white)" }}>YOUR STORY STARTS HERE</h3>
        <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Submit your first check-in to start building your progress timeline.</p>
      </div>
    );
  }

  // Group by month
  const groups: Record<string, TimelineEvent[]> = {};
  events.forEach(e => {
    const key = e.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return (
    <div className="space-y-8">
      <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY PROGRESS TIMELINE</h2>
      {Object.entries(groups).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="font-oswald text-sm uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>{month}</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div className="space-y-4">
              {monthEvents.map(event => (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  {/* Dot */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base z-10"
                    style={{ backgroundColor: "var(--surface)", border: `2px solid ${event.color}` }}>
                    {event.icon}
                  </div>
                  {/* Card */}
                  <div className="flex-1 rounded-lg p-4 mb-1" style={{ backgroundColor: "var(--surface)", border: `1px solid ${event.color}33` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-oswald text-sm uppercase" style={{ color: "var(--white)" }}>{event.title}</p>
                        <p className="font-rajdhani text-sm mt-0.5" style={{ color: "var(--muted)" }}>{event.description}</p>
                        {event.type === "checkin" && event.data?.trainerFeedback && (
                          <div className="mt-2 pl-3 border-l-2" style={{ borderColor: "var(--gold)" }}>
                            <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>Coach: {event.data.trainerFeedback}</p>
                          </div>
                        )}
                        {event.type === "photo" && event.data?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {event.data.slice(0, 4).map((url: string, i: number) => (
                              <div key={i} className="w-12 h-16 rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                                <img src={url} alt="progress" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-rajdhani text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                        {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
