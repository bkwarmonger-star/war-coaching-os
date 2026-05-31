import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function PublicClientProfilePage() {
  const [route, params] = useRoute("/public-profile/:clientId");
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;

  const { data: profileData, isLoading, error } = trpc.portal.getPublicProfile.useQuery(
    { clientId },
    { enabled: !!clientId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--black)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          <p className="font-rajdhani text-lg" style={{ color: "var(--muted)" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--black)" }}>
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-12">
            <h2 className="font-bebas text-2xl mb-3" style={{ color: "var(--gold)" }}>CLIENT NOT FOUND</h2>
            <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
              This client profile is not available. Please check the link and try again.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { client, programs, checkIns } = profileData;
  const currentProgram = programs?.[0];

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with client info */}
        <div className="mb-12 p-8 rounded-lg" style={{ backgroundColor: "var(--surface2)", border: "2px solid var(--gold)" }}>
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--surface)", border: "2px solid var(--gold)" }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--gold)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="font-bebas text-4xl mb-2" style={{ color: "var(--gold)", letterSpacing: "0.05em" }}>
                {client.name}
              </h1>
              <p className="font-rajdhani text-lg mb-4" style={{ color: "var(--muted)" }}>
                Trainer: Justin Watson
              </p>
              <div className="flex gap-8 font-rajdhani text-sm">
                <div>
                  <span style={{ color: "var(--muted)" }}>Age</span>
                  <p className="font-bebas text-xl" style={{ color: "var(--white)" }}>{client.age}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Height</span>
                  <p className="font-bebas text-xl" style={{ color: "var(--white)" }}>{client.height}"</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Current Weight</span>
                  <p className="font-bebas text-xl" style={{ color: "var(--white)" }}>{client.weight} lbs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Active Program */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                📊 Active Program
              </h2>
            </CardHeader>
            <CardBody>
              {currentProgram ? (
                <>
                  <h3 className="font-bebas text-xl mb-2" style={{ color: "var(--white)" }}>
                    {currentProgram.name}
                  </h3>
                  <p className="font-rajdhani text-sm mb-4" style={{ color: "var(--muted)" }}>
                    {currentProgram.duration} weeks
                  </p>
                  <div className="space-y-3">
                    {currentProgram.content ? (
                      JSON.parse(typeof currentProgram.content === "string" ? currentProgram.content : "[]").slice(0, 5).map((exercise: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-rajdhani text-sm">
                          <span>{exercise.name || `Exercise ${idx + 1}`}</span>
                          <span style={{ color: "var(--gold)" }}>
                            {exercise.sets}x{exercise.reps}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>No exercises added yet</p>
                    )}
                  </div>

                </>
              ) : (
                <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  No program assigned yet. Contact your trainer.
                </p>
              )}
            </CardBody>
          </Card>

          {/* This Week's Meals */}
          <Card>
            <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
              <h2 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                🍽️ This Week's Meals
              </h2>
            </CardHeader>
            <CardBody>
              {currentProgram ? (
                <>
                  <div className="space-y-3">
                    {currentProgram.content ? (
                      JSON.parse(typeof currentProgram.content === "string" ? currentProgram.content : "[]").slice(0, 3).map((meal: any, idx: number) => (
                        <div key={idx} className="p-3 rounded" style={{ backgroundColor: "var(--surface)" }}>
                          <p className="font-oswald text-sm uppercase" style={{ color: "var(--gold)" }}>
                            {meal.timing || ["Breakfast", "Lunch", "Dinner"][idx]}
                          </p>
                          <p className="font-rajdhani text-xs mt-1" style={{ color: "var(--muted)" }}>
                            {meal.description || "Custom meal"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="font-rajdhani text-xs" style={{ color: "var(--muted)" }}>No meals added yet</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  No meal plan assigned yet.
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
                  <div className="space-y-4">
                    {checkIns.map((checkIn: any, idx: number) => (
                      <div key={idx} className={`pb-4 ${idx < checkIns.length - 1 ? "border-b" : ""}`} style={{ borderBottomColor: "var(--surface2)" }}>
                        <p className="font-rajdhani text-xs mb-2" style={{ color: "var(--muted)" }}>
                          {new Date(checkIn.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex justify-between font-rajdhani text-sm">
                          <span>Weight: <span style={{ color: "var(--gold)" }}>{checkIn.weight} lbs</span></span>
                          <span>Energy: <span style={{ color: "var(--gold)" }}>{checkIn.energyLevel}/10</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                </>
              ) : (
                <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                  No check-ins yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8 border-t" style={{ borderTopColor: "var(--surface2)" }}>
          <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/public-profile/${clientId}`;
              navigator.clipboard.writeText(url);
              alert("Profile link copied to clipboard!");
            }}
            className="px-6 py-2 rounded font-oswald text-sm uppercase"
            style={{ backgroundColor: "transparent", border: "2px solid var(--gold)", color: "var(--gold)" }}
          >
            📋 Share Profile
          </button>
        </div>
      </div>
    </div>
  );
}
