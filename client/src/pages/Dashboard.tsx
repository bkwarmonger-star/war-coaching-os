import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  // Fetch trainer profile
  const { data: trainerProfile, isLoading: trainerLoading } = trpc.trainer.getProfile.useQuery();

  // Fetch clients list
  const { data: clientsData, isLoading: clientsLoading } = trpc.clients.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!trainerProfile }
  );

  // Fetch upcoming sessions
  const { data: upcomingSessions } = trpc.sessions.getUpcoming.useQuery(undefined, {
    enabled: !!trainerProfile,
  });

  // Fetch pending check-ins
  const { data: pendingCheckIns } = trpc.checkIns.getPending.useQuery(undefined, {
    enabled: !!trainerProfile,
  });

  // Fetch monthly revenue
  const { data: revenueData } = trpc.revenue.getMonthlyRevenue.useQuery(
    { month: new Date() },
    { enabled: !!trainerProfile }
  );

  if (trainerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--black)" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const activeClients = clientsData?.clients?.length || 0;
  const monthlyRevenue = revenueData?.revenue || 0;
  const incomeGoal = revenueData?.goal ? parseFloat(revenueData.goal.toString()) : 0;
  const revenueProgress = incomeGoal > 0 ? (monthlyRevenue / incomeGoal) * 100 : 0;
  const pendingCheckInsCount = pendingCheckIns?.length || 0;
  const upcomingSessionsCount = upcomingSessions?.length || 0;

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bebas text-4xl mb-2" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            DASHBOARD
          </h1>
          <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
            Welcome back, {user?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Active Clients */}
          <div className="stat-card gold">
            <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Active Clients
            </div>
            <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              {activeClients}
            </div>
            <div className="font-rajdhani text-sm mt-2" style={{ color: "var(--success)" }}>
              ▲ {activeClients > 0 ? "+1" : "0"} this month
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="stat-card green">
            <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Monthly Revenue
            </div>
            <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              ${monthlyRevenue.toFixed(0)}
            </div>
            <div className="font-rajdhani text-sm mt-2" style={{ color: "var(--success)" }}>
              ▲ +${(monthlyRevenue * 0.22).toFixed(0)} vs last month
            </div>
          </div>

          {/* Check-Ins Pending */}
          <div className="stat-card red">
            <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Check-Ins Pending
            </div>
            <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              {pendingCheckInsCount}
            </div>
            <div className="font-rajdhani text-sm mt-2" style={{ color: "var(--red)" }}>
              ▼ Needs review today
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="stat-card warn">
            <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Sessions This Week
            </div>
            <div className="font-bebas text-4xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
              {upcomingSessionsCount}
            </div>
            <div className="font-rajdhani text-sm mt-2" style={{ color: "var(--success)" }}>
              ▲ On track (+2)
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Clients Table */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-bebas text-xl" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  ACTIVE CLIENTS
                </h2>
                <div className="font-oswald text-xs uppercase cursor-pointer" style={{ color: "var(--gold)" }}>
                  View All
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottomColor: "var(--border)" }} className="border-b">
                        <th
                          className="px-6 py-3 text-left font-oswald text-xs uppercase tracking-wider"
                          style={{ color: "var(--muted)" }}
                        >
                          Client
                        </th>
                        <th
                          className="px-6 py-3 text-left font-oswald text-xs uppercase tracking-wider"
                          style={{ color: "var(--muted)" }}
                        >
                          Type
                        </th>
                        <th
                          className="px-6 py-3 text-left font-oswald text-xs uppercase tracking-wider"
                          style={{ color: "var(--muted)" }}
                        >
                          Progress
                        </th>
                        <th
                          className="px-6 py-3 text-left font-oswald text-xs uppercase tracking-wider"
                          style={{ color: "var(--muted)" }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientsData?.clients && clientsData.clients.length > 0 ? (
                        clientsData.clients.slice(0, 5).map((client) => (
                          <tr
                            key={client.id}
                            style={{ borderBottomColor: "rgba(255,255,255,0.04)" }}
                            className="border-b hover:bg-surface2 transition-colors cursor-pointer"
                            onClick={() => setSelectedClient(client.id)}
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
                            <td className="px-6 py-4">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: "65%" }}></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="tag tag-green">{client.status}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center">
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

            {/* Income Goal Ring */}
            <Card>
              <CardBody>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="var(--surface3)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 36 * (revenueProgress / 100)} ${2 * Math.PI * 36}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-oswald text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                      Income Goal Progress
                    </div>
                    <div className="font-bebas text-3xl mt-2" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  TODAY'S SCHEDULE
                </h3>
              </CardHeader>
              <CardBody className="space-y-2 max-h-64 overflow-y-auto p-4">
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  upcomingSessions.slice(0, 4).map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded border hover:border-gold transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                      }}
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
                    </div>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  QUICK ACTIONS
                </h3>
              </CardHeader>
              <CardBody className="space-y-2">
                <Button variant="primary" className="w-full">
                  + New Client
                </Button>
                <Button variant="outline" className="w-full">
                  Generate Program
                </Button>
                <Button variant="outline" className="w-full">
                  Create Meal Plan
                </Button>
              </CardBody>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <h3 className="font-bebas text-lg" style={{ color: "var(--white)", letterSpacing: "0.05em" }}>
                  ALERTS
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {pendingCheckInsCount > 0 && (
                  <div className="alert-item danger">
                    <div style={{ color: "var(--red)" }}>⚠</div>
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
                  <div style={{ color: "var(--gold)" }}>ℹ</div>
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
