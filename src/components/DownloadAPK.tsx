import React, { useState, useEffect } from 'react';
import { Download, Share, Smartphone, ExternalLink, X } from 'lucide-react';
import { getDeviceInfo, getDownloadAction, getShareMessage } from '../utils/deviceDetection';
import { shareViaWhatsApp, shareViaEmail, shareGeneric, downloadAPK } from '../utils/shareAPK';

interface DownloadAPKProps {
  isOpen: boolean;
  onClose: () => void;
  showInline?: boolean; // Para mostrar como componente inline en lugar de modal
}

const DownloadAPK: React.FC<DownloadAPKProps> = ({ isOpen, onClose, showInline = false }) => {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [downloadAction, setDownloadAction] = useState(getDownloadAction(deviceInfo));
  const [loading, setLoading] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
    setDownloadAction(getDownloadAction(info));
  }, []);

  if (!isOpen && !showInline) return null;

  const handleMainAction = async () => {
    setLoading(true);
    
    try {
      switch (downloadAction.action) {
        case 'download':
          // Descarga directa en móvil Android
          await downloadAPK();
          break;
        case 'pwa':
          // Instrucciones para iOS PWA
          alert('Para instalar la app:\n1. Toca el botón de compartir (↗️)\n2. Selecciona "Añadir a pantalla de inicio"\n3. Confirma la instalación');
          break;
        case 'share':
          // Mostrar opciones de compartir en desktop
          setShowShareOptions(true);
          break;
      }
    } catch (error) {
      console.error('Error en acción principal:', error);
      alert('Error al procesar la acción. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (type: 'whatsapp' | 'email' | 'generic' | 'download') => {
    setLoading(true);
    
    try {
      const message = getShareMessage(deviceInfo);
      const options = { message };

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
          await downloadAPK();
          break;
      }
    } catch (error) {
      console.error(`Error sharing via ${type}:`, error);
      alert(`Error al compartir por ${type}. Inténtalo de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <div className={showInline ? 'p-6' : 'p-6'}>
      {!showInline && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Urban Drive</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Información del dispositivo (solo para debug, ocultar en producción) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
          <strong>Debug:</strong> {deviceInfo.isMobile ? 'Móvil' : 'Desktop'} - 
          {deviceInfo.isAndroid && ' Android'}{deviceInfo.isIOS && ' iOS'}{deviceInfo.isWindows && ' Windows'}{deviceInfo.isMac && ' Mac'}{deviceInfo.isLinux && ' Linux'}
        </div>
      )}

      {!showShareOptions ? (
        <>
          {/* Icono principal */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              {downloadAction.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {downloadAction.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {downloadAction.subtitle}
            </p>
          </div>

          {/* Descripción */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              {downloadAction.description}
            </p>
          </div>

          {/* Botón principal */}
          <button
            onClick={handleMainAction}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {downloadAction.action === 'download' && <Download size={20} />}
                {downloadAction.action === 'pwa' && <Smartphone size={20} />}
                {downloadAction.action === 'share' && <Share size={20} />}
                {downloadAction.buttonText}
              </>
            )}
          </button>

          {/* Opciones adicionales */}
          <div className="mt-4 space-y-2">
            {deviceInfo.isDesktop && (
              <button
                onClick={() => handleShare('download')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} />
                Descargar APK
              </button>
            )}
            
            {deviceInfo.isMobile && deviceInfo.isAndroid && (
              <a
                href="http://localhost:8080/urban-drive-portable.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink size={18} />
                Abrir en navegador
              </a>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Opciones de compartir */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Cómo quieres compartir?
            </h3>
            <p className="text-gray-600 text-sm">
              Elige la forma de enviar Urban Drive a tus contactos
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleShare('whatsapp')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>💬</span>
              WhatsApp
            </button>

            <button
              onClick={() => handleShare('email')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>📧</span>
              Email
            </button>

            <button
              onClick={() => handleShare('generic')}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Share size={18} />
              Más opciones
            </button>

            <button
              onClick={() => handleShare('download')}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              Descargar
            </button>
          </div>

          <button
            onClick={() => setShowShareOptions(false)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ← Volver
          </button>
        </>
      )}

      {/* Información adicional */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Urban Drive • Transporte urbano seguro y confiable
        </p>
      </div>
    </div>
  );

  if (showInline) {
    return (
      <div className="bg-white rounded-lg shadow-lg border">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default DownloadAPK;