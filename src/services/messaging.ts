/**
 * Servicio de mensajería en tiempo real para Urban Drive
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Timestamp | null;
  read: boolean;
  conversationId: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp | null;
  unreadCount: { [key: string]: number };
}

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
    content: string
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
      // Verificar si la conversación existe
      const conversationQuery = query(
        collection(db, 'conversations'),
        where('__name__', '==', conversationId)
      );
      
      const snapshot = await getDocs(conversationQuery);

      if (snapshot.empty) {
        // Crear nueva conversación
        await addDoc(collection(db, 'conversations'), {
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
        // Actualizar conversación existente
        const doc = snapshot.docs[0];
        const currentData = doc.data();
        
        await updateDoc(doc.ref, {
          lastMessage,
          lastMessageTime: serverTimestamp(),
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

      // Actualizar contador de no leídos en la conversación
      const conversationQuery = query(
        collection(db, 'conversations'),
        where('id', '==', conversationId)
      );
      
      const convSnapshot = await getDocs(conversationQuery);
      if (!convSnapshot.empty) {
        const convDoc = convSnapshot.docs[0];
        await updateDoc(convDoc.ref, {
          [`unreadCount.${userId}`]: 0
        });
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