/**
 * Company types for Urban Drive Enterprise
 *
 * A "company" is any organization that uses Urban Drive to manage a fleet
 * of drivers/vehicles. Three main categories are supported:
 *   - cargo      (industrial/heavy goods transport)
 *   - courier    (parcel / last-mile delivery)
 *   - passenger  (land, air, water mobility)
 */

// ─── Transport modalities ──────────────────────────────────────────────────

export type CargoModality =
  | 'chemical'      // Hazmat / dangerous goods
  | 'livestock'     // Live animals (livestock, pets)
  | 'moving'        // Household / office relocation
  | 'rawMaterial'   // Bulk raw materials (grains, minerals, timber)
  | 'finishedGoods'; // Packaged / retail goods

export type CourierModality =
  | 'express'     // Same-day / urgent delivery
  | 'parcel'      // Standard parcel (1-30 kg)
  | 'documents';  // Envelopes, legal docs

export type PassengerModality =
  | 'land'   // Buses, vans, taxis, rideshare
  | 'air'    // Airport transfers, charter coordination
  | 'water'; // Ferries, water taxis, river transport

export type TransportModality =
  | CargoModality
  | CourierModality
  | PassengerModality;

export type CompanyType = 'cargo' | 'courier' | 'passenger';

// ─── Company document (Firestore: companies/{companyId}) ─────────────────

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface CompanyContact {
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'billing';
}

export interface CompanyDocument {
  type: 'tax_id' | 'business_license' | 'insurance' | 'permit';
  number: string;
  issuingAuthority?: string;
  expiresAt?: Date;
  verified: boolean;
}

export interface Company {
  id: string;

  // Identification
  name: string;
  legalName: string;
  taxId: string;             // NIT / RFC / CNPJ etc.
  logoUrl?: string;

  // Classification
  type: CompanyType;
  modalities: TransportModality[]; // active modalities (limited by plan)

  // People
  ownerUid: string;          // Firebase auth uid of the owner
  adminUids: string[];       // Other admins who can manage the company
  driverUids: string[];      // All linked driver uids

  // Contact & location
  address: CompanyAddress;
  contact: CompanyContact;

  // Compliance
  documents: CompanyDocument[];

  // Subscription reference (denormalized for fast reads)
  subscriptionId: string;
  subscriptionTier: import('./subscription').SubscriptionTier;

  // Metadata
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Partial type for creation (id assigned by Firestore) ─────────────────

export type CreateCompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;
