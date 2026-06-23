# Urban Drive — Sub-proyecto 1: Sistema de diseño + Landing con motion por scroll

- **Fecha:** 2026-06-23
- **Estado:** Aprobado para implementación (pendiente revisión final del usuario)
- **Autor:** Mario Moreno + Claude
- **Sub-proyecto:** 1 de 5 (sistema de diseño → landing → auth social → vistas autenticadas → mapa)

## 1. Contexto y objetivo

Urban Drive (React + Vite + Tailwind + shadcn/ui, Firebase Auth, Mapbox) tiene un landing rediseñado
("Kinetic Dark / Neon Mobility") que ya se muestra en `/`, pero con tres problemas concretos: no
incluye el logo, hay espacio vacío entre el hero y el CTA, y no hay coherencia visual con el resto de
la app. La causa raíz de la incoherencia es que **conviven dos paletas desconectadas**: el landing usa
los tokens `brand.ink/cyan/lime`, mientras la app autenticada se pinta con las variables shadcn `.dark`
de `src/index.css`, que hoy son **grises monocromáticas sin marca**.

El objetivo de este sub-proyecto es establecer la **fundación de diseño** —un único set de tokens y un
sistema de motion por scroll ligado al tema de movilidad— y validarlo arreglando el landing. Las vistas
autenticadas y el mapa se refactorizan en sub-proyectos posteriores, pero heredarán esta fundación.

## 2. Decisiones ya tomadas (con el usuario)

- **Identidad:** extender el lenguaje del landing ("Kinetic Dark / Neon Mobility") a toda la app.
- **Motion:** combo recomendado — ① Live Route Trace (espina dorsal en todas las secciones) + ③
  Night-Drive parallax (hero) + ② City Flow Field (una sección destacada). Sin WebGL.
- **Patrón de header:** replicar el del portafolio del usuario (`HeaderMUI`: sticky que se transforma en
  scroll + smooth-scroll a secciones + drawer móvil), con identidad propia (no MUI).
- **Auth:** fuera de alcance aquí; se resuelve en el sub-proyecto 3 con Google/Apple sobre el Firebase
  Auth actual (sin migrar a Clerk/Supabase).

## 3. Principios de diseño (de la investigación, mediados 2026)

- **A evitar (lee como "diseño de IA"):** fondos mesh-gradient/aurora animados; combo "liquid glass +
  bento + mesh gradient"; esferas de partículas Three.js; neón cyan en *todas* las superficies sin
  jerarquía.
- **Regla de oro:** motion **semánticamente ligado al contenido** (rutas, GPS, tráfico, velocidad) y
  **un motivo firma** que cruza todas las secciones, no un truco distinto por sección.
- **Jerarquía del neón:** el cyan/lima se reserva para lo *vivo/activo* (la ruta, la posición actual,
  estados activos). Las superficies base son ink + blanco a baja opacidad (glass).

## 4. Alcance

**Dentro:**
- Unificación de tokens (CSS vars shadcn + `brand.*` + tipografía + radios).
- Componente de navegación superior (`TopNav`) con transform-on-scroll, smooth-scroll y drawer móvil.
- Capa de motion por scroll: `RouteTrace` (global), `NightDriveHero` (hero), `TrafficFlowField` (una sección).
- Orquestación Lenis + GSAP (un solo loop RAF / ticker).
- Arreglo del landing: logo, cierre del hueco hero↔CTA, ritmo de secciones, contenido real en Features.
- Degradación completa con `prefers-reduced-motion` y fallbacks móviles.

**Fuera (sub-proyectos posteriores):**
- Refactor de las vistas autenticadas (home, contactos, mensajes, perfil, settings).
- Auth social (Google/Apple).
- Rediseño del mapa estilo Uber.
- Cualquier cambio de copy/contenido de marketing más allá de llenar Features con texto coherente.

## 5. Arquitectura

### 5.1 Tokens de diseño (`src/index.css`, `tailwind.config.js`)

Recablear el bloque `.dark` de `src/index.css` para que las variables shadcn expresen la marca. La app
ya renderiza en `.dark`, así que esto desplaza **toda** la UI existente sin tocar cada componente:

| Variable | Valor objetivo (HSL aprox.) | Rol |
|---|---|---|
| `--background` | ink `#0A0B0D` → `220 13% 4%` | fondo base |
| `--card`, `--popover` | ~`220 12% 8%` | superficies elevadas (resuelve el form de login lavado) |
| `--primary` | cyan `#00E5FF` → `186 100% 50%` | acción primaria / "vivo" |
| `--primary-foreground` | ink | texto sobre cyan |
| `--accent` | lime `#B6FF3C` → `84 100% 62%` | realce / estado activo |
| `--ring` | cyan | foco |
| `--border`, `--input` | blanco baja opacidad (`0 0% 100% / 10%`) | bordes glass |
| `--muted-foreground` | `220 9% 64%` | texto secundario legible sobre ink |
| `--radius` | `0.75rem` (de `0.5rem`) | look redondeado del landing |

