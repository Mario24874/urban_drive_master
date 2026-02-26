// Public barrel export for the enterprise feature module

// Types
export type {
  Company,
  CompanyAddress,
  CompanyContact,
  CompanyDocument,
  CompanyDriver,
  TransportModality,
  SubscriptionTier,
  SubscriptionBilling,
  SubscriptionStatus,
  SubscriptionPlanLimits,
  Subscription,
  VehicleCategory,
  FuelType,
  TransmissionType,
  VehicleSpecialization,
  Vehicle,
  FleetSummary,
  InvoiceStatus,
  PaymentMethod,
  InvoiceLineItem,
  PaymentAttempt,
  Invoice,
  BillingSummary,
  MaintenanceType,
  MaintenanceStatus,
  MaintenanceRecord,
  MaintenanceAlert,
  DocumentEntityType,
  CompanyDocType,
  VehicleDocType,
  DriverDocType,
  AnyDocType,
  DocumentStatus,
  DocumentRecord,
} from './types';

export { getMaintenanceStatus, getDocumentStatus, DOC_TYPE_LABELS, COMPANY_DOC_TYPES, VEHICLE_DOC_TYPES, DRIVER_DOC_TYPES } from './types';

export { SUBSCRIPTION_PLANS } from './types';

// Config
export { STRIPE_PRICE_IDS, STRIPE_PUBLISHABLE_KEY } from './config/stripe';

// Hooks
export type { FeatureKey, FeatureGateInput, FeatureGateResult } from './hooks/useFeatureGate';
export { useFeatureGate } from './hooks/useFeatureGate';
export type { UseSubscriptionResult } from './hooks/useSubscription';
export { useSubscription } from './hooks/useSubscription';
export type { UseCompanyResult } from './hooks/useCompany';
export { useCompany } from './hooks/useCompany';
export type { UseFleetResult } from './hooks/useFleet';
export { useFleet } from './hooks/useFleet';
export type { UseDriversResult } from './hooks/useDrivers';
export { useDrivers } from './hooks/useDrivers';
export type { UseMaintenanceResult } from './hooks/useMaintenance';
export { useMaintenanceByVehicle, useMaintenanceByCompany } from './hooks/useMaintenance';
export type { UseDocumentsResult } from './hooks/useDocuments';
export { useDocumentsByEntity, useDocumentsByCompany } from './hooks/useDocuments';
export type { UseFleetAnalyticsResult, FleetKPIs, MaintenanceStats, DocumentStats, FleetComposition } from './hooks/useFleetAnalytics';
export { useFleetAnalytics } from './hooks/useFleetAnalytics';

// Components
export { default as PricingPlans } from './components/PricingPlans';
export { default as CompanySetup } from './components/CompanySetup';
export { default as FleetManager } from './components/FleetManager';
export { default as DriverManager } from './components/DriverManager';
export { default as MaintenanceLog } from './components/MaintenanceLog';
export { default as MaintenanceScheduler } from './components/MaintenanceScheduler';
export { default as DocumentVault } from './components/DocumentVault';
export { default as DocumentsDashboard } from './components/DocumentsDashboard';
export { default as FleetAnalytics } from './components/FleetAnalytics';
