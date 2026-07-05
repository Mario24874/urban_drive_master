import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import app from './firebase';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const MUTED_KEY = 'ud_notif_muted';

/** Beep corto vía WebAudio — sin assets, respeta el silencio del usuario. */
function playNotificationSound(): void {
  try {
    const Ctx = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // audio bloqueado por el navegador — la notificación visual basta
  }
}

class FCMService {
  private unsubscribeForeground: (() => void) | null = null;

  /** Preferencia local de silencio (espejo de fcm_tokens/{uid}.muted) */
  isMuted(): boolean {
    try {
      return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Silenciar/activar notificaciones: el servidor deja de enviar push
   * (campo muted en fcm_tokens) y el primer plano deja de sonar.
   */
  async setMuted(userId: string, muted: boolean): Promise<void> {
    try {
      localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    } catch { /* localStorage no disponible */ }
    await setDoc(doc(db, 'fcm_tokens', userId), { muted }, { merge: true });
  }

  /**
   * Initialize FCM for a logged-in user.
   * - Requests notification permission
   * - Gets FCM token and saves it to Firestore
   * - Handles foreground messages (app open) as toasts
   */
  async initialize(userId: string): Promise<void> {
    try {
      const supported = await isSupported();
      if (!supported) return;

      if (!VAPID_KEY) {
        console.warn('[FCM] VITE_FIREBASE_VAPID_KEY not set — push notifications disabled');
        return;
      }

      if (!('Notification' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        // merge: true — no pisar la preferencia muted guardada en el doc
        await setDoc(doc(db, 'fcm_tokens', userId), {
          token,
          userId,
          updatedAt: serverTimestamp(),
          platform: 'web',
        }, { merge: true });
        // Sincronizar el espejo local de muted (p. ej. sesión en dispositivo nuevo)
        try {
          const snap = await getDoc(doc(db, 'fcm_tokens', userId));
          localStorage.setItem(MUTED_KEY, snap.data()?.muted === true ? '1' : '0');
        } catch { /* sin espejo — se usa el default no silenciado */ }
      }

      // Handle foreground messages (app is open and focused)
      this.unsubscribeForeground = onMessage(messaging, (payload) => {
        if (this.isMuted()) return;
        const title = payload.notification?.title ?? 'Urban Drive';
        const body = payload.notification?.body ?? '';
        playNotificationSound();
        toast.info(title, { description: body, duration: 5000 });
      });
    } catch (err) {
      console.error('[FCM] init error:', err);
    }
  }

  /**
   * Remove the FCM token when the user logs out.
   */
  async cleanup(userId: string): Promise<void> {
    this.unsubscribeForeground?.();
    this.unsubscribeForeground = null;
    try {
      await deleteDoc(doc(db, 'fcm_tokens', userId));
    } catch {
      // ignore — token may not exist
    }
  }
}

export const fcmService = new FCMService();