- Mantener `brand.ink/cyan/lime` y `fontFamily.display` (Space Grotesk) en `tailwind.config.js`.
- Definir utilidades canónicas en `@layer components`: `glow-btn`, `ghost-btn` (ya existen — estandarizar)
  y alinear las variantes del `Button` de shadcn (`default` → glow cyan, `outline` → ghost).
- Escala tipográfica de headings con `font-display`.

### 5.2 Navegación superior — `src/components/landing/TopNav.tsx` (nuevo)

- Estructura propia (Tailwind + shadcn, **no MUI**). `position: fixed/sticky`, `z-50`.
- Estado `isScrolled` (listener de `scroll`, umbral ~10px): transparente arriba →
  `bg-brand-ink/80 backdrop-blur-xl` + borde inferior sutil + reducción de padding, con transición.
- Izquierda: `UrbanDrive.png` (de `public/assets/`) + wordmark "Urban Drive" (`font-display`).
- Centro/derecha (desktop ≥`lg`): nav con smooth-scroll a secciones (`#features`, `#flow`, `#cta`) vía
  Lenis (`lenis.scrollTo(target)`), + CTAs "Iniciar sesión" (ghost → `/login`) y "Empezar" (glow → `/register`).
- Móvil (<`lg`): botón hamburguesa → drawer lateral (shadcn `Sheet`) con los mismos enlaces + CTAs.
- Accesibilidad: roles/aria del menú, foco visible (`--ring` cyan), targets ≥44px (ya en `index.css`).

### 5.3 Sistema de motion por scroll

Orquestación base (un solo módulo, `src/components/landing/SmoothScroll.tsx` ya envuelve con Lenis):
- Integrar el RAF de Lenis con el ticker de GSAP y llamar `ScrollTrigger.update` en cada scroll de Lenis,
  para que los scenes pinneados/scrubbed sean fluidos.
- Registrar plugins una vez: `gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin)`.
- Toda animación se monta con `useGSAP` (`@gsap/react`) para cleanup automático, y se envuelve en
  `gsap.matchMedia()` para gating de `prefers-reduced-motion`.

**① `RouteTrace.tsx` (espina dorsal, fondo de toda la página)**
- Capa de fondo fija detrás del contenido (`fixed inset-0 -z-10`), un SVG sobredimensionado con:
  - una trama tenue de "calles" (strokes blanco baja opacidad) — oculta `<md`;
  - una `path` de ruta principal (cyan) y un marcador (dot lima con glow = "posición actual").
- `ScrollTrigger` con `scrub: 1` sobre la línea de tiempo de scroll de la página:
  - `DrawSVGPlugin` anima `stroke-dashoffset` de la ruta (se "dibuja" al hacer scroll);
  - `MotionPathPlugin` mueve el marcador a lo largo de la misma `path`;
  - `gsap.quickTo()` sobre el grupo SVG (x/y inverso al marcador) = efecto "cámara" que centra el marcador.
- Cada sección registra un label/posición en la timeline (waypoint) para sincronizar reveals de contenido.

**③ `NightDriveHero.tsx` (solo hero)**
- 3 capas (skyline lejano, bordes de carretera con punto de fuga, glow de faros) en SVG/PNG-alpha.
- Parallax con **CSS `animation-timeline: scroll()`** + `animation-range` (0 KB JS, GPU). El barrido de
  faros = `radial-gradient` enmascarado animado en la misma timeline.
- Reemplaza/mejora el `NeonRoute` actual del hero; conserva el headline animado existente (GSAP `from`).

**② `TrafficFlowField.tsx` (una sección destacada, p. ej. "conductores cerca")**
- `<canvas>` 2D (no Three.js): ~150–400 partículas advectadas por un campo de ruido (curl/Perlin)
  precomputado; estelas tipo luces de tráfico (cyan flujo, lima sparse = "tu vehículo").
- `framer-motion`: `useScroll` → `useVelocity` alimenta un multiplicador de velocidad + alpha de estela
  al loop RAF del canvas. La sección va con panel `backdrop-blur` encima.

### 5.4 Arreglo del landing (`src/components/landing/*`)

- **Logo:** lo aporta `TopNav` (resuelve "no hay logo en ninguna parte").
- **Hueco hero↔CTA:** unificar ritmo vertical con una escala de espaciado de sección consistente
  (p. ej. `py-24 md:py-32`), y dar contenido real a `FeaturesSection` (3–4 features de movilidad:
  ubicación en vivo, mensajería, navegación, planes) usando `FeatureCard` con superficie glass.
