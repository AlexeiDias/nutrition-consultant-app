// This API route generates a meal plan based on the client's program goal and the number of days until the next consultation. It uses the Anthropic API to create a structured meal plan in JSON format, which includes meals and their ingredients with nutritional information. The meal plan is generated in weekly batches to manage token limits and ensure variety across days. Each meal and ingredient is assigned a unique ID for database storage.
//src/app/api/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function cleanJSON(text: string): string {
  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Find the first [ and last ] to extract just the array
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
  startDate: Date
): Promise<any[]> {
  const prompt = `You are a nutritionist. Create a ${numberOfDays}-day meal plan for goal: "${programGoal}".

IMPORTANT: Return ONLY a valid JSON array. No text before or after. No markdown.

Each day has exactly 5 meals. Keep ingredient lists to 3 items max. Be concise.

Format:
[
  {
    "day": ${startDayNumber},
    "date": "${startDate.toISOString().split('T')[0]}",
    "meals": [
      {
        "slot": "Breakfast",
        "name": "Oatmeal with Berries",
        "ingredients": [
          {"name": "Oats", "quantity": 80, "calories": 300, "protein": 10, "fat": 5, "carbs": 55},
          {"name": "Mixed Berries", "quantity": 100, "calories": 50, "protein": 1, "fat": 0, "carbs": 12}
        ],
        "totalCalories": 350,
        "totalProtein": 11,
        "totalFat": 5,
        "totalCarbs": 67
      },
      {
        "slot": "Snack",
        "name": "Apple with Almonds",
        "ingredients": [
          {"name": "Apple", "quantity": 150, "calories": 80, "protein": 0, "fat": 0, "carbs": 20},
          {"name": "Almonds", "quantity": 30, "calories": 170, "protein": 6, "fat": 15, "carbs": 5}
        ],
        "totalCalories": 250,
        "totalProtein": 6,
        "totalFat": 15,
        "totalCarbs": 25
      },
      {
        "slot": "Lunch",
        "name": "Grilled Chicken Salad",
        "ingredients": [
          {"name": "Chicken Breast", "quantity": 150, "calories": 250, "protein": 45, "fat": 5, "carbs": 0},
          {"name": "Mixed Greens", "quantity": 100, "calories": 20, "protein": 2, "fat": 0, "carbs": 3}
        ],
        "totalCalories": 350,
        "totalProtein": 47,
        "totalFat": 8,
        "totalCarbs": 15
      },
      {
        "slot": "Afternoon Snack",
        "name": "Greek Yogurt",
        "ingredients": [
          {"name": "Greek Yogurt", "quantity": 200, "calories": 130, "protein": 15, "fat": 0, "carbs": 10}
        ],
        "totalCalories": 130,
        "totalProtein": 15,
        "totalFat": 0,
        "totalCarbs": 10
      },
      {
        "slot": "Dinner",
        "name": "Salmon with Vegetables",
        "ingredients": [
          {"name": "Salmon Fillet", "quantity": 180, "calories": 350, "protein": 40, "fat": 18, "carbs": 0},
          {"name": "Steamed Broccoli", "quantity": 150, "calories": 50, "protein": 4, "fat": 0, "carbs": 10}
        ],
        "totalCalories": 450,
        "totalProtein": 44,
        "totalFat": 20,
        "totalCarbs": 12
      }
    ]
  }
]

Now generate ${numberOfDays} days starting from day ${startDayNumber}. Vary the meals each day. Return ONLY the JSON array.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  console.log(`Batch day ${startDayNumber} raw response length:`, responseText.length);
  console.log(`Batch day ${startDayNumber} first 200 chars:`, responseText.substring(0, 200));
  console.log(`Batch day ${startDayNumber} last 200 chars:`, responseText.substring(responseText.length - 200));

  const cleaned = cleanJSON(responseText);
  console.log(`Cleaned length:`, cleaned.length);

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('JSON parse error:', parseErr);
    console.error('Problematic JSON:', cleaned.substring(0, 500));
    throw new Error(`Failed to parse meal plan JSON for day ${startDayNumber}: ${parseErr}`);
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

    // Cap at 28 days max
    const cappedDays = Math.min(numberOfDays, 28);
    const start = new Date(startDate);
    // Use smaller batches of 5 days to be safe
    const BATCH_SIZE = 5;
    const allDays: any[] = [];

    console.log(`Generating ${cappedDays}-day meal plan for goal: ${programGoal}`);

    for (let i = 0; i < cappedDays; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, cappedDays - i);
      const batchStartDay = i + 1;
      const batchDate = new Date(start);
      batchDate.setDate(batchDate.getDate() + i);

      console.log(`Generating batch: days ${batchStartDay} to ${batchStartDay + batchSize - 1}`);

      const batchDays = await generateBatch(
        programGoal,
        batchStartDay,
        batchSize,
        batchDate
      );

      allDays.push(...batchDays);
      console.log(`Batch complete. Total days so far: ${allDays.length}`);
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
            ...ing,
            id: uuidv4(),
          })),
        })),
      };
    });

    console.log(`Successfully generated ${planDaysWithIds.length} days`);
    return NextResponse.json({ planDays: planDaysWithIds });

  } catch (err: unknown) {
    console.error('Meal plan generation error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to generate meal plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}