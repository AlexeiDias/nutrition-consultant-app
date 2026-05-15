// src/components/client/UnitToggle.tsx
'use client';

import { useUnits } from '@/context/UnitContext';
import { UnitSystem } from '@/lib/units';

export default function UnitToggle() {
  const { unitSystem, setUnitSystem, loadingUnits } = useUnits();

  if (loadingUnits) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        ⚖️ Unit Preference
      </p>
      <div className="flex gap-2">
        {(['metric', 'imperial'] as const).map((unit) => (
          <button
            key={unit}
            onClick={() => setUnitSystem(unit)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              unitSystem === unit
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            {unit === 'metric' ? '🌍 Metric' : '🇺🇸 Imperial'}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {unitSystem === 'metric'
          ? 'Weight in kg · Height in cm · Food in g · Water in L'
          : 'Weight in lb · Height in ft · Food in oz · Water in fl oz'}
      </p>
    </div>
  );
}
