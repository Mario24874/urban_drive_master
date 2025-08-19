// Utilidad para compartir APK por WhatsApp/Email
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface ShareAPKOptions {
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  apkUrl?: string;
}

/**
 * Comparte el APK de Urban Drive por WhatsApp o Email
 */
export class APKSharer {
  private static readonly APK_URL = 'http://localhost:3001/download-apk';
  // private static readonly APK_INFO_URL = 'http://localhost:3001/apk-info';
  private static readonly APP_NAME = 'Urban Drive';
  
  /**
   * Compartir APK por WhatsApp
   */
  static async shareViaWhatsApp(options: ShareAPKOptions = {}) {
    const message = options.message || `¡Hola! Te invito a probar ${this.APP_NAME}, nuestra nueva app de transporte. Descárgala aquí: ${options.apkUrl || this.APK_URL}`;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: `Invitación a ${this.APP_NAME}`,
          text: message,
          url: options.apkUrl || this.APK_URL,
          dialogTitle: 'Compartir via WhatsApp'
        });
      } catch (error) {
        console.error('Error sharing via WhatsApp:', error);
        // Fallback a WhatsApp Web
        this.openWhatsAppWeb(options.recipientPhone, message);
      }
    } else {
      // Para navegador web
      this.openWhatsAppWeb(options.recipientPhone, message);
    }
  }
  
  /**
   * Compartir APK por Email
   */
  static async shareViaEmail(options: ShareAPKOptions = {}) {
    const subject = `Invitación a usar ${this.APP_NAME}`;
    const body = options.message || `
¡Hola!

Te invito a probar ${this.APP_NAME}, nuestra nueva aplicación de transporte urbano.

🚗 Características principales:
• Solicita viajes de forma rápida y segura
• Seguimiento en tiempo real
• Múltiples opciones de pago
• Conductores verificados

📱 Descarga la app aquí: ${options.apkUrl || this.APK_URL}

¡Esperamos verte pronto en ${this.APP_NAME}!

Saludos,
El equipo de ${this.APP_NAME}
    `;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: subject,
          text: body,
          url: options.apkUrl || this.APK_URL,
          dialogTitle: 'Compartir via Email'
        });
      } catch (error) {
        console.error('Error sharing via Email:', error);
        // Fallback a mailto
        this.openEmailClient(options.recipientEmail, subject, body);
      }
    } else {
      // Para navegador web
      this.openEmailClient(options.recipientEmail, subject, body);
    }
  }
  
  /**
   * Compartir de forma genérica (deja que el usuario elija)
   */
  static async shareGeneric(options: ShareAPKOptions = {}) {
    const message = options.message || `¡Prueba ${this.APP_NAME}! Descarga: ${options.apkUrl || this.APK_URL}`;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: `Invitación a ${this.APP_NAME}`,
          text: message,
          url: options.apkUrl || this.APK_URL,
          dialogTitle: 'Compartir invitación'
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback a copiar al portapapeles
        await this.copyToClipboard(message);
        alert('Enlace copiado al portapapeles');
      }
    } else {
      // Para navegador web - usar Web Share API si está disponible
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Invitación a ${this.APP_NAME}`,
            text: message,
            url: options.apkUrl || this.APK_URL
          });
        } catch (error) {
          console.error('Error with Web Share API:', error);
          await this.copyToClipboard(message);
          alert('Enlace copiado al portapapeles');
        }
      } else {
        await this.copyToClipboard(message);
        alert('Enlace copiado al portapapeles');
      }
    }
  }
  
  /**
   * Descargar APK localmente (para testing)
   */
  static async downloadAPK(apkUrl?: string): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      // En navegador, abrir enlace de descarga
      window.open(apkUrl || this.APK_URL, '_blank');
      return null;
    }
    
    try {
      const response = await fetch(apkUrl || this.APK_URL);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);
      
      const fileName = `${this.APP_NAME.toLowerCase().replace(' ', '-')}-${Date.now()}.apk`;
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents
      });
      
      return result.uri;
    } catch (error) {
      console.error('Error downloading APK:', error);
      return null;
    }
  }
  
  // Métodos auxiliares privados
  private static openWhatsAppWeb(phone?: string, message?: string) {
    const encodedMessage = encodeURIComponent(message || '');
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }
  
  private static openEmailClient(email?: string, subject?: string, body?: string) {
    const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
    window.open(mailtoUrl);
  }
  
  private static async copyToClipboard(text: string) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores sin soporte para Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
  
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string)?.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Funciones de conveniencia para usar directamente
export const shareViaWhatsApp = (options?: ShareAPKOptions) => APKSharer.shareViaWhatsApp(options);
export const shareViaEmail = (options?: ShareAPKOptions) => APKSharer.shareViaEmail(options);
export const shareGeneric = (options?: ShareAPKOptions) => APKSharer.shareGeneric(options);
export const downloadAPK = (apkUrl?: string) => APKSharer.downloadAPK(apkUrl);