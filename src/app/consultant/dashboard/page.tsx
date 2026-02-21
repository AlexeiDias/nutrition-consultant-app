//src/app/consultant/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientsByConsultant } from '@/lib/firestore';
import { Client } from '@/lib/types';
import StatCard from '@/components/consultant/StatCard';
import ClientCard from '@/components/consultant/ClientCard';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ConsultantDashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getClientsByConsultant(profile.uid).then((data) => {
      setClients(data);
      setLoading(false);
    });
  }, [profile]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your clients today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Clients" value={clients.length} icon="👥" color="green" />
        <StatCard label="Active Plans" value={clients.length} icon="📋" color="blue" />
        <StatCard label="Reports Today" value={0} icon="📬" color="purple" />
      </div>

      {/* Recent Clients */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
        <Link
          href="/consultant/clients"
          className="text-sm text-green-600 hover:underline font-medium"
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-gray-600 font-medium">No clients yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first client to get started</p>
          <Link
            href="/consultant/clients/new"
            className="inline-block mt-4 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
          >
            + Add Client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.slice(0, 6).map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}