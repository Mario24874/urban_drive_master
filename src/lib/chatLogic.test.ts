import { describe, it, expect } from 'vitest';
import { messageTickState, isTypingActive, TYPING_TTL_MS } from './chatLogic';
import { formatLastSeen, ONLINE_WINDOW_MS } from './chatLogic';

const t = (k: string) =>
  ((
    {
      online: 'En línea',
      lastSeenTodayAt: 'últ. vez hoy a las {time}',
      lastSeenYesterdayAt: 'últ. vez ayer a las {time}',
      lastSeenOn: 'últ. vez {date}',
    } as Record<string, string>
  )[k] ?? k);

describe('messageTickState — estados de entrega estilo WhatsApp', () => {
  it('mensaje recién enviado muestra un solo check', () => {
    expect(messageTickState({ read: false, delivered: false })).toBe('sent');
  });

  it('mensaje entregado (recibido por el dispositivo) muestra doble check', () => {
    expect(messageTickState({ read: false, delivered: true })).toBe('delivered');
  });

  it('mensaje leído muestra doble check azul aunque delivered no se haya marcado', () => {
    expect(messageTickState({ read: true, delivered: false })).toBe('read');
  });

  it('mensajes antiguos sin campo delivered se tratan como enviados', () => {
    expect(messageTickState({ read: false })).toBe('sent');
  });
});

describe('isTypingActive — vigencia del indicador escribiendo', () => {
  const now = 1_000_000;

  it('activo si la última tecla fue hace menos del TTL', () => {
    expect(isTypingActive({ abc: now - TYPING_TTL_MS + 1000 }, 'abc', now)).toBe(true);
  });

  it('caduca pasado el TTL', () => {
    expect(isTypingActive({ abc: now - TYPING_TTL_MS - 1 }, 'abc', now)).toBe(false);
  });

  it('ignora typing de otros usuarios y campos ausentes', () => {
    expect(isTypingActive({ otro: now }, 'abc', now)).toBe(false);
    expect(isTypingActive(undefined, 'abc', now)).toBe(false);
  });

  it('la señal limpiada (0) no cuenta como escribiendo', () => {
    expect(isTypingActive({ abc: 0 }, 'abc', now)).toBe(false);
  });
});

describe('formatLastSeen — presencia estilo WhatsApp', () => {
  const now = new Date('2026-07-05T15:00:00');

  it('en línea si el heartbeat es reciente', () => {
    const recent = new Date(now.getTime() - ONLINE_WINDOW_MS + 5_000);
    expect(formatLastSeen(recent, t, now)).toBe('En línea');
  });

  it('muestra hora si fue hoy', () => {
    const earlier = new Date('2026-07-05T09:30:00');
    expect(formatLastSeen(earlier, t, now)).toMatch(/^últ\. vez hoy a las/);
  });

  it('muestra ayer si fue ayer', () => {
    const yesterday = new Date('2026-07-04T22:00:00');
    expect(formatLastSeen(yesterday, t, now)).toMatch(/^últ\. vez ayer a las/);
  });

  it('muestra fecha si fue antes', () => {
    const old = new Date('2026-06-20T10:00:00');
    expect(formatLastSeen(old, t, now)).toMatch(/^últ\. vez \d/);
  });

  it('null cuando no hay dato de presencia (no inventa estado)', () => {
    expect(formatLastSeen(null, t, now)).toBeNull();
  });
});
