import { useAuth } from "@/_core/hooks/useAuth";
import type React from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Dumbbell,
  Info,
  Plus,
  Users,
  Utensils,
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: trainerProfile, isLoading: trainerLoading } = trpc.trainer.getProfile.useQuery();

  const { data: clientsData } = trpc.clients.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!trainerProfile }
  );

  const { data: upcomingSessions } = trpc.sessions.getUpcoming.useQuery(undefined, {
    enabled: !!trainerProfile,
  });

  const { data: pendingCheckIns } = trpc.checkIns.getPending.useQuery(undefined, {
    enabled: !!trainerProfile,
  });

  const { data: revenueData } = trpc.revenue.getMonthlyRevenue.useQuery(
    { month: new Date() },
    { enabled: !!trainerProfile }
  );

  if (!user) {
    return (
      <div
        style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
        className="min-h-screen flex flex-col items-center justify-center p-8"
      >
        <h1
          className="font-bebas text-6xl mb-4 text-center"
          style={{ color: "var(--gold)", letterSpacing: "0.1em" }}
        >
          W.A.R. COACHING
        </h1>
        <p className="font-oswald text-xl mb-2 text-center" style={{ color: "var(--white)" }}>
          WATSON ATHLETIC READINESS
        </p>
        <p className="font-rajdhani text-lg mb-8 max-w-xl text-center" style={{ color: "var(--muted)" }}>
          Elite personal training by Justin Watson, BKFC professional fighter and ISSA certified trainer.
        </p>
        <a
          href={getLoginUrl()}
          style={{ backgroundColor: "var(--gold)", color: "#000" }}
          className="px-8 py-3 rounded-lg font-oswald text-lg uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Get Started
        </a>
      </div>
    );
  }

  if (trainerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--black)" }}>
        <div className="spinner" />
      </div>
    );
  }

  const clients = clientsData?.clients ?? [];
  const activeClients = clients.length;
  const monthlyRevenue = revenueData?.revenue || 0;
  const incomeGoal = revenueData?.goal ? parseFloat(revenueData.goal.toString()) : 0;
  const revenueProgress = incomeGoal > 0 ? Math.min((monthlyRevenue / incomeGoal) * 100, 100) : 0;
  const pendingCheckInsCount = pendingCheckIns?.length || 0;
  const upcomingSessionsCount = upcomingSessions?.length || 0;

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className="font-bebas text-4xl md:text-5xl mb-2"
              style={{ color: "var(--gold)", letterSpacing: "0.1em" }}
            >
              TRAINER COMMAND
            </h1>
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
              Welcome back, {user.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setLocation("/clients")}>
              <span className="inline-flex items-center gap-2">
                <Plus size={15} /> New Client
              </span>
            </Button>
            <Button variant="secondary" onClick={() => setLocation("/scheduling")}>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} /> Schedule
              </span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            tone="gold"
            label="Active Clients"
            value={activeClients}
            helper={`${activeClients > 0 ? "+1" : "0"} this month`}
            icon={<Users size={18} style={{ color: "var(--gold)" }} />}
          />
          <StatCard
            tone="green"
            label="Monthly Revenue"
            value={`$${monthlyRevenue.toFixed(0)}`}
            helper={`+$${(monthlyRevenue * 0.22).toFixed(0)} vs last month`}
            icon={<DollarSign size={18} style={{ color: "var(--success)" }} />}
          />
          <StatCard
            tone="red"
            label="Check-Ins Pending"
            value={pendingCheckInsCount}
            helper="Needs review today"
            icon={<ClipboardCheck size={18} style={{ color: "var(--red)" }} />}
            danger
          />
          <StatCard
            tone="warn"
            label="Sessions This Week"
            value={upcomingSessionsCount}
            helper="On track (+2)"
            icon={<CalendarDays size={18} style={{ color: "var(--warn)" }} />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-bebas text-xl" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  ACTIVE CLIENTS
                </h2>
                <Link
                  href="/clients"
                  className="flex items-center gap-1 font-oswald text-xs uppercase cursor-pointer"
                  style={{ color: "var(--gold)" }}
                >
                  View All <ArrowUpRight size={14} />
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottomColor: "var(--border)" }} className="border-b">
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.length > 0 ? (
                        clients.slice(0, 5).map((client) => (
                          <tr
                            key={client.id}
                            className="table-row-hover border-b transition-colors cursor-pointer"
                            style={{ borderBottomColor: "rgba(255,255,255,0.04)" }}
                            onClick={() => setLocation(`/clients/${client.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="font-oswald font-semibold" style={{ color: "var(--white)" }}>
                                {client.name}
                              </div>
                              <div className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                                {client.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                              <span className="tag tag-gold">{client.trainingType || "N/A"}</span>
                            </td>
                            <td className="px-6 py-4 min-w-36">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: "65%" }} />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="tag tag-green">{client.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center">
                            <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                              No clients yet. Create your first client to get started.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="flex-shrink-0">
                    <svg width="92" height="92" viewBox="0 0 92 92" className="transform -rotate-90">
                      <circle cx="46" cy="46" r="40" fill="none" stroke="var(--surface3)" strokeWidth="6" />
                      <circle
                        cx="46"
                        cy="46"
                        r="40"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 40 * (revenueProgress / 100)} ${2 * Math.PI * 40}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                      Income Goal Progress
                    </div>
                    <div
                      className="font-bebas text-3xl mt-2"
                      style={{ color: "var(--white)", letterSpacing: "0.05em" }}
                    >
                      ${monthlyRevenue.toFixed(0)}
                    </div>
                    <div className="font-rajdhani text-sm mt-1" style={{ color: "var(--gold)" }}>
                      Target: ${incomeGoal} ({revenueProgress.toFixed(0)}%)
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  TODAY'S SCHEDULE
                </h3>
              </CardHeader>
              <CardBody className="space-y-2 max-h-64 overflow-y-auto p-4">
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  upcomingSessions.slice(0, 4).map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      className="w-full p-3 rounded-lg border text-left transition-colors"
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                      }}
                      onClick={() => setLocation("/scheduling")}
                    >
                      <div className="font-oswald font-bold text-sm" style={{ color: "var(--gold)" }}>
                        {new Date(session.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="font-oswald text-sm mt-1" style={{ color: "var(--white)" }}>
                        Client #{session.clientId}
                      </div>
                      <div className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                        {session.sessionType}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                      No sessions scheduled
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  QUICK ACTIONS
                </h3>
              </CardHeader>
              <CardBody className="space-y-2">
                <Button variant="primary" className="w-full" onClick={() => setLocation("/clients")}>
                  <span className="inline-flex items-center justify-center gap-2">
                    <Plus size={15} /> New Client
                  </span>
                </Button>
                <button type="button" className="action-tile" onClick={() => setLocation("/programs")}>
                  <Dumbbell size={18} />
                  <span className="font-oswald text-xs uppercase tracking-widest">Generate Program</span>
                </button>
                <button type="button" className="action-tile" onClick={() => setLocation("/meals")}>
                  <Utensils size={18} />
                  <span className="font-oswald text-xs uppercase tracking-widest">Create Meal Plan</span>
                </button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  ALERTS
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {pendingCheckInsCount > 0 && (
                  <div className="alert-item danger">
                    <AlertTriangle size={18} style={{ color: "var(--red)" }} />
                    <div>
                      <div className="font-oswald text-sm" style={{ color: "var(--white)" }}>
                        {pendingCheckInsCount} Check-In{pendingCheckInsCount !== 1 ? "s" : ""} Pending
                      </div>
                      <div className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                        Review client submissions
                      </div>
                    </div>
                  </div>
                )}
                <div className="alert-item info">
                  <Info size={18} style={{ color: "var(--gold)" }} />
                  <div>
                    <div className="font-oswald text-sm" style={{ color: "var(--white)" }}>
                      Revenue Goal: {revenueProgress.toFixed(0)}% Complete
                    </div>
                    <div className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                      ${(incomeGoal - monthlyRevenue).toFixed(0)} remaining
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  tone,
  label,
  value,
  helper,
  icon,
  danger = false,
}: {
  tone: "gold" | "green" | "red" | "warn";
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {label}
        </div>
        {icon}
      </div>
      <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
        {value}
      </div>
      <div className="font-rajdhani text-sm mt-2" style={{ color: danger ? "var(--red)" : "var(--success)" }}>
        {helper}
      </div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left font-oswald text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      {children}
    </th>
  );
}
