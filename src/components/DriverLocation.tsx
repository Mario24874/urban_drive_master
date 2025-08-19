import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface DriverLocationProps {
  userId: string;
}

const DriverLocation: React.FC<DriverLocationProps> = ({ userId }) => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateDriverLocation = async (coords: GeolocationCoordinates) => {
    try {
      await setDoc(doc(db, 'driver_locations', userId), {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating driver location:", error);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position.coords);
        updateDriverLocation(position.coords);
      },
      (error) => {
        setError(`ERROR(${error.code}): ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId, updateDriverLocation]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!location) {
    return <div>Locating...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Current Location:</h3>
      <p className="text-gray-700">Latitude: {location.latitude}</p>
      <p className="text-gray-700">Longitude: {location.longitude}</p>
      <p className="text-gray-700">Accuracy: {location.accuracy} meters</p>
    </div>
  );
};

export default DriverLocation;