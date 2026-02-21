// Client-side page to view the client's current action plan, with tabs for active plan and history, and interactive task completion toggles
//src/app/client/plan/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getActionPlansByClient, updateActionPlan } from '@/lib/firestore';
import { ActionPlan } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format, differenceInDays } from 'date-fns';
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

export default function ClientPlanPage() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchPlans = async () => {
      const q = query(collection(db, 'clients'), where('clientUserId', '==', profile.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cId = snap.docs[0].id;
        setClientId(cId);
        const plansData = await getActionPlansByClient(cId);
        setPlans(plansData);
      }
      setLoading(false);
    };
    fetchPlans();
  }, [profile]);

  const handleToggleTask = async (plan: ActionPlan, taskId: string) => {
    const updatedTasks = plan.tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : null }
        : t
    );
    await updateActionPlan(plan.id, { tasks: updatedTasks });
    setPlans((prev) =>
      prev.map((p) => p.id === plan.id ? { ...p, tasks: updatedTasks } : p)
    );
    toast.success(updatedTasks.find(t => t.id === taskId)?.completed ? '✅ Task completed!' : 'Task unmarked');
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  const activePlan = plans.find((p) => p.status === 'active');
  const historyPlans = plans.filter((p) => p.status !== 'active');
  const categories = ['nutrition', 'exercise', 'hydration', 'lifestyle'] as const;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Action Plan</h1>
        <p className="text-gray-500 mt-1">Follow your consultant's recommendations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['active', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'active' ? '📋 Current Plan' : '📅 History'}
          </button>
        ))}
      </div>

      {activeTab === 'active' ? (
        activePlan ? (
          <div className="flex flex-col gap-6">

            {/* Plan Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{activePlan.title}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Started {format(
                      (activePlan.startDate as any)?.seconds
                        ? new Date((activePlan.startDate as any).seconds * 1000)
                        : new Date(activePlan.startDate),
                      'MMM d, yyyy'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  🖨️ Print
                </button>
              </div>

              {/* Countdown */}
              {activePlan.nextConsultation && (() => {
                const nextDate = (activePlan.nextConsultation as any)?.seconds
                  ? new Date((activePlan.nextConsultation as any).seconds * 1000)
                  : new Date(activePlan.nextConsultation);
                const daysLeft = differenceInDays(nextDate, new Date());
                return (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="font-semibold text-orange-800">
                        {daysLeft > 0 ? `${daysLeft} days` : 'Today!'} until next consultation
                      </p>
                      <p className="text-orange-600 text-sm">
                        {format(nextDate, 'EEEE, MMMM d yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Plan Progress</p>
                  <p className="text-sm font-bold text-green-600">
                    {activePlan.tasks.length > 0
                      ? Math.round((activePlan.tasks.filter((t) => t.completed).length / activePlan.tasks.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-gray-100 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{
                      width: `${activePlan.tasks.length > 0
                        ? Math.round((activePlan.tasks.filter((t) => t.completed).length / activePlan.tasks.length) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activePlan.tasks.filter((t) => t.completed).length} of {activePlan.tasks.length} tasks completed
                </p>
              </div>
            </div>

            {/* Tasks by Category */}
            {categories.map((category) => {
              const categoryTasks = activePlan.tasks.filter((t) => t.category === category);
              if (categoryTasks.length === 0) return null;
              const completed = categoryTasks.filter((t) => t.completed).length;
              return (
                <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {categoryIcons[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h3>
                    <span className="text-xs text-gray-500">{completed}/{categoryTasks.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {categoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${categoryColors[category]} ${task.completed ? 'opacity-60' : ''}`}
                        onClick={() => handleToggleTask(activePlan, task.id)}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 accent-green-600"
                        />
                        <div>
                          <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs opacity-70 mt-0.5">{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">No active plan yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Your consultant will create an action plan for you
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {historyPlans.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-600 font-medium">No plan history yet</p>
            </div>
          ) : (
            historyPlans.map((plan) => {
              const progress = plan.tasks.length > 0
                ? Math.round((plan.tasks.filter((t) => t.completed).length / plan.tasks.length) * 100)
                : 0;
              return (
                <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{progress}%</p>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.tasks.filter((t) => t.completed).length}/{plan.tasks.length} tasks completed
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          aside, nav, button, .no-print { display: none !important; }
          main { padding: 0 !important; }
          body { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}