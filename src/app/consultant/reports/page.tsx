// Consultant-side page to view all client reports in a feed-like format
//src/app/consultant/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientsByConsultant } from '@/lib/firestore';
import { getLogsByClient } from '@/lib/firestore';
import { Client, DailyLog } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface LogWithClient extends DailyLog {
  clientName: string;
  clientEmail: string;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<LogWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchAll = async () => {
      try {
        const clients = await getClientsByConsultant(profile.uid);
        const allLogs: LogWithClient[] = [];
        for (const client of clients) {
          const clientLogs = await getLogsByClient(client.id);
          clientLogs.forEach((log) => {
            allLogs.push({
              ...log,
              clientName: client.name,
              clientEmail: client.email,
            });
          });
        }
        // Sort by date descending
        allLogs.sort((a, b) => {
          const dateA = (a.date as any)?.seconds ?? 0;
          const dateB = (b.date as any)?.seconds ?? 0;
          return dateB - dateA;
        });
        setLogs(allLogs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [profile]);

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
        <h1 className="text-2xl font-bold text-gray-900">Client Reports</h1>
        <p className="text-gray-500 mt-1">All daily logs submitted by your clients</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-600 font-medium">No reports yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Reports will appear here when clients submit their daily logs
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                      {log.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{log.clientName}</h3>
                      <p className="text-sm text-gray-500">
                        {format(logDate, 'EEEE, MMMM d yyyy')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      log.reportSent
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {log.reportSent ? '📬 Emailed' : '📝 Not sent'}
                  </span>
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
                          <span>{meal.time} — {meal.description}</span>
                          <span className="text-gray-400">{meal.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {log.notes && (
                  <p className="mt-3 text-sm text-gray-500 italic">📝 {log.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}