- `Landing.tsx` compone: `TopNav` + `RouteTrace` (fondo) + `HeroSection`(con `NightDriveHero`) +
  `FeaturesSection` + sección con `TrafficFlowField` + `CtaSection`, todo dentro de `SmoothScroll`.

## 6. Componentes (nuevos / modificados)

| Componente | Tipo | Responsabilidad | Depende de |
|---|---|---|---|
| `index.css` / `tailwind.config.js` | mod | tokens unificados | — |
| `TopNav.tsx` | nuevo | navegación sticky + drawer + smooth-scroll | Lenis, shadcn Sheet/Button |
| `SmoothScroll.tsx` | mod | integrar Lenis↔GSAP ticker + registrar plugins | lenis, gsap |
| `RouteTrace.tsx` | nuevo | motivo firma de ruta en fondo global | gsap (ScrollTrigger/DrawSVG/MotionPath) |
| `NightDriveHero.tsx` | nuevo | parallax del hero (CSS scroll-timeline) | CSS |
| `TrafficFlowField.tsx` | nuevo | campo de flujo reactivo a velocidad | canvas 2D, framer-motion |
| `HeroSection.tsx` | mod | integrar NightDriveHero, conservar headline | NightDriveHero |
| `FeaturesSection.tsx` / `FeatureCard.tsx` | mod | contenido real + superficie glass | tokens |
| `Landing.tsx` | mod | composición final | todos los anteriores |

## 7. Rendimiento y móvil

- Sin WebGL; bundle se mantiene chico (solo SVG/canvas 2D + libs ya presentes).
- `RouteTrace`: simplificar la `path` a menos puntos bezier en pantallas chicas; ocultar trama de calles `<md`;
  limitar a ≤2 propiedades animadas concurrentes por scene pinneado en móvil (la caída de fps está en el nº
  de propiedades concurrentes, no en el SVG).
- `TrafficFlowField`: nº de partículas escalado por ancho/DPR (≈120 en móvil), DPR cap a 2, pausar el RAF
  con `IntersectionObserver` cuando la sección está fuera de pantalla.
- Lazy-load de la capa de motion donde aplique para no penalizar el first paint.

## 8. Accesibilidad y degradación

- `prefers-reduced-motion: reduce` (vía `gsap.matchMedia()` y `@media` CSS):
  - `RouteTrace`: **no** registrar ScrollTrigger; renderizar la ruta **ya dibujada** estática; reveals con
    fade CSS de 1 línea. El motivo "viaje" se comunica igual, sin scrub.
  - `NightDriveHero`: `@media` quita keyframes; capas en posición media (escena nocturna estática).
  - `TrafficFlowField`: congelar a un frame estático ("long-exposure"); fallback de gradiente si no hay canvas.
- Contraste: las nuevas superficies (`--card` ~8% L) garantizan legibilidad de formularios/tarjetas
  (corrige de paso el form de login lavado detectado antes).

## 9. Manejo de errores / robustez

- Registro de plugins GSAP y init de Lenis envueltos para no romper SSR/StrictMode doble-mount (`useGSAP` limpia).
- `TrafficFlowField`: si `getContext('2d')` falla, render del fallback estático (falla ruidosa en consola, UI intacta).
- Imports de plugins GSAP verificados en el plan (rutas `gsap/DrawSVGPlugin`, `gsap/MotionPathPlugin`).

## 10. Testing / verificación

- Tests basados en intención donde aporten (p. ej. `TopNav` cambia a estado scrolled tras superar el umbral;
  smooth-scroll dispara `lenis.scrollTo` con el target correcto).
- Verificación runtime (skill `verify`): build + screenshots del landing en móvil y desktop confirmando
  (a) logo presente en TopNav, (b) sin hueco vacío hero↔CTA, (c) ruta neón visible de fondo,
  (d) una vista autenticada para confirmar que el recableo de tokens se lee bien y con buen contraste.
- Verificar degradación con `prefers-reduced-motion` forzado.

## 11. Criterios de aceptación

1. El landing muestra el logo Urban Drive en una barra superior que se transforma con el scroll.
2. No hay espacio muerto entre hero y CTA; el ritmo de secciones es consistente.
3. Un motivo de ruta neón ligado al scroll cruza el fondo de todas las secciones principales.
4. Hero con parallax night-drive; una sección con campo de tráfico reactivo a la velocidad de scroll.
5. La app autenticada adopta la paleta neón-dark vía tokens, sin regresiones de contraste.
6. Todo degrada correctamente con `prefers-reduced-motion` y rinde aceptable en móvil.
7. El build pasa y el deploy a EasyPanel (push a `master`, autoDeploy) sirve el nuevo bundle.
