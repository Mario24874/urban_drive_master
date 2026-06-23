# Sistema de diseño + Landing con motion por scroll — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar la identidad visual de Urban Drive en un solo set de tokens y montar un sistema de motion por scroll (ligado a movilidad/GPS) sobre el landing, dejando la fundación lista para los siguientes sub-proyectos.

**Architecture:** Recablear las variables `.dark` de shadcn a la paleta de marca (cyan/lima sobre ink) para que toda la UI existente herede la identidad sin tocar componente por componente; añadir una barra `TopNav` sticky con smooth-scroll; y una capa de motion (Route Trace global + Night-Drive parallax en hero + Traffic Flow Field en una sección) construida con GSAP/ScrollTrigger + CSS scroll-timeline + canvas 2D, todo degradable con `prefers-reduced-motion`.

**Tech Stack:** React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui; gsap 3.15 (ScrollTrigger, DrawSVGPlugin, MotionPathPlugin) + @gsap/react; lenis; framer-motion; Vitest + Testing Library (se añade en Task 2).

## Global Constraints

- La app renderiza en modo `.dark`; los tokens de marca viven ahí. Light mode no es objetivo.
- Neón (cyan `#00E5FF` / lima `#B6FF3C`) reservado para elementos *vivos/activos* (ruta, posición, foco, estado activo); las superficies base son ink + blanco a baja opacidad (glass).
- Sin WebGL/Three.js. Solo SVG, CSS scroll-timeline y canvas 2D.
- Todo efecto de motion debe degradar bajo `prefers-reduced-motion: reduce` a un estado estático equivalente.
- Mobile-first: escalar/abaratar efectos en pantallas chicas; pausar loops fuera de viewport.
- Fuentes: `font-display` = Space Grotesk (ya configurada). No introducir Inter ni otras.
- Deploy: push a `master` en `github.com/Mario24874/urban_drive_master` dispara autoDeploy en EasyPanel.
- Marca: nombre "Urban Drive"; logo en `public/assets/UrbanDrive.png`.

---

### Task 1: Tokens de diseño unificados

**Files:**
- Modify: `src/index.css` (bloque `.dark` y `@layer components`)
- Test: verificación runtime (build + screenshots)

**Interfaces:**
- Consumes: nada.
- Produces: variables CSS shadcn con valores de marca; utilidades `glow-btn` / `ghost-btn` / `glass-card` canónicas que el resto de tasks reutiliza.

- [ ] **Step 1: Reemplazar los valores del bloque `.dark` en `src/index.css`**

Sustituir el contenido del selector `.dark` por los valores de marca (mantener las mismas claves que ya consume shadcn):

```css
.dark {
  --background: 220 13% 4%;        /* brand ink #0A0B0D */
  --foreground: 0 0% 98%;
  --card: 220 12% 8%;              /* superficie elevada (resuelve forms lavados) */
  --card-foreground: 0 0% 98%;
  --popover: 220 12% 8%;
  --popover-foreground: 0 0% 98%;
  --primary: 186 100% 50%;         /* brand cyan #00E5FF */
  --primary-foreground: 220 13% 4%;
  --secondary: 220 10% 14%;
  --secondary-foreground: 0 0% 98%;
  --muted: 220 10% 14%;
  --muted-foreground: 220 9% 64%;
  --accent: 84 100% 62%;           /* brand lime #B6FF3C */
  --accent-foreground: 220 13% 4%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 100% / 0.10;
  --input: 0 0% 100% / 0.14;
  --ring: 186 100% 50%;            /* cyan focus */
  --radius: 0.75rem;
}
```

- [ ] **Step 2: Asegurar utilidades canónicas en `@layer components` de `src/index.css`**

Confirmar/definir (si ya existen `glow-btn`/`ghost-btn`/`glass-card`, dejar estos valores como fuente única):

