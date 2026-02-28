import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

const APP_URL = process.env.APP_URL ?? 'https://urbandrive-1082b.web.app';

/**
 * Firestore trigger: fires when a new message is created.
 * Sends an FCM push notification to the recipient's device(s).
 */
export const sendMessageNotification = onDocumentCreated(
  'messages/{messageId}',
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const { receiverId, senderId, senderName, content, messageType } = message;
    if (!receiverId || !senderId) return;

    // Fetch recipient's FCM token
    const tokenDoc = await admin.firestore().doc(`fcm_tokens/${receiverId}`).get();
    if (!tokenDoc.exists) return;

    const fcmToken: string | undefined = tokenDoc.data()?.token;
    if (!fcmToken) return;

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
    } catch (err: any) {
      // Token no longer valid — clean it up so we don't retry
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        await admin.firestore().doc(`fcm_tokens/${receiverId}`).delete().catch(() => {});
      }
      console.error('[FCM] send error:', err.code ?? err.message);
    }
  }
);
