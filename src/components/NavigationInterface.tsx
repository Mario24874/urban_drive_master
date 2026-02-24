import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Volume2, VolumeX, RotateCcw, X, MapPin, Clock, Search, RefreshCw } from 'lucide-react';
import navigationService, { NavigationState } from '../services/navigation';

interface ContactForNav {
  id: string;
  displayName: string;
  userType: 'user' | 'driver';
  location: { longitude: number; latitude: number } | null;
  phone?: string;
  photoURL?: string;
}

interface GeocodeResult {
  id: string;
  name: string;
  coords: [number, number];
}

interface NavigationInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  destination?: [number, number];
  contactName?: string;
  contactsForNav?: ContactForNav[];
  onSelectContact?: (contact: ContactForNav) => void;
  user?: any;
}

/** Render a circular avatar: photo if available, initials otherwise */
function NavAvatar({ photoURL, displayName, userType, size = 40 }: {
  photoURL?: string;
  displayName: string;
  userType: 'user' | 'driver';
  size?: number;
}) {
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const bg = userType === 'driver' ? 'bg-emerald-500' : 'bg-blue-500';
  const sizeClass = size === 40 ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-xs';

  if (photoURL) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20`}>
        <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full ${bg} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
      {initials}
    </div>
  );
}

const NavigationInterface: React.FC<NavigationInterfaceProps> = ({
  isVisible,
  onClose,
  destination,
  contactName,
  contactsForNav = [],
  onSelectContact,
  user,
}) => {
  const [navState, setNavState] = useState<NavigationState>(navigationService.getState());
  const [isStarting, setIsStarting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const navMapInstance = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Address search state
  const [addressQuery, setAddressQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressCoords, setAddressCoords] = useState<[number, number] | undefined>();
  const [addressName, setAddressName] = useState('');

  // Effective destination: address input overrides contact prop
  const effectiveDestination = addressCoords ?? destination;
  const effectiveName = addressName || contactName || '';

  // Reset address when a contact destination is set from outside
  useEffect(() => {
    if (destination) {
      setAddressCoords(undefined);
      setAddressName('');
      setAddressQuery('');
      setGeocodeResults([]);
    }
  }, [destination]);

  // Debounced geocoding
  useEffect(() => {
    if (addressQuery.length < 3) {
      setGeocodeResults([]);
      setIsGeocoding(false);
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token?.startsWith('pk.')) return;

    setIsGeocoding(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressQuery)}.json?access_token=${token}&language=es&limit=5`
        );
        const data = await res.json();
        setGeocodeResults(
          (data.features || []).map((f: any) => ({
            id: f.id,
            name: f.place_name,
            coords: f.center as [number, number],
          }))
        );
      } catch {
        setGeocodeResults([]);
      } finally {
        setIsGeocoding(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const clearAddress = () => {
    setAddressQuery('');
    setGeocodeResults([]);
    setAddressCoords(undefined);
    setAddressName('');
  };

  useEffect(() => {
    const handleStateChange = (newState: NavigationState) => {
      setNavState(newState);
    };
    navigationService.addListener(handleStateChange);
    return () => navigationService.removeListener(handleStateChange);
  }, []);

  // Initialize Mapbox map when navigation becomes active
  useEffect(() => {
    if (!navState.isNavigating) {
      if (navMapInstance.current) {
        navMapInstance.current.remove();
        navMapInstance.current = null;
        userMarkerRef.current = null;
      }
      return;
    }

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

        const dest = navigationService.getState().destination;
        if (dest) {
          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat(dest)
            .addTo(navMapInstance.current);
        }

        const userEl = document.createElement('div');
        const _photoURL = user?.photoURL || '';
        const _name = user?.displayName || user?.email || 'Yo';
        const _initials = _name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const _inner = _photoURL
          ? `<img src="${_photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" />`
          : `<span style="font-size:13px;font-weight:bold;color:white;user-select:none;">${_initials}</span>`;
        const markerDiv = document.createElement('div');
        markerDiv.style.cssText = 'position:relative;display:inline-block;';
        markerDiv.innerHTML = `
          <div style="width:36px;height:36px;border-radius:50%;background:#3b82f6;border:3px solid white;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,0.4);">${_inner}</div>
          <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #3b82f6;"></div>
        `;
        userEl.appendChild(markerDiv);
        const userLoc = navigationService.getState().userLocation;
        if (userLoc) {
          userMarkerRef.current = new mapboxgl.Marker({ element: markerDiv })
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
    if (!effectiveDestination) return;
    setIsStarting(true);
    const success = await navigationService.startNavigation(effectiveDestination, effectiveName);
    setIsStarting(false);
    if (!success) {
      alert('Error al iniciar la navegación. Verifica los permisos de ubicación.');
    }
  };

  const handleStopNavigation = () => navigationService.stopNavigation();
  const toggleVoice = () => navigationService.toggleVoice(!navState.voiceEnabled);
  const repeatInstruction = () => navigationService.repeatInstruction();

  const formatDistance = (meters: number) =>
    meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation size={22} />
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {navState.isNavigating ? 'Navegando' : 'Urban Drive GPS'}
              </h2>
              {effectiveName && !navState.isNavigating && (
                <p className="text-blue-200 text-xs">Hacia: {effectiveName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {navState.isNavigating && (
              <>
                <button
                  onClick={toggleVoice}
                  className="p-2 rounded-full bg-blue-700 dark:bg-blue-800 hover:bg-blue-800 transition-colors"
                  title={navState.voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                >
                  {navState.voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button
                  onClick={repeatInstruction}
                  className="p-2 rounded-full bg-blue-700 dark:bg-blue-800 hover:bg-blue-800 transition-colors"
                  title="Repetir instrucción"
                >
                  <RotateCcw size={18} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Info — shown while navigating */}
      {navState.isNavigating && (
        <div className="bg-card border-b border-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formatDistance(navState.remainingDistance)}
                </div>
                <div className="text-xs text-muted-foreground">Distancia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formatTime(navState.remainingTime)}
                </div>
                <div className="text-xs text-muted-foreground">Tiempo</div>
              </div>
            </div>
            <button
              onClick={handleStopNavigation}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Finalizar
            </button>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Navigation size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">
                {navState.nextInstruction || 'Calculando ruta...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {!navState.isNavigating ? (
          <div className="h-full overflow-y-auto bg-background">
            <div className="max-w-md w-full mx-auto p-4 space-y-3">

              {/* Address search input */}
              {!effectiveDestination && (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
                    {isGeocoding ? (
                      <RefreshCw size={17} className="text-muted-foreground animate-spin flex-shrink-0" />
                    ) : (
                      <Search size={17} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <input
                      type="text"
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      placeholder="Buscar dirección o lugar..."
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none min-w-0"
                    />
                    {addressQuery && (
                      <button onClick={clearAddress} className="flex-shrink-0">
                        <X size={15} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  {geocodeResults.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                      {geocodeResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setAddressCoords(r.coords);
                            setAddressName(r.name);
                            setAddressQuery('');
                            setGeocodeResults([]);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border last:border-0"
                        >
                          <MapPin size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground leading-snug">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Destination card + Start button */}
              {effectiveDestination ? (
                <>
                  <div className="text-center pt-1">
                    <div className="w-14 h-14 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MapPin size={28} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {effectiveName ? `Navegar hacia ${effectiveName}` : 'Destino seleccionado'}
                    </h3>
                  </div>

                  <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{effectiveName || 'Destino'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {effectiveDestination[1].toFixed(5)}, {effectiveDestination[0].toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change destination */}
                  <button
                    onClick={clearAddress}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Cambiar destino
                  </button>

                  <button
                    onClick={handleStartNavigation}
                    disabled={isStarting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
                  >
                    {isStarting ? (
                      <><Clock size={20} className="animate-spin" /><span>Calculando ruta...</span></>
                    ) : (
                      <><Navigation size={20} /><span>Iniciar Navegación</span></>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Contact picker (only when no address typed) */}
                  {!addressQuery && (
                    <>
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">o elige un contacto</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {contactsForNav.length > 0 ? (
                        <div className="space-y-2">
                          {contactsForNav.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => onSelectContact?.(c)}
                              className="w-full flex items-center gap-3 bg-card hover:bg-accent active:bg-accent/80 border border-border p-4 rounded-xl shadow-sm transition-colors text-left"
                            >
                              <NavAvatar
                                photoURL={c.photoURL}
                                displayName={c.displayName}
                                userType={c.userType}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate text-sm">{c.displayName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.userType === 'driver' ? 'Conductor' : 'Usuario'}
                                  {c.phone ? ` · ${c.phone}` : ''}
                                </p>
                              </div>
                              <Navigation size={16} className="text-blue-500 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-card border border-border p-5 rounded-xl text-center">
                          <p className="text-muted-foreground text-sm mb-1">
                            Ningún contacto tiene ubicación activa.
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Busca una dirección arriba o espera a que un contacto comparta su GPS.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          // Live Mapbox map during navigation
          <div className="h-full relative">
            <div ref={mapRef} className="absolute inset-0" />
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

      {/* Footer */}
      <div className="bg-card border-t border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Urban Drive GPS</span>
          <div className="flex items-center gap-3">
            {navState.userLocation && (
              <span>
                {navState.userLocation[1].toFixed(4)}, {navState.userLocation[0].toFixed(4)}
              </span>
            )}
            {navState.isNavigating && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>GPS Activo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationInterface;
