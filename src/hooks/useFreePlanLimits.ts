/**
 * useFreePlanLimits
 *
 * Tracks per-contact daily message counts using localStorage.
 * Client-side best-effort enforcement — server-side Cloud Function
 * enforcement will be added in v1.2.
 *
 * Storage key: ud_msg_{userId}_{YYYY-MM-DD}_{contactId} → count
 */

import { useCallback } from 'react';
import { SUBSCRIPTION_PLANS } from '../features/enterprise/types/subscription';
import type { SubscriptionTier } from '../features/enterprise/types/subscription';

function todayStr(): string {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function storageKey(userId: string, contactId: string): string {
  return `ud_msg_${userId}_${todayStr()}_${contactId}`;
}

function readCount(userId: string, contactId: string): number {
  try {
    return parseInt(localStorage.getItem(storageKey(userId, contactId)) ?? '0', 10);
  } catch {
    return 0;
  }
}

function writeCount(userId: string, contactId: string, count: number): void {
  try {
    localStorage.setItem(storageKey(userId, contactId), String(count));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export interface FreePlanLimits {
  /** true if this user/contact pair can send another message right now */
  canSendMessage: (contactId: string) => boolean;
  /** Call after a message is successfully sent to increment the counter */
  recordMessageSent: (contactId: string) => void;
  /** How many messages remain today for this contact (-1 = unlimited) */
  messagesRemainingToday: (contactId: string) => number;
  /** How many messages have been sent today to this contact */
  messagesTodayCount: (contactId: string) => number;
  /** Whether voice notes are allowed on this plan */
  canUseVoiceNotes: boolean;
  /** Max contacts allowed (-1 = unlimited) */
  maxContacts: number;
  /** Daily message limit per contact (-1 = unlimited) */
  messagesPerDay: number;
}

export function useFreePlanLimits(
  userId: string | null,
  tier: SubscriptionTier,
): FreePlanLimits {
  const plan = SUBSCRIPTION_PLANS[tier];
  const { messagesPerDay, voiceNotes, maxContacts } = plan;

  const canSendMessage = useCallback(
    (contactId: string): boolean => {
      if (!userId) return false;
      if (messagesPerDay === -1) return true;
      return readCount(userId, contactId) < messagesPerDay;
    },
    [userId, messagesPerDay],
  );

  const recordMessageSent = useCallback(
    (contactId: string): void => {
      if (!userId || messagesPerDay === -1) return;
      const current = readCount(userId, contactId);
      writeCount(userId, contactId, current + 1);
    },
    [userId, messagesPerDay],
  );

  const messagesRemainingToday = useCallback(
    (contactId: string): number => {
      if (!userId || messagesPerDay === -1) return -1;
      return Math.max(0, messagesPerDay - readCount(userId, contactId));
    },
    [userId, messagesPerDay],
  );

  const messagesTodayCount = useCallback(
    (contactId: string): number => {
      if (!userId) return 0;
      return readCount(userId, contactId);
    },
    [userId],
  );

  return {
    canSendMessage,
    recordMessageSent,
    messagesRemainingToday,
    messagesTodayCount,
    canUseVoiceNotes: voiceNotes,
    maxContacts,
    messagesPerDay,
  };
}
