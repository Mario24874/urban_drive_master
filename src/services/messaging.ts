/**
 * Servicio de mensajería en tiempo real para Urban Drive
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDocs,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import app from '../firebase';

// Firebase callable function for push notifications
function getNotifyFn() {
  return httpsCallable(getFunctions(app), 'sendMessageNotification');
}

/** Referencia a un mensaje citado (responder estilo WhatsApp) */
export interface ReplyRef {
  id: string;
  senderName: string;
  preview: string; // primeros ~90 chars o '🎤 Nota de voz'
  type: 'text' | 'voice';
}

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Timestamp | null;
  read: boolean;
  delivered?: boolean; // ✓✓ gris: el dispositivo del receptor lo recibió
  deleted?: boolean;   // tombstone "mensaje eliminado" (soft-delete)
  replyTo?: ReplyRef;
  conversationId: string;
  messageType?: 'text' | 'voice';
  voiceUrl?: string;
  voiceDuration?: number; // seconds
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp | null;
  unreadCount: { [key: string]: number };
  /** typing.{uid} = epoch millis de la última tecla; vigente si < TYPING_TTL_MS */
  typing?: { [key: string]: number };
}

// Lógica pura (ticks, typing) vive en lib/chatLogic para testearse sin Firebase
export { TYPING_TTL_MS, messageTickState, isTypingActive } from '../lib/chatLogic';

class MessagingService {
  private listeners: Map<string, () => void> = new Map();