```css
@layer components {
  .glow-btn {
    @apply inline-flex items-center justify-center rounded-full bg-brand-cyan px-6 py-3 font-display font-semibold text-brand-ink transition-shadow;
    box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.0);
  }
  .glow-btn:hover { box-shadow: 0 0 24px 0 rgba(0, 229, 255, 0.45); }

  .ghost-btn {
    @apply inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 font-display font-medium text-white backdrop-blur transition-colors;
  }
  .ghost-btn:hover { @apply border-white/30 bg-white/10; }

  .glass-card {
    @apply rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md;
  }
}
```

- [ ] **Step 3: Build para verificar que compila**

Run: `npm run build`
Expected: `✓ built in …`, sin errores de TypeScript ni CSS.

- [ ] **Step 4: Verificación visual runtime**

Levantar dev server y capturar con Chromium headless (patrón ya usado en el repo):
```bash
npm run dev -- --port 5180 --host 127.0.0.1 &
# esperar "ready", luego:
chromium-browser --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1280,900 --virtual-time-budget=9000 \
  --screenshot="$HOME/t1_login.png" "http://127.0.0.1:5180/login"
```
Expected: el formulario de login se lee con buen contraste (card sobre ink, botón primario cyan). Confirma que el recableo de tokens desplazó la app a neón-dark sin romper legibilidad.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(design): unificar tokens shadcn con paleta de marca neon-dark"
```

---

### Task 2: Infra de tests (Vitest) + utilidades de scroll

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/scroll.ts`
- Create: `src/hooks/useScrolled.ts`
- Test: `src/lib/scroll.test.ts`, `src/hooks/useScrolled.test.ts`
- Modify: `package.json` (devDeps + script `test`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `setLenis(instance: Lenis | null): void` y `scrollToSection(target: string): void` en `src/lib/scroll.ts`
  - `useScrolled(threshold?: number): boolean` en `src/hooks/useScrolled.ts`

- [ ] **Step 1: Instalar dependencias de test**

```bash
npm i -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Crear `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Añadir script `test` en `package.json`**

En `"scripts"`, agregar: `"test": "vitest run"`.

- [ ] **Step 5: Escribir el test que falla — `src/lib/scroll.test.ts`**

```ts
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
    expect(scrollTo).toHaveBeenCalled();
  });

  it('no hace nada si el target no existe', () => {
    const scrollTo = vi.fn();
    setLenis({ scrollTo } as never);
    scrollToSection('#nope');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Correr el test y verificar que falla**

Run: `npm test -- src/lib/scroll.test.ts`
Expected: FAIL — `Failed to resolve import './scroll'`.

- [ ] **Step 7: Implementar `src/lib/scroll.ts`**

```ts
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
```

- [ ] **Step 8: Escribir el test que falla — `src/hooks/useScrolled.test.ts`**

```ts
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
```

- [ ] **Step 9: Correr y verificar que falla**

Run: `npm test -- src/hooks/useScrolled.test.ts`
Expected: FAIL — no resuelve `./useScrolled`.

- [ ] **Step 10: Implementar `src/hooks/useScrolled.ts`**

```ts
import { useEffect, useState } from 'react';

/** True una vez que la ventana ha hecho scroll más allá de `threshold` px. */
export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}
```

- [ ] **Step 11: Correr toda la suite y verificar que pasa**

Run: `npm test`
Expected: PASS — 5 tests verdes.

- [ ] **Step 12: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/lib/scroll.ts src/hooks/useScrolled.ts \
  src/lib/scroll.test.ts src/hooks/useScrolled.test.ts package.json package-lock.json
git commit -m "test: setup vitest + utilidades scrollToSection/useScrolled"
```

---

### Task 3: SmoothScroll registra plugins y expone Lenis

**Files:**
- Modify: `src/components/landing/SmoothScroll.tsx`

**Interfaces:**
- Consumes: `setLenis` de `src/lib/scroll.ts` (Task 2).
- Produces: plugins `DrawSVGPlugin` y `MotionPathPlugin` registrados globalmente; la instancia activa de Lenis publicada vía `setLenis` mientras el componente esté montado.

