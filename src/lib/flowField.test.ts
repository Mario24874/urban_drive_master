import { describe, it, expect } from 'vitest';
import { particleCount } from './flowField';

describe('particleCount', () => {
  it('usa pocas partículas en móvil', () => {
    expect(particleCount(390, 3)).toBeLessThanOrEqual(120);
  });
  it('escala en desktop', () => {
    expect(particleCount(1440, 1)).toBe(360);
  });
  it('capa la influencia del dpr en 2', () => {
    expect(particleCount(1440, 3)).toBe(particleCount(1440, 2));
  });
});
