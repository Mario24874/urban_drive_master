import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Check, CheckCheck, Search, X } from 'lucide-react';
import messagingService, { Message } from '../services/messaging';
import { Contact } from '../types';

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
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll al final cuando hay mensajes nuevos
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar mensajes cuando se selecciona un contacto
  useEffect(() => {
    if (!selectedContact) return;

    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    const loadMessages = async () => {
      // Marcar mensajes como leídos
      await messagingService.markMessagesAsRead(currentUserId, selectedContact.id);

      // Suscribirse a mensajes en tiempo real
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

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedContact, currentUserId]);

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!selectedContact || !newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Limpiar input inmediatamente

    const success = await messagingService.sendMessage(
      currentUserId,
      currentUserName,
      selectedContact.id,
      selectedContact.displayName,
      messageContent
    );

    if (!success) {
      // Si falla, restaurar el mensaje
      setNewMessage(messageContent);
      alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Manejar Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Buscar mensajes
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    const results = await messagingService.searchMessages(currentUserId, searchTerm);
    setMessages(results);
    setLoading(false);
  };

  // Formatear timestamp
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      
      // Si es hoy, mostrar solo hora
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Si es esta semana, mostrar día y hora
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return date.toLocaleDateString('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      }
      
      // Si es más antiguo, mostrar fecha completa
      return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
    } catch (error) {
      return '';
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Selecciona un contacto para chatear</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedContact.displayName.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedContact.displayName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedContact.userType === 'driver' ? '🚗 Conductor' : '👤 Usuario'}
                  {selectedContact.isVisible && ' • 🟢 En línea'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSearchMode(!searchMode)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {searchMode ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* Search bar */}
        {searchMode && (
          <div className="px-4 pb-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar en la conversación..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Sin mensajes aún</p>
              <p className="text-sm">Envía el primer mensaje para iniciar la conversación</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[70%] md:max-w-[50%] ${
                    isOwn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200'
                  } rounded-2xl px-4 py-2 shadow-sm`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 text-blue-600">
                      {message.senderName}
                    </p>
                  )}
                  
                  <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-800'} break-words`}>
                    {message.content}
                  </p>
                  
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                    {isOwn && (
                      message.read ? 
                        <CheckCheck size={14} /> : 
                        <Check size={14} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-full transition-all ${
              newMessage.trim() && !sending
                ? 'bg-blue-600 hover:bg-blue-700 text-white scale-100' 
                : 'bg-gray-200 text-gray-400 scale-95'
            } disabled:cursor-not-allowed`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        `
      }} />
    </div>
  );
};

// Ícono de mensaje para cuando no hay chat seleccionado
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

export default ChatInterface;