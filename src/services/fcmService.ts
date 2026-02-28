import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import app from './firebase';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

class FCMService {
  private unsubscribeForeground: (() => void) | null = null;

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
        await setDoc(doc(db, 'fcm_tokens', userId), {
          token,
          userId,
          updatedAt: serverTimestamp(),
          platform: 'web',
        });
      }

      // Handle foreground messages (app is open and focused)
      this.unsubscribeForeground = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'Urban Drive';
        const body = payload.notification?.body ?? '';
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
