import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { messagingService } from '../services/messaging';
import type { Conversation } from '../services/messaging';
import type { Contact } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, UserPlus, Trash2, Check, X } from 'lucide-react';
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

/** Try /users/{uid} then /drivers/{uid} — returns photoURL or undefined */
async function fetchContactPhoto(uid: string): Promise<string | undefined> {
  let snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) snap = await getDoc(doc(db, 'drivers', uid));
  return snap.data()?.photoURL as string | undefined;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  currentUserId,
  onSelectConversation,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  /** conv.id pending delete confirmation */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Track which UIDs we've already fetched to avoid duplicate reads */
  const fetchedIds = useRef<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useApp();

  useEffect(() => {
    const unsub = messagingService.subscribeToUserConversations(currentUserId, (convs) => {
      const seen = new Set<string>();
      const deduped = convs.filter((conv) => {
        const otherId = conv.participants.find((p) => p !== currentUserId) ?? '';
        if (!otherId || seen.has(otherId)) return false;
        seen.add(otherId);
        return true;
      });
      setConversations(deduped);
      setLoading(false);

      const newIds = [...seen].filter((id) => !fetchedIds.current.has(id));
      if (newIds.length === 0) return;
      newIds.forEach((id) => fetchedIds.current.add(id));

      Promise.all(
        newIds.map(async (uid) => [uid, await fetchContactPhoto(uid)] as [string, string | undefined])
      ).then((entries) => {
        setPhotos((prev) => {
          const next = { ...prev };
          for (const [uid, url] of entries) {
            if (url) next[uid] = url;
          }
          return next;
        });
      });
    });
    return unsub;
  }, [currentUserId]);

  const startLongPress = (convId: string) => {
    longPressTimer.current = setTimeout(() => setConfirmDeleteId(convId), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteConversation = async (conv: Conversation, otherId: string) => {
    setDeleting(true);
    await messagingService.deleteConversation(currentUserId, otherId, conv.id);
    setDeleting(false);
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground text-sm">…</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        className="h-full"
        icon={<MessageSquare size={26} />}
        title={t('noConversations')}
        description={t('startChatFromContacts')}
        action={
          <Button size="touch" onClick={onNewChat}>
            <UserPlus size={15} className="mr-2" />
            {t('newChat')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={() => setConfirmDeleteId(null)}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0 flex items-center justify-between">
        <h2 className="font-semibold text-base">{t('messages')}</h2>
        <Button variant="ghost" size="icon" onClick={onNewChat} title={t('newChat')}>
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
          const contact: Contact = { id: otherId, displayName: otherName, photoURL: photos[otherId] };
          const isPendingDelete = confirmDeleteId === conv.id;

          return (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-3 px-4 py-3 transition-colors ${
                isPendingDelete ? 'bg-destructive/10' : 'hover:bg-muted/50 active:bg-muted'
              }`}
              onTouchStart={() => !isPendingDelete && startLongPress(conv.id)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
            >
              {/* Avatar */}
              <button
                className="shrink-0"
                onClick={(e) => { e.stopPropagation(); if (!isPendingDelete) onSelectConversation(contact); }}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={photos[otherId]} alt={otherName} />
                  <AvatarFallback className="bg-amber-500 text-white font-semibold text-base">
                    {otherName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {isPendingDelete ? (
                /* ── Confirmation row ── */
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    {t('deleteConversationWith').replace('{name}', otherName)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('deleteConversationDesc')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting}
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv, otherId); }}
                      className="h-7 px-3 text-xs"
                    >
                      {deleting ? '…' : <><Check size={12} className="mr-1" />{t('delete')}</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deleting}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="h-7 px-3 text-xs"
                    >
                      <X size={12} className="mr-1" />{t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Normal row ── */
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={(e) => { e.stopPropagation(); onSelectConversation(contact); }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium truncate text-sm">{otherName}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                      {unread > 0 && (
                        <span className="min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-bold">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {lastMsg}
                  </p>
                </button>
              )}

              {/* Trash icon — desktop hover or shown when selected via long press */}
              {!isPendingDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(conv.id); }}
                  className="shrink-0 p-1.5 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  title={t('deleteConversation')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationsList;
