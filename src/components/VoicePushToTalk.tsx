/**
 * VoicePushToTalk — FAB floating button for map voice commands
 * Position: absolute bottom-4 left-4 (nav button is bottom-4 right-4)
 *
 * States:
 *   IDLE       → amber-500/80  · Mic icon
 *   LISTENING  → amber-500     · MicOff + ring pulse
 *   PROCESSING → amber-600     · Loader2 spin
 *   SUCCESS    → green flash → idle
 *   ERROR      → red flash   → idle
 */

import React, { useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceCommand, VoiceCommandState } from '../hooks/useVoiceCommand';
import { VoiceResult } from '../services/voiceService';
import { useApp } from '../contexts/AppContext';

export interface ContactForPTT {
  id: string;
  displayName: string;
  userType: 'user' | 'driver';
  location: { longitude: number; latitude: number } | null;
}

interface VoicePushToTalkProps {
  contacts: ContactForPTT[];
  onNavigateTo: (contact: ContactForPTT) => void;
  lang?: 'es' | 'en';
}

function resolveContact(
  target: string,
  contacts: ContactForPTT[]
): ContactForPTT | null {
  const needle = target.toLowerCase().trim();
  return (
    contacts.find((c) =>
      c.displayName.toLowerCase().includes(needle)
    ) ?? null
  );
}

const VoicePushToTalk: React.FC<VoicePushToTalkProps> = ({
  contacts,
  onNavigateTo,
}) => {
  const { t, lang } = useApp();

  const handleResult = useCallback(
    (result: VoiceResult) => {
      if (result.intent.type === 'navigate') {
        const contact = resolveContact(result.intent.target, contacts);
        if (contact) {
          // Speak feedback via browser TTS
          const msg = t('voiceNavigatingTo').replace('{name}', contact.displayName);
          if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(msg);
            utter.lang = lang === 'es' ? 'es-ES' : 'en-US';
            window.speechSynthesis.speak(utter);
          }
          onNavigateTo(contact);
        }
      }
      // Other intents (search, message, status) can be handled by parent via lastResult
    },
    [contacts, onNavigateTo, t, lang]
  );

  const { state, isSupported, startListening, stopListening } =
    useVoiceCommand(handleResult);

  // Don't render if SpeechRecognition is not available (Firefox, old Safari)
  if (!isSupported) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startListening();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopListening();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === 'listening') stopListening();
  };

  const stateConfig: Record<
    VoiceCommandState,
    { bg: string; icon: React.ReactNode; label: string }
  > = {
    idle: {
      bg: 'bg-amber-500/80 hover:bg-amber-500',
      icon: <Mic size={24} className="text-white" />,
      label: t('holdToTalk'),
    },
    listening: {
      bg: 'bg-amber-500 ring-4 ring-amber-300 animate-pulse',
      icon: <MicOff size={24} className="text-white" />,
      label: t('voiceListening'),
    },
    processing: {
      bg: 'bg-amber-600',
      icon: <Loader2 size={24} className="text-white animate-spin" />,
      label: t('voiceProcessing'),
    },
    success: {
      bg: 'bg-green-500',
      icon: <Mic size={24} className="text-white" />,
      label: '',
    },
    error: {
      bg: 'bg-red-500',
      icon: <Mic size={24} className="text-white" />,
      label: t('voiceError'),
    },
  };

  const cfg = stateConfig[state];

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      title={cfg.label}
      className={`absolute bottom-4 left-4 w-14 h-14 rounded-full shadow-xl z-10 flex items-center justify-center transition-all select-none touch-none ${cfg.bg}`}
    >
      {cfg.icon}
    </button>
  );
};

export default VoicePushToTalk;
