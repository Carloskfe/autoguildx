'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Profile {
  id: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface Participant {
  id: string;
  email: string;
  profile?: Profile;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; profile?: Profile };
}

interface Conversation {
  id: string;
  participantAId: string;
  participantBId: string;
  participantA: Participant;
  participantB: Participant;
  lastMessageAt: string | null;
  createdAt: string;
  lastMessage: Message | null;
  unreadCount: number;
}

function avatar(participant?: Participant) {
  const name = participant?.profile?.displayName ?? participant?.email ?? '?';
  return name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function otherParticipant(conv: Conversation, userId: string): Participant {
  return conv.participantAId === userId ? conv.participantB : conv.participantA;
}

export default function MessagesPage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<string | null>(searchParams.get('conversation'));
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: conversations = [], isLoading: convsLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ['messages', activeId],
    queryFn: () => api.get(`/messages/conversations/${activeId}`).then((r) => r.data),
    enabled: !!activeId && isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    if (messages.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    if (activeId) {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  }, [activeId, messages.length, qc]);

  const send = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/conversations/${activeId}/messages`, { content }),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['messages', activeId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const activeConv = conversations.find((c) => c.id === activeId);
  const other = activeConv && userId ? otherParticipant(activeConv, userId) : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim() && activeId) send.mutate(draft.trim());
  };

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Conversation list */}
        <aside
          className={`w-full md:w-80 shrink-0 border-r border-surface-border flex flex-col ${activeId ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="p-4 border-b border-surface-border">
            <h1 className="text-lg font-semibold text-white">Messages</h1>
          </div>

          {convsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
              <MessageSquare className="w-12 h-12 text-gray-600" />
              <p className="text-gray-400 text-sm">No conversations yet.</p>
              <p className="text-gray-500 text-xs">
                Visit a profile or listing and tap <strong>Message</strong> to start one.
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-surface-border">
              {conversations.map((conv) => {
                const participant = userId ? otherParticipant(conv, userId) : conv.participantA;
                const name = participant.profile?.displayName ?? participant.email;
                const isActive = conv.id === activeId;
                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => setActiveId(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? 'bg-surface-border' : 'hover:bg-surface-card'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {avatar(participant)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white truncate">{name}</span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.lastMessage.senderId === userId ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Thread panel */}
        <section className={`flex-1 flex flex-col min-w-0 ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
              <MessageSquare className="w-14 h-14 text-gray-600" />
              <p className="text-gray-400">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border shrink-0">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {other && (
                  <>
                    <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-sm font-bold">
                      {avatar(other)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={other.profile ? `/profile/${other.profile.id}` : '#'}
                        className="text-sm font-semibold text-white hover:text-brand-400 truncate block"
                      >
                        {other.profile?.displayName ?? other.email}
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">
                    No messages yet — say hello!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                            isMine
                              ? 'bg-brand-500 text-white rounded-br-sm'
                              : 'bg-surface-card text-gray-200 rounded-bl-sm'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${isMine ? 'text-brand-200' : 'text-gray-500'}`}
                          >
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-surface-border shrink-0"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="input flex-1 py-2 text-sm"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || send.isPending}
                  className="btn-primary p-2.5 disabled:opacity-50"
                >
                  {send.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
