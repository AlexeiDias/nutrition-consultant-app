//src/app/consultant/clients/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewClientPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: '',
    phone: '',
    medicalHistory: '',
    nutritionGoals: '',
    currentPlan: '',
  });

  // Redirect away if not a consultant
  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.push('/login');
      return;
    }
    if (profile.role !== 'consultant') {
      router.push('/client/dashboard');
    }
  }, [profile, loading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          consultantId: profile.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${form.name} has been added!`);
      router.push('/consultant/clients');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/consultant/clients" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add New Client</h1>
        <p className="text-gray-500 mt-1">This will create a login account for your client.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">

        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Login Credentials
          </h2>
          <div className="flex flex-col gap-4">
            <Input label="Client Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Temporary Password" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Personal Information
          </h2>
          <div className="flex flex-col gap-4">
            <Input label="Full Name" type="text" name="name" value={form.name} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date of Birth" type="date" name="dob" value={form.dob} onChange={handleChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <Input label="Phone Number" type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Clinical Information
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Medical History</label>
              <textarea
                name="medicalHistory"
                value={form.medicalHistory}
                onChange={handleChange}
                rows={3}
                placeholder="Allergies, conditions, medications..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nutrition Goals</label>
              <textarea
                name="nutritionGoals"
                value={form.nutritionGoals}
                onChange={handleChange}
                rows={3}
                placeholder="Weight loss, muscle gain, manage diabetes..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Current Plan Notes</label>
              <textarea
                name="currentPlan"
                value={form.currentPlan}
                onChange={handleChange}
                rows={2}
                placeholder="Brief summary of current nutrition plan..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={submitting} className="flex-1">
            Create Client Account
          </Button>
          <Link href="/consultant/clients">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}