import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { MaintenanceRecord } from '../types/maintenance';

export interface UseMaintenanceResult {
  records: MaintenanceRecord[];
  loading: boolean;
  addRecord: (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateRecord: (id: string, data: Partial<MaintenanceRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

function mapDoc(d: any): MaintenanceRecord {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    date: data.date?.toDate?.() ?? new Date(),
    nextServiceDate: data.nextServiceDate?.toDate?.() ?? undefined,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as MaintenanceRecord;
}

/** Records for a single vehicle — used by MaintenanceLog. */
export function useMaintenanceByVehicle(vehicleId: string | null): UseMaintenanceResult {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'vehicle_maintenance'),
      where('vehicleId', '==', vehicleId),
      orderBy('date', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(mapDoc));
      setLoading(false);
    });

    return unsub;
  }, [vehicleId]);

  return { records, loading, ...crudOps() };
}

/** All records for a company — used by MaintenanceScheduler. */
export function useMaintenanceByCompany(companyId: string | null): UseMaintenanceResult {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'vehicle_maintenance'),
      where('companyId', '==', companyId),
      orderBy('date', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(mapDoc));
      setLoading(false);
    });

    return unsub;
  }, [companyId]);

  return { records, loading, ...crudOps() };
}

function crudOps() {
  const addRecord = async (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'vehicle_maintenance'), {
      ...data,
      date: data.date,
      nextServiceDate: data.nextServiceDate ?? null,
      createdAt: serverTimestamp(),
    });
  };

  const updateRecord = async (id: string, data: Partial<MaintenanceRecord>) => {
    await updateDoc(doc(db, 'vehicle_maintenance', id), { ...data });
  };

  const deleteRecord = async (id: string) => {
    await deleteDoc(doc(db, 'vehicle_maintenance', id));
  };

  return { addRecord, updateRecord, deleteRecord };
}
