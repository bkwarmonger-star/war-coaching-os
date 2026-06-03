import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [clientData, setClientData] = useState<any>(null);

  // Get client profile linked to this user
  const { data: myProfile } = trpc.portal.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Get assigned programs
  const { data: programs } = trpc.portal.getMyPrograms.useQuery(undefined, {
    enabled: !!myProfile,
  });

  // Get recent check-ins
  const { data: checkIns } = trpc.portal.getMyCheckIns.useQuery(undefined, {
    enabled: !!myProfile,
  });

  // Get messages with trainer
  const { data: messages } = trpc.portal.getMyMessages.useQuery(undefined, {
    enabled: !!myProfile,
  });

  if (!myProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--black)" }}>
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <h2 className="font-bebas text-2xl mb-3" style={{ color: "var(--gold)" }}>ACCOUNT NOT LINKED</h2>
            <p className="font-rajdhani mb-6" style={{ color: "var(--muted)" }}>
              Your account is not yet linked to a trainer. Contact your trainer to get started.
            </p>
            <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
              Email: {user?.email}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-bebas text-5xl mb-2" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
            {myProfile.name}
          </h1>
          <p className="font-rajdhani text-lg" style={{ color: "var(--muted)" }}>
            Welcome back to your training portal
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <Card>
            <CardBody className="text-center">
              <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--muted)" }}>Current Weight</p>
              <p className="font-bebas text-3xl" style={{ color: "var(--gold)" }}>{myProfile.weight} lbs</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--muted)" }}>Programs</p>
              <p className="font-bebas text-3xl" style={{ color: "var(--gold)" }}>{programs?.length || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--muted)" }}>Check-Ins</p>
              <p className="font-bebas text-3xl" style={{ color: "var(--gold)" }}>{checkIns?.length || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="font-rajdhani text-sm mb-2" style={{ color: "var(--muted)" }}>Messages</p>
              <p className="font-bebas text-3xl" style={{ color: "var(--gold)" }}>{messages?.length || 0}</p>
            </CardBody>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Current Program */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                📊 Current Program
              </h2>
            </CardHeader>
            <CardBody>
              {programs && programs.length > 0 ? (
                <>
                  <h3 className="font-bebas text-xl mb-2" style={{ color: "var(--white)" }}>
                    {programs[0].name}
                  </h3>
                  <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
                    {programs[0].duration} weeks • {programs[0].programType}
                  </p>
                  {programs[0].content && (
                    <div className="space-y-2 mb-6">
                      {(() => {
                        try {
                          const parsed = JSON.parse(typeof programs[0].content === "string" ? programs[0].content : "{}");
                          const exercises = parsed.exercises || [];
                          return exercises.slice(0, 3).map((exercise: any, idx: number) => (
                          <div key={idx} className="flex justify-between font-rajdhani text-sm">
                            <span>{exercise.name}</span>
                            <span style={{ color: "var(--gold)" }}>{exercise.sets}x{exercise.reps}</span>
                          </div>
                        ));
                        } catch (e) { return null; }
                      })()}
                    </div>
                  )}
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    View Full Program
                  </button>
                </>
              ) : (
                <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                  No program assigned yet. Contact your trainer.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Recent Check-Ins */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                📈 Recent Check-Ins
              </h2>
            </CardHeader>
            <CardBody>
              {checkIns && checkIns.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    {checkIns.slice(0, 3).map((checkIn: any, idx: number) => (
                      <div key={idx} className={`pb-3 ${idx < 2 ? "border-b" : ""}`} style={{ borderBottomColor: "var(--surface2)" }}>
                        <p className="font-rajdhani text-xs mb-1" style={{ color: "var(--muted)" }}>
                          {new Date(checkIn.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex justify-between font-rajdhani text-sm">
                          <span>{checkIn.weight} lbs</span>
                          <span style={{ color: "var(--gold)" }}>Energy: {checkIn.energyLevel}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    Submit Check-In
                  </button>
                </>
              ) : (
                <>
                  <p className="font-rajdhani mb-6" style={{ color: "var(--muted)" }}>
                    No check-ins yet. Start tracking your progress.
                  </p>
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    Submit First Check-In
                  </button>
                </>
              )}
            </CardBody>
          </Card>

          {/* Meal Plan */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                🍽️ Meal Plan
              </h2>
            </CardHeader>
            <CardBody>
              {programs && programs.length > 0 && programs[0].content ? (
                <>
                    <div className="space-y-3 mb-6">
                    {(() => {
                      try {
                        const parsed = JSON.parse(typeof programs[0].content === "string" ? programs[0].content : "{}");
                        const meals = parsed.meals || [];
                        return meals.slice(0, 3).map((meal: any, idx: number) => (
                          <div key={idx} className="p-3 rounded" style={{ backgroundColor: "var(--surface)" }}>
                            <p className="font-oswald text-xs uppercase" style={{ color: "var(--gold)" }}>
                              {meal.timing || ["Breakfast", "Lunch", "Dinner"][idx]}
                            </p>
                            <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                              {meal.description || "Custom meal"}
                            </p>
                          </div>
                        ));
                      } catch (e) { return null; }
                    })()}
                    </div>
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    View Full Meal Plan
                  </button>
                </>
              ) : (
                <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                  No meal plan assigned yet.
                </p>
              )}
            </CardBody>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                💬 Messages
              </h2>
            </CardHeader>
            <CardBody>
              {messages && messages.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-40 overflow-y-auto">
                    {messages.slice(-3).map((msg: any, idx: number) => (
                      <div key={idx} className="p-2 rounded" style={{ backgroundColor: "var(--surface)" }}>
                        <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                        <p className="font-rajdhani text-sm mt-1 line-clamp-2">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    View Messages
                  </button>
                </>
              ) : (
                <>
                  <p className="font-rajdhani mb-6" style={{ color: "var(--muted)" }}>
                    No messages yet. Contact your trainer anytime.
                  </p>
                  <button
                    className="w-full py-2 rounded font-oswald text-sm uppercase"
                    style={{ backgroundColor: "var(--gold)", color: "#000" }}
                  >
                    Send Message
                  </button>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
