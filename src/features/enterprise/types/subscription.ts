/**
 * Subscription types for Urban Drive Enterprise
 *
 * Tiers (monthly USD, billed annually = 20 % discount):
 *   free         $0   / 1 driver  / 0 add-on modalities
 *   basic        $29  / 5 drivers / 1 modality
 *   professional $79  / 25 drivers/ 3 modalities
 *   enterprise   custom / unlimited / unlimited
 *
 * Payment providers priority for LATAM:
 *   1. MercadoPago — CO, MX, AR, BR
 *   2. Stripe      — international cards
 *   3. PayU        — CO PSE / bank transfer
 */

// ─── Tiers & billing ───────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentProvider = 'mercadopago' | 'stripe' | 'payu' | 'manual';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'pending';

// ─── Plan definition (static config, not stored in Firestore) ─────────────

export interface SubscriptionPlanLimits {
  maxDrivers: number;         // -1 = unlimited
  maxVehicles: number;        // -1 = unlimited
  maxModalities: number;      // -1 = unlimited
  maxActiveTrips: number;     // concurrent trips limit (-1 = unlimited)
  gpsHistoryDays: number;     // how many days of GPS track history to keep
  analyticsAccess: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;       // USD, 0 for free/enterprise
  priceAnnual: number;        // USD/year, 0 for free/enterprise
  limits: SubscriptionPlanLimits;
  description: string;
}

/** Static plan definitions — source of truth for feature gating */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      maxDrivers: 1,
      maxVehicles: 1,
      maxModalities: 0,
      maxActiveTrips: 1,
      gpsHistoryDays: 7,
      analyticsAccess: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
    description: 'Para probar Urban Drive con un solo conductor',
  },
  basic: {
    tier: 'basic',
    name: 'Basic',
    priceMonthly: 29,
    priceAnnual: 278, // ~20% off
    limits: {
      maxDrivers: 5,
      maxVehicles: 10,
      maxModalities: 1,
      maxActiveTrips: 5,
      gpsHistoryDays: 30,
      analyticsAccess: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
    description: 'Para pequeñas flotas de hasta 5 conductores',
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    priceMonthly: 79,
    priceAnnual: 758, // ~20% off
    limits: {
      maxDrivers: 25,
      maxVehicles: 50,
      maxModalities: 3,
      maxActiveTrips: 50,
      gpsHistoryDays: 90,
      analyticsAccess: true,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false,
    },
    description: 'Para empresas medianas con hasta 25 conductores',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 0, // negotiated
    priceAnnual: 0,  // negotiated
    limits: {
      maxDrivers: -1,
      maxVehicles: -1,
      maxModalities: -1,
      maxActiveTrips: -1,
      gpsHistoryDays: 365,
      analyticsAccess: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
    description: 'Solución personalizada para grandes corporaciones',
  },
};

// ─── Add-ons (optional extras on top of any plan) ─────────────────────────

export type AddOnType =
  | 'extra_drivers_5'       // +5 driver slots
  | 'extra_modality'        // +1 transport modality
  | 'gps_history_90'        // 90-day GPS history
  | 'api_access'            // REST API access
  | 'custom_branding'       // White-label branding
  | 'sms_alerts'            // SMS notifications for fleet events
  | 'advanced_analytics';   // Detailed reports + export

export interface AddOn {
  type: AddOnType;
  priceMonthly: number;  // USD
  quantity: number;      // For multiplied add-ons (e.g. 3x extra_drivers_5)
}

// ─── Subscription document (Firestore: subscriptions/{subscriptionId}) ────

export interface Subscription {
  id: string;
  companyId: string;

  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;

  // Pricing (in cents to avoid float issues)
  amountCents: number;
  currency: 'USD' | 'COP' | 'MXN' | 'ARS' | 'BRL';

  // Payment provider
  provider: PaymentProvider;
  externalSubscriptionId?: string;  // Provider's subscription ID
  externalCustomerId?: string;      // Provider's customer ID

  // Add-ons
  addOns: AddOn[];

  // Dates
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSubscriptionInput = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;
