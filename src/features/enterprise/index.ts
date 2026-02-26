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
} from './types';

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

// Components
export { default as PricingPlans } from './components/PricingPlans';
export { default as CompanySetup } from './components/CompanySetup';
export { default as FleetManager } from './components/FleetManager';
export { default as DriverManager } from './components/DriverManager';