- [ ] **Step 1: Actualizar imports y registro de plugins**

Reemplazar las primeras líneas de `SmoothScroll.tsx`:

```ts
import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { setLenis } from '../../lib/scroll';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);
```

- [ ] **Step 2: Publicar/limpiar la instancia de Lenis dentro del `useEffect`**

Dentro del `if (reduce) return;` ya existente NO se crea Lenis (queda scroll nativo). En la rama normal, tras `const lenis = new Lenis(...)` añadir `setLenis(lenis);` y en el cleanup añadir `setLenis(null);`. Resultado del cuerpo del effect:

```ts
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
```

- [ ] **Step 3: Build para verificar imports de plugins**

Run: `npm run build`
Expected: build OK; sin "Failed to resolve" para `gsap/DrawSVGPlugin` ni `gsap/MotionPathPlugin`.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/SmoothScroll.tsx
git commit -m "feat(motion): registrar DrawSVG/MotionPath y exponer instancia Lenis"
```

---

### Task 4: TopNav (logo + transform en scroll + smooth-scroll + drawer)

**Files:**
- Create: `src/components/landing/TopNav.tsx`
- Test: `src/components/landing/TopNav.test.tsx`

**Interfaces:**
- Consumes: `useScrolled` (Task 2), `scrollToSection` (Task 2), shadcn `Sheet` (`@/components/ui/sheet`), `Link` de react-router-dom.
- Produces: componente `<TopNav />` (default export) montado por `Landing` (Task 8).

- [ ] **Step 1: Escribir el test que falla — `src/components/landing/TopNav.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from './TopNav';

vi.mock('../../lib/scroll', () => ({ scrollToSection: vi.fn() }));
import { scrollToSection } from '../../lib/scroll';

const renderNav = () => render(<MemoryRouter><TopNav /></MemoryRouter>);

