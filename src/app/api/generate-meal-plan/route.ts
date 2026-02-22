// This API route generates a meal plan based on the client's program goal and the number of days until the next consultation. It uses the Anthropic API to create a structured meal plan in JSON format, which includes meals and their ingredients with nutritional information. The meal plan is generated in weekly batches to manage token limits and ensure variety across days. Each meal and ingredient is assigned a unique ID for database storage.
//src/app/api/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateWeek(
  programGoal: string,
  startDayNumber: number,
  numberOfDays: number,
  startDate: Date
): Promise<any[]> {
  const prompt = `You are an expert nutritionist. Create a ${numberOfDays}-day meal plan starting from day ${startDayNumber} for a client with the following goal: "${programGoal}".

For each day provide exactly 5 meals: Breakfast, Snack, Lunch, Afternoon Snack, and Dinner.

Respond with ONLY a valid compact JSON array. No markdown, no backticks, no extra text. Use this exact structure:
[{"day":${startDayNumber},"date":"DATE","meals":[{"slot":"Breakfast","name":"MEAL NAME","ingredients":[{"name":"INGREDIENT","quantity":100,"calories":150,"protein":5,"fat":3,"carbs":25}],"totalCalories":350,"totalProtein":15,"totalFat":8,"totalCarbs":45},{"slot":"Snack","name":"MEAL NAME","ingredients":[{"name":"INGREDIENT","quantity":50,"calories":80,"protein":3,"fat":1,"carbs":15}],"totalCalories":80,"totalProtein":3,"totalFat":1,"totalCarbs":15},{"slot":"Lunch","name":"MEAL NAME","ingredients":[{"name":"INGREDIENT","quantity":150,"calories":200,"protein":25,"fat":8,"carbs":20}],"totalCalories":450,"totalProtein":30,"totalFat":12,"totalCarbs":35},{"slot":"Afternoon Snack","name":"MEAL NAME","ingredients":[{"name":"INGREDIENT","quantity":30,"calories":100,"protein":2,"fat":5,"carbs":12}],"totalCalories":100,"totalProtein":2,"totalFat":5,"totalCarbs":12},{"slot":"Dinner","name":"MEAL NAME","ingredients":[{"name":"INGREDIENT","quantity":200,"calories":300,"protein":35,"fat":10,"carbs":25}],"totalCalories":550,"totalProtein":40,"totalFat":15,"totalCarbs":30}]}]

Rules:
- Generate exactly ${numberOfDays} day objects starting from day ${startDayNumber}
- Vary meals — do not repeat the same meals across days
- Keep ingredient lists short — maximum 4 ingredients per meal
- Make meals appropriate for goal: "${programGoal}"
- Return ONLY the JSON array, nothing else, no explanation`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const cleaned = responseText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const { programGoal, numberOfDays, startDate } = await req.json();

    if (!programGoal || !numberOfDays) {
      return NextResponse.json(
        { error: 'Missing programGoal or numberOfDays' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const BATCH_SIZE = 7;
    const allDays: any[] = [];

    // Generate in weekly batches
    for (let i = 0; i < numberOfDays; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, numberOfDays - i);
      const batchStartDay = i + 1;
      const batchDate = new Date(start);
      batchDate.setDate(batchDate.getDate() + i);

      const batchDays = await generateWeek(
        programGoal,
        batchStartDay,
        batchSize,
        batchDate
      );

      allDays.push(...batchDays);
    }

    // Add IDs and correct dates to each meal and ingredient
    const planDaysWithIds = allDays.map((day: any, dayIndex: number) => {
      const date = new Date(start);
      date.setDate(date.getDate() + dayIndex);
      return {
        ...day,
        day: dayIndex + 1,
        date: date.toISOString().split('T')[0],
        meals: (day.meals ?? []).map((meal: any) => ({
          ...meal,
          id: uuidv4(),
          ingredients: (meal.ingredients ?? []).map((ing: any) => ({
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