import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Lógica pura en lib/chatLogic (testeable sin Firebase); se re-exporta por conveniencia
export { ONLINE_WINDOW_MS, formatLastSeen } from '../lib/chatLogic';

const HEARTBEAT_MS = 60_000;

/**
 * Publica el heartbeat de presencia del usuario actual en su doc
 * (users/{uid} o drivers/{uid}) cada 60 s y en eventos de foco/visibilidad.
 */
export function usePresenceHeartbeat(userId: string | null, userType?: string) {
  useEffect(() => {
    if (!userId) return;
    const coll = userType === 'driver' ? 'drivers' : 'users';
    const beat = () => {
      updateDoc(doc(db, coll, userId), { lastActiveAt: serverTimestamp() }).catch(() => {});
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [userId, userType]);
}

/**
 * Observa la presencia de un contacto. Devuelve su lastActiveAt reactivo
 * (revisa users y drivers, el que exista).
 */
export function useContactPresence(contactId: string | null): Date | null {
  const [lastActive, setLastActive] = useState<Date | null>(null);

  useEffect(() => {
    if (!contactId) {
      setLastActive(null);
      return;
    }
    const read = (snap: any) => {
      const ts = snap.data()?.lastActiveAt;
      if (ts?.toDate) setLastActive(ts.toDate());
    };
    const unsubs = [
      onSnapshot(doc(db, 'users', contactId), read, () => {}),
      onSnapshot(doc(db, 'drivers', contactId), read, () => {}),
    ];
    return () => unsubs.forEach((u) => u());
  }, [contactId]);

  return lastActive;
}
