'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, MessageSquare, AlertTriangle, Megaphone, Bell, Info,
  Users, Filter, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useMessages } from '@/hooks/useMessages';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Message, MessageType, Property } from '@/types';
import { cn } from '@/lib/cn';

type Tenant = { id: string; name: string; email: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<MessageType, string> = {
  normal: 'Normal',
  urgent: 'Urgent',
  warning: 'Warning',
  announcement: 'Announcement',
};

const TYPE_COLORS: Record<MessageType, string> = {
  normal: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  announcement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const TYPE_ICONS: Record<MessageType, React.ElementType> = {
  normal: MessageSquare,
  urgent: AlertTriangle,
  warning: Bell,
  announcement: Megaphone,
};

function TypeBadge({ type }: { type: MessageType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[type])}>
      <Icon className="h-3 w-3" />
      {TYPE_LABELS[type]}
    </span>
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

// ─── Tenant Chat View ─────────────────────────────────────────────────────────

function TenantMessagesView({
  messages, loading, error, sendMessage, userId,
}: {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (p: { receiverIds: string[]; messageText: string; messageType: MessageType }) => Promise<Message>;
  userId: string;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [landlordName, setLandlordName] = useState('Your Landlord');
  const [noProperty, setNoProperty] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch property to get landlordId and landlordName
  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(json => {
        const prop = json.data?.[0] as (Property & { landlordName?: string }) | undefined;
        if (prop) {
          setLandlordId(prop.landlordId);
          if (prop.landlordName) setLandlordName(prop.landlordName);
        } else {
          setNoProperty(true);
        }
      })
      .catch(() => setNoProperty(true));
  }, []);

  // Derive landlordName from received messages if not provided by property API
  useEffect(() => {
    const received = messages.find(m => m.senderId !== userId);
    if (received?.senderName) setLandlordName(received.senderName);
  }, [messages, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !landlordId) return;
    setSending(true);
    setSendError('');
    try {
      await sendMessage({ receiverIds: [landlordId], messageText: text.trim(), messageType: 'normal' });
      setText('');
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" className="text-blue-600" /></div>;
  }

  if (noProperty) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No property assigned</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          You need to be assigned to a property before you can message your landlord.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Conversation with {landlordName}</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Chat thread */}
      <Card className="p-0 overflow-hidden flex flex-col" style={{ height: '60vh' }}>
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
              {landlordName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{landlordName}</p>
            <p className="text-xs text-slate-400">Landlord</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Info className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === userId;
              return (
                <div key={msg.id} className={cn('flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                    )}
                  >
                    {msg.messageText}
                  </div>
                  <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending || !landlordId}
            />
            <Button onClick={handleSend} loading={sending} disabled={!text.trim() || !landlordId}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Landlord Compose View ────────────────────────────────────────────────────

function LandlordMessagesView({
  messages, loading, error, sendMessage, userId,
}: {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (p: { receiverIds: string[]; messageText: string; messageType: MessageType }) => Promise<Message>;
  userId: string;
}) {
  const [tab, setTab] = useState<'compose' | 'inbox'>('compose');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  // Compose state
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [msgType, setMsgType] = useState<MessageType>('normal');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Inbox filter state
  const [filterType, setFilterType] = useState<MessageType | 'all'>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');

  useEffect(() => {
    fetch('/api/tenants')
      .then(r => r.json())
      .then(json => { if (json.data) setTenants(json.data); })
      .finally(() => setTenantsLoading(false));
  }, []);

  const toggleTenant = (id: string) => {
    setSelectedTenantIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!msgText.trim() || selectedTenantIds.length === 0) return;
    setSending(true);
    setSendError('');
    setSendSuccess('');
    try {
      await sendMessage({ receiverIds: selectedTenantIds, messageText: msgText.trim(), messageType: msgType });
      setMsgText('');
      setSelectedTenantIds([]);
      setMsgType('normal');
      setSendSuccess('Message sent successfully!');
      setTimeout(() => setSendSuccess(''), 3000);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  // Build tenant lookup for inbox enrichment
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.name]));

  // Filtered inbox messages
  const inboxMessages = messages.filter(msg => {
    if (filterType !== 'all' && msg.messageType !== filterType) return false;
    if (filterTenant !== 'all') {
      const involvesTenant =
        msg.senderId === filterTenant || msg.receiverIds.includes(filterTenant);
      if (!involvesTenant) return false;
    }
    return true;
  }).slice().reverse(); // newest first in inbox

  const getParticipantLabel = useCallback((msg: Message) => {
    if (msg.senderId === userId) {
      const names = msg.receiverIds.map(id => tenantMap[id] ?? 'Unknown').join(', ');
      return `You → ${names}`;
    }
    return `${msg.senderName ?? 'Tenant'} → You`;
  }, [tenantMap, userId]);

  if (loading || tenantsLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" className="text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {(['compose', 'inbox'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            )}
          >
            {t === 'inbox' ? `Inbox (${messages.length})` : 'Compose'}
          </button>
        ))}
      </div>

      {/* Compose Tab */}
      {tab === 'compose' && (
        <Card className="max-w-2xl">
          <div className="space-y-4">
            {sendError && <Alert type="error" message={sendError} />}
            {sendSuccess && <Alert type="success" message={sendSuccess} />}

            {/* Tenant selector */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                <Users className="h-4 w-4 inline mr-1" />
                Recipients
              </label>
              {tenants.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No tenants found.</p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  {/* Select all */}
                  <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.length === tenants.length && tenants.length > 0}
                      onChange={e =>
                        setSelectedTenantIds(e.target.checked ? tenants.map(t => t.id) : [])
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Select all tenants ({tenants.length})
                    </span>
                  </label>
                  {tenants.map(t => (
                    <label
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTenantIds.includes(t.id)}
                        onChange={() => toggleTenant(t.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedTenantIds.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {selectedTenantIds.length} recipient{selectedTenantIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Message type */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Message Type
              </label>
              <div className="relative">
                <select
                  value={msgType}
                  onChange={e => setMsgType(e.target.value as MessageType)}
                  className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(TYPE_LABELS) as MessageType[]).map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Message text */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Message
              </label>
              <textarea
                rows={4}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Type your message here..."
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <Button
              onClick={handleSend}
              loading={sending}
              disabled={!msgText.trim() || selectedTenantIds.length === 0}
              fullWidth
            >
              <Send className="h-4 w-4" />
              Send Message{selectedTenantIds.length > 1 ? ` to ${selectedTenantIds.length} tenants` : ''}
            </Button>
          </div>
        </Card>
      )}

      {/* Inbox Tab */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as MessageType | 'all')}
                className="pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All types</option>
                {(Object.keys(TYPE_LABELS) as MessageType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filterTenant}
                onChange={e => setFilterTenant(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All tenants</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message list */}
          {inboxMessages.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No messages found</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {filterType !== 'all' || filterTenant !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Send your first message using the Compose tab'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxMessages.map(msg => (
                <Card key={msg.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full flex-shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {(msg.senderName ?? 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {getParticipantLabel(msg)}
                        </p>
                        <p className="text-sm text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                          {msg.messageText}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <TypeBadge type={msg.messageType as MessageType} />
                      <p className="text-xs text-slate-400">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { messages, loading, error, sendMessage } = useMessages();

  if (!user) return null;

  if (user.role === 'tenant') {
    return (
      <TenantMessagesView
        messages={messages}
        loading={loading}
        error={error}
        sendMessage={sendMessage}
        userId={user.id}
      />
    );
  }

  return (
    <LandlordMessagesView
      messages={messages}
      loading={loading}
      error={error}
      sendMessage={sendMessage}
      userId={user.id}
    />
  );
}
