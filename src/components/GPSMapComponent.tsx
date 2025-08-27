import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import useContactTracking from '../hooks/useContactTracking';
import NavigationInterface from './NavigationInterface';
import VisibilityToggle from './VisibilityToggle';

interface GPSMapComponentProps {
  userLocation: any;
  user: any;
  userId: string;
  userType: 'user' | 'driver';
}

const GPSMapComponent: React.FC<GPSMapComponentProps> = ({ 
  userLocation, 
  user, 
  userId, 
  userType 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<[number, number] | undefined>();
  const [selectedContactName, setSelectedContactName] = useState<string>('');
  
  const {
    visibleContacts,
    userLocation: trackedUserLocation,
    isTracking,
    error,
    startLocationTracking,
    stopLocationTracking,
    selectContactForNavigation,
    formatDistance,
    totalContacts,
    nearbyContacts,
    drivers,
    users
  } = useContactTracking(userId, userType);

  // Iniciar tracking automáticamente
  useEffect(() => {
    if (!isTracking) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    // Solo cargar el mapa una vez
    if (map.current) return;
    
    // Cargar Mapbox GL JS dinámicamente
    const loadMapbox = async () => {

      try {
        // Cargar CSS de Mapbox
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const cssLink = document.createElement('link');
          cssLink.href = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css';
          cssLink.rel = 'stylesheet';
          document.head.appendChild(cssLink);
        }

        // Cargar JavaScript de Mapbox
        if (!(window as any).mapboxgl) {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js';
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error('Error cargando Mapbox:', error);
        showFallbackMap();
      }
    };

    const initializeMap = () => {
      const mapboxgl = (window as any).mapboxgl;
      
      if (!mapboxgl) {
        showFallbackMap();
        return;
      }

      // Obtener token de Mapbox desde variables de entorno
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      if (!accessToken || !accessToken.startsWith('pk.')) {
        console.error('Invalid or missing VITE_MAPBOX_ACCESS_TOKEN');
        showFallbackMap();
        return;
      }
      
      mapboxgl.accessToken = accessToken;

      // Usar ubicación del tracking o ubicación inicial
      const currentLocation = trackedUserLocation || (userLocation ? 
        [userLocation.longitude, userLocation.latitude] : 
        [-74.072092, 4.710989]); // Bogotá por defecto

      try {
        console.log('Creating GPS-enabled Mapbox map with location:', currentLocation);
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mariomoreno24874/cm2e3oshc002n01pbdfmv1qtj',
          center: currentLocation,
          zoom: trackedUserLocation ? 15 : 12, // Mayor zoom si tenemos ubicación precisa
          pitch: 45,
          bearing: 0,
          touchZoomRotate: true,
          touchPitch: true
        });

        map.current.on('load', () => {
          console.log('GPS Map loaded successfully');
          addMarkersToMap();
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox map error:', e);
          showFallbackMap();
        });

        // Agregar controles de navegación optimizados para móvil
        map.current.addControl(new mapboxgl.NavigationControl({
          showCompass: false, // Ocultar brújula en móvil
          showZoom: true,
          visualizePitch: true
        }), 'top-right');

        // Control de geolocalización con alta precisión
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true,
          fitBoundsOptions: {
            maxZoom: 16
          }
        });
        
        map.current.addControl(geolocateControl, 'top-right');

        // Activar automáticamente la geolocalización
        map.current.on('load', () => {
          geolocateControl.trigger();
        });

      } catch (error) {
        console.error('Error creating GPS map:', error);
        showFallbackMap();
      }
    };

    const addMarkersToMap = () => {
      const mapboxgl = (window as any).mapboxgl;
      
      if (!mapboxgl || !map.current) return;

      // Limpiar marcadores existentes
      const existingMarkers = document.querySelectorAll('.gps-marker');
      existingMarkers.forEach(marker => marker.remove());

      // Agregar marcador del usuario actual (más prominente)
      const currentUserLocation = trackedUserLocation || (userLocation ? 
        [userLocation.longitude, userLocation.latitude] : null);

      if (currentUserLocation) {
        const userMarkerEl = document.createElement('div');
        userMarkerEl.className = 'gps-marker user-marker';
        userMarkerEl.innerHTML = `
          <div style="
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            background-color: #3b82f6; 
            border: 4px solid white; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            position: relative;
          ">
            ${userType === 'driver' ? '🚗' : '👤'}
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 12px;
              height: 12px;
              background-color: ${isTracking ? '#10b981' : '#ef4444'};
              border: 2px solid white;
              border-radius: 50%;
              ${isTracking ? 'animation: pulse 2s infinite;' : ''}
            "></div>
          </div>
        `;

        new mapboxgl.Marker(userMarkerEl)
          .setLngLat(currentUserLocation)
          .setPopup(
            new mapboxgl.Popup({ offset: 35 }).setHTML(`
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #3b82f6;">
                  ${userType === 'driver' ? '🚗' : '👤'} Tú (${userType === 'driver' ? 'Conductor' : 'Usuario'})
                </h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ${user?.displayName || user?.email}<br>
                  ${isTracking ? '🟢 GPS Activo' : '🔴 GPS Inactivo'}<br>
                  📍 ${currentUserLocation[1].toFixed(6)}, ${currentUserLocation[0].toFixed(6)}
                </p>
              </div>
            `)
          )
          .addTo(map.current);
      }

      // Agregar marcadores de contactos visibles
      visibleContacts.forEach(contact => {
        if (!contact.location) return;

        const contactMarkerEl = document.createElement('div');
        const isDriver = contact.userType === 'driver';
        contactMarkerEl.className = 'gps-marker contact-marker';
        
        contactMarkerEl.innerHTML = `
          <div style="
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            background-color: ${isDriver ? '#10b981' : '#6b7280'}; 
            border: 3px solid white; 
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s ease;
          " 
          onmouseover="this.style.transform='scale(1.1)'"
          onmouseout="this.style.transform='scale(1)'"
          >
            ${isDriver ? '🚗' : '👤'}
          </div>
        `;

        // Click handler para navegación
        contactMarkerEl.addEventListener('click', () => {
          handleNavigateToContact(contact);
        });

        new mapboxgl.Marker(contactMarkerEl)
          .setLngLat([contact.location.longitude, contact.location.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 28 }).setHTML(`
              <div style="padding: 12px; min-width: 220px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${isDriver ? '#10b981' : '#6b7280'};">
                  ${isDriver ? '🚗' : '👤'} ${contact.displayName}
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                  ${isDriver ? 'Conductor' : 'Usuario'}<br>
                  📞 ${contact.phone || 'No especificado'}<br>
                  ${contact.distanceFromUser ? '📍 ' + formatDistance(contact.distanceFromUser) : '📍 Ubicación disponible'}<br>
                  🕐 ${contact.lastSeen || 'Ahora'}
                </p>
                <button 
                  onclick="window.navigateToThisContact && window.navigateToThisContact('${contact.id}')"
                  style="
                    width: 100%;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='#2563eb'"
                  onmouseout="this.style.backgroundColor='#3b82f6'"
                >
                  🧭 Navegar aquí
                </button>
              </div>
            `)
          )
          .addTo(map.current);
      });

      // Configurar función global para navegación desde popup
      (window as any).navigateToThisContact = (contactId: string) => {
        const contact = visibleContacts.find(c => c.id === contactId);
        if (contact) {
          handleNavigateToContact(contact);
        }
      };
    };

    const showFallbackMap = () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="
            width: 100%; 
            height: 500px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 24px;
            position: relative;
          ">
            <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 24px; border-radius: 16px; max-width: 400px;">
              <h3 style="margin: 0 0 16px 0; font-size: 24px;">🗺️ Urban Drive GPS</h3>
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; opacity: 0.9;">Estado del GPS: ${isTracking ? '🟢 Activo' : '🔴 Inactivo'}</p>
                ${trackedUserLocation ? `
                  <p style="margin: 0; opacity: 0.8; font-size: 14px;">
                    📍 ${trackedUserLocation[1].toFixed(6)}, ${trackedUserLocation[0].toFixed(6)}
                  </p>
                ` : `
                  <p style="margin: 0; opacity: 0.8; font-size: 14px;">Esperando ubicación GPS...</p>
                `}
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin: 16px 0;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; text-align: center;">
                  <div>
                    <div style="font-size: 20px; font-weight: bold;">${totalContacts}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Contactos</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold;">${nearbyContacts}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Cercanos</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold;">${drivers}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Conductores</div>
                  </div>
                  <div>
                    <div style="font-size: 20px; font-weight: bold;">${users}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Usuarios</div>
                  </div>
                </div>
              </div>

              ${error ? `
                <div style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.3); padding: 12px; border-radius: 8px; margin: 12px 0;">
                  <p style="margin: 0; font-size: 14px;">⚠️ ${error}</p>
                </div>
              ` : ''}

              <p style="margin: 16px 0 0 0; font-size: 12px; opacity: 0.7;">
                El mapa interactivo se cargará automáticamente cuando Mapbox esté disponible
              </p>
            </div>
          </div>
        `;
      }
    };

    loadMapbox();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Limpiar función global
      if ((window as any).navigateToThisContact) {
        delete (window as any).navigateToThisContact;
      }
    };
  }, []); // Solo ejecutar una vez al montar

  // Actualizar centro del mapa cuando cambie la ubicación
  useEffect(() => {
    if (map.current && trackedUserLocation) {
      map.current.easeTo({
        center: trackedUserLocation,
        zoom: 15,
        duration: 1000
      });
    }
  }, [trackedUserLocation]);

  // Actualizar marcadores cuando cambien los contactos o ubicación
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Limpiar marcadores existentes
    const existingMarkers = document.querySelectorAll('.gps-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Re-ejecutar función de marcadores
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    // Código de marcadores aquí (simplificado para evitar duplicación)
    const currentUserLocation = trackedUserLocation || (userLocation ? 
      [userLocation.longitude, userLocation.latitude] : null);

    if (currentUserLocation) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.className = 'gps-marker user-marker';
      userMarkerEl.innerHTML = `
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background-color: #3b82f6; 
          border: 4px solid white; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
          ${userType === 'driver' ? '🚗' : '👤'}
        </div>
      `;

      new mapboxgl.Marker(userMarkerEl)
        .setLngLat(currentUserLocation)
        .addTo(map.current);
    }

    // Agregar marcadores de contactos
    visibleContacts.forEach(contact => {
      if (!contact.location) return;

      const contactMarkerEl = document.createElement('div');
      contactMarkerEl.className = 'gps-marker contact-marker';
      contactMarkerEl.innerHTML = `
        <div style="
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          background-color: ${contact.userType === 'driver' ? '#10b981' : '#6b7280'}; 
          border: 3px solid white; 
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        ">
          ${contact.userType === 'driver' ? '🚗' : '👤'}
        </div>
      `;

      contactMarkerEl.addEventListener('click', () => {
        handleNavigateToContact(contact);
      });

      new mapboxgl.Marker(contactMarkerEl)
        .setLngLat([contact.location.longitude, contact.location.latitude])
        .addTo(map.current);
    });
  }, [visibleContacts, trackedUserLocation, userLocation, userType]);

  const handleNavigateToContact = (contact: any) => {
    if (selectContactForNavigation(contact) && contact.location) {
      setNavigationDestination([contact.location.longitude, contact.location.latitude]);
      setSelectedContactName(contact.displayName);
      setShowNavigation(true);
    }
  };

  const handleCloseNavigation = () => {
    setShowNavigation(false);
    setNavigationDestination(undefined);
    setSelectedContactName('');
  };

  return (
    <div className="w-full relative">
      {/* Información de estado GPS */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              GPS {isTracking ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          
          {/* Toggle de visibilidad */}
          <VisibilityToggle 
            userId={userId}
            userType={userType}
            className="ml-4"
          />
          
          <div className="text-sm text-gray-600">
            {totalContacts} contactos visibles
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded">
            <div className="font-semibold text-blue-600">{totalContacts}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-semibold text-green-600">{nearbyContacts}</div>
            <div className="text-gray-600">Cercanos</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-semibold text-emerald-600">{drivers}</div>
            <div className="text-gray-600">Conductores</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-semibold text-gray-600">{users}</div>
            <div className="text-gray-600">Usuarios</div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden border shadow-lg"
        style={{ height: '500px', minHeight: '400px' }}
      />

      {/* Botón flotante de navegación */}
      <button
        onClick={() => setShowNavigation(true)}
        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-10"
        title="Abrir navegación GPS"
      >
        <Navigation size={24} />
      </button>

      {/* Interfaz de navegación */}
      <NavigationInterface
        isVisible={showNavigation}
        onClose={handleCloseNavigation}
        destination={navigationDestination}
        contactName={selectedContactName}
      />

      {/* CSS para animaciones */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        `
      }} />
    </div>
  );
};

export default GPSMapComponent;