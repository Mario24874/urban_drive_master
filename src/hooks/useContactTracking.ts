import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
    error: null
  });

  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  /**
   * Calcular distancia entre dos puntos geográficos
   */
  const calculateDistance = useCallback((
    point1: [number, number], 
    point2: [number, number]
  ): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1[1] * Math.PI / 180;
    const φ2 = point2[1] * Math.PI / 180;
    const Δφ = (point2[1] - point1[1]) * Math.PI / 180;
    const Δλ = (point2[0] - point1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  /**
   * Crear o actualizar documento de usuario si no existe
   */
  const ensureUserDocument = useCallback(async () => {
    if (!userId) return;
    
    try {
      const collectionName = userType === 'driver' ? 'drivers' : 'users';
      const userRef = doc(db, collectionName, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Crear documento si no existe
        console.log(`Creating ${userType} document for ${userId}`);
        await setDoc(userRef, {
          id: userId,
          userType,
          isVisible: true,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
    }
  }, [userId, userType]);

  /**
   * Actualizar ubicación del usuario en Firebase
   */
  const updateUserLocation = useCallback(async (location: [number, number]) => {
    if (!userId) return;
    
    try {
      // Asegurar que el documento existe primero
      await ensureUserDocument();
      
      const collectionName = userType === 'driver' ? 'drivers' : 'users';
      const userRef = doc(db, collectionName, userId);
      
      await setDoc(userRef, {
        location: {
          latitude: location[1],
          longitude: location[0],
          timestamp: new Date().toISOString(),
          accuracy: 10 // Aproximado
        },
        lastSeen: new Date().toISOString(),
        isVisible: true
      }, { merge: true }); // Usar merge para no sobrescribir otros campos

      console.log('User location updated successfully');
    } catch (error) {
      console.error('Error updating user location:', error);
      setState(prev => ({ ...prev, error: 'Error actualizando ubicación' }));
    }
  }, [userId, userType, ensureUserDocument]);

  /**
   * Iniciar seguimiento de ubicación GPS
   */
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'Geolocalización no disponible en este dispositivo' 
      }));
      return;
    }

    // Limpiar seguimiento anterior si existe
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000, // 5 segundos
      timeout: 15000 // 15 segundos
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.longitude, 
          position.coords.latitude
        ];

        setState(prev => ({ 
          ...prev, 
          userLocation: newLocation,
          isTracking: true,
          error: null 
        }));

        // Actualizar ubicación en Firebase
        updateUserLocation(newLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        const errorMessages: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Habilítalo para usar el GPS.',
          2: 'Ubicación no disponible. Verifica tu conexión GPS.',
          3: 'Tiempo de espera agotado. Intenta nuevamente.'
        };

        setState(prev => ({ 
          ...prev, 
          error: errorMessages[error.code] || 'Error de ubicación desconocido',
          isTracking: false 
        }));
      },
      options
    );

    setLocationWatchId(watchId);
    setState(prev => ({ ...prev, isTracking: true }));
  }, [updateUserLocation, locationWatchId]);

  /**
   * Detener seguimiento de ubicación
   */
  const stopLocationTracking = useCallback(() => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, [locationWatchId]);

  /**
   * Crear documento de usuario al iniciar
   */
  useEffect(() => {
    ensureUserDocument();
  }, [ensureUserDocument]);

  /**
   * Obtener contactos visibles (usuarios y conductores)
   */
  useEffect(() => {
    if (!userId) return;

    const unsubscribers: (() => void)[] = [];

    // Primero obtener la lista de contactos del usuario actual
    const fetchUserContactsAndSubscribe = async () => {
      try {
        // Obtener documento del usuario actual para saber sus contactos
        const userDocRef = doc(db, userType === 'driver' ? 'drivers' : 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log('Usuario actual no encontrado');
          setState(prev => ({ ...prev, visibleContacts: [] }));
          return;
        }
        
        const userData = userDoc.data();
        const contactIds = userData.contacts || [];
        
        console.log(`Usuario tiene ${contactIds.length} contactos:`, contactIds);
        
        if (contactIds.length === 0) {
          setState(prev => ({ ...prev, visibleContacts: [] }));
          return;
        }

        // Dividir contactIds en chunks de 10 (límite de Firestore para 'in' queries)
        const chunks = [];
        for (let i = 0; i < contactIds.length; i += 10) {
          chunks.push(contactIds.slice(i, i + 10));
        }

        const handleSnapshot = (snapshot: any, contactType: 'user' | 'driver') => {
      const contacts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        userType: contactType
      })) as TrackableContact[];

      setState(prev => {
        // Filtrar contactos del tipo específico y agregar nuevos
        const filteredPrevious = prev.visibleContacts.filter(
          c => c.userType !== contactType && c.id !== userId // Excluir al usuario actual
        );

        // Calcular distancias si tenemos ubicación del usuario
        const contactsWithDistance = contacts
          .filter(contact => contact.id !== userId) // Excluir al usuario actual
          .map(contact => {
            if (prev.userLocation && contact.location && contact.location.longitude && contact.location.latitude) {
              const distance = calculateDistance(
                prev.userLocation,
                [contact.location.longitude, contact.location.latitude]
              );
              
              return {
                ...contact,
                distanceFromUser: distance,
                isReachable: distance < 10000, // 10km
                lastSeen: contact.lastSeen || 'Desconocido'
              };
            }
            return contact;
          });

        const allContacts = [...filteredPrevious, ...contactsWithDistance];
        
        // Ordenar por distancia (más cercanos primero)
        allContacts.sort((a, b) => {
          if (a.distanceFromUser && b.distanceFromUser) {
            return a.distanceFromUser - b.distanceFromUser;
          }
          return 0;
        });

        return {
          ...prev,
          visibleContacts: allContacts
        };
      });
    };

        // Suscribirse a cambios en contactos por chunks
        for (const chunk of chunks) {
          // Query para usuarios visibles que sean contactos
          const usersQuery = query(
            collection(db, 'users'),
            where('__name__', 'in', chunk),
            where('isVisible', '==', true)
          );

          // Query para conductores visibles que sean contactos
          const driversQuery = query(
            collection(db, 'drivers'),
            where('__name__', 'in', chunk),
            where('isVisible', '==', true)
          );

          // Suscribirse a cambios en usuarios
          const usersUnsubscribe = onSnapshot(usersQuery, 
            (snapshot) => handleSnapshot(snapshot, 'user'),
            (error) => {
              console.error('Error fetching users:', error);
              setState(prev => ({ ...prev, error: 'Error obteniendo usuarios' }));
            }
          );

          // Suscribirse a cambios en conductores
          const driversUnsubscribe = onSnapshot(driversQuery,
            (snapshot) => handleSnapshot(snapshot, 'driver'),
            (error) => {
              console.error('Error fetching drivers:', error);
              setState(prev => ({ ...prev, error: 'Error obteniendo conductores' }));
            }
          );

          unsubscribers.push(usersUnsubscribe, driversUnsubscribe);
        }
      } catch (error) {
        console.error('Error al obtener contactos:', error);
        setState(prev => ({ ...prev, error: 'Error obteniendo contactos' }));
      }
    };

    fetchUserContactsAndSubscribe();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, calculateDistance]);

  /**
   * Seleccionar contacto para navegación
   */
  const selectContactForNavigation = useCallback((contact: TrackableContact) => {
    if (!contact.location) {
      setState(prev => ({ 
        ...prev, 
        error: 'El contacto no tiene ubicación disponible' 
      }));
      return false;
    }

    if (!contact.isVisible) {
      setState(prev => ({ 
        ...prev, 
        error: 'El contacto no está visible actualmente' 
      }));
      return false;
    }

    setState(prev => ({ ...prev, selectedContact: contact }));
    return true;
  }, []);

  /**
   * Obtener contactos por proximidad
   */
  const getNearbyContacts = useCallback((maxDistance = 5000): TrackableContact[] => {
    return state.visibleContacts.filter(contact => 
      contact.distanceFromUser && contact.distanceFromUser <= maxDistance
    );
  }, [state.visibleContacts]);

  /**
   * Obtener contactos por tipo (conductor/usuario)
   */
  const getContactsByType = useCallback((type: 'user' | 'driver'): TrackableContact[] => {
    return state.visibleContacts.filter(contact => contact.userType === type);
  }, [state.visibleContacts]);

  /**
   * Formatear distancia para mostrar
   */
  const formatDistance = useCallback((meters?: number): string => {
    if (!meters) return 'Distancia desconocida';
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }, []);

  /**
   * Verificar si un contacto está cerca
   */
  const isContactNearby = useCallback((contactId: string, maxDistance = 1000): boolean => {
    const contact = state.visibleContacts.find(c => c.id === contactId);
    return contact ? (contact.distanceFromUser || Infinity) <= maxDistance : false;
  }, [state.visibleContacts]);

  return {
    // Estado
    visibleContacts: state.visibleContacts,
    selectedContact: state.selectedContact,
    userLocation: state.userLocation,
    isTracking: state.isTracking,
    error: state.error,

    // Acciones
    startLocationTracking,
    stopLocationTracking,
    selectContactForNavigation,

    // Utilidades
    getNearbyContacts,
    getContactsByType,
    formatDistance,
    isContactNearby,

    // Contadores
    totalContacts: state.visibleContacts.length,
    nearbyContacts: getNearbyContacts().length,
    drivers: getContactsByType('driver').length,
    users: getContactsByType('user').length
  };
};

export default useContactTracking;