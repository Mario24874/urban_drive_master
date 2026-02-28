/**
 * useVoiceCommand — React wrapper for VoiceService
 */

import { useState, useCallback, useRef } from 'react';
import voiceService, { VoiceResult } from '../services/voiceService';
import { useApp } from '../contexts/AppContext';

export type VoiceCommandState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface UseVoiceCommandReturn {
  state: VoiceCommandState;
  lastResult: VoiceResult | null;
  errorMessage: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceCommand(
  onResult: (result: VoiceResult) => void
): UseVoiceCommandReturn {
  const { lang } = useApp();
  const [state, setState] = useState<VoiceCommandState>('idle');
  const [lastResult, setLastResult] = useState<VoiceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const pendingRef = useRef(false);

  const startListening = useCallback(() => {
    if (!voiceService.isSupported || pendingRef.current) return;
    pendingRef.current = true;
    setState('listening');
    setErrorMessage('');
  }, []);

  const stopListening = useCallback(async () => {
    if (!pendingRef.current) return;
    setState('processing');

    try {
      const result = await voiceService.startListening(lang as 'es' | 'en');
      setLastResult(result);
      setState('success');
      onResult(result);
      // Reset to idle after a brief success flash
      setTimeout(() => setState('idle'), 1500);
    } catch (err: any) {
      const msg: string = err?.message ?? 'error';
      if (msg === 'recognition-stopped') {
        // User cancelled intentionally
        setState('idle');
      } else {
        setErrorMessage(msg);
        setState('error');
        setTimeout(() => setState('idle'), 1500);
      }
    } finally {
      pendingRef.current = false;
    }
  }, [lang, onResult]);

  return {
    state,
    lastResult,
    errorMessage,
    isSupported: voiceService.isSupported,
    startListening,
    stopListening,
  };
}
