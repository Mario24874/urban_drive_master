import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import type { AdminUser } from '../types';

type AdminAuthState = {
  firebaseUser: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
};

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    firebaseUser: null,
    adminUser: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ firebaseUser: null, adminUser: null, loading: false, isAdmin: false });
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          const adminUser: AdminUser = {
            uid: firebaseUser.uid,
            email: data.email ?? firebaseUser.email ?? '',
            role: data.role ?? 'admin',
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          };
          setState({ firebaseUser, adminUser, loading: false, isAdmin: true });
        } else {
          setState({ firebaseUser, adminUser: null, loading: false, isAdmin: false });
        }
      } catch {
        setState({ firebaseUser, adminUser: null, loading: false, isAdmin: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}
