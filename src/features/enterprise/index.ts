// Public barrel export for the enterprise feature module

export type {
  Company,
  CompanyAddress,
  CompanyContact,
  CompanyDocument,
  TransportModality,
  SubscriptionTier,
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

export type { FeatureKey, FeatureGateInput, FeatureGateResult } from './hooks/useFeatureGate';
export { useFeatureGate } from './hooks/useFeatureGate';
