import { invokeLLM } from "./_core/llm";

export async function generateExercises(prompt: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional fitness coach creating workout programs. Generate a list of exercises based on the user's request. 
        Return ONLY valid JSON in this exact format:
        {
          "exercises": [
            {"name": "Exercise Name", "sets": 4, "reps": 8, "rest": 90, "notes": "coaching notes"},
            ...
          ]
        }
        Ensure sets, reps, and rest are numbers. Include 4-6 exercises.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "exercises",
        strict: true,
        schema: {
          type: "object",
          properties: {
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sets: { type: "integer" },
                  reps: { type: "integer" },
                  rest: { type: "integer" },
                  notes: { type: "string" },
                },
                required: ["name", "sets", "reps", "rest", "notes"],
                additionalProperties: false,
              },
            },
          },
          required: ["exercises"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }
  return { exercises: [] };
}

export async function generateNutrition(prompt: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional nutritionist creating meal plans. Generate a daily meal plan based on the user's request.
        Return ONLY valid JSON in this exact format:
        {
          "meals": [
            {"timing": "Breakfast", "description": "meal description", "macros": {"protein": 30, "carbs": 50, "fat": 15}},
            ...
          ]
        }
        Include 3-4 meals per day. Macros should be in grams.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "nutrition",
        strict: true,
        schema: {
          type: "object",
          properties: {
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timing: { type: "string" },
                  description: { type: "string" },
                  macros: {
                    type: "object",
                    properties: {
                      protein: { type: "integer" },
                      carbs: { type: "integer" },
                      fat: { type: "integer" },
                    },
                    required: ["protein", "carbs", "fat"],
                    additionalProperties: false,
                  },
                },
                required: ["timing", "description", "macros"],
                additionalProperties: false,
              },
            },
          },
          required: ["meals"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }
  return { meals: [] };
}
