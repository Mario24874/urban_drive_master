/**
 * Vehicle types for Urban Drive Enterprise
 *
 * Each vehicle belongs to a company and can be assigned to one driver at a time.
 * Specializations align with the company's transport modalities.
 */

import type { TransportModality } from './company';

// ─── Vehicle classification ────────────────────────────────────────────────

export type VehicleCategory =
  // Land cargo
  | 'motorcycle'
  | 'van'
  | 'pickup'
  | 'box_truck'
  | 'semi_truck'
  | 'flatbed'
  | 'tanker'
  | 'refrigerated'
  | 'livestock_carrier'
  // Land passenger
  | 'sedan'
  | 'suv'
  | 'minivan'
  | 'bus'
  | 'minibus'
  // Air (coordination only)
  | 'light_aircraft'
  | 'helicopter'
  // Water
  | 'speedboat'
  | 'ferry'
  | 'water_taxi';

export type FuelType =
  | 'gasoline'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'natural_gas'
  | 'lpg';

// ─── Specialization flags per modality ────────────────────────────────────

export interface CargoSpecialization {
  hazmat: boolean;           // Certified for dangerous goods / chemical
  refrigerated: boolean;     // Cold chain capable
  livestockRamp: boolean;    // Loading ramp for animals
  gpsTemperature: boolean;   // Temperature sensor logging
  maxWeightKg: number;
  maxVolumeM3?: number;
}

export interface CourierSpecialization {
  maxPackageWeightKg: number;
  maxPackageDimsCm: { l: number; w: number; h: number };
  signatureRequired: boolean;
  cashOnDelivery: boolean;
}

export interface PassengerSpecialization {
  wheelchairAccessible: boolean;
  maxPassengers: number;
  childSeat: boolean;
  airConditioning: boolean;
  airportTransfer: boolean;
}

// ─── Documents & compliance ───────────────────────────────────────────────

export interface VehicleDocument {
  type:
    | 'registration'
    | 'insurance'
    | 'inspection'
    | 'hazmat_permit'
    | 'livestock_permit'
    | 'route_permit';
  number: string;
  issuedAt: Date;
  expiresAt: Date;
  isValid: boolean;         // computed: expiresAt > now
}

// ─── Vehicle document (Firestore: vehicles/{vehicleId}) ──────────────────

export interface VehicleLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  companyId: string;
  assignedDriverUid?: string;  // Currently assigned driver (nullable)

  // Identity
  plate: string;               // License plate
  vin?: string;                // Vehicle Identification Number
  make: string;                // e.g. "Toyota"
  model: string;               // e.g. "Hilux"
  year: number;
  color: string;
  category: VehicleCategory;
  fuel: FuelType;

  // Modality support
  modalities: TransportModality[];  // what this vehicle is cleared for
  cargoSpec?: CargoSpecialization;
  courierSpec?: CourierSpecialization;
  passengerSpec?: PassengerSpecialization;

  // Compliance
  documents: VehicleDocument[];

  // Real-time
  location?: VehicleLocation;
  isActive: boolean;    // in service
  isAvailable: boolean; // not currently on a trip

  // Metadata
  notes?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Fleet summary (computed, not stored) ─────────────────────────────────

export interface FleetSummary {
  total: number;
  active: number;
  available: number;
  byCategory: Partial<Record<VehicleCategory, number>>;
  docsExpiringSoon: number;  // docs expiring within 30 days
}
