import mapboxgl from 'mapbox-gl';

/**
 * Enruta todas las peticiones del SDK de Mapbox (estilos, tiles, glyphs,
 * sprites) a través del proxy nginx del propio dominio (/mapbox-api →
 * api.mapbox.com). Motivo: redes como Starlink bloquean o degradan el
 * acceso directo a api.mapbox.com; el dominio de la app siempre funciona.
 *
 * Importar este módulo (efecto secundario) antes de crear cualquier mapa.
 * En dev (vite) no hay nginx delante: se conserva el acceso directo.
 */
export const MAPBOX_PROXY_PREFIX = '/mapbox-api';

const useProxy = import.meta.env.PROD;

if (useProxy) {
  // El SDK construye sus URLs sobre baseApiUrl; al apuntarlo al proxy,
  // todo el tráfico del mapa viaja por urbandrive.cloud.
  (mapboxgl as any).baseApiUrl = `${window.location.origin}${MAPBOX_PROXY_PREFIX}`;
}

/** Reescribe una URL absoluta de api.mapbox.com hacia el proxy (fetch manuales) */
export function proxyMapboxUrl(url: string): string {
  if (!useProxy) return url;
  return url.replace('https://api.mapbox.com', `${window.location.origin}${MAPBOX_PROXY_PREFIX}`);
}
