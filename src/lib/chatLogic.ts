/**
 * Lógica pura de la mensajería (sin dependencias de Firebase) — testeable en aislamiento.
 */

/** Ventana de vigencia del indicador "escribiendo…" */
export const TYPING_TTL_MS = 6_000;

/** Se considera "en línea" si el último heartbeat tiene menos de 2 minutos */
export const ONLINE_WINDOW_MS = 120_000;

/** Estado de ticks de un mensaje propio: ✓ / ✓✓ / ✓✓ azul */
export function messageTickState(m: { read: boolean; delivered?: boolean }): 'sent' | 'delivered' | 'read' {
  if (m.read) return 'read';
  if (m.delivered) return 'delivered';
  return 'sent';
}

/** ¿El contacto está escribiendo? */
export function isTypingActive(
  typing: { [key: string]: number } | undefined,
  contactId: string,
  now: number = Date.now()
): boolean {
  const ts = typing?.[contactId];
  return typeof ts === 'number' && ts > 0 && now - ts < TYPING_TTL_MS;
}

/**
 * Formatea la última conexión estilo WhatsApp:
 * "en línea" / "últ. vez hoy a las 14:30" / "últ. vez ayer a las 09:15" / "últ. vez 12/05/2026"
 */
export function formatLastSeen(
  lastActiveAt: Date | null,
  t: (k: string) => string,
  now: Date = new Date()
): string | null {
  if (!lastActiveAt) return null;
  const diff = now.getTime() - lastActiveAt.getTime();
  if (diff < ONLINE_WINDOW_MS) return t('online');

  const time = lastActiveAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  if (lastActiveAt.toDateString() === now.toDateString()) {
    return t('lastSeenTodayAt').replace('{time}', time);
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (lastActiveAt.toDateString() === yesterday.toDateString()) {
    return t('lastSeenYesterdayAt').replace('{time}', time);
  }
  return t('lastSeenOn').replace('{date}', lastActiveAt.toLocaleDateString('es'));
}
