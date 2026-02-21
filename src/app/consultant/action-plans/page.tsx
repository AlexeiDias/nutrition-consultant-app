// Consultant-side page to list all action plans created by the consultant, with options to view, edit, or delete each plan
//src/app/consultant/action-plans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getActionPlansByConsultant, deleteActionPlan } from '@/lib/firestore';
import { ActionPlan } from '@/lib/types';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ActionPlansPage() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getActionPlansByConsultant(profile.uid).then((data) => {
      setPlans(data);
      setLoading(false);
    });
  }, [profile]);

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this action plan?')) return;
    try {
      await deleteActionPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Action Plans</h1>
          <p className="text-gray-500 mt-1">Create and manage client action plans</p>
        </div>
        <Link href="/consultant/action-plans/new">
          <Button>+ New Plan</Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-600 font-medium">No action plans yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first plan for a client</p>
          <Link href="/consultant/action-plans/new">
            <Button className="mt-4">+ Create Action Plan</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => {
            const progress = plan.tasks.length > 0
              ? Math.round((plan.tasks.filter((t) => t.completed).length / plan.tasks.length) * 100)
              : 0;
            const startDate = (plan.startDate as any)?.seconds
              ? new Date((plan.startDate as any).seconds * 1000)
              : new Date(plan.startDate);
            const nextConsult = (plan.nextConsultation as any)?.seconds
              ? new Date((plan.nextConsultation as any).seconds * 1000)
              : new Date(plan.nextConsultation);

            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[plan.status]}`}>
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      👤 {plan.clientName} · Started {format(startDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      📅 Next consultation: {format(nextConsult, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/consultant/action-plans/${plan.id}`}>
                      <Button variant="secondary" className="text-xs px-3 py-1">View</Button>
                    </Link>
                    <Button
                      variant="danger"
                      className="text-xs px-3 py-1"
                      onClick={() => handleDelete(plan.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {plan.tasks.filter((t) => t.completed).length}/{plan.tasks.length} tasks · {progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}