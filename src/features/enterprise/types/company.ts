// Company-related types for the enterprise layer

export type TransportModality =
  | 'taxi' | 'rideshare' | 'shuttle' | 'charter' | 'rental'
  | 'passengers_intercity' | 'school_transport' | 'tourism'
  | 'medical_transport' | 'funeral'
  | 'delivery' | 'logistics' | 'cargo_general'
  | 'cargo_refrigerated' | 'cargo_hazmat' | 'cargo_animals'
  | 'cargo_valuables' | 'cargo_finished_goods' | 'cargo_heavy';

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CompanyContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface CompanyDocument {
  id: string;
  type: 'license' | 'insurance' | 'permit' | 'tax' | 'other';
  name: string;
  url: string;
  expiresAt?: Date;
  verified: boolean;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  address?: CompanyAddress;
  contact?: CompanyContact;
  documents?: CompanyDocument[];
  modalities: TransportModality[];
  logoURL?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyDriver {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseCategory?: string;  // A1, B1, C1, C2, C3, etc.
  assignedVehicleId?: string;
  isActive: boolean;
  createdAt: Date;
}
