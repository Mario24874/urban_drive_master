/**
 * Database service - Firebase only
 * Supabase failover removed (was causing ERR_NAME_NOT_RESOLVED on load)
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db as firestore } from './firebase';

/**
 * Write data to Firestore
 */
/** Remove undefined values recursively — Firestore rejects them */
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    );
  }
  return obj;
}

export const writeData = async (
  collection: string,
  docId: string,
  data: any
): Promise<boolean> => {
  try {
    await setDoc(doc(firestore, collection, docId), stripUndefined({
      ...data,
      _lastSync: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('❌ Error writing data:', error);
    return false;
  }
};

/**
 * Read data from Firestore
 */
export const readData = async (
  collection: string,
  docId: string
): Promise<any | null> => {
  try {
    const docSnap = await getDoc(doc(firestore, collection, docId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('❌ Error reading data:', error);
    return null;
  }
};

export const getSyncStatus = () => ({
  primaryDB: 'firebase' as const,
  isFirebaseOnline: true,
  isSyncEnabled: false,
  pendingCount: 0,
});

export const toggleSync = (_enabled: boolean) => {};

export const monitorFirebaseConnection = () => {};

export const setupSupabaseTables = async (): Promise<void> => {};

export default {
  writeData,
  readData,
  getSyncStatus,
  toggleSync,
  setupSupabaseTables,
};
