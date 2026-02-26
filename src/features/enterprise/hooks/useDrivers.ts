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
import type { CompanyDriver } from '../types/company';

export interface UseDriversResult {
  drivers: CompanyDriver[];
  loading: boolean;
  addDriver: (data: Omit<CompanyDriver, 'id' | 'companyId' | 'createdAt'>) => Promise<void>;
  updateDriver: (id: string, data: Partial<CompanyDriver>) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  assignVehicle: (driverId: string, vehicleId: string | null) => Promise<void>;
}

/**
 * Real-time drivers listener for a given company.
 */
export function useDrivers(companyId: string | null): UseDriversResult {
  const [drivers, setDrivers] = useState<CompanyDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'company_drivers'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, (snap) => {
      setDrivers(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as CompanyDriver;
        }),
      );
      setLoading(false);
    });

    return unsub;
  }, [companyId]);

  const addDriver = async (
    data: Omit<CompanyDriver, 'id' | 'companyId' | 'createdAt'>,
  ) => {
    if (!companyId) throw new Error('No companyId');
    await addDoc(collection(db, 'company_drivers'), {
      ...data,
      companyId,
      createdAt: serverTimestamp(),
    });
  };

  const updateDriver = async (id: string, data: Partial<CompanyDriver>) => {
    await updateDoc(doc(db, 'company_drivers', id), { ...data });
  };

  const removeDriver = async (id: string) => {
    await deleteDoc(doc(db, 'company_drivers', id));
  };

  const assignVehicle = async (driverId: string, vehicleId: string | null) => {
    const driverRef = doc(db, 'company_drivers', driverId);
    if (vehicleId) {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await Promise.all([
        updateDoc(driverRef, { assignedVehicleId: vehicleId }),
        updateDoc(vehicleRef, { driverId, updatedAt: serverTimestamp() }),
      ]);
    } else {
      // Find current vehicle and clear driverId
      const currentDriver = drivers.find((d) => d.id === driverId);
      const ops: Promise<void>[] = [
        updateDoc(driverRef, { assignedVehicleId: null }),
      ];
      if (currentDriver?.assignedVehicleId) {
        ops.push(
          updateDoc(doc(db, 'vehicles', currentDriver.assignedVehicleId), {
            driverId: null,
            updatedAt: serverTimestamp(),
          }),
        );
      }
      await Promise.all(ops);
    }
  };

  return { drivers, loading, addDriver, updateDriver, removeDriver, assignVehicle };
}
