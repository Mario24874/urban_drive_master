// Company-related types for the enterprise layer

export type TransportModality =
  | 'taxi'
  | 'rideshare'
  | 'delivery'
  | 'logistics'
  | 'shuttle'
  | 'charter'
  | 'rental';

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
