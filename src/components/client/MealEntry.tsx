//src/components/client/MealEntry.tsx
import { Meal } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface MealEntryProps {
  meal: Meal;
  index: number;
  onChange: (index: number, field: keyof Meal, value: string | number) => void;
  onRemove: (index: number) => void;
}

export default function MealEntry({ meal, index, onChange, onRemove }: MealEntryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Meal {index + 1}</h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 text-xs"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Time"
          type="time"
          value={meal.time}
          onChange={(e) => onChange(index, 'time', e.target.value)}
        />
        <div className="col-span-2">
          <Input
            label="Description"
            type="text"
            placeholder="e.g. Grilled chicken with rice"
            value={meal.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
          />
        </div>
        <Input
          label="Calories"
          type="number"
          placeholder="0"
          value={meal.calories || ''}
          onChange={(e) => onChange(index, 'calories', Number(e.target.value))}
        />
      </div>
    </div>
  );
}