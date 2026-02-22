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
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchPlans = async () => {
      try {
        // Step 1: Find the client document using the Firebase Auth UID
        const q = query(
          collection(db, 'clients'),
          where('clientUserId', '==', profile.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cId = snap.docs[0].id;
          setClientId(cId);
          // Step 2: Fetch action plans using the Firestore client document ID
          const plansData = await getActionPlansByClient(cId);
          setPlans(plansData);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        toast.error('Failed to load your plan');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [profile]);

  const handleToggleTask = async (plan: ActionPlan, taskId: string) => {
    setTogglingTask(taskId);
    try {
      const updatedTasks = plan.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date() : null,
            }
          : t
      );
      await updateActionPlan(plan.id, { tasks: updatedTasks });
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, tasks: updatedTasks } : p
        )
      );
      const task = updatedTasks.find((t) => t.id === taskId);
      toast.success(task?.completed ? '✅ Task completed!' : 'Task unmarked');
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setTogglingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.status === 'active');
  const historyPlans = plans.filter((p) => p.status !== 'active');
  const categories = ['nutrition', 'exercise', 'hydration', 'lifestyle'] as const;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Action Plan</h1>
        <p className="text-gray-500 mt-1">
          Follow your consultant's recommendations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 no-print">
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
      <h2 className="text-xl font-bold text-gray-900">
        {activePlan.title}
      </h2>
      {activePlan.programGoal && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
          🎯 {activePlan.programGoal}
        </span>
      )}
    </div>
    <button
      onClick={() => window.print()}
      className="no-print text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
    >
      🖨️ Print
    </button>
  </div>

  {/* Day Countdown Progress Bar */}
  {activePlan.nextConsultation && (() => {
    const startDate = (activePlan.startDate as any)?.seconds
      ? new Date((activePlan.startDate as any).seconds * 1000)
      : new Date(activePlan.startDate);
    const nextDate = (activePlan.nextConsultation as any)?.seconds
      ? new Date((activePlan.nextConsultation as any).seconds * 1000)
      : new Date(activePlan.nextConsultation);
    const totalDays = Math.ceil(
      (nextDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = Math.max(0, totalDays - daysElapsed);
    const dayProgress = Math.min(
      100,
      Math.round((daysElapsed / totalDays) * 100)
    );

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-700">
            📅 Program Progress
          </p>
          <p className="text-sm font-bold text-orange-600">
            {daysLeft > 0 ? `${daysLeft} days left` : 'Last day!'}
          </p>
        </div>
        <div className="bg-gray-100 rounded-full h-3">
          <div
            className="bg-orange-400 h-3 rounded-full transition-all duration-700"
            style={{ width: `${dayProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Day {Math.min(daysElapsed, totalDays)} of {totalDays} ·{' '}
          Next consultation: {format(nextDate, 'MMM d, yyyy')}
        </p>
      </div>
    );
  })()}

  {/* Task Completion Progress Bar */}
  <div className="no-print">
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm font-medium text-gray-700">
        ✅ Task Completion
      </p>
      <p className="text-sm font-bold text-green-600">
        {activePlan.tasks.length > 0
          ? Math.round(
              (activePlan.tasks.filter((t) => t.completed).length /
                activePlan.tasks.length) *
                100
            )
          : 0}
        %
      </p>
    </div>
    <div className="bg-gray-100 rounded-full h-3">
      <div
        className="bg-green-500 h-3 rounded-full transition-all duration-700"
        style={{
          width: `${
            activePlan.tasks.length > 0
              ? Math.round(
                  (activePlan.tasks.filter((t) => t.completed).length /
                    activePlan.tasks.length) *
                    100
                )
              : 0
          }%`,
        }}
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      {activePlan.tasks.filter((t) => t.completed).length} of{' '}
      {activePlan.tasks.length} tasks completed
    </p>
  </div>
</div>

{/* Weight Goal */}
{(activePlan.startWeight || activePlan.targetWeight) && (
  <div className="grid grid-cols-2 gap-3">
    {activePlan.startWeight && (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
        <p className="text-lg font-bold text-purple-700">
          {activePlan.startWeight}kg
        </p>
        <p className="text-xs text-purple-500">Starting Weight</p>
      </div>
    )}
    {activePlan.targetWeight && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
        <p className="text-lg font-bold text-green-700">
          {activePlan.targetWeight}kg
        </p>
        <p className="text-xs text-green-500">Target Weight</p>
      </div>
    )}
  </div>
)}

{/* Day-by-Day Meal Plan */}
{activePlan.planDays && activePlan.planDays.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-900 mb-4">
      🍽️ Your Meal Plan
    </h3>
    <div className="flex flex-col gap-3">
      {activePlan.planDays.map((day, idx) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
              {day.day}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Day {day.day}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(day.date), 'EEEE, MMM d')} ·{' '}
                {day.meals.reduce((s, m) => s + m.totalCalories, 0)} kcal total
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {day.meals.map((meal) => (
              <div key={meal.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {meal.slot}
                  </p>
                  <span className="text-xs text-gray-400">
                    {meal.totalCalories} kcal
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {meal.name}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    💪 {meal.totalProtein}g P
                  </span>
                  <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                    🧈 {meal.totalFat}g F
                  </span>
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    🌾 {meal.totalCarbs}g C
                  </span>
                </div>
                {meal.ingredients.length > 0 && (
                  <div className="mt-2 flex flex-col gap-0.5">
                    {meal.ingredients.map((ing) => (
                      <p key={ing.id} className="text-xs text-gray-500">
                        · {ing.name} ({ing.quantity}g)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Planned Meals */}
{activePlan.plannedMeals && activePlan.plannedMeals.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-900 mb-4">🍽️ Your Meal Plan</h3>
    <div className="flex flex-col gap-4">
      {activePlan.plannedMeals.map((meal) => (
        <div key={meal.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">{meal.name}</h4>
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
                className="flex items-center justify-between text-xs text-gray-600 bg-white rounded px-2 py-1.5 border border-green-100"
              >
                <span>{ing.name}</span>
                <span className="text-gray-400">{ing.quantity}g · {ing.calories} kcal</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Tasks by Category */}
            {categories.map((category) => {
              const categoryTasks = activePlan.tasks.filter(
                (t) => t.category === category
              );
              if (categoryTasks.length === 0) return null;
              const completed = categoryTasks.filter((t) => t.completed).length;

              return (
                <div
                  key={category}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {categoryIcons[category]}{' '}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h3>
                    <span className="text-xs text-gray-500 no-print">
                      {completed}/{categoryTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {categoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all
                          ${categoryColors[category]}
                          ${task.completed ? 'opacity-60' : ''}
                          ${togglingTask === task.id ? 'animate-pulse' : 'cursor-pointer'}`}
                        onClick={() =>
                          togglingTask !== task.id &&
                          handleToggleTask(activePlan, task.id)
                        }
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 accent-green-600"
                        />
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              task.completed ? 'line-through' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs opacity-70 mt-0.5">
                              {task.description}
                            </p>
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
              const progress =
                plan.tasks.length > 0
                  ? Math.round(
                      (plan.tasks.filter((t) => t.completed).length /
                        plan.tasks.length) *
                        100
                    )
                  : 0;
              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {plan.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          plan.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {progress}%
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.tasks.filter((t) => t.completed).length}/
                    {plan.tasks.length} tasks completed
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          aside,
          nav,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          body {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
