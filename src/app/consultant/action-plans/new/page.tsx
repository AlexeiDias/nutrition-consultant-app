// Consultant-side page to create a new action plan for a client, with form inputs for plan details and tasks
//src/app/consultant/action-plans/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createActionPlan } from '@/lib/firestore';
import { ActionPlanTask, PlannedMeal } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CalorieCalculator from '@/components/consultant/CalorieCalculator';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

const categoryColors = {
  exercise: 'bg-blue-100 text-blue-700 border-blue-200',
  hydration: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  lifestyle: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function NewActionPlanPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';
  const clientName = searchParams.get('clientName') ?? '';

  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const [form, setForm] = useState({
    title: '',
    clientId,
    clientName,
    startDate: new Date().toISOString().split('T')[0],
    nextConsultation: '',
    status: 'active' as const,
    startWeight: '',
    targetWeight: '',
  });

  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'exercise' as ActionPlanTask['category'],
  });

  const handleAddMeal = (meal: PlannedMeal) => {
    setPlannedMeals((prev) => [...prev, meal]);
    toast.success(`${meal.name} added to plan!`);
    setShowCalculator(false);
  };

  const handleRemoveMeal = (mealId: string) => {
    setPlannedMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: uuidv4(),
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        completed: false,
        completedAt: null,
      },
    ]);
    setNewTask({ title: '', description: '', category: 'exercise' });
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    if (!form.clientId) { toast.error('Please select a client'); return; }
    setLoading(true);
    try {
      await createActionPlan({
        consultantId: profile.uid,
        clientId: form.clientId,
        clientName: form.clientName,
        title: form.title,
        startDate: new Date(form.startDate),
        nextConsultation: new Date(form.nextConsultation),
        status: form.status,
        tasks,
        plannedMeals,
        startWeight: form.startWeight ? Number(form.startWeight) : null,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Action plan created!');
      router.push('/consultant/action-plans');
    } catch {
      toast.error('Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/consultant/action-plans" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Action Plans
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Action Plan</h1>
        {clientName && <p className="text-gray-500 mt-1">For {clientName}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Plan Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Plan Details
          </h2>
          <Input
            label="Plan Title"
            placeholder="e.g. 4-Week Weight Loss Program"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              required
            />
            <Input
              label="Next Consultation Date"
              type="date"
              value={form.nextConsultation}
              onChange={(e) => setForm((p) => ({ ...p, nextConsultation: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starting Weight (kg)"
              type="number"
              step="0.1"
              placeholder="e.g. 85.0"
              value={form.startWeight}
              onChange={(e) => setForm((p) => ({ ...p, startWeight: e.target.value }))}
            />
            <Input
              label="Target Weight (kg)"
              type="number"
              step="0.1"
              placeholder="e.g. 78.0"
              value={form.targetWeight}
              onChange={(e) => setForm((p) => ({ ...p, targetWeight: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Planned Meals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            🍽️ Planned Meals
          </h2>

          {/* Existing Meals */}
          {plannedMeals.length > 0 && (
            <div className="flex flex-col gap-3 mb-4">
              {plannedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-900">{meal.name}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    <div>
                      <p className="text-sm font-bold text-orange-600">{meal.totalCalories}</p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-600">{meal.totalProtein}g</p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-600">{meal.totalFat}g</p>
                      <p className="text-xs text-gray-500">Fat</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-600">{meal.totalCarbs}g</p>
                      <p className="text-xs text-gray-500">Carbs</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {meal.ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between text-xs text-gray-600 bg-white rounded px-2 py-1"
                      >
                        <span>{ing.name}</span>
                        <span>{ing.quantity}g · {ing.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calculator Toggle */}
          <button
            type="button"
            onClick={() => setShowCalculator((p) => !p)}
            className="w-full border border-dashed border-green-300 rounded-lg p-3 text-sm text-green-700 hover:bg-green-50 transition-all"
          >
            {showCalculator ? '▲ Hide Calculator' : '+ Add Meal with Calculator'}
          </button>

          {showCalculator && (
            <div className="mt-4">
              <CalorieCalculator compact onSaveMeal={handleAddMeal} />
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Tasks
          </h2>

          {tasks.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between rounded-lg border p-3 ${categoryColors[task.category]}`}
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs mt-0.5 opacity-75">{task.description}</p>
                    )}
                    <span className="text-xs capitalize opacity-60">{task.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-xs opacity-60 hover:opacity-100 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">Add Task</p>
            <Input
              label="Task Title"
              placeholder="e.g. 30 min walk every morning"
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional details..."
                value={newTask.description}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask((p) => ({ ...p, category: e.target.value as any }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="exercise">🏃 Exercise</option>
                <option value="hydration">💧 Hydration</option>
                <option value="lifestyle">🌿 Lifestyle</option>
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={handleAddTask}>
              + Add Task
            </Button>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Create Action Plan
        </Button>
      </form>
    </div>
  );
}