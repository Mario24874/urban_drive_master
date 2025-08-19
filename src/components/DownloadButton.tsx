import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, CheckCircle, AlertCircle } from 'lucide-react';

interface APKInfo {
  available: boolean;
  filename: string;
  downloadUrl: string;
  directUrl: string | null;
  size: number;
  type: 'real' | 'demo';
  isReal: boolean;
  lastModified: string;
}

interface DownloadButtonProps {
  variant?: 'primary' | 'secondary' | 'compact';
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  variant = 'primary',
  className = '' 
}) => {
  const [apkInfo, setApkInfo] = useState<APKInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchAPKInfo();
    // Actualizar info cada 30 segundos
    const interval = setInterval(fetchAPKInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAPKInfo = async () => {
    try {
      const response = await fetch('http://localhost:3001/apk-info');
      const info = await response.json();
      setApkInfo(info);
    } catch (error) {
      console.error('Error fetching APK info:', error);
    }
  };

  const handleDownload = async () => {
    if (!apkInfo) return;
    
    setLoading(true);
    setDownloadStatus('downloading');

    try {
      // Usar la URL directa si existe, sino la URL de descarga
      const downloadUrl = apkInfo.directUrl || apkInfo.downloadUrl;
      
      // Crear elemento de descarga invisible
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = apkInfo.filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadStatus('success');
      
      // Reset status después de 3 segundos
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading APK:', error);
      setDownloadStatus('error');
      
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!apkInfo) return;

    const shareData = {
      title: 'Urban Drive - App de Transporte',
      text: '🚗 ¡Descarga Urban Drive! La app de transporte urbano más fácil y segura.',
      url: apkInfo.downloadUrl
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar al portapapeles
        const message = `${shareData.text}\n\n📱 Descarga: ${shareData.url}`;
        await navigator.clipboard.writeText(message);
        alert('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback manual
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`🚗 ¡Descarga Urban Drive!\n\n📱 ${apkInfo.downloadUrl}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!apkInfo) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-12 w-full"></div>
      </div>
    );
  }

  // Variante compacta
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleDownload}
          disabled={loading || !apkInfo.available}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : downloadStatus === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <Download size={16} />
          )}
          <span className="hidden sm:inline">Descargar</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Share2 size={16} />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>
    );
  }

  // Variante principal (completa)
  return (
    <div className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <Smartphone className="text-green-600" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Urban Drive APK</h3>
          <p className="text-sm text-gray-600">
            {apkInfo.isReal ? 'Aplicación nativa Android' : 'Versión de demostración'}
          </p>
        </div>
      </div>

      {/* APK Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-gray-500">Tamaño:</span>
          <span className="ml-2 font-medium">{formatFileSize(apkInfo.size)}</span>
        </div>
        <div>
          <span className="text-gray-500">Tipo:</span>
          <span className={`ml-2 font-medium ${apkInfo.isReal ? 'text-green-600' : 'text-amber-600'}`}>
            {apkInfo.isReal ? 'Real' : 'Demo'}
          </span>
        </div>
      </div>

      {/* Status indicator */}
      {!apkInfo.isReal && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="text-amber-600" size={16} />
          <p className="text-sm text-amber-800">
            APK de demostración. Ejecuta <code className="bg-amber-100 px-1 rounded">./build-apk.sh</code> para generar el APK real.
          </p>
        </div>
      )}

      {/* Download status */}
      {downloadStatus === 'success' && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="text-green-600" size={16} />
          <p className="text-sm text-green-800">¡Descarga iniciada exitosamente!</p>
        </div>
      )}

      {downloadStatus === 'error' && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600" size={16} />
          <p className="text-sm text-red-800">Error al descargar. Inténtalo de nuevo.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={loading || !apkInfo.available}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : downloadStatus === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <Download size={20} />
          )}
          <span>
            {downloadStatus === 'downloading' ? 'Descargando...' :
             downloadStatus === 'success' ? 'Descargado' :
             'Descargar APK'}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          <Share2 size={20} />
          <span>Compartir</span>
        </button>
      </div>

      {/* Additional info */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Compatible con Android 7.0+ • Tamaño: {formatFileSize(apkInfo.size)}
      </p>
    </div>
  );
};

export default DownloadButton;