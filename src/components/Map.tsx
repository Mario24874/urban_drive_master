import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Configura el token de acceso de Mapbox desde las variables de entorno
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Interfaz para el conductor
interface Driver {
  id: string;
  latitude: number;
  longitude: number;
}

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDriverListVisible, setIsDriverListVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (map.current) return; // Inicializa el mapa solo una vez
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mariomoreno24874/cm2e3oshc002n01pbdfmv1qtj', // Nuevo Style URL
      center: [-69.3348, 10.0636], // Cambiado a Barquisimeto, Venezuela
      zoom: isMobile ? 11 : 12, // Ajustar zoom para móvil
      pitch: isMobile ? 45 : 60, // Reducir inclinación en móvil
      bearing: 0,
      touchZoomRotate: true, // Habilitar gestos táctiles
      touchPitch: isMobile, // Permitir inclinación táctil en móvil
      dragRotate: !isMobile, // Desactivar rotación por arrastre en móvil
    });

    // Añade controles de navegación con configuración móvil
    const navControl = new mapboxgl.NavigationControl({
      showCompass: !isMobile, // Ocultar brújula en móvil para ahorrar espacio
      showZoom: true,
      visualizePitch: isMobile
    });
    map.current.addControl(navControl, 'top-right');

    // Añade un control para mostrar la ubicación actual del usuario
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: true
    });
    map.current.addControl(geolocateControl, 'top-right');

    // Configuraciones adicionales para móvil
    if (isMobile) {
      // Deshabilitar el doble clic para zoom en móvil (evita zoom accidental)
      map.current.doubleClickZoom.disable();
      
      // Configurar límites de zoom para móvil
      map.current.setMinZoom(9);
      map.current.setMaxZoom(18);
    }

    // Escucha las actualizaciones de ubicación de los conductores
    const unsubscribe = onSnapshot(collection(db, 'driver_locations'), (snapshot) => {
      const updatedDrivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      setDrivers(updatedDrivers);
    });

    // Obtén la ubicación actual del usuario
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              essential: true
            });
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }

    return () => {
      if (map.current) map.current.remove(); // Limpia el mapa al desmontar el componente
      unsubscribe(); // Detiene la escucha de actualizaciones de Firestore
    };
  }, [isMobile]);

  useEffect(() => {
    if (!map.current) return;

    // Limpia los marcadores existentes
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers[0]) {
      markers[0].parentNode?.removeChild(markers[0]);
    }

    // Añade marcadores para cada conductor con tamaño responsivo
    drivers.forEach(driver => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      // Tamaño responsivo del marcador
      const markerSize = isMobile ? '35px' : '40px';
      
      el.style.backgroundImage = 'url(https://placekitten.com/g/40/40)';
      el.style.width = markerSize;
      el.style.height = markerSize;
      el.style.backgroundSize = 'cover';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      
      // Mejorar accesibilidad táctil
      if (isMobile) {
        el.style.transform = 'scale(1.1)';
        el.style.transition = 'transform 0.2s ease';
      }

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        maxWidth: isMobile ? '200px' : '300px'
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">Driver ID: ${driver.id}</h3>
          <p class="text-sm text-gray-600 mt-1">
            Lat: ${driver.latitude.toFixed(4)}<br>
            Lng: ${driver.longitude.toFixed(4)}
          </p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([driver.longitude, driver.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [drivers, isMobile]);

  // Función para centrar el mapa en un conductor
  const focusOnDriver = (driver: Driver) => {
    if (map.current) {
      map.current.flyTo({
        center: [driver.longitude, driver.latitude],
        zoom: isMobile ? 15 : 16,
        essential: true
      });
      
      // Cerrar lista de conductores en móvil después de seleccionar
      if (isMobile) {
        setIsDriverListVisible(false);
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Contenedor del mapa con clase CSS responsiva */}
      <div ref={mapContainer} className="map-container" />
      
      {/* Botón para mostrar/ocultar lista de conductores en móvil */}
      {isMobile && (
        <button
          onClick={() => setIsDriverListVisible(!isDriverListVisible)}
          className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:bg-opacity-100"
          aria-label={isDriverListVisible ? 'Ocultar lista de conductores' : 'Mostrar lista de conductores'}
        >
          <div className="flex items-center space-x-2">
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${isDriverListVisible ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-medium">
              {drivers.length} {drivers.length === 1 ? 'Conductor' : 'Conductores'}
            </span>
          </div>
        </button>
      )}
      
      {/* Lista de conductores responsiva */}
      <div className={`
        ${isMobile 
          ? `absolute inset-x-4 bottom-4 transform transition-all duration-300 z-20 ${
              isDriverListVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-full opacity-0 pointer-events-none'
            }`
          : 'mt-4'
        }
      `}>
        <div className={`
          bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden
          ${isMobile ? 'max-h-64' : ''}
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Conductores Disponibles ({drivers.length})
              </h3>
              {isMobile && (
                <button
                  onClick={() => setIsDriverListVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cerrar lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className={`overflow-y-auto ${isMobile ? 'max-h-48' : 'max-h-60'} scrollbar-hide`}>
            {drivers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No hay conductores disponibles</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {drivers.map(driver => (
                  <li key={driver.id} className="touch-list-item cursor-pointer hover:bg-gray-50" onClick={() => focusOnDriver(driver)}>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Conductor {driver.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;