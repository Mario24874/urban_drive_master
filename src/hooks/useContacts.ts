import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, arrayRemove, getDocs, documentId,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'sonner';
import type { Contact } from '../types';

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  contactIds: string[];
  contactVisibility: Record<string, boolean>;
  removeContact: (contactId: string, contactType: 'user' | 'driver') => Promise<void>;
  toggleContactVisibility: (contactId: string, visible: boolean) => Promise<void>;
}

export function useContacts(
  userId: string | null,
  userType?: 'user' | 'driver',
): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [contactVisibility, setContactVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: listen to user's own doc to track contacts[] changes
  useEffect(() => {
    if (!userId) {
      setContacts([]);
      setContactIds([]);
      return;
    }

    const collName = userType === 'driver' ? 'drivers' : 'users';
    const unsub = onSnapshot(
      doc(db, collName, userId),
      (snap) => {
        if (snap.exists()) {
          setContactIds(snap.data().contacts || []);
          setContactVisibility(snap.data().contactVisibility || {});
        }
      },
      (err) => setError(err.message),
    );

    return () => unsub();
  }, [userId, userType]);

  // Step 2: fetch contact data whenever the list of IDs changes
  useEffect(() => {
    if (contactIds.length === 0) {
      setContacts([]);
      return;
    }

    setLoading(true);

    const fetchAll = async () => {
      try {
        const result: Contact[] = [];

        // Firestore 'in' limit is 30 items per query
        for (let i = 0; i < contactIds.length; i += 30) {
          const chunk = contactIds.slice(i, i + 30);

          for (const collName of ['users', 'drivers'] as const) {
            const snap = await getDocs(
              query(collection(db, collName), where(documentId(), 'in', chunk)),
            );
            snap.forEach((d) => {
              if (!result.find((c) => c.id === d.id)) {
                const data = d.data();
                result.push({
                  id: d.id,
                  displayName: data.displayName || data.email || 'Unknown',
                  email: data.email || '',
                  phone: data.phone || '',
                  userType: data.userType || (collName === 'drivers' ? 'driver' : 'user'),
                  isVisible: data.isVisible ?? true,
                  location: data.location || null,
                  bio: data.bio || '',
                  photoURL: data.photoURL || '',
                });
              }
            });
          }
        }

        setContacts(result);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [contactIds]);

  const removeContact = async (contactId: string, contactType: 'user' | 'driver') => {
    if (!userId) return;
    try {
      const myCollName = userType === 'driver' ? 'drivers' : 'users';
      const theirCollName = contactType === 'driver' ? 'drivers' : 'users';

      await Promise.all([
        updateDoc(doc(db, myCollName, userId), { contacts: arrayRemove(contactId) }),
        updateDoc(doc(db, theirCollName, contactId), { contacts: arrayRemove(userId) }),
      ]);

      toast.success('Contact removed');
    } catch (err: any) {
      toast.error('Failed to remove contact', { description: err.message });
    }
  };

  const toggleContactVisibility = async (contactId: string, visible: boolean) => {
    if (!userId) return;
    try {
      const collName = userType === 'driver' ? 'drivers' : 'users';
      await updateDoc(doc(db, collName, userId), {
        [`contactVisibility.${contactId}`]: visible,
      });
      toast.success(visible ? 'Contact can now see your location' : 'Contact hidden from your location');
    } catch (err: any) {
      toast.error('Failed to update visibility', { description: err.message });
    }
  };

  return { contacts, loading, error, contactIds, contactVisibility, removeContact, toggleContactVisibility };
}
