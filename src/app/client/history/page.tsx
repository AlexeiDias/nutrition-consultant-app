// Client-side page to display the user's log history and allow sending reports to the consultant
//src/app/client/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLogsByClient } from '@/lib/firestore';
import { DailyLog } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchLogs = async () => {
      const q = query(
        collection(db, 'clients'),
        where('clientUserId', '==', profile.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cId = snap.docs[0].id;
        setClientId(cId);
        const logsData = await getLogsByClient(cId);
        setLogs(logsData);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [profile]);

  const handleSendReport = async (log: DailyLog) => {
    if (!clientId) return;
    setSending(log.id);
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: log.id, clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Report sent to your consultant!');
      setLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, reportSent: true } : l))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send report';
      toast.error(message);
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Log History</h1>
        <p className="text-gray-500 mt-1">All your past daily logs</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-600 font-medium">No logs yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Start logging your daily meals to see history here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {logs.map((log) => {
            const logDate = (log.date as any)?.seconds
              ? new Date((log.date as any).seconds * 1000)
              : new Date(log.date);
            const totalCalories =
              log.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) ?? 0;

            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(logDate, 'EEEE, MMMM d yyyy')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {log.meals?.length ?? 0} meals · {totalCalories} kcal total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.reportSent ? (
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        📬 Report Sent
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        loading={sending === log.id}
                        onClick={() => handleSendReport(log)}
                        className="text-xs px-3 py-1"
                      >
                        📤 Send Report
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">{log.waterIntake}L</p>
                    <p className="text-xs text-blue-500">Water</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-purple-700">{log.weight}kg</p>
                    <p className="text-xs text-purple-500">Weight</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-yellow-700">{log.mood || '—'}</p>
                    <p className="text-xs text-yellow-500">Mood</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{totalCalories}</p>
                    <p className="text-xs text-green-500">Calories</p>
                  </div>
                </div>

                {log.meals?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Meals
                    </p>
                    <div className="flex flex-col gap-1">
                      {log.meals.map((meal, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span>
                            {meal.time} — {meal.description}
                          </span>
                          <span className="text-gray-400">{meal.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {log.exercise && (
                  <p className="mt-3 text-sm text-gray-600">
                    🏃 {log.exercise}
                  </p>
                )}

                {log.symptoms && (
                  <p className="mt-2 text-sm text-gray-600">
                    🩺 {log.symptoms}
                  </p>
                )}

                {log.notes && (
                  <p className="mt-2 text-sm text-gray-500 italic">
                    📝 {log.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}