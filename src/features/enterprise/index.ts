// Public barrel export for the enterprise feature module

// Types
export type {
  Company,
  CompanyAddress,
  CompanyContact,
  CompanyDocument,
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

// Components
export { default as PricingPlans } from './components/PricingPlans';
