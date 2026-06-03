import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/Card";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes: string;
}

interface ExerciseGeneratorProps {
  onExercisesGenerated: (exercises: Exercise[]) => void;
  isLoading?: boolean;
}

export function ExerciseGenerator({ onExercisesGenerated, isLoading }: ExerciseGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateExercises = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate exercises");
      }
      
      const data = await response.json();
      if (!data.exercises || !Array.isArray(data.exercises)) {
        throw new Error("Invalid response format");
      }
      
      onExercisesGenerated(data.exercises);
      setPrompt("");
    } catch (error) {
      console.error("Error generating exercises:", error);
      alert(`Failed to generate exercises: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader style={{ borderBottomColor: "var(--gold)" }} className="border-b-2">
        <h3 className="font-oswald text-lg uppercase tracking-widest" style={{ color: "var(--gold)" }}>
          ⚡ AI Exercise Generator
        </h3>
      </CardHeader>
      <CardBody>
        <textarea
          placeholder="Describe the workout you want (e.g., 'Upper body strength workout with compound lifts')"
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
          onClick={generateExercises}
          disabled={generating || isLoading || !prompt.trim()}
          className="w-full py-2 rounded font-oswald text-sm uppercase cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: generating || isLoading || !prompt.trim() ? "var(--surface)" : "var(--gold)",
            color: generating || isLoading || !prompt.trim() ? "var(--muted)" : "#000",
            opacity: generating || isLoading || !prompt.trim() ? 0.5 : 1,
          }}
        >
          {generating ? "Generating..." : "Generate Exercises"}
        </button>
      </CardBody>
    </Card>
  );
}
