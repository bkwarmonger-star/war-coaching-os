import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

const CATEGORY_ICONS: Record<string, string> = { steps: "👟", water: "💧", sleep: "😴", supplements: "💊", meditation: "🧘", workout: "💪", custom: "⭐" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(offsetWeeks = 0) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function HabitTrackingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: habits, isLoading, refetch } = trpc.habits.listForClient.useQuery();
  const { data: streakData } = trpc.habits.getStreak.useQuery();
  const weekDates = getWeekDates(0);
  const weekStart = weekDates[0];
  const { data: weekEntries } = trpc.habits.getWeekEntries.useQuery({ weekStartDate: weekStart });
  const logMutation = trpc.habits.logEntry.useMutation({ onSuccess: () => { refetch(); } });

  const [values, setValues] = useState<Record<number, string>>({});

  const handleLog = useCallback((habitId: number, completed: boolean, valueStr?: string) => {
    const value = valueStr !== undefined ? parseFloat(valueStr) || undefined : undefined;
    logMutation.mutate({ habitTemplateId: habitId, date: today, value, completed });
  }, [today, logMutation]);

  const weekEntryMap: Record<string, Record<number, boolean>> = {};
  (weekEntries ?? []).forEach((e: any) => {
    if (!weekEntryMap[e.date]) weekEntryMap[e.date] = {};
    weekEntryMap[e.date][e.habitTemplateId] = e.completed;
  });

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: "var(--surface)" }} />)}
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-bebas text-4xl mb-2" style={{ color: "var(--gold)" }}>🎯</p>
        <h3 className="font-bebas text-2xl mb-2" style={{ color: "var(--white)" }}>NO HABITS SET YET</h3>
        <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Your trainer will assign daily habits to track. Check back soon!</p>
      </div>
    );
  }

  const streak = streakData?.currentStreak ?? 0;
  const todayCompleted = habits.filter((h: any) => h.todayEntry?.completed).length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY HABITS</h2>
          <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-gold)" }}>
            <p className="font-bebas text-2xl" style={{ color: "var(--gold)" }}>🔥 {streak}</p>
            <p className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>Day Streak</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="font-bebas text-2xl" style={{ color: "var(--success)" }}>{todayCompleted}/{habits.length}</p>
            <p className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>Today</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface3)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: habits.length > 0 ? `${(todayCompleted / habits.length) * 100}%` : "0%", background: "linear-gradient(90deg, var(--gold-dim), var(--gold))" }} />
      </div>

      {/* Habit cards */}
      <div className="space-y-3">
        {habits.map((habit: any) => {
          const isCompleted = habit.todayEntry?.completed ?? false;
          const currentVal = values[habit.id] ?? (habit.todayEntry?.value?.toString() ?? "");
          const hasTarget = habit.dailyTarget && parseFloat(habit.dailyTarget) > 0;
          return (
            <div key={habit.id} className="rounded-xl p-4" style={{
              backgroundColor: "var(--surface)",
              border: `1px solid ${isCompleted ? "rgba(45,179,109,0.35)" : "var(--border)"}`,
              transition: "border-color 0.2s"
            }}>
              <div className="flex items-start gap-4">
                {/* Icon + status */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-2xl">{CATEGORY_ICONS[habit.category] ?? "⭐"}</span>
                  <button onClick={() => handleLog(habit.id, !isCompleted, currentVal || undefined)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ backgroundColor: isCompleted ? "var(--success)" : "var(--surface2)", border: `2px solid ${isCompleted ? "var(--success)" : "var(--border)"}` }}>
                    {isCompleted && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-oswald text-base uppercase" style={{ color: isCompleted ? "var(--success)" : "var(--white)" }}>{habit.name}</h4>
                    <span className="font-rajdhani text-xs capitalize" style={{ color: "var(--muted)" }}>{habit.category}</span>
                  </div>

                  {hasTarget && (
                    <div className="mt-2 flex items-center gap-3">
                      <input type="number" value={currentVal} onChange={e => setValues(prev => ({ ...prev, [habit.id]: e.target.value }))}
                        onBlur={e => e.target.value && handleLog(habit.id, parseFloat(e.target.value) >= parseFloat(habit.dailyTarget), e.target.value)}
                        placeholder="0" className="w-24 px-2 py-1 rounded font-rajdhani text-sm"
                        style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }} />
                      <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>/ {habit.dailyTarget} {habit.unit}</span>
                      {currentVal && parseFloat(habit.dailyTarget) > 0 && (
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface3)", maxWidth: "100px" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(currentVal) / parseFloat(habit.dailyTarget)) * 100)}%`, backgroundColor: "var(--gold)", transition: "width 0.3s" }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weekly dots */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {weekDates.map((date, i) => {
                      const done = weekEntryMap[date]?.[habit.id];
                      const isToday = date === today;
                      return (
                        <div key={date} className="flex flex-col items-center gap-0.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: done ? "var(--success)" : isToday ? "var(--border-gold)" : "var(--surface3)", border: isToday ? "1px solid var(--gold)" : "none" }} />
                          <span className="font-rajdhani" style={{ fontSize: "0.55rem", color: "var(--muted)" }}>{DAYS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
