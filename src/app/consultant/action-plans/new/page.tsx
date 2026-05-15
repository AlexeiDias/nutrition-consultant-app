// src/app/consultant/action-plans/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createActionPlan, getClientsByConsultant } from '@/lib/firestore';
import { ActionPlanTask, PlanDay, ActivityLevel, Client } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import MealsBuilder from '@/components/consultant/MealsBuilder';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

const categoryColors = {
  exercise: 'bg-blue-100 text-blue-700 border-blue-200',
  hydration: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  lifestyle: 'bg-purple-100 text-purple-700 border-purple-200',
};

const PROGRAM_GOALS = [
  'Weight loss',
  'Muscle gain',
  'Diabetes management',
  'Heart health',
  'Sports performance',
  'Gut health',
  'General healthy eating',
  'Custom',
];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calculateTDEE(
  gender: string,
  age: number,
  height: number,
  weight: number,
  activityLevel: ActivityLevel
): number {
  let bmr = 0;
  if (gender?.toLowerCase() === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export default function NewActionPlanPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClientId = searchParams.get('clientId') ?? '';
  const urlClientName = searchParams.get('clientName') ?? '';

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
  const [tdee, setTdee] = useState<number>(0);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'exercise' as ActionPlanTask['category'],
  });

  const [form, setForm] = useState({
    title: '',
    clientId: urlClientId,
    clientName: urlClientName,
    startDate: new Date().toISOString().split('T')[0],
    nextConsultation: '',
    status: 'active' as const,
    startWeight: '',
    targetWeight: '',
  });

  // Load all clients for the selector
  useEffect(() => {
    if (!profile?.uid) return;
    getClientsByConsultant(profile.uid).then(setClients);
  }, [profile]);

  // When a client is selected (either via URL or dropdown), load their data for TDEE
  useEffect(() => {
    if (!form.clientId) return;
    const found = clients.find((c) => c.id === form.clientId);
    if (found) {
      setClientData(found);
      if (found.gender && found.age && found.height && found.activityLevel) {
        const weight = form.startWeight ? Number(form.startWeight) : 70;
        const calculatedTdee = calculateTDEE(
          found.gender,
          Number(found.age),
          Number(found.height),
          weight,
          found.activityLevel as ActivityLevel
        );
        setTdee(calculatedTdee);
      } else {
        setTdee(0);
      }
    }
  }, [form.clientId, clients]);

  // Recalculate TDEE when startWeight changes
  useEffect(() => {
    if (!clientData || !form.startWeight) return;
    if (clientData.gender && clientData.age && clientData.height && clientData.activityLevel) {
      const calculatedTdee = calculateTDEE(
        clientData.gender,
        Number(clientData.age),
        Number(clientData.height),
        Number(form.startWeight),
        clientData.activityLevel as ActivityLevel
      );
      setTdee(calculatedTdee);
    }
  }, [form.startWeight, clientData]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const programGoal = [
    ...selectedGoals.filter((g) => g !== 'Custom'),
    ...(selectedGoals.includes('Custom') && customGoal ? [customGoal] : []),
  ].join(' + ');

  const numberOfDays =
    form.startDate && form.nextConsultation
      ? Math.max(
          1,
          Math.ceil(
            (new Date(form.nextConsultation).getTime() -
              new Date(form.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

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

  const doSave = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      await createActionPlan({
        consultantId: profile.uid,
        clientId: form.clientId,
        clientName: form.clientName,
        title: form.title,
        programGoal,
        programGoals: selectedGoals,
        planStatus: 'draft',
        tdee,
        startDate: new Date(form.startDate),
        nextConsultation: new Date(form.nextConsultation),
        status: form.status,
        tasks,
        planDays,
        startWeight: form.startWeight ? Number(form.startWeight) : null,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Action plan saved as draft!');
      router.push('/consultant/action-plans');
    } catch {
      toast.error('Failed to create plan');
    } finally {
      setLoading(false);
      setShowDisclaimer(false);
      setPendingSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    if (!form.clientId) {
      toast.error('Please select a client');
      return;
    }
    if (selectedGoals.length === 0) {
      toast.error('Please select at least one program goal');
      return;
    }
    if (planDays.length > 0) {
      setShowDisclaimer(true);
      setPendingSubmit(true);
      return;
    }
    await doSave();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/consultant/action-plans" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Action Plans
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Action Plan</h1>
        {form.clientName && <p className="text-gray-500 mt-1">For {form.clientName}</p>}
      </div>

      {/* Safety Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
              Clinical Safety Reminder
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              This meal plan was generated by AI. Before sharing with the client, please ensure:
            </p>
            <ul className="text-sm text-gray-600 mb-5 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                You have reviewed all meals for nutritional adequacy
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Meals are appropriate for any clinical conditions (diabetes, heart disease, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                Calorie targets align with the client's actual needs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                A registered dietician has been consulted for clients with clinical conditions
              </li>
            </ul>
            <p className="text-xs text-gray-400 mb-5 text-center">
              The plan will be saved as a <strong>Draft</strong> until you mark it as Reviewed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDisclaimer(false); setPendingSubmit(false); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Go Back & Review
              </button>
              <Button onClick={doSave} loading={loading} className="flex-1">
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Plan Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Plan Details
          </h2>

          {/* Client Selector — shown when no client pre-selected via URL */}
          {!urlClientId && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Client <span className="text-red-500">*</span>
              </label>
              {clients.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No clients found.{' '}
                  <Link href="/consultant/clients/new" className="text-green-600 underline">
                    Add a client first →
                  </Link>
                </p>
              ) : (
                <select
                  value={form.clientId}
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    setForm((p) => ({
                      ...p,
                      clientId: e.target.value,
                      clientName: selected?.name ?? '',
                    }));
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <Input
            label="Plan Title"
            placeholder="e.g. 4-Week Weight Loss Program"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          {/* Program Goals — Multi Select */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Program Goals{' '}
              <span className="text-gray-400 font-normal">— select all that apply</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PROGRAM_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedGoals.includes(goal)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {selectedGoals.includes(goal) ? '✓ ' : ''}{goal}
                </button>
              ))}
            </div>
            {selectedGoals.includes('Custom') && (
              <input
                type="text"
                placeholder="Describe your custom program goal..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
            {selectedGoals.length > 0 && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5">
                🎯 {programGoal}
              </p>
            )}
          </div>

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

          {numberOfDays > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
              📅 This program spans <strong>{numberOfDays} days</strong>
            </div>
          )}

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

          {/* TDEE Display */}
          {tdee > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    🔥 Estimated Daily Calorie Need (TDEE)
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Based on client's age, height, weight and activity level (Mifflin-St Jeor)
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{tdee} kcal</p>
              </div>
              {selectedGoals.includes('Weight loss') && (
                <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded px-2 py-1">
                  ⚡ Suggested deficit target:{' '}
                  <strong>{tdee - 500} kcal/day</strong> (500 kcal deficit)
                </p>
              )}
              {selectedGoals.includes('Muscle gain') && (
                <p className="text-xs text-green-600 mt-2 bg-green-50 rounded px-2 py-1">
                  ⚡ Suggested surplus target:{' '}
                  <strong>{tdee + 300} kcal/day</strong> (300 kcal surplus)
                </p>
              )}
            </div>
          )}

          {/* Missing client body metrics warning */}
          {form.clientId && !tdee && clientData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <p className="text-sm text-yellow-800 font-medium">⚠️ TDEE cannot be calculated</p>
              <p className="text-xs text-yellow-600 mt-1">
                Client is missing age, height, or activity level. Update the client profile to
                enable accurate calorie targets.
              </p>
              <Link
                href={`/consultant/clients/${form.clientId}`}
                className="text-xs text-yellow-700 underline mt-1 inline-block"
              >
                Update client profile →
              </Link>
            </div>
          )}

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

        {/* Meals Builder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              🍽️ Meals Builder
            </h2>
            {numberOfDays > 0 && (
              <span className="text-xs text-gray-500">{numberOfDays} days · 5 meals/day</span>
            )}
          </div>

          {/* Safety Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-orange-800">
              <strong>⚠️ Clinical Notice:</strong> AI-generated meal plans are suggestions only.
              Always review for nutritional adequacy before sharing with clients, especially those
              with clinical conditions. Plans are saved as <strong>Draft</strong> until marked as
              Reviewed.
            </p>
          </div>

          {programGoal && (
            <p className="text-xs text-green-600 mb-4">
              Goal: {programGoal}{tdee > 0 && ` · TDEE: ${tdee} kcal`}
            </p>
          )}

          <MealsBuilder
            planDays={planDays}
            onChange={setPlanDays}
            startDate={form.startDate}
            nextConsultation={form.nextConsultation}
            programGoal={programGoal}
            tdee={tdee}
            selectedGoals={selectedGoals}
          />
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
                  className={`flex items-start justify-between rounded-lg border p-3 ${
                    categoryColors[task.category]
                  }`}
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
              <label className="text-sm font-medium text-gray-700">Description (optional)</label>
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
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, category: e.target.value as any }))
                }
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
