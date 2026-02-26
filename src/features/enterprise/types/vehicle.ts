// Vehicle-related types for the enterprise layer

export type VehicleCategory =
  | 'sedan'
  | 'suv'
  | 'van'
  | 'truck'
  | 'motorcycle'
  | 'bicycle'
  | 'bus'
  | 'minibus'
  | 'other';

export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'cng';

export type TransmissionType = 'manual' | 'automatic' | 'cvt';

export interface VehicleSpecialization {
  accessible: boolean;      // wheelchair accessible
  refrigerated: boolean;    // refrigerated cargo
  refrigerationTempMin?: number;
  refrigerationTempMax?: number;
  heavyCargo: boolean;      // heavy cargo rated
  petFriendly: boolean;
  luxuryClass: boolean;
  hazmatCertified: boolean;
  hazmatClasses?: string[];     // UN classes 1-9
  livestockCapacity?: number;
  armoredVehicle: boolean;
  medicalEquipped: boolean;
}

export interface Vehicle {
  id: string;
  companyId: string;
  driverId?: string;        // currently assigned driver
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: TransmissionType;
  passengerCapacity: number;
  cargoCapacityKg?: number;
  mileageKm: number;
  insuranceExpiry?: Date;
  technicalInspectionExpiry?: Date;
  specializations: VehicleSpecialization;
  photoURL?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FleetSummary {
  totalVehicles: number;
  activeVehicles: number;
  assignedVehicles: number;
  byCategory: Record<VehicleCategory, number>;
}
