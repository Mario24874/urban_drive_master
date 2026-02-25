// Subscription and plan types for the enterprise layer

export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface SubscriptionPlanLimits {
  maxDrivers: number;       // -1 = unlimited
  maxVehicles: number;      // -1 = unlimited
  maxModalities: number;    // -1 = unlimited
  maxActiveTrips: number;   // -1 = unlimited
  analyticsAccess: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  priceUsdPerMonth: number; // 0 = free
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlanLimits> = {
  free: {
    maxDrivers: 1,
    maxVehicles: 1,
    maxModalities: 0,
    maxActiveTrips: 5,
    analyticsAccess: false,
    apiAccess: false,
    prioritySupport: false,
    customBranding: false,
    priceUsdPerMonth: 0,
  },
  basic: {
    maxDrivers: 5,
    maxVehicles: 5,
    maxModalities: 1,
    maxActiveTrips: 50,
    analyticsAccess: false,
    apiAccess: false,
    prioritySupport: false,
    customBranding: false,
    priceUsdPerMonth: 29,
  },
  professional: {
    maxDrivers: 25,
    maxVehicles: 25,
    maxModalities: 3,
    maxActiveTrips: 500,
    analyticsAccess: true,
    apiAccess: false,
    prioritySupport: true,
    customBranding: false,
    priceUsdPerMonth: 79,
  },
  enterprise: {
    maxDrivers: -1,
    maxVehicles: -1,
    maxModalities: -1,
    maxActiveTrips: -1,
    analyticsAccess: true,
    apiAccess: true,
    prioritySupport: true,
    customBranding: true,
    priceUsdPerMonth: 0, // custom pricing
  },
};

export interface Subscription {
  id: string;
  companyId: string;
  ownerId: string;
  adminIds: string[];
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string;
  externalSubscriptionId?: string; // e.g. Stripe subscription ID
  createdAt: Date;
  updatedAt: Date;
}
