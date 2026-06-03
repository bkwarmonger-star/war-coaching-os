import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

export default function MealsPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    dailyCalories: "2500",
    dietaryRestrictions: "",
    allergies: "",
    preferences: "",
    goals: "",
  });

  const generateMutation = trpc.ai.generateMealPlan.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({
        clientId: "",
        dailyCalories: "2500",
        dietaryRestrictions: "",
        allergies: "",
        preferences: "",
        goals: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      clientId: parseInt(formData.clientId),
      dailyCalories: parseInt(formData.dailyCalories),
      dietaryRestrictions: formData.dietaryRestrictions ? [formData.dietaryRestrictions] : [],
      allergies: formData.allergies ? [formData.allergies] : [],
      preferences: formData.preferences ? formData.preferences.split(",").map(p => p.trim()) : [],
      goals: formData.goals ? [formData.goals] : [],
    });
  };

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
            MEAL PLANS
          </h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Generate Meal Plan"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Client ID"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Daily Calories"
                    value={formData.dailyCalories}
                    onChange={(e) => setFormData({ ...formData, dailyCalories: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <input
                    type="text"
                    placeholder="Dietary Restrictions"
                    value={formData.dietaryRestrictions}
                    onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <input
                    type="text"
                    placeholder="Allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani"
                  />
                  <textarea
                    placeholder="Food Preferences (comma-separated)"
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-1"
                  />
                  <textarea
                    placeholder="Goals"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="border rounded px-4 py-2 font-rajdhani col-span-1"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  {generateMutation.isPending ? "Generating..." : "Generate Meal Plan"}
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {generateMutation.isError && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="font-rajdhani text-red-400">
                Error: {generateMutation.error?.message || "Failed to generate meal plan. Please try again."}
              </p>
            </CardBody>
          </Card>
        )}

        {generateMutation.data && typeof generateMutation.data === "object" && "mealPlan" in generateMutation.data && typeof generateMutation.data.mealPlan === "string" && (
          <Card>
            <CardBody>
              <h3 className="font-bebas text-lg mb-4" style={{ color: "var(--gold)" }}>
                Generated Meal Plan
              </h3>
              <div className="font-rajdhani text-sm whitespace-pre-wrap" style={{ color: "var(--white)" }}>
                {generateMutation.data.mealPlan}
              </div>
            </CardBody>
          </Card>
        )}

        {!generateMutation.data && !showForm && !generateMutation.isError && !generateMutation.isPending && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="font-rajdhani" style={{ color: "var(--muted)" }}>
                Generate personalized meal plans for your clients.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
