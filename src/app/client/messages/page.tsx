// src/app/client/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getClientsByConsultant } from '@/lib/firestore';
import MessageThread from '@/components/shared/MessageThread';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ConsultantInfo {
  uid: string;
  name: string;
  email: string;
}

export default function ClientMessagesPage() {
  const { profile } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchData = async () => {
      try {
        // Get client record
        const clientQ = query(
          collection(db, 'clients'),
          where('clientUserId', '==', profile.uid)
        );
        const clientSnap = await getDocs(clientQ);
        if (clientSnap.empty) { setLoading(false); return; }

        const clientDoc = clientSnap.docs[0];
        const clientData = clientDoc.data();
        setClientId(clientDoc.id);

        // Get consultant info
        const consultantQ = query(
          collection(db, 'users'),
          where('__name__', '==', clientData.consultantId)
        );

        // Use direct doc fetch instead
        const { doc, getDoc } = await import('firebase/firestore');
        const consultantDoc = await getDoc(doc(db, 'users', clientData.consultantId));
        if (consultantDoc.exists()) {
          const cData = consultantDoc.data();
          setConsultant({
            uid: clientData.consultantId,
            name: cData.name ?? 'Your Consultant',
            email: cData.email ?? '',
          });
        }
      } catch (err) {
        console.error('Failed to load messaging data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!clientId || !consultant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">💬</p>
        <p className="text-gray-600 font-medium">No consultant assigned yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Your consultant will appear here once you're connected
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with your consultant</p>
      </div>

      <div className="h-[calc(100vh-12rem)] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <MessageThread
          consultantId={consultant.uid}
          consultantName={consultant.name}
          consultantEmail={consultant.email}
          clientId={clientId}
          clientName={profile?.name ?? 'Client'}
          clientEmail={profile?.email ?? ''}
          currentUserId={profile?.uid ?? ''}
          currentUserName={profile?.name ?? 'Client'}
          currentUserRole="client"
        />
      </div>
    </div>
  );
}
