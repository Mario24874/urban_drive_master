import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Company } from '../types/company';

export interface UseCompanyResult {
  company: Company | null;
  loading: boolean;
  createCompany: (data: Partial<Company>) => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<void>;
  deleteCompany: () => Promise<void>;
}

/**
 * Real-time company listener for the current user.
 * Company document ID equals the owner's Firebase UID.
 */
export function useCompany(userId: string | null): UseCompanyResult {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'companies', userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCompany({
          ...data,
          id: snap.id,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as Company);
      } else {
        setCompany(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  const createCompany = async (data: Partial<Company>) => {
    if (!userId) throw new Error('No userId');
    await setDoc(doc(db, 'companies', userId), {
      ...data,
      ownerId: userId,
      adminIds: [userId],
      memberIds: [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateCompany = async (data: Partial<Company>) => {
    if (!userId) throw new Error('No userId');
    await updateDoc(doc(db, 'companies', userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteCompany = async () => {
    if (!userId) throw new Error('No userId');
    await deleteDoc(doc(db, 'companies', userId));
  };

  return { company, loading, createCompany, updateCompany, deleteCompany };
}
