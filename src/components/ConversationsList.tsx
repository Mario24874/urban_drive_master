import React, { useEffect, useState } from 'react';
import { messagingService } from '../services/messaging';
import type { Conversation } from '../services/messaging';
import type { Contact } from '../types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ConversationsListProps {
  currentUserId: string;
  onSelectConversation: (contact: Contact) => void;
  onNewChat: () => void;
}

function formatTime(ts: any): string {
  if (!ts) return '';
  const date: Date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - date.getTime()) / 3_600_000;
  if (diffH < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  currentUserId,
  onSelectConversation,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useApp();

  useEffect(() => {
    const unsub = messagingService.subscribeToUserConversations(currentUserId, (convs) => {
      // Deduplicate: convs are sorted newest-first, so the first entry
      // per otherId is always the most recent conversation.
      const seen = new Set<string>();
      const deduped = convs.filter((conv) => {
        const otherId = conv.participants.find((p) => p !== currentUserId) ?? '';
        if (!otherId || seen.has(otherId)) return false;
        seen.add(otherId);
        return true;
      });
      setConversations(deduped);
      setLoading(false);
    });
    return unsub;
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground text-sm">…</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center text-muted-foreground">
        <MessageSquare size={52} className="opacity-20" />
        <p className="font-medium">{t('noConversations') || 'Sin conversaciones'}</p>
        <p className="text-sm opacity-70">
          {t('startChatFromContacts') || 'Selecciona un contacto para iniciar un chat'}
        </p>
        <Button variant="outline" size="sm" onClick={onNewChat} className="mt-2">
          <UserPlus size={15} className="mr-2" />
          {t('newChat') || 'Nuevo chat'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0 flex items-center justify-between">
        <h2 className="font-semibold text-base">{t('messages') || 'Mensajes'}</h2>
        <Button variant="ghost" size="icon" onClick={onNewChat} title={t('newChat') || 'Nuevo chat'}>
          <UserPlus size={18} />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {conversations.map((conv) => {
          const otherId = conv.participants.find((p) => p !== currentUserId) ?? '';
          const otherName = conv.participantNames?.[otherId] ?? 'Unknown';
          const unread = conv.unreadCount?.[currentUserId] ?? 0;
          const lastMsg =
            conv.lastMessage === '[voice_note]'
              ? '🎤 Nota de voz'
              : conv.lastMessage || '…';

          const contact: Contact = { id: otherId, displayName: otherName };

          return (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(contact)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarFallback className="bg-amber-500 text-white font-semibold text-base">
                  {otherName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium truncate text-sm">{otherName}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={`text-sm truncate ${
                      unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {lastMsg}
                  </p>
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-bold">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationsList;
