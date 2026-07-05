import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, Send, X, Check } from 'lucide-react';
import invitationService from '../services/invitations';

interface InviteContactProps {
  user: any;
  onClose?: () => void;
  defaultPhone?: string;
  defaultEmail?: string;
}

const InviteContact: React.FC<InviteContactProps> = ({ 
  user, 
  onClose,
  defaultPhone = '',
  defaultEmail = ''
}) => {
  const [inviteMethod, setInviteMethod] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [success, setSuccess] = useState(false);
  const [platform, setPlatform] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Detectar plataforma y establecer método recomendado
    const detectedPlatform = invitationService.detectPlatform();
    setPlatform(detectedPlatform);
    
    // Establecer método recomendado según plataforma
    if (detectedPlatform === 'mobile') {
      setInviteMethod('whatsapp');
      if (defaultPhone) setIdentifier(defaultPhone);
    } else {
      setInviteMethod('email');
      if (defaultEmail) setIdentifier(defaultEmail);
    }
    
    // Mensaje personalizado
    setMessage(`¡Hola! Soy ${user?.displayName || 'tu amigo'} y quiero invitarte a Urban Drive para compartir ubicación y mensajes en tiempo real.`);
  }, [user, defaultPhone, defaultEmail]);

  const validateInput = () => {
    if (!identifier.trim()) {
      alert('Por favor ingresa un número o correo');
      return false;
    }

    if (inviteMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        alert('Por favor ingresa un correo válido');
        return false;
      }
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(identifier)) {
        alert('Por favor ingresa un número válido');
        return false;
      }
    }

    return true;
  };

  const handleSendInvitation = async () => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      // Crear invitación en Firebase
      const link = await invitationService.createInvitation(
        user.id,
        user,
        identifier,
        inviteMethod === 'email' ? 'email' : 'phone',
        message
      );

      if (!link) {
        throw new Error('No se pudo crear la invitación');
      }

      setInviteLink(link);

      // Enviar según el método seleccionado
      switch (inviteMethod) {
        case 'whatsapp':
          invitationService.sendWhatsAppInvitation(identifier, link, user.displayName);
          break;
        case 'email':
          invitationService.sendEmailInvitation(identifier, link, user.displayName);
          break;
        case 'sms':
          // Para SMS, copiar al portapapeles
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(
              `${user.displayName} te invita a Urban Drive: ${link}`
            );
            alert('Link copiado al portapapeles. Pégalo en tu app de SMS.');
          }
          break;
      }

      setSuccess(true);
      
      // Auto cerrar después de 3 segundos
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
    } catch (error) {
      console.error('Error enviando invitación:', error);
      alert('Error al enviar la invitación');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (navigator.clipboard && inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copiado al portapapeles');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ¡Invitación Enviada!
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            La invitación ha sido enviada correctamente.
          </p>
          {inviteLink && (
            <button
              onClick={copyToClipboard}
              className="text-sm text-brand-yellow hover:text-brand-amber"
            >
              Copiar link de invitación
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Invitar Contacto
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Plataforma detectada */}
        <div className="mb-4 p-2 bg-brand-yellow/10 rounded text-sm text-brand-yellow">
          {platform === 'mobile' ? '📱' : '💻'} Detectado: {platform === 'mobile' ? 'Dispositivo móvil' : 'Desktop'}
        </div>

        {/* Método de invitación */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            ¿Cómo quieres enviar la invitación?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setInviteMethod('whatsapp')}
              className={`p-3 rounded-lg border transition-colors ${
                inviteMethod === 'whatsapp'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <MessageCircle className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">WhatsApp</span>
            </button>
            
            <button
              onClick={() => setInviteMethod('email')}
              className={`p-3 rounded-lg border transition-colors ${
                inviteMethod === 'email'
                  ? 'bg-brand-yellow/10 border-brand-yellow text-brand-yellow'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <Mail className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">Email</span>
            </button>
            
            <button
              onClick={() => setInviteMethod('sms')}
              className={`p-3 rounded-lg border transition-colors ${
                inviteMethod === 'sms'
                  ? 'bg-purple-50 border-purple-500 text-purple-700'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <Phone className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">SMS</span>
            </button>
          </div>
        </div>

        {/* Input de identificador */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {inviteMethod === 'email' ? 'Correo electrónico' : 'Número de teléfono'}
          </label>
          <input
            type={inviteMethod === 'email' ? 'email' : 'tel'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={inviteMethod === 'email' ? 'ejemplo@correo.com' : '+1234567890'}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/60"
          />
        </div>

        {/* Mensaje personalizado */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            Mensaje personalizado (opcional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/60 resize-none"
          />
        </div>

        {/* Botón de envío */}
        <button
          onClick={handleSendInvitation}
          disabled={loading || !identifier}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            loading || !identifier
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-brand-yellow hover:bg-brand-amber text-brand-ink'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Enviar Invitación</span>
            </>
          )}
        </button>

        {/* Información adicional */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          La invitación será válida por 7 días. El contacto recibirá un link para unirse a Urban Drive.
        </p>
      </div>
    </div>
  );
};

export default InviteContact;