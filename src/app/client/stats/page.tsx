// Client-side stats page where clients can view charts and summaries of their logged data over time, including weight, water intake, calories, and mood trends
//src/app/client/stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLogsByClient } from '@/lib/firestore';
import { DailyLog } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

export default function StatsPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchLogs = async () => {
      const q = query(collection(db, 'clients'), where('clientUserId', '==', profile.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const clientId = snap.docs[0].id;
        const logsData = await getLogsByClient(clientId);
        setLogs(logsData.reverse());
      }
      setLoading(false);
    };
    fetchLogs();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  const chartData = logs.map((log) => {
    const date = (log.date as any)?.seconds
      ? new Date((log.date as any).seconds * 1000)
      : new Date(log.date);
    return {
      date: format(date, 'MMM d'),
      weight: log.weight || null,
      water: log.waterIntake || null,
calories: null,      mood: log.mood === 'Great' ? 5 : log.mood === 'Good' ? 4 :
            log.mood === 'Okay' ? 3 : log.mood === 'Low' ? 2 :
            log.mood === 'Stressed' ? 1 : null,
    };
  });

  const avgWeight = logs.filter(l => l.weight).reduce((sum, l) => sum + l.weight, 0) / (logs.filter(l => l.weight).length || 1);
  const avgWater = logs.filter(l => l.waterIntake).reduce((sum, l) => sum + l.waterIntake, 0) / (logs.filter(l => l.waterIntake).length || 1);
const avgCalories = 0;

  if (logs.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Stats</h1>
          <p className="text-gray-500 mt-1">Track your progress over time</p>
        </div>
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-gray-600 font-medium">No data yet</p>
          <p className="text-gray-400 text-sm mt-1">Start logging daily to see your stats here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Stats</h1>
        <p className="text-gray-500 mt-1">Your progress over {logs.length} logged days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-purple-700">{avgWeight.toFixed(1)}kg</p>
          <p className="text-sm text-purple-600">Avg Weight</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-blue-700">{avgWater.toFixed(1)}L</p>
          <p className="text-sm text-blue-600">Avg Water</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-green-700">{Math.round(avgCalories)}</p>
          <p className="text-sm text-green-600">Avg Calories</p>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">⚖️ Weight Over Time (kg)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="weight" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Water Intake Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">💧 Water Intake (Liters)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip />
            <Bar dataKey="water" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

     

      {/* Mood Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">😊 Mood Trend</h2>
        <p className="text-xs text-gray-400 mb-4">5=Great, 4=Good, 3=Okay, 2=Low, 1=Stressed</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip />
            <Line type="monotone" dataKey="mood" stroke="#ea580c" strokeWidth={2} dot={{ fill: '#ea580c' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}