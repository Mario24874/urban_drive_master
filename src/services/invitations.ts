import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';

interface Invitation {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  expiresAt: Date;
  message?: string;
  invitationType: 'phone' | 'email' | 'whatsapp';
}

class InvitationService {
  /**
   * Crear invitación para nuevo contacto
   */
  async createInvitation(
    senderId: string,
    senderData: any,
    recipientIdentifier: string,
    type: 'phone' | 'email' | 'whatsapp',
    message?: string
  ): Promise<string | null> {
    try {
      const invitationId = `${senderId}_${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días
      
      const invitation: Partial<Invitation> = {
        id: invitationId,
        senderId,
        senderName: senderData.displayName || senderData.name || 'Usuario',
        senderEmail: senderData.email,
        senderPhone: senderData.phone,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt,
        message: message || `${senderData.displayName} quiere agregarte a Urban Drive`,
        invitationType: type
      };

      // Agregar identificador según el tipo
      if (type === 'phone' || type === 'whatsapp') {
        invitation.recipientPhone = recipientIdentifier;
      } else if (type === 'email') {
        invitation.recipientEmail = recipientIdentifier;
      }

      await setDoc(doc(db, 'invitations', invitationId), invitation);
      
      // Generar link de invitación
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}?invite=${invitationId}`;
      
      console.log('Invitación creada:', invitationId);
      return inviteLink;
    } catch (error) {
      console.error('Error creando invitación:', error);
      return null;
    }
  }

  /**
   * Buscar invitaciones pendientes para un usuario
   */
  async getPendingInvitations(identifier: string, type: 'phone' | 'email'): Promise<Invitation[]> {
    try {
      const field = type === 'phone' ? 'recipientPhone' : 'recipientEmail';
      const q = query(
        collection(db, 'invitations'),
        where(field, '==', identifier),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const invitations: Invitation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Invitation;
        // Verificar si no ha expirado
        if (new Date(data.expiresAt) > new Date()) {
          invitations.push(data);
        }
      });
      
      return invitations;
    } catch (error) {
      console.error('Error obteniendo invitaciones:', error);
      return [];
    }
  }

  /**
   * Aceptar invitación y agregar contactos mutuamente
   */
  async acceptInvitation(invitationId: string, acceptingUserId: string): Promise<boolean> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        console.error('Invitación no encontrada');
        return false;
      }
      
      const invitation = invitationDoc.data() as Invitation;
      
      // Verificar que no haya expirado
      if (new Date(invitation.expiresAt) < new Date()) {
        console.error('Invitación expirada');
        return false;
      }
      
      // Agregar contactos mutuamente
      const senderRef = doc(db, 'users', invitation.senderId);
      const acceptingUserRef = doc(db, 'users', acceptingUserId);
      
      await Promise.all([
        // Agregar acceptingUser a los contactos del sender
        updateDoc(senderRef, {
          contacts: arrayUnion(acceptingUserId)
        }),
        // Agregar sender a los contactos del acceptingUser
        updateDoc(acceptingUserRef, {
          contacts: arrayUnion(invitation.senderId)
        }),
        // Actualizar estado de la invitación
        updateDoc(invitationRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: acceptingUserId
        })
      ]);
      
      console.log('Invitación aceptada y contactos agregados');
      return true;
    } catch (error) {
      console.error('Error aceptando invitación:', error);
      return false;
    }
  }

  /**
   * Rechazar invitación
   */
  async rejectInvitation(invitationId: string): Promise<boolean> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      
      console.log('Invitación rechazada');
      return true;
    } catch (error) {
      console.error('Error rechazando invitación:', error);
      return false;
    }
  }

  /**
   * Enviar invitación por WhatsApp
   */
  sendWhatsAppInvitation(phone: string, inviteLink: string, senderName: string) {
    const message = encodeURIComponent(
      `¡Hola! ${senderName} te invita a unirte a Urban Drive 🚗\n\n` +
      `Urban Drive es una aplicación de navegación GPS y mensajería en tiempo real.\n\n` +
      `Únete con este link: ${inviteLink}\n\n` +
      `El link expira en 7 días.`
    );
    
    // Limpiar número de teléfono (quitar espacios y caracteres especiales)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Abrir WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Enviar invitación por correo
   */
  sendEmailInvitation(email: string, inviteLink: string, senderName: string) {
    const subject = encodeURIComponent(`${senderName} te invita a Urban Drive`);
    const body = encodeURIComponent(
      `¡Hola!\n\n` +
      `${senderName} te invita a unirte a Urban Drive, una aplicación de navegación GPS y mensajería en tiempo real.\n\n` +
      `Puedes unirte usando este link:\n${inviteLink}\n\n` +
      `El link expira en 7 días.\n\n` +
      `¡Te esperamos!\n` +
      `Equipo Urban Drive`
    );
    
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  }

  /**
   * Detectar plataforma para sugerir método de invitación
   */
  detectPlatform(): 'mobile' | 'desktop' {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    return isMobile ? 'mobile' : 'desktop';
  }

  /**
   * Obtener método de invitación recomendado
   */
  getRecommendedInvitationMethod(): 'whatsapp' | 'email' {
    const platform = this.detectPlatform();
    return platform === 'mobile' ? 'whatsapp' : 'email';
  }
}

export default new InvitationService();