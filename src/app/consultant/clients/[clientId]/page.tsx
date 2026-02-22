// Consultant-side client profile page where consultants can view and edit client information, see recent logs, and access action plans
//src/app/consultant/clients/[clientId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientById, updateClient, getLogsByClient, getActionPlansByClient } from '@/lib/firestore';
import { Client, DailyLog, ActionPlan } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    medicalHistory: '',
    nutritionGoals: '',
    currentPlan: '',
  });

  useEffect(() => {
    if (!clientId) return;
    const fetchAll = async () => {
      const [clientData, logsData, plansData] = await Promise.all([
        getClientById(clientId),
        getLogsByClient(clientId),
        getActionPlansByClient(clientId),
      ]);
      if (clientData) {
        setClient(clientData);
        setForm({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          dob: clientData.dob,
          gender: clientData.gender,
          medicalHistory: clientData.medicalHistory,
          nutritionGoals: clientData.nutritionGoals,
          currentPlan: clientData.currentPlan,
        });
      }
      setLogs(logsData);
      setPlans(plansData);
      setLoading(false);
    };
    fetchAll();
  }, [clientId]);

const handleSave = async () => {
  if (!clientId) return;
  setSaving(true);
  try {
    // If email changed, update Firebase Auth + users collection via API
    if (client?.email !== form.email) {
      const res = await fetch('/api/update-client-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUserId: client?.clientUserId,
          newEmail: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    }

    // Update Firestore clients document
    await updateClient(clientId, form);

    setClient((prev) => prev ? { ...prev, ...form } : prev);
    toast.success('Client updated!');
    setEditing(false);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update client';
    toast.error(message);
  } finally {
    setSaving(false);
  }
};

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!client) return <div className="text-gray-500">Client not found</div>;

  const activePlan = plans.find((p) => p.status === 'active');
  const recentLog = logs[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/consultant/clients" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{client.name}</h1>
          <p className="text-gray-500 text-sm">{client.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/consultant/action-plans/new?clientId=${clientId}&clientName=${client.name}`}>
            <Button variant="secondary">📋 New Plan</Button>
          </Link>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>✏️ Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{logs.length}</p>
            <p className="text-xs text-green-600">Total Logs</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{plans.length}</p>
            <p className="text-xs text-blue-600">Action Plans</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {recentLog?.weight ?? '—'}
            </p>
            <p className="text-xs text-purple-600">Latest Weight (kg)</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Personal Information
          </h2>
          {editing ? (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Full Name" value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <Input label="Phone" value={form.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
    </div>
    <Input
      label="Email"
      type="email"
      value={form.email}
      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
    />
    <div className="grid grid-cols-2 gap-4">
                <Input label="Date of Birth" type="date" value={form.dob}
                  onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phone', value: client.phone },
                { label: 'Date of Birth', value: client.dob },
                { label: 'Gender', value: client.gender },
                { label: 'Email', value: client.email },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-gray-900 font-medium">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Clinical Information
          </h2>
          {editing ? (
            <div className="flex flex-col gap-4">
              {[
                { label: 'Medical History', key: 'medicalHistory', placeholder: 'Allergies, conditions, medications...' },
                { label: 'Nutrition Goals', key: 'nutritionGoals', placeholder: 'Weight loss, muscle gain...' },
                { label: 'Current Plan Notes', key: 'currentPlan', placeholder: 'Brief plan summary...' },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  <textarea rows={3} placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { label: 'Medical History', value: client.medicalHistory },
                { label: 'Nutrition Goals', value: client.nutritionGoals },
                { label: 'Current Plan Notes', value: client.currentPlan },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-gray-900 text-sm">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Plan */}
        {activePlan && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Active Action Plan
              </h2>
              <Link
                href={`/consultant/action-plans/${activePlan.id}`}
                className="text-sm text-green-600 hover:underline"
              >
                View Full Plan →
              </Link>
            </div>
            <p className="font-semibold text-gray-900 mb-2">{activePlan.title}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${activePlan.tasks.length > 0
                      ? Math.round((activePlan.tasks.filter((t) => t.completed).length / activePlan.tasks.length) * 100)
                      : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {activePlan.tasks.filter((t) => t.completed).length}/{activePlan.tasks.length} tasks
              </span>
            </div>
          </div>
        )}

        {/* Recent Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Recent Logs
            </h2>
            <div className="flex flex-col gap-2">
              {logs.slice(0, 3).map((log) => {
                const logDate = (log.date as any)?.seconds
                  ? new Date((log.date as any).seconds * 1000)
                  : new Date(log.date);
                return (
                  <div key={log.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(logDate, 'EEE, MMM d')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.meals?.length ?? 0} meals · {log.weight}kg · {log.mood}
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
    </div>
  );
}