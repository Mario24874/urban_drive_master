import React, { useEffect, useRef, useState, memo } from 'react';
import { Navigation } from 'lucide-react';
import useContactTracking from '../hooks/useContactTracking';
import NavigationInterface from './NavigationInterface';

function createAvatarMarkerEl(
  photoURL: string | undefined,
  displayName: string,
  markerUserType: 'user' | 'driver',
  isCurrentUser: boolean,
  isTracking?: boolean
): HTMLElement {
  const size = isCurrentUser ? 36 : 30;
  const borderColor = isCurrentUser
    ? '#3b82f6'
    : markerUserType === 'driver'
    ? '#10b981'
    : '#6b7280';
  const borderWidth = isCurrentUser ? 3 : 2;
  const bgColor = isCurrentUser
    ? '#3b82f6'
    : markerUserType === 'driver'
    ? '#10b981'
    : '#6b7280';

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const innerContent = photoURL
    ? `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" />`
    : `<span style="font-size:${isCurrentUser ? 13 : 11}px;font-weight:bold;color:white;user-select:none;">${initials}</span>`;

  const trackingDot = isCurrentUser
    ? `<div style="
        position:absolute;
        top:-4px;
        right:-4px;
        width:10px;
        height:10px;
        background-color:${isTracking ? '#10b981' : '#ef4444'};
        border:2px solid white;
        border-radius:50%;
        z-index:1;
        ${isTracking ? 'animation:pulse 2s infinite;' : ''}
      "></div>`
    : '';

  const el = document.createElement('div');
  el.className = `gps-marker ${isCurrentUser ? 'user-marker' : 'contact-marker'}`;
  el.style.cssText = 'position:relative;display:inline-block;';
  el.innerHTML = `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background-color:${bgColor};
      border:${borderWidth}px solid ${borderColor};
      box-shadow:0 3px 8px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      cursor:${isCurrentUser ? 'default' : 'pointer'};
    ">${innerContent}</div>
    ${trackingDot}
    <div style="
      position:absolute;
      bottom:-8px;
      left:50%;
      transform:translateX(-50%);
      width:0;
      height:0;
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-top:8px solid ${borderColor};
    "></div>
  `;
  return el;
}

interface GPSMapComponentProps {
  userLocation: any;
  user: any;
  userId: string;
  userType: 'user' | 'driver';
  isActive?: boolean;
  /** When set, immediately opens navigation toward this contact */
  navTarget?: any;
}

const GPSMapComponent: React.FC<GPSMapComponentProps> = ({
  userLocation,
  user,
  userId,
  userType,
  isActive = true,
  navTarget,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<[number, number] | undefined>();
  const [selectedContactName, setSelectedContactName] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const {
    visibleContacts,
    userLocation: trackedUserLocation,
    isTracking,
    error,
    startLocationTracking,
    stopLocationTracking,
    selectContactForNavigation,
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
          style: 'mapbox://styles/mapbox/streets-v12',
          center: currentLocation,
          zoom: trackedUserLocation ? 15 : 12, // Mayor zoom si tenemos ubicación precisa
          pitch: 45,
          bearing: 0,
          touchZoomRotate: true,
          touchPitch: true
        });

        map.current.on('load', () => {
          console.log('GPS Map loaded successfully');
          setMapLoaded(true);
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
          trackUserLocation: false,
          showUserHeading: true,
          showAccuracyCircle: true,
          fitBoundsOptions: {
            maxZoom: 16
          }
        });
        
        map.current.addControl(geolocateControl, 'top-right');

      } catch (error) {
        console.error('Error creating GPS map:', error);
        showFallbackMap();
      }
    };

    const showFallbackMap = () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
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

  // Resize map when tab becomes active (fixes blank map on mobile)
  useEffect(() => {
    if (isActive && map.current) {
      setTimeout(() => {
        map.current.resize();
      }, 100);
    }
  }, [isActive]);

  // Resize map on orientation/window change (landscape ↔ portrait)
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        setTimeout(() => map.current.resize(), 150);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Trigger navigation when a contact is passed from ContactList
  useEffect(() => {
    if (navTarget?.location) {
      handleNavigateToContact(navTarget);
    }
  }, [navTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualizar marcadores cuando cambien los contactos o ubicación
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

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
      const userMarkerEl = createAvatarMarkerEl(
        user?.photoURL,
        user?.displayName || user?.email || 'U',
        userType,
        true,
        isTracking
      );

      new mapboxgl.Marker(userMarkerEl)
        .setLngLat(currentUserLocation)
        .addTo(map.current);
    }

    // Agregar marcadores de contactos
    visibleContacts.forEach(contact => {
      if (!contact.location) return;

      const contactMarkerEl = createAvatarMarkerEl(
        contact.photoURL,
        contact.displayName || '?',
        contact.userType || 'user',
        false
      );

      contactMarkerEl.addEventListener('click', () => {
        handleNavigateToContact(contact);
      });

      new mapboxgl.Marker(contactMarkerEl)
        .setLngLat([contact.location.longitude, contact.location.latitude])
        .addTo(map.current);
    });
  }, [visibleContacts, trackedUserLocation, userLocation, userType, mapLoaded]);

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
    <div className="w-full h-full flex flex-col relative">
      {/* Información de estado GPS */}
      <div className="flex-shrink-0 px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-foreground">
              GPS {isTracking ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-blue-600 dark:text-blue-400">{totalContacts}</div>
              <div className="text-muted-foreground">En mapa</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">{drivers}</div>
              <div className="text-muted-foreground">Conductores</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">{users}</div>
              <div className="text-muted-foreground">Usuarios</div>
            </div>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive">⚠️ {error}</p>
        )}
      </div>

      {/* Mapa — flex-1 fills remaining height */}
      <div
        ref={mapContainer}
        className="flex-1 w-full min-h-0 overflow-hidden"
      />

      {/* Botón flotante de navegación */}
      <button
        onClick={() => setShowNavigation(true)}
        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white p-4 rounded-full shadow-xl transition-colors z-10"
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
        contactsForNav={visibleContacts.filter(c => c.location) as any}
        onSelectContact={handleNavigateToContact}
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

export default memo(GPSMapComponent);