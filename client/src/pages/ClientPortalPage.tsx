import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";
import HabitTrackingPage from "@/pages/HabitTrackingPage";
import AchievementsPage from "@/pages/AchievementsPage";
import ProgressTimelinePage from "@/pages/ProgressTimelinePage";

type PortalTab = "dashboard" | "programs" | "meals" | "forms" | "habits" | "checkins" | "messages" | "progress" | "timeline" | "achievements" | "sessions";

export default function ClientPortalPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<PortalTab>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          <p className="font-rajdhani text-lg" style={{ color: "var(--muted)" }}>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--black)" }}>
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--surface2)", border: "2px solid var(--gold)" }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="font-bebas text-3xl mb-2" style={{ color: "var(--gold)" }}>CLIENT PORTAL</h2>
            <p className="font-rajdhani mb-6" style={{ color: "var(--muted)" }}>
              Sign in to access your training programs, meal plans, and progress tracking.
            </p>
            <a
              href={getLoginUrl()}
              className="inline-block px-8 py-3 rounded font-oswald uppercase tracking-wider transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--gold)", color: "#000" }}
            >
              Sign In
            </a>
          </CardBody>
        </Card>
      </div>
    );
  }

  return <PortalContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function PortalContent({ activeTab, setActiveTab }: { activeTab: PortalTab; setActiveTab: (t: PortalTab) => void }) {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.portal.getMyProfile.useQuery();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          <p className="font-rajdhani text-lg" style={{ color: "var(--muted)" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <Card className="max-w-lg w-full mx-4">
          <CardBody className="text-center py-12">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "var(--surface2)", border: "2px solid var(--gold-dim)" }}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold-dim)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="font-bebas text-3xl mb-3" style={{ color: "var(--gold)" }}>ACCOUNT NOT LINKED</h2>
            <p className="font-rajdhani text-lg mb-2" style={{ color: "var(--white)" }}>
              Welcome, {user?.name || "Athlete"}!
            </p>
            <p className="font-rajdhani mb-6" style={{ color: "var(--muted)" }}>
              Your account hasn't been linked to a client profile yet. Contact your trainer to get set up with your personalized training portal.
            </p>
            <div className="p-4 rounded" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
              <p className="font-oswald text-sm uppercase mb-1" style={{ color: "var(--gold)" }}>Your Trainer</p>
              <p className="font-rajdhani text-lg font-semibold" style={{ color: "var(--white)" }}>Justin Watson</p>
              <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>BKFC Pro Fighter | 6x ISSA Certified</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const tabs: { id: PortalTab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "programs", label: "Programs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "meals", label: "Nutrition", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: "habits", label: "Habits", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "achievements", label: "Achievements", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
    { id: "forms", label: "Forms", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "checkins", label: "Check-Ins", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    { id: "messages", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { id: "progress", label: "Progress", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { id: "timeline", label: "Timeline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "sessions", label: "Sessions", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--black)" }}>
      {/* Portal Header */}
      <div className="border-b" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bebas text-2xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
                MY TRAINING PORTAL
              </h1>
              <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                Welcome back, {profile.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-oswald text-sm" style={{ backgroundColor: "var(--gold)", color: "#000" }}>
                {profile.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b overflow-x-auto" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 font-oswald text-sm uppercase tracking-wider transition-all whitespace-nowrap border-b-2"
                style={{
                  color: activeTab === tab.id ? "var(--gold)" : "var(--muted)",
                  borderBottomColor: activeTab === tab.id ? "var(--gold)" : "transparent",
                  backgroundColor: activeTab === tab.id ? "var(--surface2)" : "transparent",
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "dashboard" && <PortalDashboard profile={profile} />}
        {activeTab === "programs" && <PortalPrograms />}
        {activeTab === "meals" && <PortalMeals />}
        {activeTab === "habits" && <HabitTrackingPage />}
        {activeTab === "achievements" && <AchievementsPage />}
        {activeTab === "forms" && <PortalForms />}
        {activeTab === "checkins" && <PortalCheckIns />}
        {activeTab === "messages" && <PortalMessages />}
        {activeTab === "progress" && <PortalProgress />}
        {activeTab === "timeline" && <ProgressTimelinePage />}
        {activeTab === "sessions" && <PortalSessions />}
      </div>
    </div>
  );
}

// ─── DASHBOARD TAB ──────────────────────────────────────────────────────────────

function PortalDashboard({ profile }: { profile: any }) {
  const { data: programs } = trpc.portal.getMyPrograms.useQuery();
  const { data: sessions } = trpc.portal.getMySessions.useQuery();
  const { data: checkIns } = trpc.portal.getMyCheckIns.useQuery();
  const { data: messages } = trpc.portal.getMyMessages.useQuery();

  const activePrograms = programs?.filter((p: any) => p.programType === "exercise") || [];
  const activeMealPlans = programs?.filter((p: any) => p.programType === "nutrition") || [];
  const upcomingSessions = sessions || [];
  const unreadMessages = messages?.filter((m: any) => !m.isRead) || [];
  const lastCheckIn = checkIns?.[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-lg p-6" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-gold)" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bebas text-2xl" style={{ backgroundColor: "var(--gold)", color: "#000" }}>
            {profile.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>{profile.name}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                {profile.fitnessLevel ? profile.fitnessLevel.charAt(0).toUpperCase() + profile.fitnessLevel.slice(1) : "Athlete"} Level
              </span>
              <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>•</span>
              <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                {profile.trainingType === "in-person" ? "In-Person" : profile.trainingType === "online" ? "Online" : "Adaptive"} Training
              </span>
              {profile.weight && (
                <>
                  <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>•</span>
                  <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>{profile.weight} lbs</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Programs" value={activePrograms.length.toString()} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <StatCard label="Meal Plans" value={activeMealPlans.length.toString()} icon="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        <StatCard label="Upcoming Sessions" value={upcomingSessions.length.toString()} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <StatCard label="Unread Messages" value={unreadMessages.length.toString()} icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </div>

      {/* Next Session & Last Check-In */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>Next Session</h3>
          </CardHeader>
          <CardBody>
            {upcomingSessions.length > 0 ? (
              <div>
                <p className="font-rajdhani text-lg font-semibold" style={{ color: "var(--white)" }}>
                  {new Date(upcomingSessions[0].startTime).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
                <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                  {new Date(upcomingSessions[0].startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - {new Date(upcomingSessions[0].endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded text-xs font-oswald uppercase" style={{ backgroundColor: "var(--surface2)", color: "var(--gold)", border: "1px solid var(--border-gold)" }}>
                  {upcomingSessions[0].sessionType}
                </span>
              </div>
            ) : (
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No upcoming sessions scheduled.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>Last Check-In</h3>
          </CardHeader>
          <CardBody>
            {lastCheckIn ? (
              <div>
                <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  {new Date(lastCheckIn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                {lastCheckIn.weight && (
                  <p className="font-rajdhani text-lg mt-1" style={{ color: "var(--white)" }}>Weight: {lastCheckIn.weight} lbs</p>
                )}
                {lastCheckIn.energyLevel && (
                  <p className="font-rajdhani" style={{ color: "var(--muted)" }}>Energy: {lastCheckIn.energyLevel}/10</p>
                )}
                <span className="inline-block mt-2 px-3 py-1 rounded text-xs font-oswald uppercase" style={{
                  backgroundColor: lastCheckIn.status === "responded" ? "rgba(45, 179, 109, 0.15)" : "var(--surface2)",
                  color: lastCheckIn.status === "responded" ? "var(--success)" : "var(--muted)",
                  border: `1px solid ${lastCheckIn.status === "responded" ? "rgba(45, 179, 109, 0.3)" : "var(--border)"}`,
                }}>
                  {lastCheckIn.status}
                </span>
              </div>
            ) : (
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No check-ins submitted yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Goals */}
      {profile.goals && (
        <Card>
          <CardHeader>
            <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>My Goals</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {(() => {
                try {
                  const goals = JSON.parse(profile.goals);
                  return goals.map((goal: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded font-rajdhani text-sm" style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}>
                      {goal}
                    </span>
                  ));
                } catch {
                  return <span className="font-rajdhani" style={{ color: "var(--muted)" }}>{profile.goals}</span>;
                }
              })()}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: "var(--surface2)" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <p className="font-bebas text-2xl" style={{ color: "var(--white)" }}>{value}</p>
          <p className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PROGRAMS TAB ───────────────────────────────────────────────────────────────

function PortalPrograms() {
  const { data: programs, isLoading } = trpc.portal.getMyPrograms.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  const exercisePrograms = programs?.filter((p: any) => p.programType === "exercise" || p.programType === "hybrid") || [];

  if (exercisePrograms.length === 0) {
    return (
      <EmptyState
        title="No Programs Yet"
        description="Your trainer hasn't assigned any training programs yet. Check back soon!"
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY TRAINING PROGRAMS</h2>
      {exercisePrograms.map((program: any) => (
        <Card key={program.id}>
          <div
            className="px-6 py-4 cursor-pointer flex items-center justify-between"
            onClick={() => setExpandedId(expandedId === program.id ? null : program.id)}
          >
            <div>
              <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>{program.name}</h3>
              <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                {program.duration ? `${program.duration} weeks` : "Ongoing"} • {program.programType}
              </p>
            </div>
            <svg className={`w-5 h-5 transition-transform ${expandedId === program.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {expandedId === program.id && (
            <CardBody className="border-t" style={{ borderColor: "var(--border)" }}>
              {program.description && (
                <p className="font-rajdhani mb-4" style={{ color: "var(--muted)" }}>{program.description}</p>
              )}
              {program.content && <ProgramContent content={program.content} />}
              <p className="font-rajdhani text-xs mt-4" style={{ color: "var(--muted)" }}>
                Created: {new Date(program.createdAt).toLocaleDateString()}
              </p>
            </CardBody>
          )}
        </Card>
      ))}
    </div>
  );
}

function ProgramContent({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.weeks) {
      return (
        <div className="space-y-4">
          {parsed.weeks.map((week: any, wi: number) => (
            <div key={wi} className="rounded p-4" style={{ backgroundColor: "var(--surface2)" }}>
              <h4 className="font-oswald text-sm uppercase mb-2" style={{ color: "var(--gold)" }}>
                Week {week.week || wi + 1}{week.focus ? ` — ${week.focus}` : ""}
              </h4>
              {week.days?.map((day: any, di: number) => (
                <div key={di} className="mb-3 last:mb-0">
                  <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--white)" }}>{day.day || `Day ${di + 1}`}</p>
                  {day.exercises?.map((ex: any, ei: number) => (
                    <p key={ei} className="font-rajdhani text-sm pl-4" style={{ color: "var(--muted)" }}>
                      • {ex.name} — {ex.sets}×{ex.reps} {ex.rest ? `(${ex.rest} rest)` : ""}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return <pre className="font-rajdhani text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{JSON.stringify(parsed, null, 2)}</pre>;
  } catch {
    return <p className="font-rajdhani text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{content}</p>;
  }
}

// ─── MEALS TAB ──────────────────────────────────────────────────────────────────

function PortalMeals() {
  const { data: meals, isLoading } = trpc.portal.getMyMealPlans.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  if (!meals || meals.length === 0) {
    return (
      <EmptyState
        title="No Meal Plans Yet"
        description="Your trainer hasn't created any nutrition plans for you yet. Check back soon!"
        icon="M3 3h2l.4 2M7 13h10l4-8H5.4"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY NUTRITION PLANS</h2>
      {meals.map((plan: any) => (
        <Card key={plan.id}>
          <div
            className="px-6 py-4 cursor-pointer flex items-center justify-between"
            onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
          >
            <div>
              <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>{plan.name}</h3>
              <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                {plan.duration ? `${plan.duration} weeks` : "Ongoing"} • Nutrition Plan
              </p>
            </div>
            <svg className={`w-5 h-5 transition-transform ${expandedId === plan.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {expandedId === plan.id && (
            <CardBody className="border-t" style={{ borderColor: "var(--border)" }}>
              {plan.description && (
                <p className="font-rajdhani mb-4" style={{ color: "var(--muted)" }}>{plan.description}</p>
              )}
              {plan.content && <MealPlanContent content={plan.content} />}
              <p className="font-rajdhani text-xs mt-4" style={{ color: "var(--muted)" }}>
                Created: {new Date(plan.createdAt).toLocaleDateString()}
              </p>
            </CardBody>
          )}
        </Card>
      ))}
    </div>
  );
}

function MealPlanContent({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.days || parsed.meals) {
      const days = parsed.days || [{ meals: parsed.meals }];
      return (
        <div className="space-y-4">
          {days.map((day: any, di: number) => (
            <div key={di} className="rounded p-4" style={{ backgroundColor: "var(--surface2)" }}>
              {day.day && <h4 className="font-oswald text-sm uppercase mb-2" style={{ color: "var(--gold)" }}>{day.day}</h4>}
              {day.meals?.map((meal: any, mi: number) => (
                <div key={mi} className="mb-3 last:mb-0">
                  <p className="font-oswald text-xs uppercase" style={{ color: "var(--white)" }}>{meal.name || meal.type || `Meal ${mi + 1}`}</p>
                  {meal.foods?.map((food: any, fi: number) => (
                    <p key={fi} className="font-rajdhani text-sm pl-4" style={{ color: "var(--muted)" }}>
                      • {typeof food === "string" ? food : `${food.name} (${food.calories || ""}cal)`}
                    </p>
                  ))}
                  {meal.calories && <p className="font-rajdhani text-xs pl-4 mt-1" style={{ color: "var(--gold-dim)" }}>{meal.calories} cal</p>}
                </div>
              ))}
              {day.totalCalories && <p className="font-rajdhani text-sm mt-2 font-semibold" style={{ color: "var(--gold)" }}>Total: {day.totalCalories} cal</p>}
            </div>
          ))}
          {parsed.shoppingList && (
            <div className="rounded p-4" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
              <h4 className="font-oswald text-sm uppercase mb-2" style={{ color: "var(--gold)" }}>Shopping List</h4>
              <div className="grid grid-cols-2 gap-1">
                {parsed.shoppingList.map((item: string, i: number) => (
                  <p key={i} className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>• {item}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return <pre className="font-rajdhani text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{JSON.stringify(parsed, null, 2)}</pre>;
  } catch {
    return <p className="font-rajdhani text-sm whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{content}</p>;
  }
}

// ─── CHECK-INS TAB ──────────────────────────────────────────────────────────────

type PoseType = "front" | "back" | "left_side" | "right_side";
type PhotoUpload = { pose: PoseType; preview: string; file: File };

const POSE_CONFIG: { id: PoseType; label: string; description: string; icon: string }[] = [
  { id: "front", label: "Front", description: "Face the camera, arms relaxed at sides", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
  { id: "back", label: "Back", description: "Face away from camera, arms relaxed", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
  { id: "left_side", label: "Left Side", description: "Turn left side toward camera", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "right_side", label: "Right Side", description: "Turn right side toward camera", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function PortalCheckIns() {
  const { data: checkIns, isLoading, refetch } = trpc.portal.getMyCheckIns.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePose, setActivePose] = useState<PoseType | null>(null);

  const uploadPhotoMutation = trpc.portal.uploadPhoto.useMutation();

  const submitMutation = trpc.portal.submitCheckIn.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setWeight("");
      setEnergyLevel(7);
      setNotes("");
      setPhotos([]);
      setUploadingPhotos(false);
      setUploadProgress("");
      refetch();
    },
    onError: (error) => {
      setUploadingPhotos(false);
      setUploadProgress("");
      console.error("Check-in submission failed:", error);
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePose) return;
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Photo must be under 10MB");
      return;
    }
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      setPhotos((prev) => {
        // Replace if same pose already uploaded
        const filtered = prev.filter((p) => p.pose !== activePose);
        return [...filtered, { pose: activePose, preview, file }];
      });
      setActivePose(null);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [activePose]);

  const removePhoto = (pose: PoseType) => {
    setPhotos((prev) => prev.filter((p) => p.pose !== pose));
  };

  const triggerFileInput = (pose: PoseType) => {
    setActivePose(pose);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let photoUrls: string[] = [];

    // Upload photos first if any
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          setUploadProgress(`Uploading ${photo.pose} photo (${i + 1}/${photos.length})...`);
          // Convert file to base64 (strip data URL prefix)
          const base64 = photo.preview.split(",")[1];
          // Validate and map mimeType to allowed values
          let mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg";
          if (photo.file.type === "image/png") mimeType = "image/png";
          else if (photo.file.type === "image/webp") mimeType = "image/webp";
          const result = await uploadPhotoMutation.mutateAsync({
            pose: photo.pose,
            photoData: base64,
            mimeType,
          });
          photoUrls.push(result.url);
        }
        setUploadProgress("Photos uploaded! Submitting check-in...");
      } catch (err) {
        setUploadingPhotos(false);
        setUploadProgress("");
        alert("Failed to upload photos. Please try again.");
        return;
      }
    }

    submitMutation.mutate({
      weight: weight || undefined,
      energyLevel,
      notes: notes || undefined,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>WEEKLY CHECK-INS</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "primary"}>
          {showForm ? "Cancel" : "New Check-In"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Check-In Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>Submit Weekly Check-In</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>Current Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 185.5"
                  className="w-full px-4 py-3 rounded font-rajdhani"
                  style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>
                  Energy Level: <span style={{ color: "var(--gold)" }}>{energyLevel}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full accent-[#c9a84c]"
                />
                <div className="flex justify-between font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              {/* Progress Photos Section */}
              <div>
                <label className="block font-oswald text-sm uppercase mb-3" style={{ color: "var(--muted)" }}>
                  Progress Photos <span className="font-rajdhani normal-case text-xs">(optional — front, back, side)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {POSE_CONFIG.map((pose) => {
                    const uploaded = photos.find((p) => p.pose === pose.id);
                    return (
                      <div key={pose.id} className="relative">
                        {uploaded ? (
                          <div className="relative group">
                            <div
                              className="aspect-[3/4] rounded-lg overflow-hidden border-2"
                              style={{ borderColor: "var(--gold)" }}
                            >
                              <img
                                src={uploaded.preview}
                                alt={`${pose.label} pose`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute top-1 right-1">
                              <button
                                type="button"
                                onClick={() => removePhoto(pose.id)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                                style={{ backgroundColor: "rgba(220, 38, 38, 0.9)", color: "#fff" }}
                              >
                                ✕
                              </button>
                            </div>
                            <p className="font-oswald text-xs uppercase text-center mt-1" style={{ color: "var(--gold)" }}>
                              {pose.label} ✓
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerFileInput(pose.id)}
                            className="w-full aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-solid"
                            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface2)" }}
                          >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--muted)" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={pose.icon} />
                            </svg>
                            <span className="font-oswald text-xs uppercase" style={{ color: "var(--muted)" }}>{pose.label}</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold-dim)" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {photos.length > 0 && (
                  <p className="font-rajdhani text-xs mt-2" style={{ color: "var(--gold)" }}>
                    {photos.length} photo{photos.length > 1 ? "s" : ""} ready to upload
                  </p>
                )}
              </div>

              <div>
                <label className="block font-oswald text-sm uppercase mb-2" style={{ color: "var(--muted)" }}>Notes / How are you feeling?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was your week? Any soreness, wins, or concerns..."
                  rows={4}
                  className="w-full px-4 py-3 rounded font-rajdhani resize-none"
                  style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
                />
              </div>

              {uploadProgress && (
                <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border-gold)" }}>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
                  <p className="font-rajdhani text-sm" style={{ color: "var(--gold)" }}>{uploadProgress}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending || uploadingPhotos}>
                {uploadingPhotos ? "Uploading Photos..." : submitMutation.isPending ? "Submitting..." : photos.length > 0 ? `Submit Check-In with ${photos.length} Photo${photos.length > 1 ? "s" : ""}` : "Submit Check-In"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Check-In History */}
      {checkIns && checkIns.length > 0 ? (
        <div className="space-y-3">
          {checkIns.map((ci: any) => {
            let parsedPhotos: string[] = [];
            try {
              parsedPhotos = ci.photoUrls ? JSON.parse(ci.photoUrls) : [];
            } catch { parsedPhotos = []; }
            return (
              <Card key={ci.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                        {new Date(ci.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {ci.weight && <span className="font-rajdhani font-semibold" style={{ color: "var(--white)" }}>{ci.weight} lbs</span>}
                        {ci.energyLevel && (
                          <span className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                            Energy: {ci.energyLevel}/10
                          </span>
                        )}
                      </div>
                      {ci.notes && <p className="font-rajdhani text-sm mt-2" style={{ color: "var(--muted)" }}>{ci.notes}</p>}
                    </div>
                    <span className="px-3 py-1 rounded text-xs font-oswald uppercase" style={{
                      backgroundColor: ci.status === "responded" ? "rgba(45, 179, 109, 0.15)" : ci.status === "reviewed" ? "rgba(201, 168, 76, 0.15)" : "var(--surface2)",
                      color: ci.status === "responded" ? "var(--success)" : ci.status === "reviewed" ? "var(--gold)" : "var(--muted)",
                      border: `1px solid ${ci.status === "responded" ? "rgba(45, 179, 109, 0.3)" : ci.status === "reviewed" ? "var(--border-gold)" : "var(--border)"}`,
                    }}>
                      {ci.status}
                    </span>
                  </div>
                  {/* Display photos if any */}
                  {parsedPhotos.length > 0 && (
                    <div className="mt-4">
                      <p className="font-oswald text-xs uppercase mb-2" style={{ color: "var(--gold)" }}>Progress Photos</p>
                      <div className="grid grid-cols-4 gap-2">
                        {parsedPhotos.map((url: string, idx: number) => (
                          <div key={idx} className="aspect-[3/4] rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                            <img src={url} alt={`Progress photo ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {ci.trainerFeedback && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: "var(--surface2)", borderLeft: "3px solid var(--gold)" }}>
                      <p className="font-oswald text-xs uppercase mb-1" style={{ color: "var(--gold)" }}>Trainer Feedback</p>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--white)" }}>{ci.trainerFeedback}</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Check-Ins Yet"
          description="Submit your first weekly check-in to keep your trainer updated on your progress."
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      )}
    </div>
  );
}

// ─── MESSAGES TAB ───────────────────────────────────────────────────────────────

function PortalMessages() {
  const { user } = useAuth();
  const { data: profile } = trpc.portal.getMyProfile.useQuery();
  const clientId = profile?.id;
  const { data: messages, isLoading, refetch } = trpc.portal.getMyMessages.useQuery(undefined, {
    refetchInterval: 8000,
  });
  const { data: typingStatus } = trpc.messages.getTypingStatus.useQuery(
    { clientId: clientId || 0 },
    { enabled: !!clientId, refetchInterval: 3000 }
  );
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  const markThreadReadMutation = trpc.messages.markThreadRead.useMutation({
    onSuccess: () => utils.portal.getMyMessages.invalidate(),
  });
  const setTypingMutation = trpc.messages.setTyping.useMutation();

  const sendMutation = trpc.portal.sendMessage.useMutation({
    onSuccess: () => {
      setContent("");
      refetch();
    },
  });

  // Mark trainer's messages as read whenever this tab is open
  useEffect(() => {
    if (clientId) markThreadReadMutation.mutate({ clientId });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear typing flag on unmount / client change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (clientId) setTypingMutation.mutate({ clientId, isTyping: false });
    };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = (value: string) => {
    setContent(value);
    if (!clientId) return;
    setTypingMutation.mutate({ clientId, isTyping: value.trim().length > 0 });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingMutation.mutate({ clientId, isTyping: false });
    }, 4000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (clientId) setTypingMutation.mutate({ clientId, isTyping: false });
    sendMutation.mutate({ content: content.trim() });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MESSAGES</h2>
        {typingStatus?.trainerTyping && (
          <span className="font-rajdhani text-xs italic flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <span className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "var(--gold)", animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>
            Your coach is typing…
          </span>
        )}
      </div>

      <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages && messages.length > 0 ? (
            <>
              {messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-3 ${isMe ? "rounded-br-none" : "rounded-bl-none"}`} style={{
                      backgroundColor: isMe ? "var(--gold)" : "var(--surface2)",
                      color: isMe ? "#000" : "var(--white)",
                    }}>
                      <p className="font-rajdhani text-sm">{msg.content}</p>
                      {msg.attachmentUrl && (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-rajdhani text-xs underline mt-1 inline-block"
                          style={{ color: isMe ? "#000" : "var(--gold)" }}
                        >
                          📎 {msg.attachmentName || "Attachment"}
                        </a>
                      )}
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p className="font-rajdhani text-xs" style={{ color: isMe ? "#000" : "var(--muted)", opacity: isMe ? 0.6 : 1 }}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                        {isMe && (
                          <p className="font-rajdhani text-xs" style={{ color: msg.readAt ? "#0a4d2e" : "#000", opacity: msg.readAt ? 1 : 0.5 }}>
                            {msg.readAt ? "Read ✓" : "Sent ✓"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>No messages yet. Send a message to your trainer!</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded font-rajdhani"
              style={{ backgroundColor: "var(--surface2)", color: "var(--white)", border: "1px solid var(--border)" }}
            />
            <Button type="submit" disabled={!content.trim() || sendMutation.isPending}>
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// ─── PROGRESS TAB ───────────────────────────────────────────────────────────────

function PortalProgress() {
  const { data: progress, isLoading } = trpc.portal.getMyProgress.useQuery();

  if (isLoading) return <LoadingSkeleton />;

  if (!progress || progress.length === 0) {
    return (
      <EmptyState
        title="No Progress Data Yet"
        description="Your progress metrics will appear here as your trainer records them. Keep training!"
        icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    );
  }

  // Group by metric type
  const grouped: Record<string, any[]> = {};
  progress.forEach((p: any) => {
    const type = p.metricType || "general";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(p);
  });

  return (
    <div className="space-y-6">
      <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY PROGRESS</h2>

      {Object.entries(grouped).map(([type, metrics]) => (
        <Card key={type}>
          <CardHeader>
            <h3 className="font-oswald text-lg uppercase" style={{ color: "var(--gold)" }}>
              {type.replace("_", " ")}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {metrics.slice(0, 10).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="font-rajdhani font-semibold" style={{ color: "var(--white)" }}>
                      {m.value} {m.unit || ""}
                    </p>
                    {m.notes && <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>{m.notes}</p>}
                  </div>
                  <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                    {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
            {metrics.length > 10 && (
              <p className="font-rajdhani text-sm mt-3" style={{ color: "var(--muted)" }}>
                Showing latest 10 of {metrics.length} entries
              </p>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// ─── SESSIONS TAB ───────────────────────────────────────────────────────────────

// ─── FORMS TAB ────────────────────────────────────────────────────────────────
function PortalForms() {
  const { data: templates, isLoading: tLoading } = trpc.forms.listTemplates.useQuery();
  const { data: submissions } = trpc.forms.getMySubmissions.useQuery();
  const subMap: Record<number, any> = {};
  (submissions ?? []).forEach((s: any) => { subMap[s.formTemplateId] = s; });
  const required = (templates ?? []).filter((t: any) => t.isRequired && !subMap[t.id]);
  if (tLoading) return <LoadingSkeleton />;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>MY FORMS</h2>
        {required.length > 0 && (
          <div className="mt-3 px-4 py-3 rounded-lg" style={{ backgroundColor: "rgba(201,168,76,0.08)", border: "1px solid var(--border-gold)" }}>
            <p className="font-rajdhani" style={{ color: "var(--gold)" }}>⚠ {required.length} required form{required.length > 1 ? "s" : ""} still need{required.length === 1 ? "s" : ""} to be completed.</p>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {(templates ?? []).map((form: any) => {
          const sub = subMap[form.id];
          const status: string = sub?.status ?? "none";
          const colors: Record<string, string> = { reviewed: "var(--success)", submitted: "#60a5fa", draft: "var(--warn)", none: "var(--border)" };
          const labels: Record<string, string> = { reviewed: "✓ Reviewed", submitted: "✓ Submitted", draft: "Draft saved", none: "Not started" };
          return (
            <div key={form.slug} className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: "var(--surface)", border: `1px solid ${colors[status] ?? "var(--border)"}44` }}>
              <div>
                <h4 className="font-oswald text-base" style={{ color: "var(--white)" }}>{form.name}</h4>
                <p className="font-rajdhani text-xs mt-0.5" style={{ color: "var(--muted)" }}>{form.category} {form.isRequired ? "· Required" : ""}</p>
              </div>
              <span className="font-rajdhani text-xs" style={{ color: colors[status] }}>{labels[status]}</span>
            </div>
          );
        })}
      </div>
      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>To fill out forms, use the dedicated Forms portal. Ask your trainer for the link.</p>
    </div>
  );
}

// ─── SESSIONS TAB ─────────────────────────────────────────────────────────────
function PortalSessions() {
  const { data: sessions, isLoading } = trpc.portal.getMySessions.useQuery();

  if (isLoading) return <LoadingSkeleton />;

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        title="No Upcoming Sessions"
        description="You don't have any sessions scheduled. Contact your trainer to book your next session."
        icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bebas text-3xl" style={{ color: "var(--white)" }}>UPCOMING SESSIONS</h2>

      <div className="space-y-3">
        {sessions.map((session: any) => {
          const start = new Date(session.startTime);
          const end = new Date(session.endTime);
          const isToday = start.toDateString() === new Date().toDateString();

          return (
            <Card key={session.id}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="font-bebas text-2xl" style={{ color: isToday ? "var(--gold)" : "var(--white)" }}>
                        {start.getDate()}
                      </p>
                      <p className="font-rajdhani text-xs uppercase" style={{ color: "var(--muted)" }}>
                        {start.toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-oswald uppercase" style={{ color: "var(--white)" }}>
                        {start.toLocaleDateString("en-US", { weekday: "long" })}
                        {isToday && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--gold)", color: "#000" }}>TODAY</span>}
                      </p>
                      <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                        {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded text-xs font-oswald uppercase" style={{
                      backgroundColor: "var(--surface2)",
                      color: "var(--gold)",
                      border: "1px solid var(--border-gold)",
                    }}>
                      {session.sessionType}
                    </span>
                    {session.notes && (
                      <p className="font-rajdhani text-xs mt-2" style={{ color: "var(--muted)" }}>{session.notes}</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg p-6 animate-pulse" style={{ backgroundColor: "var(--surface)" }}>
          <div className="h-4 rounded w-1/3 mb-3" style={{ backgroundColor: "var(--surface2)" }} />
          <div className="h-3 rounded w-2/3 mb-2" style={{ backgroundColor: "var(--surface2)" }} />
          <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--surface2)" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold-dim)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="font-oswald text-xl uppercase mb-2" style={{ color: "var(--white)" }}>{title}</h3>
      <p className="font-rajdhani max-w-md mx-auto" style={{ color: "var(--muted)" }}>{description}</p>
    </div>
  );
}
