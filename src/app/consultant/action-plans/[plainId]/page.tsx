// Consultant-side page to view and edit details of a specific action plan, including tasks, progress, and plan information
//src/app/consultant/action-plans/[planId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getActionPlanById, updateActionPlan, deleteActionPlan } from '@/lib/firestore';
import { ActionPlan, ActionPlanTask } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const categoryColors = {
  nutrition: 'bg-green-50 border-green-200 text-green-800',
  exercise: 'bg-blue-50 border-blue-200 text-blue-800',
  hydration: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  lifestyle: 'bg-purple-50 border-purple-200 text-purple-800',
};

const categoryIcons = {
  nutrition: '🥗',
  exercise: '🏃',
  hydration: '💧',
  lifestyle: '🌿',
};

export default function ActionPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    startDate: '',
    nextConsultation: '',
    status: 'active' as ActionPlan['status'],
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'nutrition' as ActionPlanTask['category'],
  });

  useEffect(() => {
    if (!planId) return;
    getActionPlanById(planId).then((data) => {
      if (data) {
        setPlan(data);
        const startDate = (data.startDate as any)?.seconds
          ? new Date((data.startDate as any).seconds * 1000)
          : new Date(data.startDate);
        const nextConsult = (data.nextConsultation as any)?.seconds
          ? new Date((data.nextConsultation as any).seconds * 1000)
          : new Date(data.nextConsultation);
        setEditForm({
          title: data.title,
          startDate: startDate.toISOString().split('T')[0],
          nextConsultation: nextConsult.toISOString().split('T')[0],
          status: data.status,
        });
      }
      setLoading(false);
    });
  }, [planId]);

  const handleSavePlan = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      await updateActionPlan(planId, {
        title: editForm.title,
        startDate: new Date(editForm.startDate),
        nextConsultation: new Date(editForm.nextConsultation),
        status: editForm.status,
      });
      setPlan((p) => p ? { ...p, ...editForm,
        startDate: new Date(editForm.startDate),
        nextConsultation: new Date(editForm.nextConsultation),
      } : p);
      toast.success('Plan updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !plan) return;
    const task: ActionPlanTask = {
      id: uuidv4(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      completed: false,
      completedAt: null,
    };
    const updatedTasks = [...plan.tasks, task];
    await updateActionPlan(planId, { tasks: updatedTasks });
    setPlan((p) => p ? { ...p, tasks: updatedTasks } : p);
    setNewTask({ title: '', description: '', category: 'nutrition' });
    toast.success('Task added!');
  };

  const handleRemoveTask = async (taskId: string) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.filter((t) => t.id !== taskId);
    await updateActionPlan(planId, { tasks: updatedTasks });
    setPlan((p) => p ? { ...p, tasks: updatedTasks } : p);
    toast.success('Task removed');
  };

  const handleToggleTask = async (taskId: string) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : null }
        : t
    );
    await updateActionPlan(planId, { tasks: updatedTasks });
    setPlan((p) => p ? { ...p, tasks: updatedTasks } : p);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this action plan? This cannot be undone.')) return;
    await deleteActionPlan(planId);
    toast.success('Plan deleted');
    router.push('/consultant/action-plans');
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!plan) return <div className="text-gray-500">Plan not found</div>;

  const progress = plan.tasks.length > 0
    ? Math.round((plan.tasks.filter((t) => t.completed).length / plan.tasks.length) * 100)
    : 0;

  const startDate = (plan.startDate as any)?.seconds
    ? new Date((plan.startDate as any).seconds * 1000)
    : new Date(plan.startDate);
  const nextConsult = (plan.nextConsultation as any)?.seconds
    ? new Date((plan.nextConsultation as any).seconds * 1000)
    : new Date(plan.nextConsultation);

  const categories = ['nutrition', 'exercise', 'hydration', 'lifestyle'] as const;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/consultant/action-plans" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Plans
          </Link>
          {editing ? (
            <Input
              label=""
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              className="text-xl font-bold mt-2"
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{plan.title}</h1>
          )}
          <p className="text-gray-500 text-sm">👤 {plan.clientName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            🖨️ Print
          </button>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="secondary">✏️ Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSavePlan}>Save</Button>
            </div>
          )}
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* Plan Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={editForm.startDate}
                onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} />
              <Input label="Next Consultation" type="date" value={editForm.nextConsultation}
                onChange={(e) => setEditForm((p) => ({ ...p, nextConsultation: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as any }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="font-medium text-gray-900">{format(startDate, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Next Consultation</p>
                <p className="font-medium text-gray-900">{format(nextConsult, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  plan.status === 'active' ? 'bg-green-100 text-green-700' :
                  plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'}`}>
                  {plan.status}
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="text-sm font-semibold text-green-600">{progress}%</p>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {plan.tasks.filter((t) => t.completed).length} of {plan.tasks.length} tasks completed
            </p>
          </div>
        </div>

        {/* Tasks by Category */}
        {categories.map((category) => {
          const categoryTasks = plan.tasks.filter((t) => t.category === category);
          if (categoryTasks.length === 0) return null;
          return (
            <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                {categoryIcons[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
              </h2>
              <div className="flex flex-col gap-2">
                {categoryTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${categoryColors[category]}`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs opacity-70 mt-0.5">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add Task */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">+ Add Task</h2>
          <div className="flex flex-col gap-3">
            <Input label="Task Title" placeholder="e.g. Eat 5 portions of vegetables daily"
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea rows={2} placeholder="Additional details..."
                value={newTask.description}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select value={newTask.category}
                  onChange={(e) => setNewTask((p) => ({ ...p, category: e.target.value as any }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500">
                  <option value="nutrition">🥗 Nutrition</option>
                  <option value="exercise">🏃 Exercise</option>
                  <option value="hydration">💧 Hydration</option>
                  <option value="lifestyle">🌿 Lifestyle</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={handleAddTask} variant="secondary">
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            aside, nav, button, a { display: none !important; }
            main { padding: 0 !important; }
            .rounded-xl { border-radius: 8px !important; }
            body { font-size: 12px; }
          }
        `}</style>
      </div>
    </div>
  );
}