// A comprehensive calorie calculator component for consultants to search foods, build meals, and calculate macros, with the ability to save meals to a client's action plan. Utilizes OpenFoodFacts API for food data and provides a user-friendly interface for meal planning.
//src/components/consultant/CalorieCalculator.tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { PlannedMeal, PlannedMealIngredient } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface FoodResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface CalorieCalculatorProps {
  onSaveMeal?: (meal: PlannedMeal) => void;
  compact?: boolean;
}

export default function CalorieCalculator({
  onSaveMeal,
  compact = false,
}: CalorieCalculatorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [ingredients, setIngredients] = useState<PlannedMealIngredient[]>([]);
  const [mealName, setMealName] = useState('');
  const [servingInputs, setServingInputs] = useState<Record<string, number>>({});

  const searchFood = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=id,product_name,nutriments`
      );
      const data = await res.json();
      const foods: FoodResult[] = (data.products ?? [])
        .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'])
        .map((p: any) => ({
          id: p.id ?? uuidv4(),
          name: p.product_name,
          calories: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
          protein: Math.round(p.nutriments['proteins_100g'] ?? 0),
          fat: Math.round(p.nutriments['fat_100g'] ?? 0),
          carbs: Math.round(p.nutriments['carbohydrates_100g'] ?? 0),
        }));
      setResults(foods);
      if (foods.length === 0) toast.error('No results found. Try a different search.');
    } catch {
      toast.error('Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const calcNutrient = (base: number, quantity: number) =>
    Math.round((base * quantity) / 100);

  const handleAddIngredient = (food: FoodResult) => {
    const quantity = servingInputs[food.id] ?? 100;
    const ingredient: PlannedMealIngredient = {
      id: uuidv4(),
      name: food.name,
      quantity,
      calories: calcNutrient(food.calories, quantity),
      protein: calcNutrient(food.protein, quantity),
      fat: calcNutrient(food.fat, quantity),
      carbs: calcNutrient(food.carbs, quantity),
    };
    setIngredients((prev) => [...prev, ingredient]);
    toast.success(`${food.name} added`);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity,
              calories: calcNutrient(i.calories / (i.quantity / 100), quantity),
              protein: calcNutrient(i.protein / (i.quantity / 100), quantity),
              fat: calcNutrient(i.fat / (i.quantity / 100), quantity),
              carbs: calcNutrient(i.carbs / (i.quantity / 100), quantity),
            }
          : i
      )
    );
  };

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      fat: acc.fat + ing.fat,
      carbs: acc.carbs + ing.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const handleSaveMeal = () => {
    if (!mealName.trim()) {
      toast.error('Please enter a meal name');
      return;
    }
    if (ingredients.length === 0) {
      toast.error('Add at least one ingredient');
      return;
    }
    const meal: PlannedMeal = {
      id: uuidv4(),
      name: mealName,
      ingredients,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalFat: totals.fat,
      totalCarbs: totals.carbs,
    };
    onSaveMeal?.(meal);
    setIngredients([]);
    setMealName('');
    setResults([]);
    setQuery('');
    setServingInputs({});
  };

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'max-w-3xl'}`}>
      {/* Search */}
      <div className={`bg-gray-50 rounded-xl border border-gray-200 p-4`}>
        <h4 className="font-medium text-gray-800 mb-3">🔍 Search Food</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchFood()}
            placeholder="e.g. chicken breast, banana, oats..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button onClick={searchFood} loading={searching} className="shrink-0">
            Search
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {results.map((food) => (
              <div
                key={food.id}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {food.name}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    🔥 {food.calories} kcal
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    💪 {food.protein}g protein
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    🧈 {food.fat}g fat
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    🌾 {food.carbs}g carbs
                  </span>
                  <span className="text-xs text-gray-400">per 100g</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={servingInputs[food.id] ?? 100}
                    onChange={(e) =>
                      setServingInputs((p) => ({
                        ...p,
                        [food.id]: Number(e.target.value),
                      }))
                    }
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-gray-500">grams</span>
                  <Button
                    variant="secondary"
                    className="text-xs px-3 py-1 ml-auto"
                    onClick={() => handleAddIngredient(food)}
                  >
                    + Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Builder */}
      {ingredients.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="font-medium text-gray-800 mb-3">🍽️ Meal Ingredients</h4>

          <input
            type="text"
            placeholder="Meal name (e.g. Breakfast, Lunch...)"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 mb-3"
          />

          <div className="flex flex-col gap-2 mb-3">
            {ingredients.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ing.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ing.calories} kcal · {ing.protein}g P · {ing.fat}g F · {ing.carbs}g C
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={ing.quantity}
                  onChange={(e) =>
                    handleQuantityChange(ing.id, Number(e.target.value))
                  }
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-xs text-gray-400">g</span>
                <button
                  onClick={() => handleRemoveIngredient(ing.id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-green-800 mb-2">Meal Totals</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-orange-600">{totals.calories}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{totals.protein}g</p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{totals.fat}g</p>
                <p className="text-xs text-gray-500">Fat</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{totals.carbs}g</p>
                <p className="text-xs text-gray-500">Carbs</p>
              </div>
            </div>
          </div>

          {onSaveMeal && (
            <Button onClick={handleSaveMeal} className="w-full">
              💾 Save Meal to Plan
            </Button>
          )}
        </div>
      )}
    </div>
  );
}