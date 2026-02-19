import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Contact } from '../types';

interface TrackableContact extends Omit<Contact, 'lastSeen'> {
  distanceFromUser?: number;
  isReachable?: boolean;
  lastSeen?: Date | string;
}

interface ContactTrackingState {
  visibleContacts: TrackableContact[];
  selectedContact: TrackableContact | null;
  userLocation: [number, number] | null;
  isTracking: boolean;
  error: string | null;
}

export const useContactTracking = (userId: string, userType: 'user' | 'driver') => {
  const [state, setState] = useState<ContactTrackingState>({
    visibleContacts: [],
    selectedContact: null,
    userLocation: null,
    isTracking: false,
    error: null,
  });

  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  const calculateDistance = useCallback((
    point1: [number, number],
    point2: [number, number],
  ): number => {
    const R = 6371e3;
    const φ1 = point1[1] * Math.PI / 180;
    const φ2 = point2[1] * Math.PI / 180;
    const Δφ = (point2[1] - point1[1]) * Math.PI / 180;
    const Δλ = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const ensureUserDocument = useCallback(async () => {
    if (!userId) return;
    try {
      const collectionName = userType === 'driver' ? 'drivers' : 'users';
      const userRef = doc(db, collectionName, userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: userId,
          userType,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
    }
  }, [userId, userType]);

  /**
   * Update location in Firestore — does NOT touch isVisible so that the
   * per-contact visibility preference is never overwritten by a GPS tick.
   */
  const updateUserLocation = useCallback(async (location: [number, number]) => {
    if (!userId) return;
    try {
      await ensureUserDocument();
      const collectionName = userType === 'driver' ? 'drivers' : 'users';
      await setDoc(doc(db, collectionName, userId), {
        location: {
          latitude: location[1],
          longitude: location[0],
          timestamp: new Date().toISOString(),
          accuracy: 10,
        },
        lastSeen: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user location:', error);
      setState(prev => ({ ...prev, error: 'Error actualizando ubicación' }));
    }
  }, [userId, userType, ensureUserDocument]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocalización no disponible en este dispositivo' }));
      return;
    }
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
        setState(prev => ({ ...prev, userLocation: newLocation, isTracking: true, error: null }));
        updateUserLocation(newLocation);
      },
      (error) => {
        const msgs: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Habilítalo para usar el GPS.',
          2: 'Ubicación no disponible. Verifica tu conexión GPS.',
          3: 'Tiempo de espera agotado. Intenta nuevamente.',
        };
        setState(prev => ({ ...prev, error: msgs[error.code] || 'Error de ubicación desconocido', isTracking: false }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setLocationWatchId(watchId);
    setState(prev => ({ ...prev, isTracking: true }));
  }, [updateUserLocation, locationWatchId]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, [locationWatchId]);

  useEffect(() => {
    ensureUserDocument();
  }, [ensureUserDocument]);

  /**
   * Subscribe to the current user's contacts and track their real-time locations.
   * Visibility filter (PUSH model): contacts who have set
   * contactVisibility[myUserId] === false are excluded from the map.
   */
  useEffect(() => {
    if (!userId) return;

    const unsubscribers: (() => void)[] = [];

    const fetchUserContactsAndSubscribe = async () => {
      try {
        const collName = userType === 'driver' ? 'drivers' : 'users';
        const userDoc = await getDoc(doc(db, collName, userId));
        if (!userDoc.exists()) {
          setState(prev => ({ ...prev, visibleContacts: [] }));
          return;
        }

        const contactIds: string[] = userDoc.data().contacts || [];
        if (contactIds.length === 0) {
          setState(prev => ({ ...prev, visibleContacts: [] }));
          return;
        }

        // Firestore 'in' limit is 30
        const chunks: string[][] = [];
        for (let i = 0; i < contactIds.length; i += 30) {
          chunks.push(contactIds.slice(i, i + 30));
        }

        const handleSnapshot = (snapshot: any, contactType: 'user' | 'driver') => {
          const contacts: TrackableContact[] = snapshot.docs
            // PUSH visibility: skip contacts who have explicitly hidden themselves from me
            .filter((d: any) => {
              const cv = d.data().contactVisibility;
              return !cv || cv[userId] !== false;
            })
            .filter((d: any) => d.id !== userId)
            .map((d: any) => ({
              id: d.id,
              ...d.data(),
              userType: contactType,
            }));

          setState(prev => {
            // Replace contacts of this type with fresh snapshot data
            const others = prev.visibleContacts.filter(c => c.userType !== contactType);

            const withDistance = contacts.map(contact => {
              if (prev.userLocation && contact.location?.longitude && contact.location?.latitude) {
                const dist = calculateDistance(
                  prev.userLocation,
                  [contact.location.longitude, contact.location.latitude],
                );
                return { ...contact, distanceFromUser: dist, isReachable: dist < 10000, lastSeen: contact.lastSeen || 'Desconocido' };
              }
              return contact;
            });

            const all = [...others, ...withDistance].sort((a, b) =>
              (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity),
            );

            return { ...prev, visibleContacts: all };
          });
        };

        for (const chunk of chunks) {
          // Query all contacts in this chunk (no isVisible filter — visibility
          // is handled per-contact via contactVisibility in handleSnapshot)
          const usersUnsub = onSnapshot(
            query(collection(db, 'users'), where(documentId(), 'in', chunk)),
            (snap) => handleSnapshot(snap, 'user'),
            (err) => console.error('[useContactTracking] users error:', err),
          );
          const driversUnsub = onSnapshot(
            query(collection(db, 'drivers'), where(documentId(), 'in', chunk)),
            (snap) => handleSnapshot(snap, 'driver'),
            (err) => console.error('[useContactTracking] drivers error:', err),
          );
          unsubscribers.push(usersUnsub, driversUnsub);
        }
      } catch (error) {
        console.error('Error al obtener contactos:', error);
        setState(prev => ({ ...prev, error: 'Error obteniendo contactos' }));
      }
    };

    fetchUserContactsAndSubscribe();
    return () => unsubscribers.forEach(u => u());
  }, [userId, userType, calculateDistance]);

  const selectContactForNavigation = useCallback((contact: TrackableContact) => {
    if (!contact.location) {
      setState(prev => ({ ...prev, error: 'El contacto no tiene ubicación disponible' }));
      return false;
    }
    setState(prev => ({ ...prev, selectedContact: contact }));
    return true;
  }, []);

  const getNearbyContacts = useCallback((maxDistance = 5000): TrackableContact[] =>
    state.visibleContacts.filter(c => c.distanceFromUser !== undefined && c.distanceFromUser <= maxDistance),
  [state.visibleContacts]);

  const getContactsByType = useCallback((type: 'user' | 'driver'): TrackableContact[] =>
    state.visibleContacts.filter(c => c.userType === type),
  [state.visibleContacts]);

  const formatDistance = useCallback((meters?: number): string => {
    if (!meters) return 'Distancia desconocida';
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  }, []);

  const isContactNearby = useCallback((contactId: string, maxDistance = 1000): boolean => {
    const c = state.visibleContacts.find(c => c.id === contactId);
    return c ? (c.distanceFromUser ?? Infinity) <= maxDistance : false;
  }, [state.visibleContacts]);

  const contactsOnMap = state.visibleContacts.filter(c => c.location);

  return {
    visibleContacts: state.visibleContacts,
    selectedContact: state.selectedContact,
    userLocation: state.userLocation,
    isTracking: state.isTracking,
    error: state.error,
    startLocationTracking,
    stopLocationTracking,
    selectContactForNavigation,
    getNearbyContacts,
    getContactsByType,
    formatDistance,
    isContactNearby,
    totalContacts: contactsOnMap.length,
    nearbyContacts: getNearbyContacts().length,
    drivers: getContactsByType('driver').length,
    users: getContactsByType('user').length,
  };
};

export default useContactTracking;
