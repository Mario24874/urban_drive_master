import * as admin from 'firebase-admin';

// Initialize Firebase Admin (once, before importing other modules)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ── Stripe Cloud Functions ────────────────────────────────────────────────────
export { createCheckoutSession, stripeWebhook, createPortalSession } from './stripe';

// ── Notification Cloud Functions ──────────────────────────────────────────────
export { sendMessageNotification } from './notifications';
