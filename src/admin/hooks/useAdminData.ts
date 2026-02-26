import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string;
  userType: 'user' | 'driver';
  tier?: string;
  createdAt?: Date;
  photoURL?: string;
}

export interface AdminCompanyRow {
  id: string;
  companyName: string;
  taxId?: string;
  tier?: string;
  ownerId?: string;
  vehicleCount: number;
  driverCount: number;
  createdAt?: Date;
  modalities?: string[];
}

export interface AdminSubscriptionRow {
  id: string;
  ownerName: string;
  ownerId: string;
  tier: string;
  billing: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  createdAt?: Date;
}

export interface AdminVehicleRow {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  year?: number;
  companyId?: string;
  category?: string;
  currentMileageKm?: number;
  isActive?: boolean;
}

export interface AdminMaintenanceRow {
  id: string;
  vehicleId: string;
  companyId?: string;
  type: string;
  date?: Date;
  mileageAtService?: number;
  nextServiceKm?: number;
  nextServiceDate?: Date;
}

export interface AdminDocumentRow {
  id: string;
  companyId: string;
  entityType: string;
  entityId: string;
  docType: string;
  name: string;
  expiryDate?: Date;
  isVerified?: boolean;
}

interface AdminData {
  users: AdminUserRow[];
  companies: AdminCompanyRow[];
  subscriptions: AdminSubscriptionRow[];
  vehicles: AdminVehicleRow[];
  maintenanceRecords: AdminMaintenanceRow[];
  documents: AdminDocumentRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function toDate(val: unknown): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && 'toDate' in (val as object)) {
    return (val as { toDate: () => Date }).toDate();
  }
  return undefined;
}

export function useAdminData(): AdminData {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicleRow[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AdminMaintenanceRow[]>([]);
  const [documents, setDocuments] = useState<AdminDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const [
          usersSnap, driversSnap,
          companiesSnap, subsSnap,
          vehiclesSnap, maintenanceSnap, docsSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))).catch(() => null),
          getDocs(query(collection(db, 'drivers'), orderBy('createdAt', 'desc'))).catch(() => null),
          getDocs(collection(db, 'companies')).catch(() => null),
          getDocs(collection(db, 'subscriptions')).catch(() => null),
          getDocs(collection(db, 'vehicles')).catch(() => null),
          getDocs(collection(db, 'vehicle_maintenance')).catch(() => null),
          getDocs(collection(db, 'company_documents')).catch(() => null),
        ]);

        if (cancelled) return;

        // Users
        const userRows: AdminUserRow[] = [];
        usersSnap?.forEach((d) => {
          const data = d.data();
          userRows.push({
            id: d.id,
            displayName: data.displayName ?? '',
            email: data.email ?? '',
            userType: 'user',
            tier: data.tier,
            createdAt: toDate(data.createdAt),
            photoURL: data.photoURL,
          });
        });
        driversSnap?.forEach((d) => {
          const data = d.data();
          userRows.push({
            id: d.id,
            displayName: data.displayName ?? '',
            email: data.email ?? '',
            userType: 'driver',
            tier: data.tier,
            createdAt: toDate(data.createdAt),
            photoURL: data.photoURL,
          });
        });
        setUsers(userRows);

        // Companies — need vehicle/driver counts
        const vehiclesByCompany: Record<string, number> = {};
        const driversByCompany: Record<string, number> = {};
        vehiclesSnap?.forEach((d) => {
          const cid = d.data().companyId;
          if (cid) vehiclesByCompany[cid] = (vehiclesByCompany[cid] ?? 0) + 1;
        });

        const companyRows: AdminCompanyRow[] = [];
        companiesSnap?.forEach((d) => {
          const data = d.data();
          companyRows.push({
            id: d.id,
            companyName: data.companyName ?? data.legalName ?? '',
            taxId: data.taxId,
            tier: data.tier,
            ownerId: data.ownerId,
            vehicleCount: vehiclesByCompany[d.id] ?? 0,
            driverCount: driversByCompany[d.id] ?? 0,
            createdAt: toDate(data.createdAt),
            modalities: data.modalities ?? [],
          });
        });
        setCompanies(companyRows);

        // Subscriptions
        const subRows: AdminSubscriptionRow[] = [];
        subsSnap?.forEach((d) => {
          const data = d.data();
          subRows.push({
            id: d.id,
            ownerName: data.ownerName ?? '',
            ownerId: data.ownerId ?? '',
            tier: data.tier ?? 'free',
            billing: data.billing ?? 'monthly',
            status: data.status ?? 'active',
            currentPeriodStart: toDate(data.currentPeriodStart),
            currentPeriodEnd: toDate(data.currentPeriodEnd),
            createdAt: toDate(data.createdAt),
          });
        });
        setSubscriptions(subRows);

        // Vehicles
        const vehicleRows: AdminVehicleRow[] = [];
        vehiclesSnap?.forEach((d) => {
          const data = d.data();
          vehicleRows.push({
            id: d.id,
            plate: data.plate ?? '',
            make: data.make,
            model: data.model,
            year: data.year,
            companyId: data.companyId,
            category: data.category,
            currentMileageKm: data.currentMileageKm,
            isActive: data.isActive ?? true,
          });
        });
        setVehicles(vehicleRows);

        // Maintenance
        const maintRows: AdminMaintenanceRow[] = [];
        maintenanceSnap?.forEach((d) => {
          const data = d.data();
          maintRows.push({
            id: d.id,
            vehicleId: data.vehicleId ?? '',
            companyId: data.companyId,
            type: data.type ?? '',
            date: toDate(data.date),
            mileageAtService: data.mileageAtService,
            nextServiceKm: data.nextServiceKm,
            nextServiceDate: toDate(data.nextServiceDate),
          });
        });
        setMaintenanceRecords(maintRows);

        // Documents
        const docRows: AdminDocumentRow[] = [];
        docsSnap?.forEach((d) => {
          const data = d.data();
          docRows.push({
            id: d.id,
            companyId: data.companyId ?? '',
            entityType: data.entityType ?? '',
            entityId: data.entityId ?? '',
            docType: data.docType ?? '',
            name: data.name ?? data.docType ?? '',
            expiryDate: toDate(data.expiryDate),
            isVerified: data.isVerified ?? false,
          });
        });
        setDocuments(docRows);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  return {
    users,
    companies,
    subscriptions,
    vehicles,
    maintenanceRecords,
    documents,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
