import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Send, ArrowLeft, Check, CheckCheck, Search, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import messagingService, { Message } from '../services/messaging';
import { Contact } from '../types';
import { useApp } from '../contexts/AppContext';

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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUserId,
  currentUserName,
  selectedContact,
  onBack,
}) => {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationId = selectedContact
    ? [currentUserId, selectedContact.id].sort().join('_')
    : '';

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

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const success = await messagingService.sendMessage(
      currentUserId,
      currentUserName,
      selectedContact.id,
      selectedContact.displayName,
      messageContent
    );

    if (!success) {
      setNewMessage(messageContent);
      alert('Error sending message. Please try again.');
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
    },
    [selectedContact, currentUserId, currentUserName]
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
                <h3 className="font-semibold">{selectedContact.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedContact.userType === 'driver' ? t('driverBadge') : t('userBadge')}
                  {selectedContact.isVisible && ` • 🟢 ${t('online')}`}
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
                const isVoice = message.messageType === 'voice';
                const isSelected = selectedMsgId === message.id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`group flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    onTouchStart={() => isOwn && startLongPress(message.id!)}
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

                    {/* Delete button — appears left of own bubbles on hover (desktop) or long press (mobile) */}
                    {isOwn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message.id!); }}
                        className={`shrink-0 p-1.5 rounded-full text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Eliminar mensaje"
                      >
                        <Trash2 size={14} />
                      </button>
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
                        <p className="text-xs font-semibold mb-1 text-amber-500 dark:text-amber-400">
                          {message.senderName}
                        </p>
                      )}

                      {isVoice && message.voiceUrl ? (
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
                          {isOwn &&
                            (message.read ? <CheckCheck size={14} /> : <Check size={14} />)}
                        </div>
                      )}
                    </div>
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

      {/* Input */}
      <div className="bg-card border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            disabled={sending}
            className="flex-1 rounded-full"
          />

          {/* Voice note recorder — shown only when no text is typed */}
          {!newMessage.trim() && (
            <VoiceNoteRecorder
              conversationId={conversationId}
              onSendVoiceNote={handleSendVoiceNote}
              disabled={sending}
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
                disabled={!newMessage.trim() || sending}
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
