// Document-related types for the enterprise layer

export type DocumentEntityType = 'company' | 'vehicle' | 'driver';

export type CompanyDocType =
  | 'chamber_of_commerce'    // Cámara de Comercio
  | 'transport_authorization' // Habilitación Transporte
  | 'sarlaft'                // SARLAFT
  | 'rut'                    // RUT
  | 'operating_license';     // Licencia de Operación

export type VehicleDocType =
  | 'soat'                   // SOAT
  | 'technical_inspection'   // Revisión Técnico-Mecánica
  | 'operation_card'         // Tarjeta de Operación
  | 'property_card'          // Tarjeta de Propiedad
  | 'insurance';             // Póliza de Seguro

export type DriverDocType =
  | 'license'                // Licencia de Conducción
  | 'medical_certificate'    // Certificado Médico
  | 'background_check'       // Antecedentes
  | 'psychosensory';         // Examen Psicosensorial

export type AnyDocType = CompanyDocType | VehicleDocType | DriverDocType;

export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiry';

export interface DocumentRecord {
  id: string;
  companyId: string;
  entityId: string;
  entityType: DocumentEntityType;
  docType: AnyDocType;
  name: string;           // display name (auto-filled from type)
  issueDate?: Date;
  expiryDate?: Date;
  fileURL?: string;       // optional link to stored file
  isVerified: boolean;
  notes?: string;
  createdAt: Date;
}

// Required document types per entity kind
export const COMPANY_DOC_TYPES: CompanyDocType[] = [
  'chamber_of_commerce',
  'transport_authorization',
  'sarlaft',
  'rut',
  'operating_license',
];

export const VEHICLE_DOC_TYPES: VehicleDocType[] = [
  'soat',
  'technical_inspection',
  'operation_card',
  'property_card',
  'insurance',
];

export const DRIVER_DOC_TYPES: DriverDocType[] = [
  'license',
  'medical_certificate',
  'background_check',
  'psychosensory',
];

export const DOC_TYPE_LABELS: Record<AnyDocType, string> = {
  // Company
  chamber_of_commerce: 'Cámara de Comercio',
  transport_authorization: 'Habilitación de Transporte',
  sarlaft: 'SARLAFT',
  rut: 'RUT',
  operating_license: 'Licencia de Operación',
  // Vehicle
  soat: 'SOAT',
  technical_inspection: 'Revisión Técnico-Mecánica',
  operation_card: 'Tarjeta de Operación',
  property_card: 'Tarjeta de Propiedad',
  insurance: 'Póliza de Seguro',
  // Driver
  license: 'Licencia de Conducción',
  medical_certificate: 'Certificado Médico',
  background_check: 'Antecedentes Judiciales',
  psychosensory: 'Examen Psicosensorial',
};

/**
 * Derive status from a document's expiry date.
 * Warning threshold: ≤ 30 days remaining.
 */
export function getDocumentStatus(doc: DocumentRecord): {
  status: DocumentStatus;
  daysRemaining?: number;
} {
  if (!doc.expiryDate) return { status: 'no_expiry' };

  const now = new Date();
  const daysRemaining = Math.ceil(
    (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) return { status: 'expired', daysRemaining };
  if (daysRemaining <= 30) return { status: 'expiring_soon', daysRemaining };
  return { status: 'valid', daysRemaining };
}
