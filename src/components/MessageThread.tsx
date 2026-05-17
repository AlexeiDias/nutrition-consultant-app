// src/components/shared/MessageThread.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationId,
} from '@/lib/firestore';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

interface MessageThreadProps {
  consultantId: string;
  consultantName: string;
  consultantEmail: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'consultant' | 'client';
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

export default function MessageThread({
  consultantId,
  consultantName,
  consultantEmail,
  clientId,
  clientName,
  clientEmail,
  currentUserId,
  currentUserName,
  currentUserRole,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationId = getConversationId(consultantId, clientId);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      // Mark messages from the other side as read
      markMessagesAsRead(conversationId, currentUserRole).catch(console.error);
    });
    return unsub;
  }, [conversationId, currentUserRole]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const messageText = text.trim();
    setText('');
    try {
      await sendMessage({
        conversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: messageText,
        createdAt: new Date(),
        read: false,
      });

      // Send email notification to the other party
      const recipientEmail = currentUserRole === 'consultant' ? clientEmail : consultantEmail;
      const recipientName = currentUserRole === 'consultant' ? clientName : consultantName;
      const portalUrl = currentUserRole === 'consultant'
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutrition-consultant-app.vercel.app'}/client/messages`
        : `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nutrition-consultant-app.vercel.app'}/consultant/messages`;

      fetch('/api/send-message-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          senderName: currentUserName,
          messageText,
          portalUrl,
        }),
      }).catch(console.error); // Fire and forget — don't block on email

    } catch (err) {
      toast.error('Failed to send message');
      setText(messageText); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    const existing = groupedMessages.find((g) => g.date === dateKey);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full">

      {/* Thread Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
          {(currentUserRole === 'consultant' ? clientName : consultantName).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {currentUserRole === 'consultant' ? clientName : consultantName}
          </p>
          <p className="text-xs text-gray-500">
            {currentUserRole === 'consultant' ? clientEmail : consultantEmail}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-600 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Send a message to start the conversation
            </p>
          </div>
        )}

        {groupedMessages.map((group) => {
          const groupDate = new Date(group.date);
          const dateLabel = isToday(groupDate)
            ? 'Today'
            : isYesterday(groupDate)
            ? 'Yesterday'
            : format(groupDate, 'MMMM d, yyyy');

          return (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs text-gray-400 font-medium px-2">{dateLabel}</p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages in group */}
              {group.messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const showName = idx === 0 || group.messages[idx - 1]?.senderId !== msg.senderId;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {showName && !isMe && (
                      <p className="text-xs text-gray-400 ml-2 mb-1">{msg.senderName}</p>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                      {formatMessageDate(new Date(msg.createdAt))}
                      {isMe && (
                        <span className="ml-1">{msg.read ? ' · Read' : ''}</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 border border-gray-300 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none max-h-32"
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
