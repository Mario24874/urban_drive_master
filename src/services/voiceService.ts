/**
 * VoiceService — SpeechRecognition singleton + intent parser
 * Supports Chrome/Edge (desktop & Android). Returns isSupported=false for
 * Firefox and Safari < 14.5 where webkitSpeechRecognition is unavailable.
 */

export type VoiceIntent =
  | { type: 'navigate'; target: string }
  | { type: 'search'; target: string }
  | { type: 'message'; target: string }
  | { type: 'status'; value: 'onWay' | 'arrived' }
  | { type: 'unknown'; transcript: string };

export interface VoiceResult {
  transcript: string;
  intent: VoiceIntent;
}

const SpeechRecognitionCtor: any =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

function parseIntent(text: string, lang: 'es' | 'en'): VoiceIntent {
  const t = text.trim();

  if (lang === 'es') {
    // navigate
    const navMatch = t.match(/(navegar|ir|llevarme)\s+(a|hacia)\s+(.+)/i);
    if (navMatch) return { type: 'navigate', target: navMatch[3].trim() };

    // search
    const searchMatch = t.match(/(buscar|busca)\s+(.+)/i);
    if (searchMatch) return { type: 'search', target: searchMatch[2].trim() };

    // message
    const msgMatch = t.match(/(mensaje|hablar)\s+(a|con)\s+(.+)/i);
    if (msgMatch) return { type: 'message', target: msgMatch[3].trim() };

    // status
    if (/en camino/i.test(t)) return { type: 'status', value: 'onWay' };
    if (/llegué|he llegado/i.test(t)) return { type: 'status', value: 'arrived' };
  } else {
    // navigate
    const navMatch = t.match(/(navigate|go)\s+to\s+(.+)/i);
    if (navMatch) return { type: 'navigate', target: navMatch[2].trim() };

    // search
    const searchMatch = t.match(/(search|find)\s+(.+)/i);
    if (searchMatch) return { type: 'search', target: searchMatch[2].trim() };

    // message
    const msgMatch = t.match(/(message|chat)\s+(to|with)\s+(.+)/i);
    if (msgMatch) return { type: 'message', target: msgMatch[3].trim() };

    // status
    if (/on my way/i.test(t)) return { type: 'status', value: 'onWay' };
    if (/i.*(arrived|have arrived)/i.test(t)) return { type: 'status', value: 'arrived' };
  }

  return { type: 'unknown', transcript: t };
}

class VoiceService {
  readonly isSupported: boolean = SpeechRecognitionCtor !== null;

  private recognition: any = null;
  private currentReject: ((reason: any) => void) | null = null;

  startListening(lang: 'es' | 'en'): Promise<VoiceResult> {
    if (!this.isSupported) {
      return Promise.reject(new Error('SpeechRecognition not supported'));
    }

    // Cancel any in-flight recognition
    this.stopListening();

    return new Promise<VoiceResult>((resolve, reject) => {
      this.currentReject = reject;

      const rec = new SpeechRecognitionCtor();
      this.recognition = rec;

      rec.lang = lang === 'es' ? 'es-ES' : 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onresult = (event: any) => {
        const transcript: string =
          event.results?.[0]?.[0]?.transcript ?? '';
        resolve({
          transcript,
          intent: parseIntent(transcript, lang),
        });
        this.recognition = null;
        this.currentReject = null;
      };

      rec.onerror = (event: any) => {
        reject(new Error(event.error ?? 'recognition-error'));
        this.recognition = null;
        this.currentReject = null;
      };

      rec.onend = () => {
        // If still pending (no result/error fired), reject gracefully
        if (this.currentReject) {
          this.currentReject(new Error('recognition-end-no-result'));
          this.currentReject = null;
        }
        this.recognition = null;
      };

      try {
        rec.start();
      } catch (err) {
        reject(err);
        this.recognition = null;
        this.currentReject = null;
      }
    });
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    if (this.currentReject) {
      this.currentReject(new Error('recognition-stopped'));
      this.currentReject = null;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