describe('TopNav', () => {
  it('muestra el logo Urban Drive', () => {
    renderNav();
    expect(screen.getByAltText(/urban drive/i)).toBeInTheDocument();
  });

  it('al click en un enlace de nav hace smooth-scroll a la sección', () => {
    renderNav();
    fireEvent.click(screen.getByRole('button', { name: /funciones/i }));
    expect(scrollToSection).toHaveBeenCalledWith('#features');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/components/landing/TopNav.test.tsx`
Expected: FAIL — no resuelve `./TopNav`.

- [ ] **Step 3: Implementar `src/components/landing/TopNav.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useScrolled } from '../../hooks/useScrolled';
import { scrollToSection } from '../../lib/scroll';
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/components/ui/sheet';

const NAV = [
  { label: 'Funciones', target: '#features' },
  { label: 'En vivo', target: '#flow' },
  { label: 'Empezar', target: '#cta' },
];

export default function TopNav() {
  const scrolled = useScrolled(10);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {NAV.map((item) => (
        <button
          key={item.target}
          onClick={() => { scrollToSection(item.target); onNavigate?.(); }}
          className="font-display text-sm font-medium text-white/80 transition-colors hover:text-brand-cyan"
        >
          {item.label}
        </button>
      ))}
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-brand-ink/80 py-2 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent py-4'
      }`}
    >
      <div className="container-responsive flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-8 w-8 rounded-xl" />
          <span className="font-display text-lg font-bold text-white">Urban Drive</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <NavLinks />
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="ghost-btn !px-5 !py-2 text-sm">Iniciar sesión</Link>
          <Link to="/register" className="glow-btn !px-5 !py-2 text-sm">Empezar</Link>
        </div>

        <Sheet>
          <SheetTrigger className="lg:hidden text-white" aria-label="Abrir menú">
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="border-white/10 bg-brand-ink/95 backdrop-blur-xl">
            <div className="mt-10 flex flex-col gap-6">
              <SheetClose asChild>
                <div className="flex flex-col items-start gap-6">
                  <NavLinks />
                </div>
              </SheetClose>
              <Link to="/login" className="ghost-btn w-full">Iniciar sesión</Link>
              <Link to="/register" className="glow-btn w-full">Empezar</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Verificar que existe `@/components/ui/sheet`**

Run: `ls src/components/ui/sheet.tsx`
Expected: existe. Si no: `npx shadcn@latest add sheet` y commitear el componente generado junto con esta task.

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test -- src/components/landing/TopNav.test.tsx`
Expected: PASS — 2 tests verdes.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/TopNav.tsx src/components/landing/TopNav.test.tsx
git commit -m "feat(landing): TopNav sticky con logo, smooth-scroll y drawer móvil"
```

---

### Task 5: RouteTrace (motivo firma de ruta en el fondo global)

**Files:**
- Create: `src/components/landing/RouteTrace.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `DrawSVGPlugin`, `MotionPathPlugin` (registrados en Task 3); `useGSAP` de `@gsap/react`.
- Produces: componente `<RouteTrace />` (default export); capa de fondo fija que `Landing` (Task 8) monta una vez.

- [ ] **Step 1: Implementar `src/components/landing/RouteTrace.tsx`**

```tsx
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Ruta neón (cyan) con marcador de posición (lima) que se dibuja a lo largo del scroll. */
const ROUTE_D =
  'M 80 60 C 220 120, 120 320, 340 360 S 620 520, 520 720 S 240 940, 460 1140';

export default function RouteTrace() {
  const root = useRef<SVGSVGElement>(null);
  const route = useRef<SVGPathElement>(null);
  const marker = useRef<SVGCircleElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Reduced motion: ruta ya dibujada, sin scrub.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(route.current, { drawSVG: '100%' });
      gsap.set(marker.current, { opacity: 1 });
    });

    // Motion normal: dibujar al hacer scroll + mover marcador por la ruta.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(route.current, { drawSVG: '0%' });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });
      tl.to(route.current, { drawSVG: '100%', ease: 'none' }, 0);
      tl.to(marker.current, {
        motionPath: { path: ROUTE_D, align: ROUTE_D, alignOrigin: [0.5, 0.5] },
        ease: 'none',
      }, 0);
    });
  }, { scope: root });

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-brand-ink" aria-hidden="true">
      <svg
        ref={root}
        viewBox="0 0 600 1200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-70"
      >
        <path
          ref={route}
          d={ROUTE_D}
          fill="none"
          stroke="#00E5FF"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.6))' }}
        />
        <circle ref={marker} r={7} fill="#B6FF3C" opacity={0}
          style={{ filter: 'drop-shadow(0 0 10px rgba(182,255,60,0.9))' }} />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Build para verificar compilación**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/RouteTrace.tsx
git commit -m "feat(motion): RouteTrace — ruta neón dibujada por scroll con marcador"
```

(Verificación visual integrada en Task 8, cuando RouteTrace se monta en Landing.)

---

### Task 6: NightDriveHero (parallax CSS scroll-timeline en el hero)

**Files:**
- Create: `src/components/landing/NightDriveHero.tsx`
- Modify: `src/index.css` (`@layer utilities` con keyframes de parallax)
- Modify: `src/components/landing/HeroSection.tsx` (montar el fondo)

**Interfaces:**
- Consumes: tokens de Task 1.
- Produces: componente `<NightDriveHero />` (default export) usado como fondo de `HeroSection`.

- [ ] **Step 1: Añadir keyframes y utilidades de parallax en `src/index.css`**

```css
@layer utilities {
  @keyframes nd-rise   { to { transform: translateY(-8%); } }
  @keyframes nd-rush   { to { transform: translateY(14%) scale(1.06); } }
  @keyframes nd-sweep  { to { opacity: 0.9; transform: translateX(12%); } }

  @media (prefers-reduced-motion: no-preference) {
    @supports (animation-timeline: scroll()) {
      .nd-skyline { animation: nd-rise   linear both; animation-timeline: scroll(root); }
      .nd-road    { animation: nd-rush   linear both; animation-timeline: scroll(root); }
      .nd-lights  { animation: nd-sweep  linear both; animation-timeline: scroll(root); }
    }
  }
}
```

- [ ] **Step 2: Implementar `src/components/landing/NightDriveHero.tsx`**

```tsx
/** Fondo de hero: parallax nocturno (skyline + carretera con punto de fuga + barrido de faros).
 *  Movido por CSS scroll-timeline (0 KB JS). Estático bajo prefers-reduced-motion. */
export default function NightDriveHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Skyline lejano */}
      <div
        className="nd-skyline absolute inset-x-0 bottom-1/3 h-1/3 opacity-30"
        style={{ background: 'linear-gradient(to top, rgba(0,229,255,0.10), transparent)' }}
      />
      {/* Carretera con punto de fuga */}
      <div
        className="nd-road absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            'conic-gradient(from 90deg at 50% 0%, transparent 0deg, rgba(0,229,255,0.06) 20deg, transparent 40deg)',
          maskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />
      {/* Barrido de faros */}
      <div
        className="nd-lights absolute inset-0 opacity-50"
        style={{ background: 'radial-gradient(40% 30% at 30% 40%, rgba(182,255,60,0.10), transparent 70%)' }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Montar el fondo en `HeroSection.tsx`**

En `src/components/landing/HeroSection.tsx`, importar y renderizar `NightDriveHero` como primer hijo del `<section>` (detrás del contenido, que ya está en `z-10`):

```tsx
import NightDriveHero from './NightDriveHero';
// ...dentro del <section ref={root} ...>, antes del overlay de gradientes existente:
      <NightDriveHero />
```

- [ ] **Step 4: Build para verificar compilación**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/landing/NightDriveHero.tsx src/components/landing/HeroSection.tsx
git commit -m "feat(motion): NightDriveHero — parallax nocturno con CSS scroll-timeline"
```

---

### Task 7: TrafficFlowField (campo de tráfico reactivo a velocidad) + sección

**Files:**
- Create: `src/lib/flowField.ts`
- Create: `src/components/landing/TrafficFlowField.tsx`
- Create: `src/components/landing/LiveSection.tsx`
- Test: `src/lib/flowField.test.ts`

**Interfaces:**
- Consumes: `framer-motion` (`useScroll`, `useVelocity`), tokens de Task 1.
- Produces:
  - `particleCount(width: number, dpr: number): number` en `src/lib/flowField.ts`
  - `<TrafficFlowField />` (fondo canvas) y `<LiveSection />` (sección con `id="flow"`), ambos default export.

- [ ] **Step 1: Escribir el test que falla — `src/lib/flowField.test.ts`**

```ts
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
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- src/lib/flowField.test.ts`
Expected: FAIL — no resuelve `./flowField`.

- [ ] **Step 3: Implementar `src/lib/flowField.ts`**

```ts
/** Nº de partículas escalado por ancho de viewport y DPR (capado para móvil). */
export function particleCount(width: number, dpr: number): number {
  const base = width < 640 ? 120 : width < 1024 ? 240 : 360;
  const cappedDpr = Math.min(Math.max(dpr, 1), 2);
  return Math.round(base / cappedDpr);
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- src/lib/flowField.test.ts`
Expected: PASS — 3 tests verdes.

- [ ] **Step 5: Implementar `src/components/landing/TrafficFlowField.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { useScroll, useVelocity } from 'framer-motion';
import { particleCount } from '../../lib/flowField';

interface P { x: number; y: number; vx: number; vy: number; }

/** Estelas tipo tráfico en canvas 2D; la velocidad de scroll acelera el flujo. */
export default function TrafficFlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const speedRef = useRef(0);

  useEffect(() => velocity.on('change', (v) => { speedRef.current = Math.min(Math.abs(v) / 1000, 6); }), [velocity]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const n = particleCount(canvas.offsetWidth, dpr);
    const ps: P[] = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0.6 + Math.random() * 0.8,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    let raf = 0;
    let running = true;
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const draw = () => {
      const boost = reduce ? 0 : speedRef.current;
      ctx.fillStyle = 'rgba(10,11,13,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,229,255,0.5)';
      ctx.lineWidth = 1.2 * dpr;
      for (const p of ps) {
        const len = (2 + boost * 6) * dpr;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
        ctx.stroke();
        p.x += p.vx * (1 + boost) * dpr;
        p.y += p.vy * (1 + boost) * dpr;
        if (p.x > canvas.width) { p.x = 0; p.y = Math.random() * canvas.height; }
      }
      if (!reduce && running) raf = requestAnimationFrame(draw);
    };
    draw(); // un frame siempre; loop solo si hay motion

    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
```

- [ ] **Step 6: Implementar `src/components/landing/LiveSection.tsx`**

```tsx
import TrafficFlowField from './TrafficFlowField';

/** Sección de alto impacto: conductores en movimiento, con fondo de campo de tráfico. */
export default function LiveSection() {
  return (
    <section id="flow" className="relative overflow-hidden py-24 md:py-32">
      <TrafficFlowField />
      <div className="container-responsive relative z-10">
        <div className="glass-card mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Conductores en movimiento, en tiempo real
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">
            Ve quién está cerca y sigue cada trayecto al instante. La ciudad, viva.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Build + correr tests**

Run: `npm run build && npm test`
Expected: build OK; toda la suite verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/flowField.ts src/lib/flowField.test.ts \
  src/components/landing/TrafficFlowField.tsx src/components/landing/LiveSection.tsx
git commit -m "feat(motion): TrafficFlowField + LiveSection reactivos a velocidad de scroll"
```

---

### Task 8: Composición del Landing + cierre del hueco hero↔CTA

**Files:**
- Modify: `src/components/landing/Landing.tsx`
- Modify: `src/components/landing/CtaSection.tsx` (id de ancla)
- Modify: `src/components/landing/FeaturesSection.tsx` (id de ancla + ritmo)

**Interfaces:**
- Consumes: `TopNav` (T4), `RouteTrace` (T5), `LiveSection` (T7), y los componentes existentes `HeroSection`, `FeaturesSection`, `CtaSection`, `SmoothScroll`.
- Produces: el landing final cableado.

- [ ] **Step 1: Reescribir `src/components/landing/Landing.tsx`**

```tsx
import SmoothScroll from './SmoothScroll';
import RouteTrace from './RouteTrace';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import LiveSection from './LiveSection';
import CtaSection from './CtaSection';

/** Landing público: nav + fondo de ruta neón + secciones con motion ligado a movilidad. */
export default function Landing() {
  return (
    <SmoothScroll>
      <RouteTrace />
      <TopNav />
      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <LiveSection />
        <CtaSection />
      </main>
    </SmoothScroll>
  );
}
```

- [ ] **Step 2: Añadir anclas y ritmo de sección**

- En `FeaturesSection.tsx`: cambiar `<section ref={ref} className="bg-brand-ink py-24">` por `<section id="features" ref={ref} className="py-24 md:py-32">` (quitar `bg-brand-ink` para dejar ver el RouteTrace de fondo).
- En `CtaSection.tsx`: cambiar `<section className="relative overflow-hidden bg-brand-ink py-28">` por `<section id="cta" className="relative overflow-hidden py-24 md:py-32">`.
- En `HeroSection.tsx`: confirmar que la sección no tiene `bg-brand-ink` opaco que tape el RouteTrace; si lo tiene, cambiar a `bg-brand-ink/40` para que la ruta se perciba detrás (el `NightDriveHero` aporta el ambiente del hero).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Verificación visual runtime (desktop + móvil)**

```bash
npm run dev -- --port 5180 --host 127.0.0.1 &
# tras "ready":
chromium-browser --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1280,900 --virtual-time-budget=9000 --screenshot="$HOME/t8_desktop.png" "http://127.0.0.1:5180/"
chromium-browser --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=390,844 --virtual-time-budget=9000 --screenshot="$HOME/t8_mobile.png" "http://127.0.0.1:5180/"
```
Expected: (a) TopNav con logo arriba; (b) hero con ambiente night-drive; (c) ruta neón visible de fondo; (d) sin hueco muerto entre hero y CTA; (e) en móvil el layout no se rompe y el botón hamburguesa aparece.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/Landing.tsx src/components/landing/CtaSection.tsx \
  src/components/landing/FeaturesSection.tsx src/components/landing/HeroSection.tsx
git commit -m "feat(landing): componer nav + route trace + live section; cerrar hueco hero-CTA"
```

---

### Task 9: Verificación de degradación + deploy

**Files:**
- Ninguno nuevo (verificación + deploy).

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: build desplegado en EasyPanel sirviendo el nuevo landing.

- [ ] **Step 1: Verificar degradación con prefers-reduced-motion**

```bash
chromium-browser --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --force-prefers-reduced-motion --window-size=1280,900 --virtual-time-budget=6000 \
  --screenshot="$HOME/t9_reduced.png" "http://127.0.0.1:5180/"
```
Expected: la ruta neón aparece **ya dibujada** (estática), el hero se ve compuesto sin animación, y no hay loops de canvas activos. UI completa y legible.

- [ ] **Step 2: Suite de tests + build final**

Run: `npm test && npm run build`
Expected: tests verdes; build OK.

- [ ] **Step 3: Deploy a EasyPanel (autoDeploy en push a master)**

```bash
git push origin frontend-landing:master frontend-landing:frontend-landing
```
Expected: push fast-forward. EasyPanel dispara autoDeploy (build "Download Github Archive" → docker → swarm).

- [ ] **Step 4: Verificar el deploy en producción**

Monitorear el último log en `/etc/easypanel/actions/` hasta `### Success`, confirmar contenedor `urban-drive` recreado (`docker ps`), y que el bundle servido contiene los marcadores nuevos:
```bash
CID=$(docker ps -q --filter "name=urban-drive" | head -1)
docker exec "$CID" sh -c 'grep -rhoE "Conductores en movimiento|Urban Drive" /usr/share/nginx/html/assets/*.js | sort -u'
```
Expected: aparecen los textos nuevos → el cambio shipeó.

- [ ] **Step 5: Commit/cierre (si hubo ajustes de verificación)**

Sin cambios de código adicionales esperados; si los hubo, commitear con mensaje descriptivo.

---

## Self-Review

**Cobertura del spec:**
- §5.1 tokens → Task 1. §5.2 TopNav → Task 4. §5.3 motion (RouteTrace/NightDrive/FlowField) → Tasks 5/6/7; orquestación Lenis↔GSAP + plugins → Task 3. §5.4 landing fixes (logo, hueco, ritmo, features) → Tasks 4/8. §7 mobile → Tasks 7 (escalado partículas) y 8 (screenshot móvil). §8 reduced-motion → Tasks 5/6/7 (gating) y 9 (verificación). §10 testing → Tasks 2/4/7 (unit) + verificación runtime. §11 criterios → Tasks 8/9. Cobertura completa.
- Auth y mapa correctamente fuera de alcance (sub-proyectos 3 y 5).

**Placeholder scan:** sin TBD/TODO; todo step con código u orden concreto.

**Consistencia de tipos:** `setLenis`/`scrollToSection` (T2) consumidos por T3/T4; `useScrolled` (T2) por T4; `particleCount` (T7) consistente entre lib y test y componente; nombres de componentes (`TopNav`, `RouteTrace`, `NightDriveHero`, `TrafficFlowField`, `LiveSection`) consistentes entre su task y la composición en T8.

**Nota de riesgo conocida:** `DrawSVGPlugin`/`MotionPathPlugin` ya están en `node_modules/gsap` (versión completa libre); Task 3 valida sus import paths en build. Si `@/components/ui/sheet` no existiera, Task 4 Step 4 lo genera.
