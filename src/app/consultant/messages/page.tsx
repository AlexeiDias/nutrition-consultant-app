// src/app/consultant/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientsByConsultant, getConversationId, getUnreadCount } from '@/lib/firestore';
import { Client } from '@/lib/types';
import MessageThread from '@/components/shared/MessageThread';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ClientWithUnread extends Client {
  unreadCount: number;
}

export default function ConsultantMessagesPage() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientWithUnread[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientWithUnread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchClients = async () => {
      try {
        const allClients = await getClientsByConsultant(profile.uid);
        const withUnread = await Promise.all(
          allClients.map(async (c) => {
            const conversationId = getConversationId(profile.uid, c.id);
            const unreadCount = await getUnreadCount(conversationId, 'consultant');
            return { ...c, unreadCount };
          })
        );
        // Sort by unread first
        withUnread.sort((a, b) => b.unreadCount - a.unreadCount);
        setClients(withUnread);
        if (withUnread.length > 0 && !selectedClient) {
          setSelectedClient(withUnread[0]);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [profile]);

  // Refresh unread counts when switching clients
  const handleSelectClient = async (client: ClientWithUnread) => {
    setSelectedClient(client);
    // Reset unread count for this client after opening
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">💬</p>
        <p className="text-gray-600 font-medium text-lg">No clients yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Add clients to start messaging them
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* Client List */}
      <div className="w-72 border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5">{clients.length} conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all border-b border-gray-100 text-left ${
                selectedClient?.id === client.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{client.name}</p>
                <p className="text-xs text-gray-400 truncate">{client.email}</p>
              </div>
              {client.unreadCount > 0 && (
                <span className="w-5 h-5 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">
                  {client.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedClient && profile ? (
          <MessageThread
            consultantId={profile.uid}
            consultantName={profile.name}
            consultantEmail={profile.email}
            clientId={selectedClient.id}
            clientName={selectedClient.name}
            clientEmail={selectedClient.email}
            currentUserId={profile.uid}
            currentUserName={profile.name}
            currentUserRole="consultant"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <p className="text-4xl mb-3">👈</p>
              <p className="text-gray-500">Select a client to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
