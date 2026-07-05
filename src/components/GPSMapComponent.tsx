import React, { useEffect, useRef, useState, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../lib/mapboxProxy'; // enruta el SDK vía proxy propio (fix Starlink)
import { Navigation } from 'lucide-react';
import useContactTracking from '../hooks/useContactTracking';
import NavigationInterface from './NavigationInterface';
import VoicePushToTalk from './VoicePushToTalk';
import { useApp } from '../contexts/AppContext';
import { MAP_STYLE } from '../lib/mapStyle';

function createAvatarMarkerEl(
  photoURL: string | undefined,
  displayName: string,
  markerUserType: 'user' | 'driver',
  isCurrentUser: boolean,
  isTracking?: boolean
): HTMLElement {
  const size = isCurrentUser ? 36 : 30;
  const borderColor = isCurrentUser
    ? '#f59e0b'
    : markerUserType === 'driver'
    ? '#10b981'
    : '#6b7280';
  const borderWidth = isCurrentUser ? 3 : 2;
  const bgColor = isCurrentUser
    ? '#f59e0b'
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
  const { t } = useApp();
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
    
    // mapbox-gl viene en el bundle (import estático): no depende del CDN,
    // que fallaba en redes con DNS/rutas problemáticas (p.ej. Starlink)
    const initializeMap = () => {
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
        
        // En móvil/GPUs débiles (p.ej. Xiaomi Redmi A10, Mali) el render 3D con pitch
        // alto rompe el canvas WebGL (carga y se queda en blanco). Mapa plano en móvil,
        // sin antialias, y forzar render aunque el navegador reporte GPU lenta.
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

        if (!mapContainer.current) return;
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: MAP_STYLE,
          center: currentLocation,
          zoom: trackedUserLocation ? 15 : 12, // Mayor zoom si tenemos ubicación precisa
          pitch: isMobile ? 0 : 45,
          bearing: 0,
          touchZoomRotate: true,
          touchPitch: !isMobile,
          antialias: false,
          failIfMajorPerformanceCaveat: false,
        });

        map.current.on('load', () => {
          console.log('GPS Map loaded successfully');
          setMapLoaded(true);
          // El contenedor suele tener 0px al inicializar dentro de tabs/flex; forzar
          // un resize cuando ya está visible evita un canvas roto/vacío.
          requestAnimationFrame(() => map.current?.resize());
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox map error:', e);
          showFallbackMap();
        });

        // Recupera el mapa si el navegador pierde el contexto WebGL (común en
        // dispositivos de gama baja con poca memoria).
        const canvas = map.current.getCanvas();
        canvas.addEventListener('webglcontextlost', (ev: Event) => {
          ev.preventDefault();
          console.warn('WebGL context lost; intentando recuperar el mapa');
        });
        canvas.addEventListener('webglcontextrestored', () => {
          map.current?.resize();
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

    initializeMap();

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
      if (contact.location?.longitude == null || contact.location?.latitude == null) return;
      const { longitude, latitude } = contact.location;

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
        .setLngLat([longitude, latitude])
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
              GPS {isTracking ? t('active') : t('inactive')}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-amber-500 dark:text-amber-400">{totalContacts}</div>
              <div className="text-muted-foreground">{t('inMap')}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">{drivers}</div>
              <div className="text-muted-foreground">{t('driversLabel')}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">{users}</div>
              <div className="text-muted-foreground">{t('usersLabel')}</div>
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
        className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-xl transition-colors z-10"
        title={t('openGpsNav')}
      >
        <Navigation size={24} />
      </button>

      {/* Botón flotante de voz (PTT) */}
      <VoicePushToTalk
        contacts={visibleContacts.filter((c) => c.location) as any}
        onNavigateTo={(contact) => handleNavigateToContact(contact)}
      />

      {/* Interfaz de navegación */}
      <NavigationInterface
        isVisible={showNavigation}
        onClose={handleCloseNavigation}
        destination={navigationDestination}
        contactName={selectedContactName}
        contactsForNav={visibleContacts.filter(c => c.location) as any}
        onSelectContact={handleNavigateToContact}
        user={user}
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