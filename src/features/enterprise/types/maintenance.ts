// Maintenance-related types for the enterprise layer

export type MaintenanceType =
  | 'oil_change'
  | 'brakes'
  | 'tires'
  | 'timing_belt'
  | 'filters'
  | 'battery'
  | 'suspension'
  | 'transmission'
  | 'alignment'
  | 'ac_service'
  | 'lights'
  | 'general_inspection';

export type MaintenanceStatus = 'ok' | 'warning' | 'overdue';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  companyId: string;
  type: MaintenanceType;
  date: Date;
  mileageAtService: number;
  nextServiceKm?: number;    // absolute km at which next service is due
  nextServiceDate?: Date;    // date by which next service is due
  workshopName?: string;
  technician?: string;
  cost?: number;
  costCurrency?: string;
  notes?: string;
  createdAt: Date;
}

export interface MaintenanceAlert {
  record: MaintenanceRecord;
  vehiclePlate: string;
  status: MaintenanceStatus;
  daysRemaining?: number;    // negative = overdue
  kmRemaining?: number;      // negative = overdue
}

/**
 * Calculate the worst-case status for a record given current mileage and date.
 * Warning threshold: ≤ 30 days or ≤ 500 km remaining.
 */
export function getMaintenanceStatus(
  record: MaintenanceRecord,
  currentMileageKm: number,
): { status: MaintenanceStatus; daysRemaining?: number; kmRemaining?: number } {
  let status: MaintenanceStatus = 'ok';
  let daysRemaining: number | undefined;
  let kmRemaining: number | undefined;

  const now = new Date();

  if (record.nextServiceDate) {
    const ms = record.nextServiceDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      status = 'overdue';
    } else if (daysRemaining <= 30) {
      status = 'warning';
    }
  }

  if (record.nextServiceKm !== undefined) {
    kmRemaining = record.nextServiceKm - currentMileageKm;
    if (kmRemaining < 0) {
      status = 'overdue';
    } else if (kmRemaining <= 500 && status === 'ok') {
      status = 'warning';
    }
  }

  return { status, daysRemaining, kmRemaining };
}
