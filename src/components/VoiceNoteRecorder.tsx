/**
 * VoiceNoteRecorder — inline mic button for chat input area
 * Hold → record; release → upload and call onSendVoiceNote
 */

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceNote } from '../hooks/useVoiceNote';
import { useApp } from '../contexts/AppContext';

interface VoiceNoteRecorderProps {
  conversationId: string;
  onSendVoiceNote: (url: string, duration: number) => void;
  disabled?: boolean;
}

function formatSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  conversationId,
  onSendVoiceNote,
  disabled = false,
}) => {
  const { t } = useApp();
  const { state, duration, isSupported, startRecording, stopAndSend, cancelRecording } =
    useVoiceNote();

  if (!isSupported) return null;

  const isRecording = state === 'recording';
  const isSending = state === 'sending';

  const handlePointerDown = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled || isSending) return;
    await startRecording();
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (state !== 'recording') return;
    const result = await stopAndSend(conversationId);
    if (result) {
      onSendVoiceNote(result.url, result.duration);
    }
  };

  const handlePointerLeave = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'recording') {
      cancelRecording();
    }
  };

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {/* Duration badge while recording */}
      {isRecording && (
        <span className="text-xs text-red-500 font-mono tabular-nums animate-pulse">
          {formatSecs(duration)}
        </span>
      )}
      {isSending && (
        <span className="text-xs text-muted-foreground">{t('voiceNoteSending')}</span>
      )}

      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        disabled={disabled || isSending}
        title={isRecording ? t('voiceRecording') : t('holdToRecord')}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors select-none touch-none
          ${isRecording
            ? 'bg-red-500 animate-pulse'
            : isSending
            ? 'bg-amber-300 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
          }
          disabled:opacity-50`}
      >
        {isRecording ? (
          <MicOff size={20} className="text-white" />
        ) : (
          <Mic size={20} className="text-white" />
        )}
      </button>
    </div>
  );
};

export default VoiceNoteRecorder;
