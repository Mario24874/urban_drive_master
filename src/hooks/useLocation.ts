import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'sonner';
import type { Location, UserData } from '../types';

interface UseLocationReturn {
  location: Location | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

export function useLocation(user: UserData | null): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use stable primitive IDs as deps — not the whole user object.
  // This prevents re-triggering getLocation every time onSnapshot fires
  // and updates the user reference without changing the actual user ID.
  const userId = user?.id ?? null;
  const userType = user?.userType ?? null;

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation not supported by your browser';
      setError(errorMsg);
      toast.error('Location error', { description: errorMsg });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try GPS/WiFi first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const newLocation: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        method: 'GPS/WiFi',
        timestamp: new Date(),
      };

      setLocation(newLocation);

      // Write ONLY location fields — never the full user object.
      // Using setDoc/writeData would overwrite contacts, photoURL, etc.
      // and would trigger onSnapshot → infinite loop.
      if (userId) {
        const coll = userType === 'driver' ? 'drivers' : 'users';
        await updateDoc(doc(db, coll, userId), {
          location: newLocation,
          lastLocationUpdate: new Date().toISOString(),
        });
      }

      toast.success('Location updated', {
        description: `Accuracy: ${Math.round(position.coords.accuracy)}m`,
      });
    } catch (gpsError) {
      console.error('GPS error:', gpsError);

      // Fallback to IP-based location
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.latitude && data.longitude) {
          const fallbackLocation: Location = {
            lat: data.latitude,
            lng: data.longitude,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: 5000, // IP-based accuracy is ~5km
            method: 'IP',
            timestamp: new Date(),
          };

          setLocation(fallbackLocation);

          if (userId) {
            const coll = userType === 'driver' ? 'drivers' : 'users';
            await updateDoc(doc(db, coll, userId), {
              location: fallbackLocation,
              lastLocationUpdate: new Date().toISOString(),
            });
          }

          toast.warning('Location from IP', {
            description: 'Using approximate location from your IP address',
          });
        } else {
          throw new Error('Could not get location from IP');
        }
      } catch (ipError) {
        const errorMsg = 'Could not determine your location';
        setError(errorMsg);
        toast.error('Location error', { description: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, userType]); // stable deps — only change on login/logout

  // Only re-run when the user logs in or out (userId changes),
  // not on every Firestore snapshot update to the user document.
  useEffect(() => {
    if (userId) {
      getLocation();
    }
  }, [userId, getLocation]);

  return {
    location,
    loading,
    error,
    refreshLocation: getLocation,
  };
}
