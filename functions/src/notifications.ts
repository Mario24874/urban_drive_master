import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const APP_URL = process.env.APP_URL ?? 'https://urbandrive-1082b.web.app';

/**
 * Callable function — the client calls this immediately after sending a message
 * to deliver an FCM push notification to the recipient.
 *
 * Input: { receiverId, senderId, senderName, content, messageType }
 */
export const sendMessageNotification = onCall(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Must be signed in');
    }

    const { receiverId, senderId, senderName, content, messageType } =
      request.data as {
        receiverId: string;
        senderId: string;
        senderName: string;
        content: string;
        messageType?: string;
      };

    if (!receiverId || !senderId) {
      throw new HttpsError('invalid-argument', 'receiverId and senderId are required');
    }

    // Only the sender may trigger this
    if (uid !== senderId) {
      throw new HttpsError('permission-denied', 'Cannot send notifications on behalf of others');
    }

    // Fetch recipient's FCM token
    const tokenDoc = await admin.firestore().doc(`fcm_tokens/${receiverId}`).get();
    if (!tokenDoc.exists) return { sent: false, reason: 'no_token' };

    const fcmToken: string | undefined = tokenDoc.data()?.token;
    if (!fcmToken) return { sent: false, reason: 'empty_token' };

    const body: string =
      messageType === 'voice'
        ? '🎤 Voice message'
        : String(content ?? '').slice(0, 200);

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: String(senderName ?? 'Urban Drive'),
          body,
        },
        data: {
          contactId: String(senderId),
          senderName: String(senderName ?? ''),
        },
        webpush: {
          notification: {
            icon: `${APP_URL}/assets/UrbanDrive.png`,
            badge: `${APP_URL}/assets/UrbanDrive.png`,
            tag: `msg-${senderId}`,
            renotify: true,
          },
          fcmOptions: {
            link: `${APP_URL}/?chat=${senderId}`,
          },
        },
      });

      return { sent: true };
    } catch (err: any) {
      // Token no longer valid — remove it so we don't retry
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        await admin.firestore().doc(`fcm_tokens/${receiverId}`).delete().catch(() => {});
        return { sent: false, reason: 'invalid_token' };
      }
      console.error('[FCM] send error:', err.code ?? err.message);
      return { sent: false, reason: err.code };
    }
  }
);
