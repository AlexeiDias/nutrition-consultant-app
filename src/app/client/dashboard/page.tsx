//src/app/client/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLogsByClient } from '@/lib/firestore';
import { DailyLog, Client } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [clientRecord, setClientRecord] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;

    const fetchData = async () => {
      try {
        const q = query(
          collection(db, 'clients'),
          where('clientUserId', '==', profile.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const clientData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Client;
          setClientRecord(clientData);
          const logsData = await getLogsByClient(clientData.id);
          setLogs(logsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const todayLogged = logs.some(
    (l) => format(
      new Date((l.date as any)?.seconds ? (l.date as any).seconds * 1000 : l.date),
      'yyyy-MM-dd'
    ) === format(new Date(), 'yyyy-MM-dd')
  );

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Track your nutrition journey every day.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-2xl font-bold text-green-700">{logs.length}</p>
          <p className="text-sm text-green-600">Total Logs</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-2xl font-bold text-blue-700">
            {logs.filter(l => l.reportSent).length}
          </p>
          <p className="text-sm text-blue-600">Reports Sent</p>
        </div>
        <div className={`${todayLogged ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-5`}>
          <p className={`text-2xl font-bold ${todayLogged ? 'text-purple-700' : 'text-orange-700'}`}>
            {todayLogged ? '✓ Done' : '! Pending'}
          </p>
          <p className={`text-sm ${todayLogged ? 'text-purple-600' : 'text-orange-600'}`}>
            Today's Log
          </p>
        </div>
      </div>

      {!todayLogged && (
        <div className="bg-white rounded-xl border border-dashed border-orange-300 p-8 text-center mb-8">
          <p className="text-3xl mb-2">📝</p>
          <p className="font-semibold text-gray-800">You haven't logged today yet</p>
          <p className="text-gray-400 text-sm mt-1">Keep your consultant updated on your progress</p>
          <Link
            href="/client/log"
            className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
          >
            Log Today's Meals
          </Link>
        </div>
      )}

      {clientRecord?.currentPlan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">📋 Your Current Plan</h2>
          <p className="text-gray-600 text-sm">{clientRecord.currentPlan}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Logs</h2>
            <Link href="/client/history" className="text-sm text-green-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {logs.slice(0, 3).map((log) => {
              const logDate = (log.date as any)?.seconds
                ? new Date((log.date as any).seconds * 1000)
                : new Date(log.date);
              return (
                <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{format(logDate, 'EEEE, MMM d')}</p>
                    <p className="text-sm text-gray-500">
  {log.waterIntake}L water · {log.mood || '—'} · {log.weight ? `${log.weight}kg` : 'no weight'}
</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${log.reportSent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {log.reportSent ? '📬 Sent' : '📝 Draft'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}