  /**
   * Generar ID de conversación único entre dos usuarios
   */
  private generateConversationId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Enviar mensaje a otro usuario
   */
  async sendMessage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    content: string,
    replyTo?: ReplyRef
  ): Promise<boolean> {
    try {
      if (!content.trim()) {
        console.error('El mensaje está vacío');
        return false;
      }

      const conversationId = this.generateConversationId(senderId, receiverId);

      const message: Omit<Message, 'id'> = {
        senderId,
        senderName,
        receiverId,
        receiverName,
        content: content.trim(),
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        delivered: false,
        ...(replyTo ? { replyTo } : {}),
        conversationId
      };

      // Guardar mensaje en la colección de mensajes
      await addDoc(collection(db, 'messages'), message);

      // Actualizar o crear conversación
      await this.updateConversation(
        conversationId,
        senderId,
        senderName,
        receiverId,
        receiverName,
        content
      );

      // Trigger push notification (fire-and-forget)
      getNotifyFn()({ receiverId, senderId, senderName, content: content.trim(), messageType: 'text' })
        .then((r: any) => { if (!r?.data?.sent) console.warn('[FCM] notify skipped:', r?.data?.reason); })
        .catch((e: any) => console.error('[FCM] notify error:', e?.code ?? e?.message));

      console.log('Mensaje enviado exitosamente');
      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return false;
    }
  }

  /**
   * Actualizar información de la conversación
   */
  private async updateConversation(
    conversationId: string,
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    lastMessage: string
  ): Promise<void> {
    try {
      // Use conversationId as the document ID so getDoc/setDoc are O(1)
      const convRef = doc(db, 'conversations', conversationId);
      const snapshot = await getDoc(convRef);

      if (!snapshot.exists()) {
        await setDoc(convRef, {
          id: conversationId,
          participants: [senderId, receiverId],
          participantNames: {
            [senderId]: senderName,
            [receiverId]: receiverName
          },
          lastMessage,
          lastMessageTime: serverTimestamp(),
          unreadCount: {
            [senderId]: 0,
            [receiverId]: 1
          }
        });
      } else {
        const currentData = snapshot.data();
        await updateDoc(convRef, {
          lastMessage,
          lastMessageTime: serverTimestamp(),
          [`participantNames.${senderId}`]: senderName,
          [`participantNames.${receiverId}`]: receiverName,
          unreadCount: {
            ...currentData.unreadCount,
            [receiverId]: (currentData.unreadCount?.[receiverId] || 0) + 1
          }
        });
      }
    } catch (error) {
      console.error('Error actualizando conversación:', error);
    }
  }

  /**
   * Suscribirse a mensajes de una conversación
   */
  subscribeToConversation(
    userId: string,
    contactId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const conversationId = this.generateConversationId(userId, contactId);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery,
      (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data()
          } as Message);
        });
        callback(messages);

        // ✓✓ entregado: este dispositivo (receptor) acaba de recibir los mensajes
        messages
          .filter((m) => m.receiverId === userId && !m.delivered && m.id)
          .forEach((m) =>
            updateDoc(doc(db, 'messages', m.id!), { delivered: true }).catch(() => {})
          );
      },
      (error) => {
        console.error('Error en suscripción de mensajes:', error);
        callback([]);
      }
    );

    // Guardar listener para poder desuscribirse después
    const listenerId = `${userId}_${contactId}`;
    this.listeners.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Obtener todas las conversaciones de un usuario
   */
  subscribeToUserConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery,
      (snapshot) => {
        const conversations: Conversation[] = [];
        snapshot.forEach((doc) => {
          conversations.push({
            id: doc.id,
            ...doc.data()
          } as Conversation);
        });
        callback(conversations);
      },
      (error) => {
        console.error('Error obteniendo conversaciones:', error);
        callback([]);
      }
    );

    this.listeners.set(`conversations_${userId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Marcar mensajes como leídos
   */
  async markMessagesAsRead(userId: string, contactId: string): Promise<void> {
    try {
      const conversationId = this.generateConversationId(userId, contactId);
      
      // Obtener mensajes no leídos del contacto
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(messagesQuery);
      
      // Marcar cada mensaje como leído
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);

      // Actualizar contador de no leídos en la conversación (O(1) lookup by doc ID)
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        await updateDoc(convRef, { [`unreadCount.${userId}`]: 0 });
      }

      console.log('Mensajes marcados como leídos');
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  }

  /**
   * Obtener historial de mensajes entre dos usuarios
   */
  async getMessageHistory(
    userId: string,
    contactId: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const conversationId = this.generateConversationId(userId, contactId);
      
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(messagesQuery);
      const messages: Message[] = [];
      
      let count = 0;
      snapshot.forEach((doc) => {
        if (count < limit) {
          messages.push({
            id: doc.id,
            ...doc.data()
          } as Message);
          count++;
        }
      });

      // Invertir para mostrar en orden cronológico
      return messages.reverse();
    } catch (error) {
      console.error('Error obteniendo historial de mensajes:', error);
      return [];
    }
  }

  /**
   * Buscar mensajes por contenido
   */
  async searchMessages(
    userId: string,
    searchTerm: string
  ): Promise<Message[]> {
    try {
      // Obtener todos los mensajes donde el usuario es participante
      const sentQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userId)
      );

      const receivedQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const messages: Message[] = [];

      // Combinar y filtrar mensajes
      [...sentSnapshot.docs, ...receivedSnapshot.docs].forEach((doc) => {
        const data = doc.data() as Message;
        if (data.content.toLowerCase().includes(searchTerm.toLowerCase())) {
          messages.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Ordenar por fecha
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      return messages;
    } catch (error) {
      console.error('Error buscando mensajes:', error);
      return [];
    }
  }

  /**
   * Obtener contador de mensajes no leídos
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error obteniendo mensajes no leídos:', error);
      return 0;
    }
  }

  /**
   * Enviar nota de voz a otro usuario
   */
  async sendVoiceMessage(
    senderId: string,
    senderName: string,
    receiverId: string,
    receiverName: string,
    voiceUrl: string,
    voiceDuration: number
  ): Promise<boolean> {
    try {
      const conversationId = this.generateConversationId(senderId, receiverId);
      const placeholder = '[voice_note]';

      const message: Omit<Message, 'id'> = {
        senderId,
        senderName,
        receiverId,
        receiverName,
        content: placeholder,
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        delivered: false,
        conversationId,
        messageType: 'voice',
        voiceUrl,
        voiceDuration,
      };

      await addDoc(collection(db, 'messages'), message);
      await this.updateConversation(
        conversationId,
        senderId,
        senderName,
        receiverId,
        receiverName,
        placeholder
      );

      // Trigger push notification (fire-and-forget)
      getNotifyFn()({ receiverId, senderId, senderName, content: '🎤 Voice message', messageType: 'voice' })
        .then((r: any) => { if (!r?.data?.sent) console.warn('[FCM] notify skipped:', r?.data?.reason); })
        .catch((e: any) => console.error('[FCM] notify error:', e?.code ?? e?.message));

      return true;
    } catch (error) {
      console.error('Error enviando nota de voz:', error);
      return false;
    }
  }

  /**
   * Eliminar para todos (estilo WhatsApp): solo mensajes propios, soft-delete.
   * El doc queda como tombstone y ambos lados ven "mensaje eliminado".
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        deleted: true,
        content: '',
        voiceUrl: '',
      });
      return true;
    } catch (error) {
      console.error('Error borrando mensaje:', error);
      return false;
    }
  }

  /**
   * Señal "escribiendo…": marca de tiempo por usuario en el doc de conversación.
   * Llamar con throttle desde el composer; el receptor la considera vigente
   * durante TYPING_TTL_MS.
   */
  async setTyping(userId: string, contactId: string): Promise<void> {
    const conversationId = this.generateConversationId(userId, contactId);
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`typing.${userId}`]: Date.now(),
    }).catch(() => {}); // la conversación puede no existir aún: silencioso
  }

  /** Limpia la señal de typing (al enviar o salir del chat) */
  async clearTyping(userId: string, contactId: string): Promise<void> {
    const conversationId = this.generateConversationId(userId, contactId);
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`typing.${userId}`]: 0,
    }).catch(() => {});
  }

  /**
   * Suscripción al doc de conversación (typing, unread) de un par de usuarios
   */
  subscribeToConversationDoc(
    userId: string,
    contactId: string,
    callback: (conv: Conversation | null) => void
  ): () => void {
    const conversationId = this.generateConversationId(userId, contactId);
    return onSnapshot(
      doc(db, 'conversations', conversationId),
      (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null),
      () => callback(null)
    );
  }

  /**
   * Borrar una conversación completa: todos sus mensajes + documento de conversación
   */
  async deleteConversation(
    userId: string,
    contactId: string,
    conversationDocId?: string,
  ): Promise<boolean> {
    try {
      const msgConvId = this.generateConversationId(userId, contactId);

      // Delete all messages in the conversation
      const snapshot = await getDocs(
        query(collection(db, 'messages'), where('conversationId', '==', msgConvId)),
      );
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

      // Find ALL conversation documents for this pair (handles legacy addDoc random IDs)
      const convSnap = await getDocs(
        query(collection(db, 'conversations'), where('participants', 'array-contains', userId)),
      );
      const pairConvIds = convSnap.docs
        .filter((d) => (d.data().participants as string[]).includes(contactId))
        .map((d) => d.id);

      // Collect all doc IDs: found in query + explicitly provided + computed
      const docIds = new Set<string>([
        ...pairConvIds,
        ...[conversationDocId, msgConvId].filter(Boolean) as string[],
      ]);

      await Promise.all(
        [...docIds].map((id) => deleteDoc(doc(db, 'conversations', id)).catch(() => {})),
      );

      return true;
    } catch (error) {
      console.error('Error borrando conversación:', error);
      return false;
    }
  }

  /**
   * Limpiar todos los listeners activos
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

// Crear instancia singleton
export const messagingService = new MessagingService();
export default messagingService;