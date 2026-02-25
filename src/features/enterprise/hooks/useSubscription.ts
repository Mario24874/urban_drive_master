import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Subscription, SubscriptionTier } from '../types/subscription';

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  loading: boolean;
  tier: SubscriptionTier;
  isActive: boolean;
}

/**
 * Real-time subscription listener for the current user.
 * Reads from Firestore `subscriptions/{userId}` — updated by the Stripe webhook.
 */
export function useSubscription(userId: string | null): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'subscriptions', userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSubscription({
          ...data,
          id: snap.id,
          currentPeriodStart: data.currentPeriodStart?.toDate?.() ?? new Date(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate?.() ?? new Date(),
          trialEnd: data.trialEnd?.toDate?.() ?? undefined,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as Subscription);
      } else {
        setSubscription(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  const activeStatuses: Subscription['status'][] = ['active', 'trialing'];
  const isActive = !!subscription && activeStatuses.includes(subscription.status);
  const tier: SubscriptionTier = isActive ? subscription!.tier : 'free';

  return { subscription, loading, tier, isActive };
}
