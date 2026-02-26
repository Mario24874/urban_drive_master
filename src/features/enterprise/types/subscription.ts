// Subscription and plan types for the enterprise layer

export type SubscriptionTier = 'free' | 'bronce' | 'plata' | 'oro';

export type SubscriptionBilling = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface SubscriptionPlanLimits {
  maxDrivers: number;        // -1 = unlimited
  maxVehicles: number;       // -1 = unlimited
  maxModalities: number;     // -1 = unlimited
  maxActiveTrips: number;    // -1 = unlimited
  maxContacts: number;       // -1 = unlimited
  analyticsAccess: boolean;
  analyticsLevel: 'none' | 'basic' | 'advanced';
  apiAccess: boolean;
  prioritySupport: boolean;
  supportLevel: 'email' | 'priority_email' | 'phone_email';
  customBranding: boolean;
  priceUsdPerMonth: number;  // 0 = free
  priceUsdPerYear: number;   // 0 = free
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlanLimits> = {
  free: {
    maxDrivers: 1,
    maxVehicles: 1,
    maxModalities: 0,
    maxActiveTrips: 5,
    maxContacts: 3,
    analyticsAccess: false,
    analyticsLevel: 'none',
    apiAccess: false,
    prioritySupport: false,
    supportLevel: 'email',
    customBranding: false,
    priceUsdPerMonth: 0,
    priceUsdPerYear: 0,
  },
  bronce: {
    maxDrivers: 3,
    maxVehicles: 3,
    maxModalities: 1,
    maxActiveTrips: 20,
    maxContacts: 15,
    analyticsAccess: false,
    analyticsLevel: 'none',
    apiAccess: false,
    prioritySupport: false,
    supportLevel: 'email',
    customBranding: false,
    priceUsdPerMonth: 19,
    priceUsdPerYear: 190,
  },
  plata: {
    maxDrivers: 20,
    maxVehicles: 20,
    maxModalities: 3,
    maxActiveTrips: 200,
    maxContacts: 50,
    analyticsAccess: true,
    analyticsLevel: 'basic',
    apiAccess: false,
    prioritySupport: true,
    supportLevel: 'priority_email',
    customBranding: false,
    priceUsdPerMonth: 49,
    priceUsdPerYear: 490,
  },
  oro: {
    maxDrivers: -1,
    maxVehicles: -1,
    maxModalities: -1,
    maxActiveTrips: -1,
    maxContacts: -1,
    analyticsAccess: true,
    analyticsLevel: 'advanced',
    apiAccess: true,
    prioritySupport: true,
    supportLevel: 'phone_email',
    customBranding: true,
    priceUsdPerMonth: 119,
    priceUsdPerYear: 1190,
  },
};

export interface Subscription {
  id: string;
  userId: string;           // Firebase UID of subscriber
  companyId?: string;       // optional — can be persona natural (no company)
  ownerName: string;        // nombre o razón social
  ownerId: string;
  adminIds: string[];
  tier: SubscriptionTier;
  billing: SubscriptionBilling;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
