import { useState, useCallback } from 'react';
import { shareViaWhatsApp, shareViaEmail, shareGeneric, downloadAPK, ShareAPKOptions } from '../utils/shareAPK';

export interface UseShareAPKReturn {
  shareViaWhatsApp: (options?: ShareAPKOptions) => Promise<void>;
  shareViaEmail: (options?: ShareAPKOptions) => Promise<void>;
  shareGeneric: (options?: ShareAPKOptions) => Promise<void>;
  downloadAPK: (apkUrl?: string) => Promise<string | null>;
  isSharing: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook personalizado para compartir APK con manejo de estados
 */
export const useShareAPK = (): UseShareAPKReturn => {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleShare = useCallback(async (
    shareFunction: (options?: ShareAPKOptions) => Promise<any>,
    options?: ShareAPKOptions,
    errorMessage = 'Error al compartir'
  ) => {
    setIsSharing(true);
    setError(null);
    
    try {
      await shareFunction(options);
    } catch (err) {
      console.error('Share error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareWhatsApp = useCallback(async (options?: ShareAPKOptions) => {
    await handleShare(shareViaWhatsApp, options, 'Error al compartir por WhatsApp');
  }, [handleShare]);

  const shareEmail = useCallback(async (options?: ShareAPKOptions) => {
    await handleShare(shareViaEmail, options, 'Error al compartir por Email');
  }, [handleShare]);

  const shareGenericAction = useCallback(async (options?: ShareAPKOptions) => {
    await handleShare(shareGeneric, options, 'Error al compartir');
  }, [handleShare]);

  const downloadAPKAction = useCallback(async (apkUrl?: string): Promise<string | null> => {
    setIsSharing(true);
    setError(null);
    
    try {
      const result = await downloadAPK(apkUrl);
      return result;
    } catch (err) {
      console.error('Download error:', err);
      setError('Error al descargar el APK');
      throw err;
    } finally {
      setIsSharing(false);
    }
  }, []);

  return {
    shareViaWhatsApp: shareWhatsApp,
    shareViaEmail: shareEmail,
    shareGeneric: shareGenericAction,
    downloadAPK: downloadAPKAction,
    isSharing,
    error,
    clearError
  };
};