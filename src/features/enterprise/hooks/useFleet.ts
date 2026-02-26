import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Vehicle } from '../types/vehicle';

export interface UseFleetResult {
  vehicles: Vehicle[];
  loading: boolean;
  addVehicle: (data: Omit<Vehicle, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
}

/**
 * Real-time fleet listener for a given company.
 */
export function useFleet(companyId: string | null): UseFleetResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'vehicles'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, (snap) => {
      setVehicles(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          } as Vehicle;
        }),
      );
      setLoading(false);
    });

    return unsub;
  }, [companyId]);

  const addVehicle = async (
    data: Omit<Vehicle, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!companyId) throw new Error('No companyId');
    await addDoc(collection(db, 'vehicles'), {
      ...data,
      companyId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    await updateDoc(doc(db, 'vehicles', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const removeVehicle = async (id: string) => {
    await deleteDoc(doc(db, 'vehicles', id));
  };

  return { vehicles, loading, addVehicle, updateVehicle, removeVehicle };
}
