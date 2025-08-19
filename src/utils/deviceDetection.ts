// Utilidad para detectar el tipo de dispositivo y plataforma
export interface DeviceInfo {
  isMobile: boolean;
  isDesktop: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  browserName: string;
  platform: string;
}

/**
 * Detecta información del dispositivo y plataforma
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // Detectar dispositivos móviles
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
  const isDesktop = !isMobile;
  
  // Detectar sistemas operativos móviles
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  
  // Detectar sistemas operativos desktop
  const isWindows = /win/i.test(platform);
  const isMac = /mac/i.test(platform);
  const isLinux = /linux/i.test(platform);
  
  // Detectar navegador
  let browserName = 'unknown';
  if (userAgent.includes('chrome')) browserName = 'chrome';
  else if (userAgent.includes('firefox')) browserName = 'firefox';
  else if (userAgent.includes('safari')) browserName = 'safari';
  else if (userAgent.includes('edge')) browserName = 'edge';
  else if (userAgent.includes('opera')) browserName = 'opera';
  
  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIOS,
    isWindows,
    isMac,
    isLinux,
    browserName,
    platform: platform || 'unknown'
  };
};

/**
 * Obtiene el texto y acción apropiados según el dispositivo
 */
export const getDownloadAction = (deviceInfo: DeviceInfo) => {
  if (deviceInfo.isMobile) {
    if (deviceInfo.isAndroid) {
      return {
        action: 'download',
        title: 'Descargar App',
        subtitle: 'Instala Urban Drive en tu Android',
        icon: '📱',
        buttonText: 'Descargar APK',
        description: 'Descarga e instala la app directamente en tu dispositivo Android'
      };
    } else if (deviceInfo.isIOS) {
      return {
        action: 'pwa',
        title: 'Instalar App',
        subtitle: 'Añade Urban Drive a tu pantalla de inicio',
        icon: '📲',
        buttonText: 'Instalar App',
        description: 'Toca el botón de compartir y selecciona "Añadir a pantalla de inicio"'
      };
    }
  }
  
  // Desktop
  return {
    action: 'share',
    title: 'Compartir App',
    subtitle: 'Envía Urban Drive a tus contactos',
    icon: '🚀',
    buttonText: 'Compartir App',
    description: 'Comparte la app por WhatsApp, Email o descarga el APK'
  };
};

/**
 * Verifica si el dispositivo soporta instalación PWA
 */
export const supportsPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Verifica si el dispositivo puede descargar APKs
 */
export const supportsAPKDownload = (deviceInfo: DeviceInfo): boolean => {
  return deviceInfo.isAndroid || deviceInfo.isDesktop;
};

/**
 * Obtiene el mensaje apropiado para compartir según el dispositivo
 */
export const getShareMessage = (deviceInfo: DeviceInfo): string => {
  const baseMessage = '🚗 ¡Prueba Urban Drive! La app de transporte urbano más fácil y segura.';
  
  if (deviceInfo.isMobile && deviceInfo.isAndroid) {
    return `${baseMessage}\n\n📱 Descarga directa para Android: http://localhost:3001/download-apk`;
  }
  
  if (deviceInfo.isMobile && deviceInfo.isIOS) {
    return `${baseMessage}\n\n🌐 Úsala desde el navegador: http://localhost:8080/urban-drive-portable.html`;
  }
  
  return `${baseMessage}\n\n🔗 Pruébala aquí: http://localhost:8080/urban-drive-portable.html\n📱 APK para Android: http://localhost:3001/download-apk`;
};