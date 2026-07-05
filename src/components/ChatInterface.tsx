import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Send, ArrowLeft, Check, CheckCheck, Search, X, Trash2, Sparkles, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import messagingService, { Message, ReplyRef, messageTickState, isTypingActive } from '../services/messaging';
import { usePresenceHeartbeat, useContactPresence, formatLastSeen } from '../hooks/usePresence';
import { Contact } from '../types';
import { useApp } from '../contexts/AppContext';
import type { FreePlanLimits } from '../hooks/useFreePlanLimits';
import UpgradeModal from './UpgradeModal';

// Shadcn UI Components
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Voice
import VoiceNoteRecorder from './VoiceNoteRecorder';
import VoiceNotePlayer from './VoiceNotePlayer';

interface ChatInterfaceProps {
  currentUserId: string;
  currentUserName: string;
  selectedContact: Contact | null;
  onBack?: () => void;
  /** Plan limits for the current user — controls message count and voice notes */
  planLimits?: FreePlanLimits;
  /** Opens the pricing/upgrade flow */
  onUpgrade?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUserId,
  currentUserName,
  selectedContact,
  onBack,
  planLimits,
  onUpgrade,
}) => {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const lastTypingSentRef = useRef(0);
  const [upgradeModal, setUpgradeModal] = useState<'message_limit' | 'voice_notes' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived plan state
  const contactId = selectedContact?.id ?? '';
  const canSendMsg = planLimits ? planLimits.canSendMessage(contactId) : true;
  const msgsRemaining = planLimits ? planLimits.messagesRemainingToday(contactId) : -1;
  const isFreeTier = planLimits ? planLimits.messagesPerDay !== -1 : false;
  const voiceAllowed = planLimits ? planLimits.canUseVoiceNotes : true;

  const conversationId = selectedContact
    ? [currentUserId, selectedContact.id].sort().join('_')
    : '';

  // Presencia: publicar la propia y observar la del contacto
  usePresenceHeartbeat(currentUserId);
  const contactLastActive = useContactPresence(selectedContact?.id ?? null);
  const presenceLabel = formatLastSeen(contactLastActive, t);

  // Typing del contacto: observar el doc de conversación
  useEffect(() => {
    if (!selectedContact) return;
    let poll: ReturnType<typeof setInterval> | null = null;
    let lastTyping: { [k: string]: number } | undefined;

    const unsub = messagingService.subscribeToConversationDoc(
      currentUserId,
      selectedContact.id,
      (conv) => {
        lastTyping = conv?.typing;
        setIsTyping(isTypingActive(lastTyping, selectedContact.id));
      }
    );
    // Re-evaluar cada 2 s para que el indicador caduque sin nuevos snapshots
    poll = setInterval(() => {
      setIsTyping(isTypingActive(lastTyping, selectedContact.id));
    }, 2000);

    return () => {
      unsub();
      if (poll) clearInterval(poll);
      messagingService.clearTyping(currentUserId, selectedContact.id);
    };
  }, [selectedContact, currentUserId]);

  // Emitir mi señal de typing (throttle 2.5 s)
  const emitTyping = () => {
    if (!selectedContact) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2500) {
      lastTypingSentRef.current = now;
      messagingService.setTyping(currentUserId, selectedContact.id);
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when contact is selected
  useEffect(() => {
    if (!selectedContact) return;

    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    const loadMessages = async () => {
      await messagingService.markMessagesAsRead(currentUserId, selectedContact.id);

      unsubscribe = messagingService.subscribeToConversation(
        currentUserId,
        selectedContact.id,
        (newMessages) => {
          setMessages(newMessages);
          setLoading(false);
        }
      );
    };

    loadMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedContact, currentUserId]);

  // Send text message
  const handleSendMessage = async () => {
    if (!selectedContact || !newMessage.trim() || sending) return;

    // Enforce plan message limit
    if (!canSendMsg) {
      setUpgradeModal('message_limit');
      return;
    }

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Cita estilo WhatsApp si hay mensaje seleccionado para responder
    const replyRef: ReplyRef | undefined = replyTarget
      ? {
          id: replyTarget.id!,
          senderName: replyTarget.senderId === currentUserId ? currentUserName : replyTarget.senderName,
          preview:
            replyTarget.messageType === 'voice'
              ? t('voiceNotePreview')
              : replyTarget.content.slice(0, 90),
          type: replyTarget.messageType === 'voice' ? 'voice' : 'text',
        }
      : undefined;
    setReplyTarget(null);
    messagingService.clearTyping(currentUserId, selectedContact.id);

    const success = await messagingService.sendMessage(
      currentUserId,
      currentUserName,
      selectedContact.id,
      selectedContact.displayName,
      messageContent,
      replyRef
    );

    if (!success) {
      setNewMessage(messageContent);
    } else {
      planLimits?.recordMessageSent(contactId);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Send voice note
  const handleSendVoiceNote = useCallback(
    async (url: string, duration: number) => {
      if (!selectedContact) return;
      await messagingService.sendVoiceMessage(
        currentUserId,
        currentUserName,
        selectedContact.id,
        selectedContact.displayName,
        url,
        duration
      );
      planLimits?.recordMessageSent(selectedContact.id);
    },
    [selectedContact, currentUserId, currentUserName, planLimits]
  );

  // Long-press handlers (mobile) — select own message to show delete button
  const startLongPress = (msgId: string) => {
    longPressTimer.current = setTimeout(() => setSelectedMsgId(msgId), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    setSelectedMsgId(null);
    await messagingService.deleteMessage(msgId);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Search messages
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    const results = await messagingService.searchMessages(currentUserId, searchTerm);
    setMessages(results);
    setLoading(false);
  };

  // Format timestamp
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      }

      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return date.toLocaleDateString('es', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
    } catch (error) {
      return '';
    }
  };

  if (!selectedContact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full text-muted-foreground"
      >
        <div className="text-center">
          <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 text-muted" />
          <p className="text-lg">{t('selectContactToChat')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft size={20} />
              </Button>
            )}

            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedContact.photoURL || ''} alt={selectedContact.displayName} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white">
                  {selectedContact.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-display font-semibold">{selectedContact.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  {isTyping ? (
                    <span className="text-brand-yellow">{t('typingIndicator')}</span>
                  ) : presenceLabel ? (
                    <span className={presenceLabel === t('online') ? 'text-brand-green' : ''}>
                      {presenceLabel === t('online') && '🟢 '}
                      {presenceLabel}
                    </span>
                  ) : (
                    selectedContact.userType === 'driver' ? t('driverBadge') : t('userBadge')
                  )}
                </p>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setSearchMode(!searchMode)}>
            {searchMode ? <X size={20} /> : <Search size={20} />}
          </Button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchConversation')}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>{t('search')}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center h-full text-muted-foreground"
          >
            <div className="text-center">
              <p className="text-lg mb-2">{t('noMessagesYet')}</p>
              <p className="text-sm">{t('sendFirstMessage')}</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3" onClick={() => setSelectedMsgId(null)}>
            <AnimatePresence mode="popLayout">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUserId;
                const isVoice = message.messageType === 'voice' && !message.deleted;
                const isSelected = selectedMsgId === message.id;
                const tick = messageTickState(message);

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`group flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    onTouchStart={() => startLongPress(message.id!)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                  >
                    {/* Contact avatar — shown only for received messages */}
                    {!isOwn && (
                      <Avatar className="h-6 w-6 flex-shrink-0 mb-0.5">
                        <AvatarImage src={selectedContact.photoURL || ''} alt={selectedContact.displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-[10px]">
                          {selectedContact.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Acciones — a la izquierda de burbuja propia: responder + eliminar */}
                    {isOwn && !message.deleted && (
                      <div className={`flex shrink-0 gap-0.5 transition-all ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReplyTarget(message); setSelectedMsgId(null); inputRef.current?.focus(); }}
                          className="p-1.5 rounded-full text-white/40 hover:text-brand-yellow hover:bg-brand-yellow/10"
                          title={t('reply')}
                        >
                          <Reply size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message.id!); }}
                          className="p-1.5 rounded-full text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                          title={t('deleteMessage')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] md:max-w-[55%] ${
                        isOwn
                          ? isVoice ? '' : 'bg-primary text-primary-foreground'
                          : isVoice ? '' : 'bg-card border border-border'
                      } ${isVoice ? '' : 'rounded-2xl px-4 py-2 shadow-sm'} ${
                        isSelected ? 'ring-2 ring-destructive/40' : ''
                      }`}
                    >
                      {!isOwn && !isVoice && (
                        <p className="text-xs font-semibold mb-1 text-brand-yellow">
                          {message.senderName}
                        </p>
                      )}

                      {/* Cita del mensaje respondido */}
                      {message.replyTo && !message.deleted && (
                        <div className={`mb-1.5 rounded-lg border-l-2 border-brand-yellow px-2 py-1 text-xs ${
                          isOwn ? 'bg-black/15' : 'bg-white/5'
                        }`}>
                          <p className="font-semibold text-brand-yellow">{message.replyTo.senderName}</p>
                          <p className={`truncate ${isOwn ? 'text-primary-foreground/70' : 'text-white/60'}`}>
                            {message.replyTo.preview}
                          </p>
                        </div>
                      )}

                      {message.deleted ? (
                        <p className="text-sm italic opacity-60">{t('messageDeleted')}</p>
                      ) : isVoice && message.voiceUrl ? (
                        <VoiceNotePlayer
                          url={message.voiceUrl}
                          duration={message.voiceDuration ?? 0}
                        />
                      ) : (
                        <p className="text-sm break-words">{message.content}</p>
                      )}

                      {!isVoice && (
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          <span>{formatTime(message.timestamp)}</span>
                          {isOwn && !message.deleted && (
                            tick === 'read'
                              // Azul universal de "leído" (WhatsApp); contrasta sobre burbuja amarilla
                              ? <CheckCheck size={14} className="text-sky-600" />
                              : tick === 'delivered'
                                ? <CheckCheck size={14} />
                                : <Check size={14} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Responder — a la derecha de burbuja recibida (solo el remitente puede eliminar) */}
                    {!isOwn && !message.deleted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReplyTarget(message); setSelectedMsgId(null); inputRef.current?.focus(); }}
                        className={`shrink-0 p-1.5 rounded-full text-white/40 hover:text-brand-yellow hover:bg-brand-yellow/10 transition-all ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title={t('reply')}
                      >
                        <Reply size={14} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Free-tier message limit banner */}
      <AnimatePresence>
        {isFreeTier && msgsRemaining >= 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-1.5 flex items-center justify-between text-xs border-t ${
              msgsRemaining === 0
                ? 'bg-red-950/40 border-red-800/40 text-red-300'
                : 'bg-amber-950/30 border-amber-800/30 text-amber-300'
            }`}
          >
            <span>
              {msgsRemaining === 0
                ? t('msgLimitReached')
                : t('msgLimitRemaining').replace('{n}', String(msgsRemaining))}
            </span>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="flex items-center gap-1 font-semibold hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                {t('upgradePlan')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-card border-t p-4">
        {/* Preview de respuesta (cita) */}
        <AnimatePresence>
          {replyTarget && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-2 border-brand-yellow bg-white/5 px-3 py-1.5"
            >
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-brand-yellow">
                  {t('replyingTo').replace(
                    '{name}',
                    replyTarget.senderId === currentUserId ? currentUserName : replyTarget.senderName
                  )}
                </p>
                <p className="truncate text-white/60">
                  {replyTarget.messageType === 'voice' ? t('voiceNotePreview') : replyTarget.content}
                </p>
              </div>
              <button
                onClick={() => setReplyTarget(null)}
                className="shrink-0 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); if (e.target.value) emitTyping(); }}
            onKeyPress={handleKeyPress}
            placeholder={canSendMsg ? t('typeMessage') : t('msgLimitReached')}
            disabled={sending || !canSendMsg}
            className="flex-1 rounded-full"
          />

          {/* Voice note recorder — shown only when no text is typed */}
          {!newMessage.trim() && (
            <VoiceNoteRecorder
              conversationId={conversationId}
              onSendVoiceNote={handleSendVoiceNote}
              disabled={sending}
              voiceAllowed={voiceAllowed}
              onFeatureBlocked={() => setUpgradeModal('voice_notes')}
            />
          )}

          {/* Send button — shown only when text is present */}
          {newMessage.trim() && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || !canSendMsg}
                size="icon"
                className="rounded-full"
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <Send size={20} />
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Upgrade modals */}
      {upgradeModal && (
        <UpgradeModal
          open={true}
          reason={upgradeModal}
          onClose={() => setUpgradeModal(null)}
          onUpgrade={() => { setUpgradeModal(null); onUpgrade?.(); }}
        />
      )}
    </div>
  );
};

// Message icon for empty state
const MessageSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export default memo(ChatInterface);
