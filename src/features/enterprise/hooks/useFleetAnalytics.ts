import { useMemo } from 'react';
import { useFleet } from './useFleet';
import { useDrivers } from './useDrivers';
import { useMaintenanceByCompany } from './useMaintenance';
import { useDocumentsByCompany } from './useDocuments';
import { getMaintenanceStatus } from '../types/maintenance';
import { getDocumentStatus } from '../types/documents';
import type { MaintenanceType } from '../types/maintenance';
import type { DocumentEntityType } from '../types/documents';

export interface FleetKPIs {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  assignedDrivers: number;
  utilizationPct: number;
}

export interface MaintenanceStats {
  totalCost: number;
  currency: string;
  okCount: number;
  warningCount: number;
  overdueCount: number;
  costByType: { type: MaintenanceType; label: string; total: number }[];
  monthlyTrend: { month: string; cost: number }[];
}

export interface DocumentStats {
  totalDocs: number;
  validCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  compliancePct: number;
  byEntityType: {
    entityType: DocumentEntityType;
    valid: number;
    expiring: number;
    expired: number;
    noExpiry: number;
  }[];
}

export interface FleetComposition {
  byCategory: { category: string; count: number }[];
  avgMileageKm: number;
  mileageByVehicle: { plate: string; mileageKm: number }[];
}

export interface UseFleetAnalyticsResult {
  loading: boolean;
  kpis: FleetKPIs;
  maintenanceStats: MaintenanceStats;
  documentStats: DocumentStats;
  fleetComposition: FleetComposition;
}

const MAINTENANCE_LABELS: Record<string, string> = {
  oil_change: 'Aceite',
  brakes: 'Frenos',
  tires: 'Llantas',
  timing_belt: 'Correa dist.',
  filters: 'Filtros',
  battery: 'Batería',
  suspension: 'Suspensión',
  transmission: 'Transmisión',
  alignment: 'Alineación',
  ac_service: 'A/C',
  lights: 'Luces',
  general_inspection: 'Rev. general',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function useFleetAnalytics(companyId: string | null): UseFleetAnalyticsResult {
  const { vehicles, loading: loadingVehicles } = useFleet(companyId);
  const { drivers, loading: loadingDrivers } = useDrivers(companyId);
  const { records, loading: loadingRecords } = useMaintenanceByCompany(companyId);
  const { documents, loading: loadingDocs } = useDocumentsByCompany(companyId);

  const loading = loadingVehicles || loadingDrivers || loadingRecords || loadingDocs;

  const kpis = useMemo<FleetKPIs>(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.isActive).length;
    const totalDrivers = drivers.length;
    const assignedDrivers = drivers.filter((d) => d.assignedVehicleId).length;
    const utilizationPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
    return { totalVehicles, activeVehicles, totalDrivers, assignedDrivers, utilizationPct };
  }, [vehicles, drivers]);

  const maintenanceStats = useMemo<MaintenanceStats>(() => {
    const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);
    const currency = records.find((r) => r.costCurrency)?.costCurrency ?? 'USD';

    // Build latest record per (vehicleId, type) for status counts
    const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
    const latestMap = new Map<string, (typeof records)[0]>();
    for (const r of records) {
      const key = `${r.vehicleId}::${r.type}`;
      const existing = latestMap.get(key);
      if (!existing || r.date > existing.date) latestMap.set(key, r);
    }

    let okCount = 0;
    let warningCount = 0;
    let overdueCount = 0;
    for (const [, record] of latestMap) {
      if (!record.nextServiceDate && record.nextServiceKm === undefined) continue;
      const vehicle = vehicleMap.get(record.vehicleId);
      if (!vehicle) continue;
      const { status } = getMaintenanceStatus(record, vehicle.mileageKm ?? 0);
      if (status === 'ok') okCount++;
      else if (status === 'warning') warningCount++;
      else overdueCount++;
    }

    // Cost by type, top 6
    const typeMap = new Map<string, number>();
    for (const r of records) {
      if (!r.cost) continue;
      typeMap.set(r.type, (typeMap.get(r.type) ?? 0) + r.cost);
    }
    const costByType = Array.from(typeMap.entries())
      .map(([type, total]) => ({
        type: type as MaintenanceType,
        label: MAINTENANCE_LABELS[type] ?? type,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Monthly trend: last 6 months
    const now = new Date();
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      const cost = records
        .filter((r) => r.date.getMonth() === targetMonth && r.date.getFullYear() === targetYear)
        .reduce((sum, r) => sum + (r.cost ?? 0), 0);
      return { month: MONTH_LABELS[targetMonth], cost };
    });

    return { totalCost, currency, okCount, warningCount, overdueCount, costByType, monthlyTrend };
  }, [records, vehicles]);

  const documentStats = useMemo<DocumentStats>(() => {
    const totalDocs = documents.length;
    let validCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let noExpiryCount = 0;

    const entityMap = new Map<
      DocumentEntityType,
      { valid: number; expiring: number; expired: number; noExpiry: number }
    >();

    for (const doc of documents) {
      const { status } = getDocumentStatus(doc);
      if (status === 'valid') validCount++;
      else if (status === 'expiring_soon') expiringSoonCount++;
      else if (status === 'expired') expiredCount++;
      else noExpiryCount++;

      const entry = entityMap.get(doc.entityType) ?? { valid: 0, expiring: 0, expired: 0, noExpiry: 0 };
      if (status === 'valid') entry.valid++;
      else if (status === 'expiring_soon') entry.expiring++;
      else if (status === 'expired') entry.expired++;
      else entry.noExpiry++;
      entityMap.set(doc.entityType, entry);
    }

    const compliancePct =
      totalDocs > 0 ? Math.round(((validCount + noExpiryCount) / totalDocs) * 100) : 100;

    const byEntityType = (['company', 'vehicle', 'driver'] as DocumentEntityType[]).map(
      (entityType) => ({
        entityType,
        ...(entityMap.get(entityType) ?? { valid: 0, expiring: 0, expired: 0, noExpiry: 0 }),
      }),
    );

    return { totalDocs, validCount, expiringSoonCount, expiredCount, compliancePct, byEntityType };
  }, [documents]);

  const fleetComposition = useMemo<FleetComposition>(() => {
    const categoryMap = new Map<string, number>();
    for (const v of vehicles) {
      categoryMap.set(v.category, (categoryMap.get(v.category) ?? 0) + 1);
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileageKm ?? 0), 0);
    const avgMileageKm = vehicles.length > 0 ? Math.round(totalMileage / vehicles.length) : 0;

    const mileageByVehicle = [...vehicles]
      .sort((a, b) => (b.mileageKm ?? 0) - (a.mileageKm ?? 0))
      .slice(0, 10)
      .map((v) => ({ plate: v.plate, mileageKm: v.mileageKm ?? 0 }));

    return { byCategory, avgMileageKm, mileageByVehicle };
  }, [vehicles]);

  return { loading, kpis, maintenanceStats, documentStats, fleetComposition };
}
