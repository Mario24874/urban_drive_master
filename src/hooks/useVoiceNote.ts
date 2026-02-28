/**
 * useVoiceNote — React wrapper for recording and sending voice notes
 */

import { useState, useCallback, useRef } from 'react';
import voiceNotesService from '../services/voiceNotes';

export type VoiceNoteState = 'idle' | 'recording' | 'sending' | 'error';

interface UseVoiceNoteReturn {
  state: VoiceNoteState;
  duration: number; // seconds elapsed while recording
  errorMessage: string;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopAndSend: (conversationId: string) => Promise<{ url: string; duration: number } | null>;
  cancelRecording: () => void;
}

export function useVoiceNote(): UseVoiceNoteReturn {
  const [state, setState] = useState<VoiceNoteState>('idle');
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    if (!voiceNotesService.isSupported) return;
    setErrorMessage('');
    setDuration(0);

    try {
      await voiceNotesService.startRecording();
      startTimeRef.current = Date.now();
      setState('recording');

      // Tick duration counter every second
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'mic-error');
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }, []);

  const stopAndSend = useCallback(
    async (conversationId: string): Promise<{ url: string; duration: number } | null> => {
      clearTimer();
      if (state !== 'recording') return null;
      setState('sending');

      try {
        const durationMs = Date.now() - startTimeRef.current;
        const blob = await voiceNotesService.stopRecording();
        const result = await voiceNotesService.uploadVoiceNote(blob, conversationId, durationMs);
        setState('idle');
        setDuration(0);
        return result;
      } catch (err: any) {
        setErrorMessage(err?.message ?? 'upload-error');
        setState('error');
        setTimeout(() => setState('idle'), 2000);
        return null;
      }
    },
    [state]
  );

  const cancelRecording = useCallback(() => {
    clearTimer();
    try {
      voiceNotesService.stopRecording().catch(() => {});
    } catch {
      // ignore
    }
    setState('idle');
    setDuration(0);
  }, []);

  return {
    state,
    duration,
    errorMessage,
    isSupported: voiceNotesService.isSupported,
    startRecording,
    stopAndSend,
    cancelRecording,
  };
}
