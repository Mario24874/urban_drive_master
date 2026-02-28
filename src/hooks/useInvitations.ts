import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  arrayUnion, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'sonner';
import type { Invitation } from '../types';

function toInvitation(d: any): Invitation {
  return {
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate?.() ?? new Date(),
  } as Invitation;
}

export function useInvitations(
  userId: string | null,
  userType?: 'user' | 'driver',
  userEmail?: string,
) {
  const [received, setReceived] = useState<Invitation[]>([]);
  const [sent, setSent] = useState<Invitation[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const invRef = collection(db, 'invitations');

    // Merge helper: combine two invitation lists deduplicating by id
    const merge = (a: Invitation[], b: Invitation[]) => {
      const map = new Map<string, Invitation>();
      [...a, ...b].forEach((inv) => map.set(inv.id, inv));
      return Array.from(map.values());
    };

    let byId: Invitation[] = [];
    let byEmail: Invitation[] = [];

    const notify = () => setReceived(merge(byId, byEmail));

    // Query 1: invitations where toId matches my userId
    const unsubById = onSnapshot(
      query(invRef, where('toId', '==', userId), where('status', '==', 'pending')),
      (snap) => {
        byId = snap.docs.map(toInvitation);
        notify();
      },
      (err) => console.error('[useInvitations] byId query error:', err),
    );

    // Query 2: invitations sent to my email (toId may be null if I wasn't found at send time)
    const emailLower = userEmail?.trim().toLowerCase() ?? '';
    let unsubByEmail = () => {};
    if (emailLower) {
      unsubByEmail = onSnapshot(
        query(invRef, where('toIdentifier', '==', emailLower), where('status', '==', 'pending')),
        async (snap) => {
          byEmail = snap.docs.map(toInvitation);
          notify();

          // Auto-resolve: set toId on any invitation that was sent before we were found
          for (const d of snap.docs) {
            if (!d.data().toId) {
              await updateDoc(doc(db, 'invitations', d.id), { toId: userId }).catch(() => {});
            }
          }
        },
        (err) => console.error('[useInvitations] byEmail query error:', err),
      );
    }

    // All invitations sent by me
    const unsubSent = onSnapshot(
      query(invRef, where('fromId', '==', userId)),
      (snap) => setSent(snap.docs.map(toInvitation)),
      (err) => console.error('[useInvitations] sent query error:', err),
    );

    return () => { unsubById(); unsubByEmail(); unsubSent(); };
  }, [userId, userEmail]);

  const sendInvitation = async (currentUser: any, identifier: string) => {
    if (!userId || !identifier.trim()) return;

    const id = identifier.trim().toLowerCase();
    const isEmail = id.includes('@');

    setIsSending(true);
    try {
      // Search for the target user in both collections
      let foundUser: any = null;

      for (const coll of ['users', 'drivers'] as const) {
        const field = isEmail ? 'email' : 'phone';
        const snap = await getDocs(query(collection(db, coll), where(field, '==', id)));
        if (!snap.empty) {
          foundUser = { id: snap.docs[0].id, ...snap.docs[0].data() };
          break;
        }
      }

      if (foundUser?.id === userId) {
        toast.error('Cannot invite yourself');
        return;
      }

      // Check if already in contacts
      const myCollName = userType === 'driver' ? 'drivers' : 'users';
      const mySnap = await getDoc(doc(db, myCollName, userId));
      const myContacts: string[] = mySnap.data()?.contacts || [];

      if (foundUser && myContacts.includes(foundUser.id)) {
        toast.error('Already in contacts', { description: 'This person is already in your contact list.' });
        return;
      }

      // Prevent duplicate pending invitations (in-memory check — no composite index required)
      const alreadyPending = sent.some(
        (inv) => inv.toIdentifier === id && inv.status === 'pending',
      );
      if (alreadyPending) {
        toast.error('Invitation already pending', { description: 'Wait for the recipient to respond.' });
        return;
      }

      await addDoc(collection(db, 'invitations'), {
        fromId: userId,
        fromName: currentUser.displayName || currentUser.email || '',
        fromEmail: currentUser.email || '',
        fromPhone: currentUser.phone || '',
        fromType: userType || 'user',
        toIdentifier: id,
        toId: foundUser?.id || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success('Invitation sent!', {
        description: foundUser
          ? `Sent to ${foundUser.displayName || foundUser.email}`
          : `Sent to ${identifier} — they'll receive it when they register`,
      });
    } catch (err: any) {
      toast.error('Failed to send invitation', { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const acceptInvitation = async (invitation: Invitation, currentUserType: 'user' | 'driver') => {
    if (!userId) return;
    try {
      const myCollName = currentUserType === 'driver' ? 'drivers' : 'users';
      const theirCollName = invitation.fromType === 'driver' ? 'drivers' : 'users';

      await Promise.all([
        updateDoc(doc(db, myCollName, userId), { contacts: arrayUnion(invitation.fromId) }),
        updateDoc(doc(db, theirCollName, invitation.fromId), { contacts: arrayUnion(userId) }),
        updateDoc(doc(db, 'invitations', invitation.id), { status: 'accepted' }),
      ]);

      toast.success('Contact added!', {
        description: `${invitation.fromName || invitation.fromEmail} is now in your contacts`,
      });
    } catch (err: any) {
      toast.error('Failed to accept invitation', { description: err.message });
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), { status: 'rejected' });
      toast.info('Invitation declined');
    } catch (err: any) {
      toast.error('Failed to decline invitation', { description: err.message });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', invitationId));
      toast.info('Invitation cancelled');
    } catch (err: any) {
      toast.error('Failed to cancel invitation', { description: err.message });
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', invitationId));
      toast.info('Invitation deleted');
    } catch (err: any) {
      toast.error('Failed to delete invitation', { description: err.message });
    }
  };

  return {
    received,
    sent,
    isSending,
    pendingCount: received.length,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    deleteInvitation,
  };
}
