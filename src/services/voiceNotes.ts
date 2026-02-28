/**
 * VoiceNotesService — MediaRecorder + Firebase Storage upload/download
 * Storage path: voice_notes/{conversationId}/{timestamp}_{uid}.webm
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { auth } from './firebase';

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
    conversationId: string,
    durationMs: number
  ): Promise<VoiceNoteUploadResult> {
    const uid = auth.currentUser?.uid ?? 'anonymous';
    const timestamp = Date.now();
    const ext = blob.type.includes('webm') ? 'webm' : 'ogg';
    const path = `voice_notes/${conversationId}/${timestamp}_${uid}.${ext}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'audio/webm' });
    const url = await getDownloadURL(storageRef);

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
