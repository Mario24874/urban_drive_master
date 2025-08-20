import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
  userLocation: any;
  contacts: any[];
  user: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ userLocation, contacts, user }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    // Cargar Mapbox GL JS dinámicamente
    const loadMapbox = async () => {
      if (map.current) return; // El mapa ya está inicializado

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

      // Token público de Mapbox (válido para desarrollo)
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidXJiYW5kcml2ZSIsImEiOiJjbTJwOGV2ZjEwMGVwMmlweDZuZzF5ZGdwIn0.example';
      
      console.log('Mapbox token available:', !!accessToken);
      console.log('Environment check:', import.meta.env.MODE);
      
      if (!accessToken || accessToken.includes('example')) {
        console.warn('Using fallback - configure VITE_MAPBOX_ACCESS_TOKEN in Netlify');
        showFallbackMap();
        return;
      }
      
      mapboxgl.accessToken = accessToken;

      // Configurar ubicación inicial
      const initialLocation = userLocation ? 
        [userLocation.longitude, userLocation.latitude] : 
        [-74.072092, 4.710989]; // Bogotá por defecto

      try {
        console.log('Creating Mapbox map with location:', initialLocation);
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: initialLocation,
          zoom: userLocation ? 13 : 10
        });

        map.current.on('load', () => {
          console.log('Mapbox map loaded successfully');
          addMarkersToMap();
        });

        map.current.on('error', (e: any) => {
          console.error('Mapbox map error:', e);
          showFallbackMap();
        });
      } catch (error) {
        console.error('Error creating Mapbox map:', error);
        showFallbackMap();
      }

      // Agregar controles de navegación
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    };

    const addMarkersToMap = () => {
      const mapboxgl = (window as any).mapboxgl;
      
      if (!mapboxgl || !map.current) return;

      // Agregar marcador del usuario actual
      if (userLocation) {
        const userMarkerEl = document.createElement('div');
        userMarkerEl.innerHTML = `
          <div style="
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            background-color: #3b82f6; 
            border: 3px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">
            ${user?.displayName?.charAt(0) || 'U'}
          </div>
        `;

        new mapboxgl.Marker(userMarkerEl)
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-weight: bold;">Tú</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ${user?.displayName || user?.email}<br>
                  ${userLocation.method === 'GPS/WiFi' ? '📍 GPS/WiFi' : '📍 IP Aproximada'}<br>
                  ±${userLocation.accuracy < 100 ? Math.round(userLocation.accuracy) + 'm' : Math.round(userLocation.accuracy/1000) + 'km'}
                </p>
              </div>
            `)
          )
          .addTo(map.current);
      }

      // Agregar marcadores de contactos
      contacts.filter(contact => contact.location).forEach(contact => {
        const contactMarkerEl = document.createElement('div');
        const isDriver = contact.userType === 'driver';
        
        contactMarkerEl.innerHTML = `
          <div style="
            width: 18px; 
            height: 18px; 
            border-radius: 50%; 
            background-color: ${isDriver ? '#10b981' : '#6b7280'}; 
            border: 2px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            font-weight: bold;
          ">
            ${contact.displayName?.charAt(0) || 'C'}
          </div>
        `;

        new mapboxgl.Marker(contactMarkerEl)
          .setLngLat([contact.location.longitude, contact.location.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-weight: bold;">${contact.displayName}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ${isDriver ? '🚗 Conductor' : '👤 Usuario'}<br>
                  📞 ${contact.phone || 'No especificado'}<br>
                  ${contact.location.city ? '📍 ' + contact.location.city : ''}
                </p>
              </div>
            `)
          )
          .addTo(map.current);
      });
    };

    const showFallbackMap = () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div style="
            width: 100%; 
            height: 400px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 20px;
          ">
            <h3 style="margin: 0 0 16px 0; font-size: 20px;">🗺️ Mapa Urban Drive</h3>
            <p style="margin: 0 0 16px 0; opacity: 0.9;">Configurar token de Mapbox en variables de entorno</p>
            <p style="margin: 0 0 16px 0; opacity: 0.7; font-size: 14px;">VITE_MAPBOX_ACCESS_TOKEN requerido</p>
            <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; width: 100%; max-width: 300px;">
              ${userLocation ? `
                <div style="margin-bottom: 12px;">
                  <strong>📍 Tu ubicación:</strong><br>
                  <small>Lat: ${userLocation.latitude.toFixed(6)}</small><br>
                  <small>Lng: ${userLocation.longitude.toFixed(6)}</small><br>
                  <small>${userLocation.city || 'Ubicación detectada'}</small>
                </div>
              ` : `
                <div style="margin-bottom: 12px;">
                  <strong>📍 Tu ubicación:</strong><br>
                  <small>Esperando GPS...</small>
                </div>
              `}
              
              ${contacts.filter(c => c.location).length > 0 ? `
                <div>
                  <strong>👥 Contactos cercanos:</strong><br>
                  ${contacts.filter(c => c.location).map(contact => 
                    `<small>${contact.userType === 'driver' ? '🚗' : '👤'} ${contact.displayName}</small>`
                  ).join('<br>')}
                </div>
              ` : `
                <div>
                  <strong>👥 Sin contactos visibles</strong>
                </div>
              `}
            </div>
            <p style="margin: 16px 0 0 0; font-size: 12px; opacity: 0.7;">
              El mapa interactivo se cargará automáticamente cuando esté disponible
            </p>
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
    };
  }, [userLocation, contacts]);

  // Actualizar marcadores cuando cambien los datos
  useEffect(() => {
    if (map.current && (window as any).mapboxgl) {
      // Limpiar marcadores existentes y volver a agregarlos
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
      
      // Reagregar marcadores
      setTimeout(() => {
        if (map.current && map.current.loaded()) {
          addMarkersToMap();
        }
      }, 100);
    }
  }, [userLocation, contacts]);

  const addMarkersToMap = () => {
    const mapboxgl = (window as any).mapboxgl;
    
    if (!mapboxgl || !map.current) return;

    // Agregar marcador del usuario actual
    if (userLocation) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.innerHTML = `
        <div style="
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          background-color: #3b82f6; 
          border: 3px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">
          ${user?.displayName?.charAt(0) || 'U'}
        </div>
      `;

      new mapboxgl.Marker(userMarkerEl)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">Tú</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                ${user?.displayName || user?.email}<br>
                ${userLocation.method === 'GPS/WiFi' ? '📍 GPS/WiFi' : '📍 IP Aproximada'}<br>
                ±${userLocation.accuracy < 100 ? Math.round(userLocation.accuracy) + 'm' : Math.round(userLocation.accuracy/1000) + 'km'}
              </p>
            </div>
          `)
        )
        .addTo(map.current);
    }

    // Agregar marcadores de contactos
    contacts.filter(contact => contact.location).forEach(contact => {
      const contactMarkerEl = document.createElement('div');
      const isDriver = contact.userType === 'driver';
      
      contactMarkerEl.innerHTML = `
        <div style="
          width: 18px; 
          height: 18px; 
          border-radius: 50%; 
          background-color: ${isDriver ? '#10b981' : '#6b7280'}; 
          border: 2px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 9px;
          font-weight: bold;
        ">
          ${contact.displayName?.charAt(0) || 'C'}
        </div>
      `;

      new mapboxgl.Marker(contactMarkerEl)
        .setLngLat([contact.location.longitude, contact.location.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${contact.displayName}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                ${isDriver ? '🚗 Conductor' : '👤 Usuario'}<br>
                📞 ${contact.phone || 'No especificado'}<br>
                ${contact.location.city ? '📍 ' + contact.location.city : ''}
              </p>
            </div>
          `)
        )
        .addTo(map.current);
    });
  };

  return (
    <div className="w-full">
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default MapComponent;