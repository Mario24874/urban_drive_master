# Rediseño del interior de Urban Drive — Spec de diseño

**Fecha:** 2026-07-05 · **Aprobado por:** Mario Moreno · **Enfoque:** A (sistema primero, pantallas después)

## Objetivo
El interior de la app debe ser 100% responsive, coherente y con el mismo lenguaje visual de la landing (colores, tipografía, iconos, logos, fondos). Usable, atractiva, moderna e intuitiva. Solo capa visual: **no se toca lógica de Firebase, GPS, Stripe ni hooks**.

## Decisiones aprobadas
- **Tema:** solo oscuro, como la landing. Se elimina la posibilidad de caer al tema claro dentro de la app.
- **Efectos:** identidad sí, efectos pesados no. Sin video ni animaciones continuas en el interior; gradientes estáticos y glow sutil. Fondo "vitrina" (motivo nocturno estático) solo en bienvenida, pricing y upgrade; negro limpio en mapa, chat y dashboards.
- **Alcance:** todo el interior en una pasada, incluyendo las 10 pantallas enterprise.

## 1. Fundación visual
- App interna siempre en `.dark` (clase fija en el shell interno).
- Cero hex hardcodeados: tokens `brand-ink`, `brand-yellow`, `brand-amber/green/red` (estados), texto en escalas `text-white`, `white/70`, `white/50`.
- Tipografía: `font-display` (Space Grotesk) en títulos y cifras protagonistas; sistema en cuerpo.
- Iconos: set único (lucide vía `Icons.tsx` consolidado). Logo con las reglas de la landing.
- Reemplazar `placekitten.com` (servicio muerto) por avatar de iniciales sobre `brand-yellow/10`.
- Mapa: bundlear `mapbox-gl` desde npm (ya es dependencia); eliminar `<script>`/`<link>` del CDN en `index.html`. Motivo: robustez en redes con DNS/rutas problemáticas (bug reportado en Starlink) y un origen menos.

## 2. Kit de componentes (`components/ui`)
- `PageHeader` (título + subtítulo + acción), `StatCard` (métrica de dashboard), `EmptyState` (icono + mensaje + CTA), `ListRow` (fila para conversaciones/conductores/documentos).
- Jerarquía de botones fija: primario = amarillo con texto tinta; secundario = ghost con borde `white/10`; destructivo = `brand-red`.
- Targets táctiles ≥44px; focus visible en todo control.
- Ninguna pantalla define estilos propios de card/botón.

## 3. Responsive
- Mobile-first. Tab bar inferior en móvil (Dashboard, Mapa, Chat, Perfil); navbar solo ≥md.
- Safe-areas (`env(safe-area-inset-*)`) para notch/PWA.
- Mapa fullscreen con controles flotantes overlay.
- Breakpoint `landscape` existente para modo conducción horizontal.
- Verificación en 360 / 768 / 1280 px por pantalla.

## 4. Orden de migración
1. Shell + navegación (tab bar / navbar)
2. Dashboards (usuario, conductor) + PortableInterfaceNew
3. Mapa y navegación (Map, GPSMapComponent, NavigationInterface, SearchDriver)
4. Chat — solo estilos (funcionalidad WhatsApp es proyecto aparte)
5. Perfil, settings, login/register
6. Enterprise completo: PricingPlans (vitrina), BankTransferDialog, CompanySetup, FleetManager, DriverManager, FleetAnalytics, DocumentVault, DocumentsDashboard, MaintenanceLog, MaintenanceScheduler
7. Modals transversales: UpgradeModal, InviteContact, ActiveContactSlotModal

## 5. Estados y robustez
- Skeletons de carga coherentes; empty states con CTA; errores visibles con mensaje útil.
- Incluye bugfix ya aplicado: Firestore con `ignoreUndefinedProperties: true` (campos opcionales vacíos rompían el guardado de CompanySetup y afines).

## 6. Verificación
- Por pantalla: build + revisión a 3 anchos contra la estética de la landing.
- Final: flujo completo real (login → dashboard → mapa → chat → pricing → checkout test). Tests existentes en verde.
- Deploy: commit + push a GitHub (dispara EasyPanel) y verificación en producción.

## Fuera de alcance
- Funcionalidad de mensajería estilo WhatsApp (proyecto 3, spec propio).
- Cambios de lógica de negocio, datos o backend.
