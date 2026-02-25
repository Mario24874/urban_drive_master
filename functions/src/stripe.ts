import * as admin from 'firebase-admin';
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

// ─── Stripe client (secret key from Cloud Functions secrets) ─────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20',
});

const APP_URL = process.env.APP_URL ?? 'https://urbandrive-1082b.web.app';

// ─── Firestore (initialized by index.ts or here lazily) ──────────────────────
function db() {
  return admin.firestore();
}

// ─── createCheckoutSession ────────────────────────────────────────────────────
/**
 * Callable function — frontend calls this to get a Stripe Checkout URL.
 * Input:  { priceId: string, userId: string, billing: 'monthly' | 'yearly' }
 * Output: { url: string }
 */
export const createCheckoutSession = onCall(
  { cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para suscribirte.');
    }

    const { priceId, billing } = request.data as {
      priceId: string;
      billing: string;
    };

    if (!priceId || !priceId.startsWith('price_')) {
      throw new HttpsError('invalid-argument', 'Price ID inválido.');
    }

    // Check if user already has a Stripe customer ID
    const subSnap = await db().collection('subscriptions').doc(uid).get();
    let stripeCustomerId: string | undefined = subSnap.data()?.stripeCustomerId;

    // Get user email for Stripe customer
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;

    // Create or reuse Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { firebaseUid: uid },
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { firebaseUid: uid, billing },
      },
      success_url: `${APP_URL}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?subscription=canceled`,
      client_reference_id: uid,
      allow_promotion_codes: true,
    });

    return { url: session.url };
  }
);

// ─── stripeWebhook ────────────────────────────────────────────────────────────
/**
 * HTTP endpoint called by Stripe when subscription events occur.
 * Configure the webhook in Stripe Dashboard → Developers → Webhooks.
 * Endpoint URL: https://<region>-urbandrive-1082b.cloudfunctions.net/stripeWebhook
 * Events to listen: checkout.session.completed, customer.subscription.updated,
 *                   customer.subscription.deleted
 */
export const stripeWebhook = onRequest(
  { cors: false },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(sub);
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(sub);
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err: any) {
      console.error('Error processing webhook event:', err);
      res.status(500).send('Internal error processing event');
      return;
    }

    res.json({ received: true });
  }
);

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const uid = session.client_reference_id;
  if (!uid) return;

  const stripeSubId = session.subscription as string;
  if (!stripeSubId) return;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  const priceId = stripeSub.items.data[0]?.price.id ?? '';
  const tier = tierFromPriceId(priceId);
  const billing = (stripeSub.metadata?.billing ?? 'monthly') as 'monthly' | 'yearly';

  await db()
    .collection('subscriptions')
    .doc(uid)
    .set(
      {
        userId: uid,
        tier,
        billing,
        status: stripeSub.status,
        stripeCustomerId: stripeSub.customer as string,
        stripeSubscriptionId: stripeSubId,
        stripePriceId: priceId,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(
          stripeSub.current_period_start * 1000
        ),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          stripeSub.current_period_end * 1000
        ),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log(`Subscription created/updated for user ${uid}: ${tier} (${billing})`);
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const uid = stripeSub.metadata?.firebaseUid;
  if (!uid) return;

  const priceId = stripeSub.items.data[0]?.price.id ?? '';
  const tier = tierFromPriceId(priceId);
  const billing = (stripeSub.metadata?.billing ?? 'monthly') as 'monthly' | 'yearly';

  await db()
    .collection('subscriptions')
    .doc(uid)
    .set(
      {
        tier,
        billing,
        status: stripeSub.status,
        stripePriceId: priceId,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(
          stripeSub.current_period_start * 1000
        ),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          stripeSub.current_period_end * 1000
        ),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const uid = stripeSub.metadata?.firebaseUid;
  if (!uid) return;

  await db().collection('subscriptions').doc(uid).set(
    {
      status: 'canceled',
      cancelAtPeriodEnd: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Price → Tier mapping ──────────────────────────────────────────────────────
// Keep in sync with src/features/enterprise/config/stripe.ts
const PRICE_TO_TIER: Record<string, 'bronce' | 'plata' | 'oro'> = {
  // Monthly
  'price_1T4npQB2WAG0h7ZP3FoSzeub': 'bronce',
  'price_1T4nsDB2WAG0h7ZPCmamsZGT': 'plata',
  'price_1T4ntQB2WAG0h7ZPXd5ipCOT': 'oro',
  // Yearly
  'price_1T4nx6B2WAG0h7ZPCe8k2700': 'bronce',
  'price_1T4nxvB2WAG0h7ZPKXwVlx5M': 'plata',
  'price_1T4nygB2WAG0h7ZPrHdrCcTb': 'oro',
};

function tierFromPriceId(priceId: string): 'bronce' | 'plata' | 'oro' {
  return PRICE_TO_TIER[priceId] ?? 'bronce';
}
