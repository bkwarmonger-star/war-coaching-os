import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardBody } from "@/components/Card";

interface Exercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes: string;
}

interface Meal {
  id?: string;
  name: string;
  timing: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  recipe: string;
}

export default function ProgramDetailPage() {
  const [, params] = useRoute("/programs/:id");
  const [, setLocation] = useLocation();
  const programId = params?.id;

  const [program, setProgram] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | undefined>(undefined);
  const [editingMealId, setEditingMealId] = useState<string | undefined>(undefined);
  const [newExercise, setNewExercise] = useState<Exercise>({
    name: "",
    sets: 3,
    reps: "8-12",
    rest: 60,
    notes: "",
  });
  const [newMeal, setNewMeal] = useState<Meal>({
    name: "",
    timing: "Breakfast",
    macros: { protein: 0, carbs: 0, fats: 0 },
    recipe: "",
  });

  const { data: programData, isLoading } = trpc.programs.get.useQuery(
    { programId: programId ? parseInt(programId) : 0 },
    { enabled: !!programId }
  );

  const updateMutation = trpc.programs.update.useMutation({
    onSuccess: () => {
      // Refetch program data
    },
  });

  // Parse program content when it loads
  useEffect(() => {
    if (programData) {
      setProgram(programData);
      const content = typeof programData.content === "string" ? JSON.parse(programData.content) : programData.content;
      
      // Normalize exercises to ensure all have unique IDs
      const normalizedExercises = (content?.exercises || []).map((ex: any, idx: number) => ({
        ...ex,
        id: ex.id || `ex-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      }));
      
      // Normalize meals to ensure all have unique IDs
      const normalizedMeals = (content?.meals || []).map((meal: any, idx: number) => ({
        ...meal,
        id: meal.id || `meal-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      }));
      
      setExercises(normalizedExercises);
      setMeals(normalizedMeals);
    }
  }, [programData]);

  const handleAddExercise = () => {
    if (!newExercise.name) return;
    if (editingExerciseId) {
      const updatedExercises = exercises.map((e) => (e.id === editingExerciseId ? { ...newExercise, id: editingExerciseId } : e));
      setExercises(updatedExercises);
      saveProgram(updatedExercises, meals);
      setEditingExerciseId(undefined);
    } else {
      const uniqueId = `ex-${Date.now()}-${exercises.length}-${Math.random().toString(36).substr(2, 9)}`;
      const updatedExercises = [...exercises, { ...newExercise, id: uniqueId }];
      setExercises(updatedExercises);
      saveProgram(updatedExercises, meals);
    }
    setNewExercise({ name: "", sets: 3, reps: "8-12", rest: 60, notes: "" });
    setShowAddExercise(false);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setNewExercise(exercise);
    setEditingExerciseId(exercise.id);
    setShowAddExercise(true);
  };

  const handleDeleteExercise = (id: string | undefined) => {
    const updated = exercises.filter((e) => e.id !== id);
    setExercises(updated);
    saveProgram(updated, meals);
  };

  const handleAddMeal = () => {
    if (!newMeal.name) return;
    if (editingMealId) {
      const updatedMeals = meals.map((m) => (m.id === editingMealId ? { ...newMeal, id: editingMealId } : m));
      setMeals(updatedMeals);
      saveProgram(exercises, updatedMeals);
      setEditingMealId(undefined);
    } else {
      const uniqueId = `meal-${Date.now()}-${meals.length}-${Math.random().toString(36).substr(2, 9)}`;
      const updatedMeals = [...meals, { ...newMeal, id: uniqueId }];
      setMeals(updatedMeals);
      saveProgram(exercises, updatedMeals);
    }
    setNewMeal({ name: "", timing: "Breakfast", macros: { protein: 0, carbs: 0, fats: 0 }, recipe: "" });
    setShowAddMeal(false);
  };

  const handleEditMeal = (meal: Meal) => {
    setNewMeal(meal);
    setEditingMealId(meal.id);
    setShowAddMeal(true);
  };

  const handleDeleteMeal = (id: string | undefined) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
    saveProgram(exercises, updated);
  };

  const saveProgram = (exs: Exercise[], mls: Meal[]) => {
    if (!programId) return;
    updateMutation.mutate({
      programId: parseInt(programId),
      content: { exercises: exs, meals: mls },
    });
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p style={{ color: "var(--muted)" }}>Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p style={{ color: "var(--muted)" }}>Program not found.</p>
          <Button variant="secondary" onClick={() => setLocation("/programs")} className="mt-4">
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bebas text-4xl" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
                {program.name}
              </h1>
              <p style={{ color: "var(--muted)" }} className="text-sm mt-2">
                {program.description}
              </p>
              <p style={{ color: "var(--muted)" }} className="text-sm mt-1">
                Type: {program.programType} | Duration: {program.duration} weeks
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/export/workout/${program.id}`}
                download
                className="px-4 py-2 font-rajdhani font-bold rounded hover:opacity-90 transition"
                style={{ backgroundColor: "var(--gold)", color: "var(--black)" }}
              >
                📥 Workout PDF
              </a>
              <a
                href={`/api/export/meal-plan/${program.id}`}
                download
                className="px-4 py-2 font-rajdhani font-bold rounded hover:opacity-90 transition"
                style={{ backgroundColor: "var(--gold)", color: "var(--black)" }}
              >
                📥 Meal Plan PDF
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Exercises Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald uppercase text-lg" style={{ color: "var(--white)" }}>
                Exercises
              </h2>
              <Button variant="primary" size="sm" onClick={() => setShowAddExercise(true)}>
                Add Exercise
              </Button>
            </div>

            {showAddExercise && (
              <Card className="mb-6">
                <CardBody className="space-y-3">
                  <input
                    type="text"
                    placeholder="Exercise name (e.g., Barbell Squat)"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Sets"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) })}
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                        color: "var(--white)",
                      }}
                      className="border rounded px-3 py-2 font-rajdhani text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Reps (e.g., 8-12)"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                        color: "var(--white)",
                      }}
                      className="border rounded px-3 py-2 font-rajdhani text-sm"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Rest (seconds)"
                    value={newExercise.rest}
                    onChange={(e) => setNewExercise({ ...newExercise, rest: parseInt(e.target.value) })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                  />
                  <textarea
                    placeholder="Notes (form tips, modifications, etc.)"
                    value={newExercise.notes}
                    onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleAddExercise} className="flex-1">
                      {editingExerciseId ? "Save" : "Add"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddExercise(false);
                        setEditingExerciseId(undefined);
                        setNewExercise({ name: "", sets: 3, reps: "8-12", rest: 60, notes: "" });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="space-y-3">
              {exercises.length > 0 ? (
                exercises.map((ex) => (
                  <Card key={ex.id}>
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-oswald" style={{ color: "var(--gold)" }}>
                            {ex.name}
                          </h3>
                          <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                            {ex.sets} sets × {ex.reps} reps | {ex.rest}s rest
                          </p>
                          {ex.notes && (
                            <p className="font-rajdhani text-xs mt-2" style={{ color: "var(--muted)" }}>
                              {ex.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditExercise(ex)}
                            className="text-blue-400 hover:text-blue-300 font-oswald text-xs uppercase"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="text-red-400 hover:text-red-300 font-oswald text-xs uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--muted)" }} className="text-sm">
                  No exercises yet. Add one to get started.
                </p>
              )}
            </div>
          </div>

          {/* Meals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald uppercase text-lg" style={{ color: "var(--white)" }}>
                Meal Plans
              </h2>
              <Button variant="primary" size="sm" onClick={() => setShowAddMeal(true)}>
                Add Meal
              </Button>
            </div>

            {showAddMeal && (
              <Card className="mb-6">
                <CardBody className="space-y-3">
                  <input
                    type="text"
                    placeholder="Meal name (e.g., Grilled Chicken & Rice)"
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                  />
                  <select
                    value={newMeal.timing}
                    onChange={(e) => setNewMeal({ ...newMeal, timing: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                    <option>Pre-Workout</option>
                    <option>Post-Workout</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Protein (g)"
                      value={newMeal.macros.protein}
                      onChange={(e) => setNewMeal({ ...newMeal, macros: { ...newMeal.macros, protein: parseInt(e.target.value) } })}
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                        color: "var(--white)",
                      }}
                      className="border rounded px-3 py-2 font-rajdhani text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Carbs (g)"
                      value={newMeal.macros.carbs}
                      onChange={(e) => setNewMeal({ ...newMeal, macros: { ...newMeal.macros, carbs: parseInt(e.target.value) } })}
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                        color: "var(--white)",
                      }}
                      className="border rounded px-3 py-2 font-rajdhani text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Fats (g)"
                      value={newMeal.macros.fats}
                      onChange={(e) => setNewMeal({ ...newMeal, macros: { ...newMeal.macros, fats: parseInt(e.target.value) } })}
                      style={{
                        backgroundColor: "var(--surface2)",
                        borderColor: "var(--border)",
                        color: "var(--white)",
                      }}
                      className="border rounded px-3 py-2 font-rajdhani text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Recipe / Preparation instructions"
                    value={newMeal.recipe}
                    onChange={(e) => setNewMeal({ ...newMeal, recipe: e.target.value })}
                    style={{
                      backgroundColor: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--white)",
                    }}
                    className="w-full border rounded px-3 py-2 font-rajdhani text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleAddMeal} className="flex-1">
                      {editingMealId ? "Save" : "Add"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddMeal(false);
                        setEditingMealId(undefined);
                        setNewMeal({ name: "", timing: "Breakfast", macros: { protein: 0, carbs: 0, fats: 0 }, recipe: "" });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="space-y-3">
              {meals.length > 0 ? (
                meals.map((meal) => (
                  <Card key={meal.id}>
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-oswald" style={{ color: "var(--gold)" }}>
                            {meal.name}
                          </h3>
                          <p className="font-rajdhani text-sm" style={{ color: "var(--muted)" }}>
                            {meal.timing}
                          </p>
                          <p className="font-rajdhani text-xs mt-2" style={{ color: "var(--muted)" }}>
                            P: {meal.macros.protein}g | C: {meal.macros.carbs}g | F: {meal.macros.fats}g
                          </p>
                          {meal.recipe && (
                            <p className="font-rajdhani text-xs mt-2" style={{ color: "var(--muted)" }}>
                              {meal.recipe}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMeal(meal)}
                            className="text-blue-400 hover:text-blue-300 font-oswald text-xs uppercase"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-red-400 hover:text-red-300 font-oswald text-xs uppercase"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--muted)" }} className="text-sm">
                  No meals yet. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={() => setLocation("/programs")} className="mt-8">
          Back to Programs
        </Button>
      </div>
    </div>
  );
}
