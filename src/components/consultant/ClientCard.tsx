//src/app/consultant/ClientCard.tsx
import Link from 'next/link';
import { Client } from '@/lib/types';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
        <Link
          href={`/consultant/clients/${client.id}`}
          className="text-sm text-green-600 hover:underline font-medium"
        >
          View →
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">Phone</p>
          <p className="text-gray-900 font-medium">{client.phone || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">Gender</p>
          <p className="text-gray-900 font-medium">{client.gender || '—'}</p>
        </div>
      </div>
      {client.nutritionGoals && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">
          🎯 {client.nutritionGoals}
        </p>
      )}
    </div>
  );
}