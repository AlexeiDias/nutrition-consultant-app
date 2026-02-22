// This page allows consultants to create a new action plan for their clients. It includes a form to input plan details, select a program goal, set dates, and add tasks. The MealsBuilder component is integrated to generate meal plans based on the client's goal and consultation timeline. Upon submission, the plan is saved to Firestore and the consultant is redirected to the action plans list.
//src/app/consultant/action-plans/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createActionPlan } from '@/lib/firestore';
import { ActionPlanTask, PlanDay } from '@/lib/types';
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

export default function NewActionPlanPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') ?? '';
  const clientName = searchParams.get('clientName') ?? '';

  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');

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

  const [planDays, setPlanDays] = useState<PlanDay[]>([]);
  const [tasks, setTasks] = useState<ActionPlanTask[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'exercise' as ActionPlanTask['category'],
  });

  const programGoal = selectedGoal === 'Custom' ? customGoal : selectedGoal;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    if (!form.clientId) {
      toast.error('Please select a client');
      return;
    }
    setLoading(true);
    try {
      await createActionPlan({
        consultantId: profile.uid,
        clientId: form.clientId,
        clientName: form.clientName,
        title: form.title,
        programGoal,
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
        <Link
          href="/consultant/action-plans"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Action Plans
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          New Action Plan
        </h1>
        {clientName && (
          <p className="text-gray-500 mt-1">For {clientName}</p>
        )}
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

          {/* Program Goal */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Program Goal
            </label>
            <div className="flex flex-wrap gap-2">
              {PROGRAM_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedGoal === goal
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
            {selectedGoal === 'Custom' && (
              <input
                type="text"
                placeholder="Describe your custom program goal..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              required
            />
            <Input
              label="Next Consultation Date"
              type="date"
              value={form.nextConsultation}
              onChange={(e) =>
                setForm((p) => ({ ...p, nextConsultation: e.target.value }))
              }
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
              onChange={(e) =>
                setForm((p) => ({ ...p, startWeight: e.target.value }))
              }
            />
            <Input
              label="Target Weight (kg)"
              type="number"
              step="0.1"
              placeholder="e.g. 78.0"
              value={form.targetWeight}
              onChange={(e) =>
                setForm((p) => ({ ...p, targetWeight: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value as any }))
              }
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
              <span className="text-xs text-gray-500">
                {numberOfDays} days · 5 meals/day
              </span>
            )}
          </div>
          {programGoal && (
            <p className="text-xs text-green-600 mb-4">
              Goal: {programGoal}
            </p>
          )}
          <MealsBuilder
            planDays={planDays}
            onChange={setPlanDays}
            startDate={form.startDate}
            nextConsultation={form.nextConsultation}
            programGoal={programGoal}
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
                      <p className="text-xs mt-0.5 opacity-75">
                        {task.description}
                      </p>
                    )}
                    <span className="text-xs capitalize opacity-60">
                      {task.category}
                    </span>
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
              onChange={(e) =>
                setNewTask((p) => ({ ...p, title: e.target.value }))
              }
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional details..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, description: e.target.value }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={newTask.category}
                onChange={(e) =>
                  setNewTask((p) => ({
                    ...p,
                    category: e.target.value as any,
                  }))
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