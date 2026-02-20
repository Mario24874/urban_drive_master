/**
 * useFeatureGate — checks whether a subscription plan allows a feature
 *
 * Usage:
 *   const { allowed, reason } = useFeatureGate('analyticsAccess', subscription);
 *
 * Returns:
 *   allowed — true if the current plan grants access
 *   reason  — human-readable reason when blocked (for upgrade CTAs)
 *
 * This hook is STATELESS — it reads from the static SUBSCRIPTION_PLANS config,
 * not from Firestore. For the live subscription document use useSubscription (Phase 2).
 */

import { useMemo } from 'react';
import type { Subscription, SubscriptionPlanLimits } from '../types/subscription';
import { SUBSCRIPTION_PLANS } from '../types/subscription';

type LimitKey = keyof SubscriptionPlanLimits;

interface GateResult {
  /** Whether the feature/limit is accessible on this plan */
  allowed: boolean;
  /** Plain-text reason to display in an upgrade CTA */
  reason: string;
  /** The tier required to unlock this feature */
  requiredTier?: 'basic' | 'professional' | 'enterprise';
}

// ─── Numeric limit check ──────────────────────────────────────────────────

/**
 * Check whether adding `count` items is within the plan's numeric limit.
 *
 * @param limitKey   - The limit field in SubscriptionPlanLimits
 * @param current    - How many items the company currently has
 * @param subscription - The active subscription document
 * @returns GateResult
 */
export function checkNumericLimit(
  limitKey: Extract<LimitKey, 'maxDrivers' | 'maxVehicles' | 'maxModalities' | 'maxActiveTrips'>,
  current: number,
  subscription: Pick<Subscription, 'tier'>,
): GateResult {
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  const limit = plan.limits[limitKey] as number;

  if (limit === -1) {
    return { allowed: true, reason: '' };
  }

  if (current < limit) {
    return { allowed: true, reason: '' };
  }

  // Blocked — find the next tier that lifts this limit
  const tiers = ['free', 'basic', 'professional', 'enterprise'] as const;
  const requiredTier = tiers.find((t) => {
    const l = SUBSCRIPTION_PLANS[t].limits[limitKey] as number;
    return l === -1 || l > limit;
  }) as GateResult['requiredTier'];

  const limitNames: Record<string, string> = {
    maxDrivers: 'conductores',
    maxVehicles: 'vehículos',
    maxModalities: 'modalidades de transporte',
    maxActiveTrips: 'viajes simultáneos',
  };

  return {
    allowed: false,
    reason: `Tu plan ${plan.name} permite hasta ${limit} ${limitNames[limitKey] ?? limitKey}. Actualiza para agregar más.`,
    requiredTier,
  };
}

// ─── Boolean feature check ─────────────────────────────────────────────────

/**
 * Check whether a boolean feature is enabled on the current plan.
 *
 * @param featureKey   - The boolean field in SubscriptionPlanLimits
 * @param subscription - The active subscription document
 * @returns GateResult
 */
export function checkBooleanFeature(
  featureKey: Extract<
    LimitKey,
    'analyticsAccess' | 'apiAccess' | 'prioritySupport' | 'customBranding'
  >,
  subscription: Pick<Subscription, 'tier'>,
): GateResult {
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  const enabled = plan.limits[featureKey] as boolean;

  if (enabled) {
    return { allowed: true, reason: '' };
  }

  const featureNames: Record<string, string> = {
    analyticsAccess: 'Analíticas avanzadas',
    apiAccess: 'Acceso a API REST',
    prioritySupport: 'Soporte prioritario',
    customBranding: 'Marca personalizada',
  };

  const tiers = ['free', 'basic', 'professional', 'enterprise'] as const;
  const requiredTier = tiers.find(
    (t) => (SUBSCRIPTION_PLANS[t].limits[featureKey] as boolean) === true,
  ) as GateResult['requiredTier'];

  return {
    allowed: false,
    reason: `${featureNames[featureKey] ?? featureKey} está disponible desde el plan ${requiredTier ?? 'superior'}.`,
    requiredTier,
  };
}

// ─── React hook ───────────────────────────────────────────────────────────

export type FeatureGateInput =
  | { type: 'boolean'; feature: Parameters<typeof checkBooleanFeature>[0] }
  | { type: 'numeric'; limit: Parameters<typeof checkNumericLimit>[0]; current: number };

/**
 * React hook wrapper around the gate check functions.
 * Memoized — only recomputes when subscription.tier or current changes.
 */
export function useFeatureGate(
  input: FeatureGateInput,
  subscription: Pick<Subscription, 'tier'>,
): GateResult {
  return useMemo(() => {
    if (input.type === 'boolean') {
      return checkBooleanFeature(input.feature, subscription);
    }
    return checkNumericLimit(input.limit, input.current, subscription);
  }, [input, subscription]);
}
