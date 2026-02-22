// This API route generates a meal plan based on the client's program goal and the number of days until the next consultation. It uses the Anthropic API to create meal plans in batches, ensuring that the response is manageable and can be parsed effectively. The generated meal plan includes details for each meal and its ingredients, which are then returned as a JSON response to be used in the MealsBuilder component.
//src/app/api/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function cleanJSON(text: string): string {
  let cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned;
}

async function generateBatch(
  programGoal: string,
  startDayNumber: number,
  numberOfDays: number,
  batchDate: Date
): Promise<any[]> {
  const prompt = `You are a nutritionist. Generate a ${numberOfDays}-day meal plan for goal: "${programGoal}".

Return ONLY a JSON array. No markdown. No explanation. No extra text.

Each day has 5 meals: Breakfast, Snack, Lunch, Afternoon Snack, Dinner.
Each meal has: slot, name, totalCalories, totalProtein, totalFat, totalCarbs, and ingredients.
Each ingredient has ONLY: name, quantity (grams), calories.

Example for ${numberOfDays} day(s) starting at day ${startDayNumber}:
[{"day":${startDayNumber},"date":"${batchDate.toISOString().split('T')[0]}","meals":[{"slot":"Breakfast","name":"Oatmeal with Berries","totalCalories":320,"totalProtein":10,"totalFat":5,"totalCarbs":58,"ingredients":[{"name":"Oats","quantity":80,"calories":280},{"name":"Berries","quantity":60,"calories":40}]},{"slot":"Snack","name":"Apple","totalCalories":80,"totalProtein":0,"totalFat":0,"totalCarbs":20,"ingredients":[{"name":"Apple","quantity":150,"calories":80}]},{"slot":"Lunch","name":"Chicken Salad","totalCalories":380,"totalProtein":42,"totalFat":10,"totalCarbs":18,"ingredients":[{"name":"Chicken","quantity":150,"calories":250},{"name":"Salad","quantity":100,"calories":30},{"name":"Olive Oil","quantity":10,"calories":100}]},{"slot":"Afternoon Snack","name":"Yogurt","totalCalories":120,"totalProtein":12,"totalFat":0,"totalCarbs":14,"ingredients":[{"name":"Greek Yogurt","quantity":150,"calories":120}]},{"slot":"Dinner","name":"Salmon and Broccoli","totalCalories":430,"totalProtein":42,"totalFat":20,"totalCarbs":12,"ingredients":[{"name":"Salmon","quantity":180,"calories":350},{"name":"Broccoli","quantity":150,"calories":50},{"name":"Olive Oil","quantity":5,"calories":40}]}]}]

Now generate ${numberOfDays} days starting from day ${startDayNumber}. Vary meals. Return ONLY the JSON array.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  console.log(`Day ${startDayNumber} response length: ${responseText.length}`);

  const cleaned = cleanJSON(responseText);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`Parse error day ${startDayNumber}:`, err);
    console.error('Raw:', responseText.substring(0, 300));
    throw new Error(`JSON parse failed for day ${startDayNumber}: ${err}`);
  }
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

    const cappedDays = Math.min(numberOfDays, 28);
    const start = new Date(startDate);
    // 3 days per batch — very safe size
    const BATCH_SIZE = 3;
    const allDays: any[] = [];

    for (let i = 0; i < cappedDays; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, cappedDays - i);
      const batchStartDay = i + 1;
      const batchDate = new Date(start);
      batchDate.setDate(batchDate.getDate() + i);

      console.log(`Generating days ${batchStartDay}–${batchStartDay + batchSize - 1}`);

      const batchDays = await generateBatch(
        programGoal,
        batchStartDay,
        batchSize,
        batchDate
      );

      allDays.push(...batchDays);
    }

    // Add IDs and correct dates
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
            id: uuidv4(),
            name: ing.name,
            quantity: ing.quantity,
            calories: ing.calories,
          })),
        })),
      };
    });

    return NextResponse.json({ planDays: planDaysWithIds });

  } catch (err: unknown) {
    console.error('Generation error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to generate meal plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}