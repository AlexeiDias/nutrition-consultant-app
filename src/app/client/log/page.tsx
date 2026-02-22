//src/app/client/log/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDailyLog } from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LogPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    waterIntake: '',
    weight: '',
    symptoms: '',
    mood: '',
    exercise: '',
    mealsExperience: '',
    notes: '',
  });

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchClientId = async () => {
      const q = query(
        collection(db, 'clients'),
        where('clientUserId', '==', profile.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setClientId(snap.docs[0].id);
    };
    fetchClientId();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error('Client record not found. Please contact your consultant.');
      return;
    }
    setLoading(true);
    try {
      await createDailyLog({
        clientId,
        date: new Date(),
        mealsExperience: form.mealsExperience,
        waterIntake: Number(form.waterIntake),
        weight: Number(form.weight),
        symptoms: form.symptoms,
        mood: form.mood,
        exercise: form.exercise,
        notes: form.notes,
        reportSent: false,
      });
      toast.success('Log saved successfully!');
      router.push('/client/dashboard');
    } catch (err: unknown) {
      console.error('Full error:', err);
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Unknown error — check console');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Today's Log</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Vitals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">📏 Vitals</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Water Intake (Liters)"
              type="number"
              step="0.1"
              placeholder="2.5"
              value={form.waterIntake}
              onChange={(e) => setForm((p) => ({ ...p, waterIntake: e.target.value }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Weight (kg){' '}
                <span className="text-gray-400 font-normal">— optional</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Only log if weighed today"
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400">
                Recommended: first and last day of your plan
              </p>
            </div>
          </div>
        </div>

        {/* Wellbeing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">💚 Wellbeing</h2>
          <div className="flex flex-col gap-4">

            {/* Mood */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mood</label>
              <select
                value={form.mood}
                onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select mood...</option>
                <option value="Great">😄 Great</option>
                <option value="Good">🙂 Good</option>
                <option value="Okay">😐 Okay</option>
                <option value="Low">😔 Low</option>
                <option value="Stressed">😟 Stressed</option>
              </select>
            </div>

            {/* Symptoms */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Symptoms</label>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                rows={2}
                placeholder="Any bloating, headaches, fatigue..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Exercise */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Exercise</label>
              <textarea
                value={form.exercise}
                onChange={(e) => setForm((p) => ({ ...p, exercise: e.target.value }))}
                rows={2}
                placeholder="Describe your exercise experience."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Meals Experience */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Meals</label>
              <textarea
                value={form.mealsExperience}
                onChange={(e) => setForm((p) => ({ ...p, mealsExperience: e.target.value }))}
                rows={3}
                placeholder="Describe your meals experience today."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Anything else you'd like your consultant to know..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Save Today's Log
        </Button>
      </form>
    </div>
  );
}