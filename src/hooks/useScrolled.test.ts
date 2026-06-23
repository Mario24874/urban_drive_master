import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrolled } from './useScrolled';

describe('useScrolled', () => {
  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('es false al tope de la página', () => {
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(false);
  });

  it('pasa a true tras superar el umbral', () => {
    const { result } = renderHook(() => useScrolled(10));
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);
  });
});
