import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Volume2, VolumeX, RotateCcw, X, MapPin, Clock } from 'lucide-react';
import navigationService, { NavigationState } from '../services/navigation';

interface NavigationInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  destination?: [number, number];
  contactName?: string;
}

const NavigationInterface: React.FC<NavigationInterfaceProps> = ({
  isVisible,
  onClose,
  destination,
  contactName
}) => {
  const [navState, setNavState] = useState<NavigationState>(navigationService.getState());
  const [isStarting, setIsStarting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const navMapInstance = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    const handleStateChange = (newState: NavigationState) => {
      setNavState(newState);
    };

    navigationService.addListener(handleStateChange);

    return () => {
      navigationService.removeListener(handleStateChange);
    };
  }, []);

  // Initialize Mapbox map when navigation becomes active
  useEffect(() => {
    if (!navState.isNavigating) {
      // Clean up map when navigation stops
      if (navMapInstance.current) {
        navMapInstance.current.remove();
        navMapInstance.current = null;
        userMarkerRef.current = null;
      }
      return;
    }

    // Wait a tick for mapRef.current to be set after render
    const initTimer = setTimeout(() => {
      if (!mapRef.current) return;
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl) return;
      if (navMapInstance.current) return;

      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!accessToken?.startsWith('pk.')) return;

      mapboxgl.accessToken = accessToken;
      const center = navState.userLocation ?? navState.destination ?? [-74.072092, 4.710989];

      navMapInstance.current = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center,
        zoom: 15,
        pitch: 45,
      });

      navMapInstance.current.on('load', () => {
        const route = navigationService.getState().currentRoute;

        // Draw route polyline
        if (route?.geometry?.length) {
          navMapInstance.current.addSource('nav-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: route.geometry },
            },
          });
          navMapInstance.current.addLayer({
            id: 'nav-route',
            type: 'line',
            source: 'nav-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#3b82f6', 'line-width': 7, 'line-opacity': 0.9 },
          });
        }

        // Destination marker
        const dest = navigationService.getState().destination;
        if (dest) {
          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat(dest)
            .addTo(navMapInstance.current);
        }

        // User marker
        const userEl = document.createElement('div');
        userEl.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#3b82f6;border:4px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.4)">🚗</div>`;
        const userLoc = navigationService.getState().userLocation;
        if (userEl.firstChild && userLoc) {
          userMarkerRef.current = new mapboxgl.Marker({ element: userEl.firstChild as HTMLElement })
            .setLngLat(userLoc)
            .addTo(navMapInstance.current);
        }
      });
    }, 50);

    return () => {
      clearTimeout(initTimer);
      if (navMapInstance.current) {
        navMapInstance.current.remove();
        navMapInstance.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [navState.isNavigating]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep user marker in sync with GPS position
  useEffect(() => {
    if (!navMapInstance.current || !navState.userLocation) return;
    userMarkerRef.current?.setLngLat(navState.userLocation);
    navMapInstance.current.easeTo({ center: navState.userLocation, duration: 800 });
  }, [navState.userLocation]);

  const handleStartNavigation = async () => {
    if (!destination) return;

    setIsStarting(true);
    const success = await navigationService.startNavigation(destination, contactName);
    setIsStarting(false);

    if (!success) {
      alert('Error al iniciar la navegación. Verifica los permisos de ubicación.');
    }
  };

  const handleStopNavigation = () => {
    navigationService.stopNavigation();
  };

  const toggleVoice = () => {
    navigationService.toggleVoice(!navState.voiceEnabled);
  };

  const repeatInstruction = () => {
    navigationService.repeatInstruction();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation size={24} />
            <div>
              <h2 className="text-lg font-semibold">
                {navState.isNavigating ? 'Navegando' : 'Urban Drive GPS'}
              </h2>
              {contactName && (
                <p className="text-blue-100 text-sm">Hacia: {contactName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {navState.isNavigating && (
              <>
                <button
                  onClick={toggleVoice}
                  className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
                  title={navState.voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                >
                  {navState.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                
                <button
                  onClick={repeatInstruction}
                  className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
                  title="Repetir instrucción"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Info */}
      {navState.isNavigating && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatDistance(navState.remainingDistance)}
                </div>
                <div className="text-sm text-gray-600">Distancia</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(navState.remainingTime)}
                </div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
            </div>
            
            <button
              onClick={handleStopNavigation}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Finalizar
            </button>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Navigation size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">
                  {navState.nextInstruction || 'Calculando ruta...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {!navState.isNavigating ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <MapPin size={40} className="text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Navegación GPS
                </h3>
                <p className="text-gray-600">
                  {contactName ? 
                    `Inicia la navegación hacia ${contactName}` : 
                    'Selecciona un destino para comenzar'
                  }
                </p>
              </div>

              {destination && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {contactName || 'Destino seleccionado'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {destination[1].toFixed(6)}, {destination[0].toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartNavigation}
                    disabled={isStarting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isStarting ? (
                      <>
                        <Clock size={24} className="animate-spin" />
                        <span>Iniciando...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={24} />
                        <span>Iniciar Navegación</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">Características:</h4>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Instrucciones de voz en tiempo real</li>
                  <li>• Navegación turn-by-turn</li>
                  <li>• Recalculo automático de ruta</li>
                  <li>• Optimizado para móviles</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Live Mapbox map during navigation
          <div className="h-full relative">
            <div ref={mapRef} className="absolute inset-0" />
            {/* GPS waiting overlay — shown before map loads */}
            {!navState.userLocation && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
                <div className="text-center">
                  <Navigation size={40} className="mx-auto mb-3 animate-pulse" />
                  <p className="text-sm">Esperando señal GPS...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con información adicional */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Urban Drive GPS</span>
            {navState.userLocation && (
              <span>
                📍 {navState.userLocation[1].toFixed(4)}, {navState.userLocation[0].toFixed(4)}
              </span>
            )}
          </div>
          {navState.isNavigating && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>GPS Activo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationInterface;