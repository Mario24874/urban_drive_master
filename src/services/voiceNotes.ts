/**
 * VoiceNotesService — MediaRecorder + base64 encoding for voice notes.
 * Audio is stored as a data URL directly in the Firestore message document.
 */

export interface VoiceNoteUploadResult {
  url: string;
  duration: number; // seconds (approximate, from recording time)
}

class VoiceNotesService {
  readonly isSupported: boolean =
    typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingStart = 0;

  async startRecording(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('MediaRecorder not supported');
    }

    // Stop any previous recording
    this.stopStream();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

    this.chunks = [];
    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recordingStart = Date.now();
    this.mediaRecorder.start(100); // collect chunks every 100 ms
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.chunks = [];
        this.stopStream();
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e: any) => {
        reject(new Error(e.error?.message ?? 'recording-error'));
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        reject(err);
      }
    });
  }

  async uploadVoiceNote(
    blob: Blob,
    _conversationId: string,
    durationMs: number
  ): Promise<VoiceNoteUploadResult> {
    // Encode as base64 data URL stored in Firestore to avoid Firebase Storage CORS issues.
    // webm/opus at ~16kbps: 30s ≈ 80KB base64 — well within Firestore's 1MB document limit.
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to encode audio'));
      reader.readAsDataURL(blob);
    });

    return {
      url,
      duration: Math.round(durationMs / 1000),
    };
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  getRecordingDurationMs(): number {
    return this.recordingStart > 0 ? Date.now() - this.recordingStart : 0;
  }
}

export const voiceNotesService = new VoiceNotesService();
export default voiceNotesService;
