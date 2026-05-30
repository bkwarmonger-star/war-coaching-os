import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function RevenuePage() {
  const { data: subscriptionsData } = trpc.revenue.getActiveSubscriptions.useQuery();

  const totalRevenue = subscriptionsData?.reduce((sum: number, sub: any) => sum + (sub.totalAmount || 0), 0) || 0;
  const activeClients = subscriptionsData?.length || 0;
  const monthlyIncomeGoal = 5000;
  const progressPercent = (totalRevenue / monthlyIncomeGoal) * 100;

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-bebas text-4xl mb-8" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
          REVENUE & PAYMENTS
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card gold">
            <div className="text-sm font-oswald uppercase" style={{ color: "var(--muted)" }}>
              Total Revenue
            </div>
            <div className="text-3xl font-bebas mt-2" style={{ color: "var(--gold)" }}>
              ${totalRevenue.toFixed(0)}
            </div>
          </Card>

          <Card className="stat-card green">
            <div className="text-sm font-oswald uppercase" style={{ color: "var(--muted)" }}>
              Active Clients
            </div>
            <div className="text-3xl font-bebas mt-2" style={{ color: "var(--success)" }}>
              {activeClients}
            </div>
          </Card>

          <Card className="stat-card warn">
            <div className="text-sm font-oswald uppercase" style={{ color: "var(--muted)" }}>
              Avg Revenue/Client
            </div>
            <div className="text-3xl font-bebas mt-2" style={{ color: "var(--warn)" }}>
              ${activeClients > 0 ? (totalRevenue / activeClients).toFixed(0) : 0}
            </div>
          </Card>

          <Card className="stat-card red">
            <div className="text-sm font-oswald uppercase" style={{ color: "var(--muted)" }}>
              Monthly Goal
            </div>
            <div className="text-3xl font-bebas mt-2" style={{ color: "var(--red)" }}>
              ${monthlyIncomeGoal}
            </div>
          </Card>
        </div>

        {/* Income Goal Progress Ring */}
        <Card>
          <CardHeader>
            <h2 className="font-bebas text-xl" style={{ color: "var(--white)" }}>
              Monthly Income Goal Progress
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-center py-12">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--surface3)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="8"
                    strokeDasharray={`${(progressPercent / 100) * 565.48} 565.48`}
                    style={{ transition: "stroke-dasharray 0.3s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-bebas text-3xl" style={{ color: "var(--gold)" }}>
                    {Math.round(progressPercent)}%
                  </div>
                  <div className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                    of goal
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                ${totalRevenue.toFixed(0)} of ${monthlyIncomeGoal}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Active Subscriptions */}
        {subscriptionsData && subscriptionsData.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="font-bebas text-xl" style={{ color: "var(--white)" }}>
                Active Subscriptions
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {subscriptionsData.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border-l-4" style={{ borderColor: "var(--gold)" }}>
                    <div>
                      <p className="font-oswald text-sm" style={{ color: "var(--white)" }}>
                        Client {sub.clientId}
                      </p>
                      <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                        {sub.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bebas text-lg" style={{ color: "var(--gold)" }}>
                        ${sub.totalAmount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
