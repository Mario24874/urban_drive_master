import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

/** Resolve which collection ('users' | 'drivers') a uid lives in. */
async function findUserDoc(uid: string) {
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (userSnap.exists) return { ref: userRef, snap: userSnap };
  const driverRef = admin.firestore().doc(`drivers/${uid}`);
  const driverSnap = await driverRef.get();
  if (driverSnap.exists) return { ref: driverRef, snap: driverSnap };
  return null;
}

/**
 * Callable — redeem a shareable invitation link (kind: 'link') or any pending
 * invitation by ID. Runs with admin rights because Firestore rules do not let
 * a third party read/update an invitation that doesn't name them.
 *
 * Input:  { invitationId }
 * Output: { redeemed: true, fromName } | throws HttpsError
 */
export const redeemInvitation = onCall({ cors: true }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }

  const invitationId = String(request.data?.invitationId ?? '');
  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'invitationId is required');
  }

  const invRef = admin.firestore().doc(`invitations/${invitationId}`);

  return admin.firestore().runTransaction(async (tx) => {
    const invSnap = await tx.get(invRef);
    if (!invSnap.exists) {
      throw new HttpsError('not-found', 'invitation_not_found');
    }
    const inv = invSnap.data()!;

    if (inv.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'invitation_not_pending');
    }
    if (inv.fromId === uid) {
      throw new HttpsError('failed-precondition', 'cannot_redeem_own_invitation');
    }
    // Direct invitations addressed to someone else cannot be hijacked by link
    if (inv.toId && inv.toId !== uid) {
      throw new HttpsError('permission-denied', 'invitation_not_for_you');
    }

    const me = await findUserDoc(uid);
    const inviter = await findUserDoc(inv.fromId);
    if (!me || !inviter) {
      throw new HttpsError('not-found', 'user_not_found');
    }

    tx.update(me.ref, {
      contacts: admin.firestore.FieldValue.arrayUnion(inv.fromId),
    });
    // Mismo default que las invitaciones directas: el invitador queda oculto
    // para quien acepta hasta que lo permita con su toggle por contacto.
    const inviterVisibility = inviter.snap.data()?.contactVisibility || {};
    tx.update(inviter.ref, {
      contacts: admin.firestore.FieldValue.arrayUnion(uid),
      ...(inviterVisibility[uid] === undefined
        ? { [`contactVisibility.${uid}`]: false }
        : {}),
    });
    tx.update(invRef, { status: 'accepted', toId: uid });

    return { redeemed: true, fromName: inv.fromName || inv.fromEmail || '' };
  });
});

/**
 * Callable — claim pending invitations addressed to my email or phone before
 * I was registered (toId null). Runs with admin rights because the client
 * cannot update an invitation that doesn't name its uid yet.
 * Called once per session; after toId is set, the normal byId listener and
 * accept flow work under the existing rules.
 */
export const claimPendingInvitations = onCall({ cors: true }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }

  const identifiers: string[] = [];
  const email = request.auth?.token.email?.toLowerCase();
  if (email) identifiers.push(email);

  const me = await findUserDoc(uid);
  const phone: string | undefined = me?.snap.data()?.phone;
  if (phone) identifiers.push(String(phone).trim().toLowerCase());

  if (identifiers.length === 0) return { claimed: 0 };

  const snap = await admin.firestore()
    .collection('invitations')
    .where('toIdentifier', 'in', identifiers)
    .where('status', '==', 'pending')
    .get();

  const batch = admin.firestore().batch();
  let claimed = 0;
  snap.forEach((d) => {
    if (!d.data().toId) {
      batch.update(d.ref, { toId: uid });
      claimed++;
    }
  });
  if (claimed > 0) await batch.commit();
  return { claimed };
});

/**
 * Firestore trigger — push notification when an invitation is created for an
 * already-registered user (toId resolved at send time).
 */
export const onInvitationCreated = onDocumentCreated(
  'invitations/{invitationId}',
  async (event) => {
    const inv = event.data?.data();
    if (!inv?.toId || inv.status !== 'pending') return;

    const tokenDoc = await admin.firestore().doc(`fcm_tokens/${inv.toId}`).get();
    const fcmToken: string | undefined = tokenDoc.data()?.token;
    if (!fcmToken || tokenDoc.data()?.muted === true) return;

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: String(inv.fromName || 'Urban Drive'),
          body: '📩 Te invitó a conectar en Urban Drive',
        },
        data: {
          type: 'invitation',
          invitationId: event.params.invitationId,
          fromId: String(inv.fromId ?? ''),
        },
      });
    } catch (err) {
      console.error('[onInvitationCreated] push failed:', err);
    }
  },
);
