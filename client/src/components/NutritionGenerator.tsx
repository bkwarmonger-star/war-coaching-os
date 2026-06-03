import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/Card";

interface Meal {
  timing: string;
  description: string;
  macros?: { protein: number; carbs: number; fat: number };
}

interface NutritionGeneratorProps {
  onMealsGenerated: (meals: Meal[]) => void;
  isLoading?: boolean;
}

export function NutritionGenerator({ onMealsGenerated, isLoading }: NutritionGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateMeals = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate meals");
      }
      
      const data = await response.json();
      if (!data.meals || !Array.isArray(data.meals)) {
        throw new Error("Invalid response format");
      }
      
      onMealsGenerated(data.meals);
      setPrompt("");
    } catch (error) {
      console.error("Error generating meals:", error);
      alert(`Failed to generate meal plan: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
        <h3 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
          🍽️ AI Nutrition Generator
        </h3>
      </CardHeader>
      <CardBody>
        <textarea
          placeholder="Describe the meal plan you want (e.g., 'High protein, low carb diet for muscle gain')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 rounded border mb-4"
          style={{
            backgroundColor: "var(--surface2)",
            borderColor: "var(--border)",
            color: "var(--white)",
          }}
          rows={3}
        />
        <button
          onClick={generateMeals}
          disabled={generating || isLoading || !prompt.trim()}
          className="w-full py-2 rounded font-oswald text-sm uppercase cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: generating || isLoading || !prompt.trim() ? "var(--surface)" : "var(--gold)",
            color: generating || isLoading || !prompt.trim() ? "var(--muted)" : "#000",
            opacity: generating || isLoading || !prompt.trim() ? 0.5 : 1,
          }}
        >
          {generating ? "Generating..." : "Generate Meal Plan"}
        </button>
      </CardBody>
    </Card>
  );
}
