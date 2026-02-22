'use client';

import { useState } from 'react';
import { PlanDay, MealItem, MealSlot, PlannedMealIngredient } from '@/lib/types';
import CalorieCalculator from './CalorieCalculator';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const MEAL_SLOTS: MealSlot[] = [
  'Breakfast',
  'Snack',
  'Lunch',
  'Afternoon Snack',
  'Dinner',
];

const slotColors: Record<MealSlot, string> = {
  Breakfast: 'bg-yellow-50 border-yellow-200',
  Snack: 'bg-orange-50 border-orange-200',
  Lunch: 'bg-green-50 border-green-200',
  'Afternoon Snack': 'bg-blue-50 border-blue-200',
  Dinner: 'bg-purple-50 border-purple-200',
};

const slotIcons: Record<MealSlot, string> = {
  Breakfast: '🌅',
  Snack: '🍎',
  Lunch: '☀️',
  'Afternoon Snack': '🫐',
  Dinner: '🌙',
};

interface MealsBuilderProps {
  planDays: PlanDay[];
  onChange: (days: PlanDay[]) => void;
  startDate: string;
  nextConsultation: string;
  programGoal: string;
}

export default function MealsBuilder({
  planDays,
  onChange,
  startDate,
  nextConsultation,
  programGoal,
}: MealsBuilderProps) {
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number;
    mealId: string;
  } | null>(null);

  const numberOfDays =
    startDate && nextConsultation
      ? Math.max(
          1,
          Math.ceil(
            (new Date(nextConsultation).getTime() -
              new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const handleGenerate = async () => {
    if (!programGoal) {
      toast.error('Please enter a program goal first');
      return;
    }
    if (!startDate || !nextConsultation) {
      toast.error('Please set start date and consultation date first');
      return;
    }
    if (
      planDays.length > 0 &&
      !confirm('This will replace the current meal plan. Continue?')
    )
      return;

    setGenerating(true);
    try {
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programGoal, numberOfDays, startDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.planDays);
      setExpandedDay(0);
      toast.success(`✨ ${numberOfDays}-day meal plan generated!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateMeal = (
    dayIndex: number,
    mealId: string,
    ingredients: PlannedMealIngredient[],
    mealName: string
  ) => {
    const totalCalories = ingredients.reduce((s, i) => s + i.calories, 0);

    const updated = planDays.map((day, dIdx) =>
      dIdx === dayIndex
        ? {
            ...day,
            meals: day.meals.map((m) =>
              m.id === mealId
                ? {
                    ...m,
                    name: mealName || m.name,
                    ingredients,
                    totalCalories,
                    totalProtein: m.totalProtein,
                    totalFat: m.totalFat,
                    totalCarbs: m.totalCarbs,
                  }
                : m
            ),
          }
        : day
    );
    onChange(updated);
    setEditingMeal(null);
    toast.success('Meal updated!');
  };

  if (numberOfDays === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 text-sm">
        Set start date and consultation date to enable the meals builder
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Generate Button */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-green-900">
              ✨ AI Meal Plan Generator
            </h4>
            <p className="text-sm text-green-700 mt-0.5">
              Generate a {numberOfDays}-day meal plan based on{' '}
              <strong>{programGoal || 'your program goal'}</strong>
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            loading={generating}
            className="shrink-0 ml-3"
          >
            {generating ? 'Generating...' : '✨ Generate Plan'}
          </Button>
        </div>
        {generating && (
          <div className="mt-3 bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-green-700">
                AI is creating your {numberOfDays}-day meal plan. This may take
                a minute...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Days */}
      {planDays.length > 0 && (
        <div className="flex flex-col gap-3">
          {planDays.map((day, dayIndex) => {
            const dayDate = new Date(day.date);
            const dayTotalCals = day.meals.reduce(
              (s, m) => s + m.totalCalories,
              0
            );
            const isExpanded = expandedDay === dayIndex;

            return (
              <div
                key={dayIndex}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDay(isExpanded ? null : dayIndex)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {day.day}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        Day {day.day}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(dayDate, 'EEEE, MMM d')} · {dayTotalCals} kcal
                        total
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Meals */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 flex flex-col gap-3">
                    {day.meals.map((meal) => {
                      const isEditing =
                        editingMeal?.dayIndex === dayIndex &&
                        editingMeal?.mealId === meal.id;

                      return (
                        <div
                          key={meal.id}
                          className={`rounded-lg border p-3 ${slotColors[meal.slot]}`}
                        >
                          {/* Meal Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {slotIcons[meal.slot]} {meal.slot}
                              </p>
                              <p className="font-medium text-gray-900 text-sm">
                                {meal.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingMeal(
                                  isEditing
                                    ? null
                                    : { dayIndex, mealId: meal.id }
                                )
                              }
                              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              {isEditing ? 'Cancel' : '✏️ Edit'}
                            </button>
                          </div>

                          {/* Macros */}
                          <div className="flex gap-2 flex-wrap mb-2">
                            <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                              🔥 {meal.totalCalories} kcal
                            </span>
                            {meal.totalProtein > 0 && (
                              <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                                💪 {meal.totalProtein}g P
                              </span>
                            )}
                            {meal.totalFat > 0 && (
                              <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                                🧈 {meal.totalFat}g F
                              </span>
                            )}
                            {meal.totalCarbs > 0 && (
                              <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                                🌾 {meal.totalCarbs}g C
                              </span>
                            )}
                          </div>

                          {/* Ingredients */}
                          {meal.ingredients.length > 0 && (
                            <div className="flex flex-col gap-1 mb-2">
                              {meal.ingredients.map((ing) => (
                                <div
                                  key={ing.id}
                                  className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-white"
                                >
                                  <span className="text-gray-700">
                                    {ing.name}
                                  </span>
                                  <span className="text-gray-400">
                                    {ing.quantity}g · {ing.calories} kcal
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Calculator */}
                          {isEditing && (
                            <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Edit ingredients for {meal.name}
                              </p>
                              <CalorieCalculator
                                compact
                                initialMealName={meal.name}
                                initialIngredients={meal.ingredients}
                                onSaveMeal={(savedMeal) =>
                                  handleUpdateMeal(
                                    dayIndex,
                                    meal.id,
                                    savedMeal.ingredients,
                                    savedMeal.name
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
