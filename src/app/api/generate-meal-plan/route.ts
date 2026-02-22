// This API route generates a meal plan based on the client's goal and number of days using Anthropic's API. It expects a JSON body with "programGoal", "numberOfDays", and "startDate". The response is a structured meal plan with meals and nutritional information for each day.
//src/app/api/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MEAL_SLOTS = ['Breakfast', 'Snack', 'Lunch', 'Afternoon Snack', 'Dinner'];

export async function POST(req: NextRequest) {
  try {
    const { programGoal, numberOfDays, startDate } = await req.json();

    if (!programGoal || !numberOfDays) {
      return NextResponse.json(
        { error: 'Missing programGoal or numberOfDays' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert nutritionist. Create a detailed ${numberOfDays}-day meal plan for a client with the following goal: "${programGoal}".

For each day, provide exactly 5 meals: Breakfast, Snack, Lunch, Afternoon Snack, and Dinner.

For each meal provide realistic nutritional estimates.

Respond with ONLY a valid JSON array, no other text, no markdown, no backticks. Use this exact structure:

[
  {
    "day": 1,
    "date": "${startDate}",
    "meals": [
      {
        "slot": "Breakfast",
        "name": "Meal name here",
        "ingredients": [
          {
            "name": "Ingredient name",
            "quantity": 100,
            "calories": 150,
            "protein": 5,
            "fat": 3,
            "carbs": 25
          }
        ],
        "totalCalories": 350,
        "totalProtein": 15,
        "totalFat": 8,
        "totalCarbs": 45
      }
    ]
  }
]

Rules:
- Make meals appropriate for the goal: "${programGoal}"
- Vary meals across different days — do not repeat the same meals
- Keep ingredient quantities realistic (grams)
- Ensure nutritional totals match the sum of ingredients
- Return ONLY the JSON array, nothing else`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Clean response and parse JSON
    const cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const planDays = JSON.parse(cleaned);

    // Add IDs to each meal and ingredient
    const { v4: uuidv4 } = await import('uuid');
    const planDaysWithIds = planDays.map((day: any, dayIndex: number) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayIndex);
      return {
        ...day,
        date: date.toISOString().split('T')[0],
        meals: day.meals.map((meal: any) => ({
          ...meal,
          id: uuidv4(),
          ingredients: meal.ingredients.map((ing: any) => ({
            ...ing,
            id: uuidv4(),
          })),
        })),
      };
    });

    return NextResponse.json({ planDays: planDaysWithIds });
  } catch (err: unknown) {
    console.error('Meal plan generation error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to generate meal plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}