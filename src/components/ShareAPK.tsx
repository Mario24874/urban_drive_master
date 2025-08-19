import React, { useState } from 'react';
import { Share, MessageCircle, Mail, Download } from 'lucide-react';
import { shareViaWhatsApp, shareViaEmail, shareGeneric, downloadAPK } from '../utils/shareAPK';

interface ShareAPKProps {
  isOpen: boolean;
  onClose: () => void;
  apkUrl?: string;
}

const ShareAPK: React.FC<ShareAPKProps> = ({ isOpen, onClose, apkUrl }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const handleShare = async (type: 'whatsapp' | 'email' | 'generic' | 'download') => {
    setLoading(type);
    
    try {
      const options = {
        recipientPhone: recipientPhone || undefined,
        recipientEmail: recipientEmail || undefined,
        message: customMessage || undefined,
        apkUrl
      };

      switch (type) {
        case 'whatsapp':
          await shareViaWhatsApp(options);
          break;
        case 'email':
          await shareViaEmail(options);
          break;
        case 'generic':
          await shareGeneric(options);
          break;
        case 'download':
          await downloadAPK(apkUrl);
          break;
      }
    } catch (error) {
      console.error(`Error sharing via ${type}:`, error);
      alert(`Error al compartir por ${type}. Inténtalo de nuevo.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Compartir Urban Drive</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Campos opcionales */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                placeholder="Ej: +573001234567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje personalizado (opcional)
              </label>
              <textarea
                placeholder="Escribe un mensaje personalizado..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none"
              />
            </div>
          </div>

          {/* Botones de compartir */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShare('whatsapp')}
              disabled={loading === 'whatsapp'}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading === 'whatsapp' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageCircle size={20} />
              )}
              WhatsApp
            </button>

            <button
              onClick={() => handleShare('email')}
              disabled={loading === 'email'}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading === 'email' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail size={20} />
              )}
              Email
            </button>

            <button
              onClick={() => handleShare('generic')}
              disabled={loading === 'generic'}
              className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading === 'generic' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Share size={20} />
              )}
              Compartir
            </button>

            <button
              onClick={() => handleShare('download')}
              disabled={loading === 'download'}
              className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading === 'download' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={20} />
              )}
              Descargar
            </button>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <strong>Consejo:</strong> Los campos son opcionales. Si no los llenas, 
              el sistema te permitirá elegir el contacto al momento de compartir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareAPK;