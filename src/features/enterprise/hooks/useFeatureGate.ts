import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { Subscription, SubscriptionTier } from '../types/subscription';

export type FeatureKey =
  | 'maxDrivers'
  | 'maxVehicles'
  | 'maxModalities'
  | 'maxActiveTrips'
  | 'analyticsAccess'
  | 'apiAccess'
  | 'prioritySupport'
  | 'customBranding';

export interface FeatureGateInput {
  feature: FeatureKey;
  /** Current count, used for limit checks (maxDrivers, maxVehicles, etc.) */
  current?: number;
}

export interface FeatureGateResult {
  allowed: boolean;
  reason: string;
  requiredTier: SubscriptionTier | null;
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'basic', 'professional', 'enterprise'];

function findRequiredTier(feature: FeatureKey, current?: number): SubscriptionTier | null {
  for (const tier of TIER_ORDER) {
    const plan = SUBSCRIPTION_PLANS[tier];
    if (isFeatureAllowed(plan, feature, current)) {
      return tier;
    }
  }
  return null;
}

function isFeatureAllowed(
  plan: typeof SUBSCRIPTION_PLANS[SubscriptionTier],
  feature: FeatureKey,
  current?: number,
): boolean {
  switch (feature) {
    case 'maxDrivers':
      return plan.maxDrivers === -1 || (current === undefined ? true : current < plan.maxDrivers);
    case 'maxVehicles':
      return plan.maxVehicles === -1 || (current === undefined ? true : current < plan.maxVehicles);
    case 'maxModalities':
      return plan.maxModalities === -1 || (current === undefined ? true : current < plan.maxModalities);
    case 'maxActiveTrips':
      return plan.maxActiveTrips === -1 || (current === undefined ? true : current < plan.maxActiveTrips);
    case 'analyticsAccess':
      return plan.analyticsAccess;
    case 'apiAccess':
      return plan.apiAccess;
    case 'prioritySupport':
      return plan.prioritySupport;
    case 'customBranding':
      return plan.customBranding;
    default:
      return false;
  }
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  maxDrivers: 'conductores',
  maxVehicles: 'vehículos',
  maxModalities: 'modalidades de transporte',
  maxActiveTrips: 'viajes activos simultáneos',
  analyticsAccess: 'acceso a analíticas',
  apiAccess: 'acceso a la API',
  prioritySupport: 'soporte prioritario',
  customBranding: 'personalización de marca',
};

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Gratuito',
  basic: 'Básico',
  professional: 'Profesional',
  enterprise: 'Empresarial',
};

/**
 * Stateless feature gate hook.
 * Checks whether a feature is available for the given subscription.
 *
 * @param input - Feature key and optional current count for limit checks.
 * @param subscription - The company's active subscription object.
 * @returns { allowed, reason, requiredTier }
 */
export function useFeatureGate(
  input: FeatureGateInput,
  subscription: Subscription,
): FeatureGateResult {
  const { feature, current } = input;
  const plan = SUBSCRIPTION_PLANS[subscription.tier];

  const allowed = isFeatureAllowed(plan, feature, current);

  if (allowed) {
    return { allowed: true, reason: '', requiredTier: null };
  }

  const requiredTier = findRequiredTier(feature, current);
  const featureLabel = FEATURE_LABELS[feature] ?? feature;

  let reason: string;

  if (requiredTier === null) {
    reason = `La función "${featureLabel}" no está disponible en ningún plan actual.`;
  } else {
    const tierName = TIER_NAMES[requiredTier];
    reason = `Necesitas el plan ${tierName} o superior para acceder a "${featureLabel}".`;
  }

  return { allowed: false, reason, requiredTier };
}
