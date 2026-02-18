import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'sonner';
import type { Contact } from '../types';

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

export function useContacts(
  userId: string | null,
  userType?: 'user' | 'driver'
): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setContacts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query contacts based on user type
      // If user is a 'driver', show other drivers and users
      // If user is a 'user', show drivers
      const collectionName = userType === 'driver' ? 'users' : 'drivers';
      const contactsRef = collection(db, collectionName);

      // Get all drivers/users (can add filtering later)
      const q = query(contactsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const contactsList: Contact[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();

            // Don't include the current user in contacts
            if (doc.id !== userId) {
              contactsList.push({
                id: doc.id,
                displayName: data.displayName || data.email || 'Unknown',
                email: data.email || '',
                phone: data.phone || '',
                userType: data.userType || 'user',
                isVisible: data.isVisible !== undefined ? data.isVisible : true,
                location: data.location || null,
                bio: data.bio || '',
              });
            }
          });

          setContacts(contactsList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching contacts:', err);
          setError(err.message);
          toast.error('Failed to load contacts', {
            description: err.message,
          });
          setLoading(false);
        }
      );

      // Cleanup subscription
      return () => unsubscribe();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to setup contacts listener';
      setError(errorMsg);
      toast.error('Contacts error', { description: errorMsg });
      setLoading(false);
    }
  }, [userId, userType]);

  return {
    contacts,
    loading,
    error,
  };
}
