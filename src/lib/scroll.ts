import type Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

/** Registra (o limpia) la instancia compartida de Lenis para smooth-scroll programático. */
export function setLenis(instance: Lenis | null): void {
  lenisInstance = instance;
}

/** Smooth-scroll a una sección por selector CSS. Cae a scrollIntoView nativo si no hay Lenis. */
export function scrollToSection(target: string): void {
  const el = document.querySelector(target);
  if (!el) return;
  if (lenisInstance) {
    lenisInstance.scrollTo(el as HTMLElement);
  } else {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
