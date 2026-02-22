// Page component for the Calorie Calculator, allowing consultants to access the calorie calculator interface where they can search for foods, build meals, and calculate macros for their clients. This page serves as the main entry point for the calorie calculator feature within the consultant dashboard.
//src/app/consultant/calculator/page.tsx
'use client';

import CalorieCalculator from '@/components/consultant/CalorieCalculator';

export default function CalculatorPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🧮 Calorie Calculator</h1>
        <p className="text-gray-500 mt-1">
          Search 3 million+ foods, build meals and calculate macros
        </p>
      </div>
      <CalorieCalculator />
    </div>
  );
}