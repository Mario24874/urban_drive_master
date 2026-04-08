import type { Timestamp } from 'firebase/firestore';

// ─── Individual user plans ────────────────────────────────────────────────────

export type IndividualPlan = 'free' | 'bronze' | 'silver' | 'gold';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trial';

export type PaymentMethod = 'stripe' | 'mercadopago' | 'coupon' | null;

export interface UserSubscription {
  userId: string;
  plan: IndividualPlan;
  status: SubscriptionStatus;
  startedAt: Timestamp;
  expiresAt: Timestamp | null;
  paymentMethod: PaymentMethod;
  /** Only relevant for free tier: which contact the user currently tracks */
  activeContactId: string | null;
  /** Daily message counters: { 'YYYY-MM-DD': { contactId: count } } */
  dailyMessageCount: Record<string, Record<string, number>>;
}

export interface PlanLimits {
  maxContacts: number;
  /** null means unlimited */
  messagesPerDay: number | null;
  voiceNotes: boolean;
  /** 0 means no history */
  locationHistoryDays: number;
}

export const PLAN_LIMITS: Record<IndividualPlan, PlanLimits> = {
  free:   { maxContacts: 1,        messagesPerDay: 2,    voiceNotes: false, locationHistoryDays: 0 },
  bronze: { maxContacts: 15,       messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 1 },
  silver: { maxContacts: 50,       messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 7 },
  gold:   { maxContacts: Infinity, messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 30 },
};

export const PLAN_PRICES_USD: Record<IndividualPlan, number> = {
  free:   0,
  bronze: 4.99,
  silver: 9.99,
  gold:   19.99,
};

/** Launch promo: 40% off for first 4 weeks */
export const PLAN_PROMO_PRICES_USD: Record<IndividualPlan, number> = {
  free:   0,
  bronze: 2.99,
  silver: 5.99,
  gold:   9.99,
};

// ─── Enterprise / company plans ───────────────────────────────────────────────

export type EnterprisePlan = 'starter' | 'professional' | 'business' | 'enterprise';

export interface EnterpriseLimits {
  maxDrivers: number;
  maxModalities: number;
  locationHistoryDays: number;
  apiAccess: boolean;
  whiteLabel: boolean;
}

export const ENTERPRISE_LIMITS: Record<EnterprisePlan, EnterpriseLimits> = {
  starter:      { maxDrivers: 5,        maxModalities: 1,        locationHistoryDays: 7,  apiAccess: false, whiteLabel: false },
  professional: { maxDrivers: 25,       maxModalities: 3,        locationHistoryDays: 30, apiAccess: false, whiteLabel: false },
  business:     { maxDrivers: 100,      maxModalities: 5,        locationHistoryDays: 90, apiAccess: true,  whiteLabel: false },
  enterprise:   { maxDrivers: Infinity, maxModalities: Infinity, locationHistoryDays: 365,apiAccess: true,  whiteLabel: true  },
};

export const ENTERPRISE_PRICES_USD: Record<EnterprisePlan, number | 'custom'> = {
  starter:      29,
  professional: 79,
  business:     149,
  enterprise:   'custom',
};

// ─── Upgrade reason codes (for showing the right modal) ──────────────────────

export type UpgradeReason =
  | 'message_limit'      // reached 2 msg/day free limit
  | 'contact_limit'      // trying to add 2nd contact on free
  | 'second_invitation'  // free user got invited by someone when slot is taken
  | 'voice_notes'        // tried to send a voice note on free
  | 'location_history';  // tried to access history on free/bronze
