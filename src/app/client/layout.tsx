//src/app/client/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ClientSidebar from '@/components/client/ClientSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!profile) return;
    if (profile.role !== 'client') {
      router.push('/consultant/dashboard');
    }
  }, [user, profile, loading, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (profile.role !== 'client') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <main className="flex-1 p-8 overflow-y-auto pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
}