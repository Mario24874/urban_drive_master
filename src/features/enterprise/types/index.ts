/**
 * Enterprise feature — public type exports
 * Import from '@/features/enterprise/types'
 */

export type {
  // Company
  CompanyType,
  CargoModality,
  CourierModality,
  PassengerModality,
  TransportModality,
  CompanyAddress,
  CompanyContact,
  CompanyDocument,
  Company,
  CreateCompanyInput,
} from './company';

export type {
  // Subscription
  SubscriptionTier,
  BillingCycle,
  PaymentProvider,
  SubscriptionStatus,
  SubscriptionPlanLimits,
  SubscriptionPlan,
  AddOnType,
  AddOn,
  Subscription,
  CreateSubscriptionInput,
} from './subscription';

export {
  // Static plan config
  SUBSCRIPTION_PLANS,
} from './subscription';

export type {
  // Vehicle
  VehicleCategory,
  FuelType,
  CargoSpecialization,
  CourierSpecialization,
  PassengerSpecialization,
  VehicleDocument,
  VehicleLocation,
  Vehicle,
  CreateVehicleInput,
  FleetSummary,
} from './vehicle';

export type {
  // Invoice / billing
  InvoiceStatus,
  InvoiceType,
  InvoiceLineItem,
  PaymentAttemptStatus,
  PaymentAttempt,
  Invoice,
  CreateInvoiceInput,
  BillingSummary,
} from './invoice';
