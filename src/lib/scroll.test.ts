import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrollToSection, setLenis } from './scroll';

describe('scrollToSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="features"></section>';
    setLenis(null);
  });

  it('usa scrollIntoView nativo si no hay Lenis', () => {
    const el = document.querySelector('#features') as HTMLElement;
    const spy = vi.fn();
    el.scrollIntoView = spy;
    scrollToSection('#features');
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('delega en Lenis.scrollTo si está registrado', () => {
    const scrollTo = vi.fn();
    setLenis({ scrollTo } as never);
    scrollToSection('#features');
    expect(scrollTo).toHaveBeenCalledWith(document.querySelector('#features'));
  });

  it('no hace nada si el target no existe', () => {
    const scrollTo = vi.fn();
    setLenis({ scrollTo } as never);
    scrollToSection('#nope');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
