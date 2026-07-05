import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  arrayUnion, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../services/firebase';
import app from '../services/firebase';
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
        (snap) => {
          byEmail = snap.docs.map(toInvitation);
          notify();
        },
        (err) => console.error('[useInvitations] byEmail query error:', err),
      );
    }

    // Resolver toId de invitaciones enviadas a mi email/teléfono antes de
    // registrarme. Server-side (callable): las rules no permiten que el
    // cliente actualice una invitación cuyo toId aún no lo nombra — el
    // auto-resolve anterior desde el cliente fallaba siempre en silencio.
    httpsCallable(getFunctions(app), 'claimPendingInvitations')().catch((err) => {
      console.error('[useInvitations] claimPendingInvitations error:', err);
    });

    // All invitations sent by me
    const myCollName = userType === 'driver' ? 'drivers' : 'users';
    const unsubSent = onSnapshot(
      query(invRef, where('fromId', '==', userId)),
      async (snap) => {
        const sentInvs = snap.docs.map(toInvitation);
        setSent(sentInvs);

        // Default de visibilidad asimétrica: quien invita queda oculto para el
        // invitado hasta permitirlo con el toggle por contacto. Se aplica solo a
        // invitaciones 'pending' con destinatario resuelto y sin entrada previa en
        // contactVisibility, para no tocar relaciones ya aceptadas antes de esta regla.
        const pendingResolved = sentInvs.filter((inv) => inv.status === 'pending' && inv.toId);
        if (pendingResolved.length === 0) return;
        try {
          const mySnap = await getDoc(doc(db, myCollName, userId));
          const myVisibility: Record<string, boolean> = mySnap.data()?.contactVisibility || {};
          const updates: Record<string, boolean> = {};
          for (const inv of pendingResolved) {
            if (myVisibility[inv.toId!] === undefined) {
              updates[`contactVisibility.${inv.toId}`] = false;
            }
          }
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, myCollName, userId), updates);
          }
        } catch (err) {
          console.error('[useInvitations] visibility default error:', err);
        }
      },
      (err) => console.error('[useInvitations] sent query error:', err),
    );

    return () => { unsubById(); unsubByEmail(); unsubSent(); };
  }, [userId, userEmail, userType]);

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

  /**
   * Crea una invitación por enlace compartible (WhatsApp, redes, email…).
   * Devuelve la URL para compartir; el canje ocurre server-side en /invite/:id.
   */
  const createLinkInvitation = async (currentUser: any): Promise<string | null> => {
    if (!userId) return null;
    try {
      const ref = await addDoc(collection(db, 'invitations'), {
        fromId: userId,
        fromName: currentUser.displayName || currentUser.email || '',
        fromEmail: currentUser.email || '',
        fromPhone: currentUser.phone || '',
        fromType: userType || 'user',
        kind: 'link',
        toIdentifier: null,
        toId: null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return `${window.location.origin}/invite/${ref.id}`;
    } catch (err: any) {
      toast.error('Failed to create invite link', { description: err.message });
      return null;
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
    createLinkInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    deleteInvitation,
  };
}
