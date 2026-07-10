# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.1] - 2026-07-10

### 🩹 Portal Admin: datos reales de Usuarios y Suscripciones

- **Fix root cause — usuarios "invisibles" en la tabla Usuarios**: `useAdminData`
  ordena por `orderBy('createdAt')`; Firestore excluye del resultado cualquier
  doc sin ese campo. 7 de 13 cuentas reales (incl. el superadmin) no tenían
  `createdAt` y no aparecían en el portal. Backfill puntual con la fecha real
  de creación de Firebase Auth (no la fecha actual).
- **Fix — columna "Plan" siempre en "—"**: el tier real vive en
  `subscriptions/{uid}`, nunca en el doc de `users`/`drivers`. `useAdminData`
  ahora hace join con `subscriptions` (solo `status` `active`/`trialing`).
- **Fix — columna "Subscriber" siempre en "—"**: `BankTransferDialog.tsx`
  escribía `ownerName: ''` hardcodeado; el webhook de Stripe
  (`functions/src/stripe.ts`) no escribía `ownerId`/`ownerName`. Corregido en
  ambos flujos + backfill de las suscripciones existentes.
- **Fix — cuentas duplicadas por login social**: `signInWithProvider`
  (`src/lib/socialAuth.ts`) podía crear un segundo perfil (UID nuevo) para un
  email que ya tenía cuenta por password. Ahora verifica contra `users`/`drivers`
  antes de crear el perfil y bloquea con un error claro si el email ya existe
  bajo otro UID. Regla de negocio: una persona puede tener 1–3 cuentas con
  emails distintos (válido); lo que no puede pasar es el mismo email con dos
  cuentas.
- **Limpieza de datos de producción** (un solo uso, vía Cloud Function
  temporal + Admin SDK, borrada tras su ejecución): eliminado un doc
  duplicado histórico (`users/{uid}` residual de una cuenta ya presente en
  `drivers/{uid}`), 2 docs huérfanos sin cuenta de Auth asociada, y
  reactivada manualmente una suscripción bronce que había quedado
  `canceled` con período vencido.

## [1.8.0] - 2026-07-05

### 📐 Reglas de planes: visibilidad free vs suscrito
Spec: `docs/superpowers/specs/2026-07-05-plan-visibility-rules-design.md`

- **Aceptar invitaciones nunca se bloquea por plan**: el usuario free chatea con
  todos sus contactos (límite de mensajes/día intacto); se retiró la intercepción
  de "slot ocupado" (`ActiveContactSlotModal` queda sin uso).
- **Plan free: un solo contacto en el mapa** — slot activo (`activeMapContactId`,
  campo aditivo en el doc del usuario; fallback al primer contacto). Selector
  "Ver en mi mapa" y badge "En mapa" en la lista de contactos.
- **Asimetría invitador/invitado**: quien invita queda oculto por defecto para el
  invitado (`contactVisibility` en el doc propio del invitador, solo invitaciones
  pendientes); se abre con el toggle por contacto existente.
- `useContactTracking` escucha el doc propio en vivo (contactos nuevos aparecen
  en el mapa sin recargar) y filtra por tier (`useSubscription`).
- `public/map-diag.html`: página de diagnóstico del mapa (WebGL + proxy + tiles).
- Sin migración de datos ni cambios en Firestore rules.

### 🔗 Invitaciones fase 2: enlaces, push, banner y silenciar
Spec: `docs/superpowers/specs/2026-07-05-invitation-links-design.md`

- **Enlace de invitación compartible** (WhatsApp/redes/email) con QR
  (`qrcode.react`) desde "Agregar contacto"; canje en `/invite/:id` vía Cloud
  Function `redeemInvitation` (un uso por enlace; sin sesión se canjea tras
  registrarse; aplica el default de visibilidad de fase 1).
- **Fix crítico**: el auto-resolve de invitaciones enviadas antes del registro
  violaba las rules y fallaba en silencio desde siempre; ahora lo hace la
  callable `claimPendingInvitations` al iniciar sesión, cubriendo también
  invitaciones por teléfono (antes huérfanas).
- **Push de invitaciones**: trigger `onInvitationCreated` (Eventarc → FCM).
- **Banner de 1 tap** (`InvitationBanner`) en el shell con aceptar/rechazar.
- **Notificaciones de chat**: beep WebAudio en primer plano + sección
  "Notificaciones" en Ajustes con Silenciar/Activar (campo `muted` en
  `fcm_tokens`, respetado por las functions; token se guarda con `merge: true`).

#### Cloud Functions desplegadas
`redeemInvitation`, `claimPendingInvitations`, `onInvitationCreated` (nuevas),
`sendMessageNotification` (actualizada con check de `muted`).

## [1.4.0] - 2026-02-26

### 🛡️ Admin Portal — Phase 8

#### Arquitectura
- Nueva ruta `/admin` lazy-loaded desde `App.tsx` con `React.lazy + Suspense`
- `useAdminAuth` hook: verifica `onAuthStateChanged` + `getDoc(db, 'admins', uid)`
- `useAdminData` hook: lectura paralela de 7 colecciones Firestore con `Promise.all`
- Cero impacto en bundle de la app principal (chunk separado `AdminPortal-*.js`)

#### Nuevos archivos
- `src/admin/AdminPortal.tsx` — Punto de entrada con guard de auth
- `src/admin/types/index.ts` — `AdminUser`, `AdminSection`, `ADMIN_SIDEBAR_ITEMS`
- `src/admin/hooks/useAdminAuth.ts` — Auth guard contra colección `admins/{uid}`
- `src/admin/hooks/useAdminData.ts` — Fetch paralelo de users/drivers/companies/subscriptions/vehicles/maintenance/documents
- `src/admin/components/AdminLayout.tsx` — Desktop sidebar w-64 + mobile header
- `src/admin/components/AdminSidebar.tsx` — Navegación con iconos lucide-react
- `src/admin/components/AdminMobileSidebar.tsx` — Sheet hamburger (shadcn `Sheet side="left"`)
- `src/admin/components/AdminAccessDenied.tsx` — Pantalla 403 para no-admins
- `src/admin/components/sections/AdminDashboard.tsx` — 4 KPI cards + barras de distribución por plan + tabla de empresas recientes + MRR estimado
- `src/admin/components/sections/AdminUsers.tsx` — Tabla paginada (20/pág) de users+drivers con búsqueda, filtros tipo/plan y detail Dialog
- `src/admin/components/sections/AdminCompanies.tsx` — Tabla de empresas con conteos de vehículos/conductores y filtro por tier
- `src/admin/components/sections/AdminSubscriptions.tsx` — MRR en header, chips active/trialing/past_due/canceled, filtros tier+status
- `src/admin/components/sections/AdminFleet.tsx` — Vehículos cross-company con filtros categoría/activo
- `src/admin/components/sections/AdminMaintenance.tsx` — Alertas overdue/warning/ok reutilizando `getMaintenanceStatus()`
- `src/admin/components/sections/AdminDocuments.tsx` — Barras de compliance por empresa reutilizando `getDocumentStatus()`

#### Firestore
- Nueva colección `admins/{uid}` → `{ email, role: 'superadmin', createdAt }`
- Regla `isAdmin()`: `exists(/databases/.../admins/$(request.auth.uid))`
- `companies`, `subscriptions`, `billingHistory`: `allow read: if isAdmin() || (... reglas existentes)`

#### i18n — 20 nuevas claves (EN + ES)
`adminPortal`, `adminDashboard`, `adminUsers`, `adminCompanies`, `adminSubscriptions`,
`adminFleet`, `adminMaintenance`, `adminDocuments`, `adminTotalUsers`, `adminTotalCompanies`,
`adminMRR`, `adminActiveSubs`, `adminAccessDenied`, `adminAccessDeniedDesc`,
`adminSearch`, `adminFilterByType`, `adminFilterByPlan`, `adminFilterByStatus`,
`adminRefresh`, `adminNoData`

---

### 🐛 Correcciones de Firestore Security Rules

#### Suscripciones (`subscriptions/{subscriptionId}`)
- **Bug**: Regla usaba `resource.data.ownerId` que no existe en los documentos escritos por el webhook de Stripe
- **Fix**: Cambiado a `isOwner(subscriptionId)` — el ID del documento ES el UID del usuario
- **Impacto**: Resuelve `permission-denied` en `useSubscription` onSnapshot al iniciar la app

#### Invitaciones (`invitations/{invitationId}`)
- **Bug**: Reglas usaban nombres de campo incorrectos (`fromUserId`, `toEmail`) que no coincidían con los escritos por `addDoc`
- **Fix**: Corregidos a `fromId`, `toId`, `toIdentifier` en las 4 operaciones (read/create/update/delete)
- **Impacto**: Resuelve `permission-denied` en las 3 queries de `useInvitations`

---

### 🌐 PricingPlans — i18n completo

- **Bug**: Todos los textos de planes (taglines, features, botones, billing) estaban hardcodeados en español
- **Fix**: Componente reescrito separando metadatos visuales (`PLAN_VISUAL`) de contenido localizado
- **35 nuevas claves i18n** en `AppContext.tsx` (EN + ES):
  `pricingTitle`, `pricingSubtitle`, `billingMonthly`, `billingYearly`, `billingPerMonth`,
  `billingYearlySave`, `planRecommended`, `planTaglineBronce`, `planTaglinePlata`, `planTaglineOro`,
  `planCurrentCta`, `planSubscribeTo`, `planProcessing`, `planNoCommitment`, `planSecurePayments`,
  `planCancelNote`, `planStripeNotConfigured`, `featDrivers`, `adminFleet`, `featModalities`,
  `featActiveTrips`, `featGPS`, `featChat`, `featStats`, `featAPI`, `featBranding`, `featSupport`,
  `featUpTo`, `featUnlimited`, `featAll`, `featBasic`, `featAdvanced`, `featPriorityEmail`, `featPhoneEmail`

---

### 🎨 UI/UX Fixes

#### SettingsSheet — cierre automático
- **Bug**: Al hacer click en "Mi Empresa", "Gestionar Flota", etc., el Sheet permanecía abierto bloqueando la vista del formulario
- **Fix**: Convertido a Sheet controlado (`open` / `onOpenChange`); todos los handlers llaman `setOpen(false)` antes de abrir el módulo correspondiente
- Afecta: Pricing, CompanySetup, FleetManager, DriverManager, MaintenanceScheduler, DocumentsDashboard, FleetAnalytics

#### CompanySetup — layout responsive
- **Bug**: Stepper de pasos no estaba centrado; botones del footer demasiado anchos en pantallas grandes
- **Fix**: Stepper y footer envueltos en `max-w-lg mx-auto`; botones Cancel/Anterior limitados a `max-w-[160px]`
- La app sigue siendo 100% mobile-first y responsive en todos los tamaños de pantalla

---

### 📄 Archivos Modificados

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Routes/Route/useLocation, lazy AdminPortal, split path /admin vs /* |
| `firestore.rules` | isAdmin() helper, colección admins, fix invitaciones, fix suscripciones |
| `src/contexts/AppContext.tsx` | +55 claves i18n (admin + pricing) |
| `src/features/enterprise/components/PricingPlans.tsx` | Reescritura completa i18n |
| `src/components/SettingsSheet.tsx` | Sheet controlado + setOpen(false) en todos los handlers |
| `src/features/enterprise/components/CompanySetup.tsx` | max-w-lg mx-auto en stepper y footer |

---

## [1.3.0] - 2026-02-25

### Agregado — Enterprise Transport Layer (Fases 3–7)

#### Fase 3 — Capa de pagos completa
- Stripe checkout session + webhook en Cloud Functions
- Portal de gestión de suscripciones (Stripe Customer Portal)
- Planes Bronce / Plata / Oro con billing mensual y anual (−17%)
- `useSubscription` con estado en tiempo real desde Firestore
- UX post-pago: banner de plan activo, badge en Home y Settings
- Límites por plan: `maxContacts`, `maxDrivers`, `maxVehicles`, `maxModalities`

#### Fase 4 — Empresa, Flota y Conductores
- `CompanySetup`: wizard 3 pasos (datos básicos, modalidades, contacto)
- `FleetManager`: inventario de vehículos con CRUD
- `DriverManager`: gestión de conductores de empresa
- 18 modalidades de transporte: taxi, rideshare, shuttle, charter, rental, escolar, turismo, médico, funerario, delivery, logística, carga general/refrigerada/hazmat/animales/valores/productos terminados/pesada

#### Fase 5 — Mantenimiento de vehículos
- `MaintenanceLog`: historial de mantenimiento por vehículo
- `MaintenanceScheduler`: programación de mantenimientos futuros
- 12 tipos de mantenimiento (aceite, frenos, llantas, correa distribución, etc.)
- Sistema semáforo: ok / warning (próximo a vencer) / overdue (vencido)
- Alertas en dashboard de flota

#### Fase 6 — Bóveda de documentos
- `DocumentVault`: subida y control de documentos empresariales, de vehículo y conductor
- Tipos: cámara de comercio, habilitación transporte, SOAT, RTM, tarjeta de operación, licencia, certificado médico, antecedentes
- Dashboard de vencimientos con semáforo verde/amarillo/rojo
- Alertas de documentos próximos a vencer (30 días)

#### Fase 7 — Analytics de flota (Plata/Oro)
- `FleetAnalytics`: reportes de flota con métricas de mantenimiento y documentos
- Restringido a planes Plata y Oro (`feature gate`)
- KPIs: km promedio, costo promedio de mantenimiento, compliance de documentos

---

## [1.1.0] - 2025-10-27

### 🚀 Optimizaciones Mayores

#### Rendimiento
- **Reducción de bundle 70%**: Bundle principal de 844KB → 245KB (gzipped: 208KB → 59KB)
- **Reducción de tamaño total 75%**: De 13MB → 3.3MB
- **Eliminación de background.png**: Removida imagen de 9.6MB, usando solo background.jpg (2.2MB)
- **Code splitting implementado**:
  - `react-vendor.js`: 140KB (React, React-DOM, React-Router)
  - `firebase-vendor.js`: 454KB (Firebase Auth, Firestore, Storage)
  - `mapbox-vendor.js`: Lazy loading
  - `ui-vendor.js`: 4KB (Lucide, clsx, tailwind-merge)

#### GPS por Voz - Correcciones Críticas
- **Sistema de inicialización mejorado**: Manejo correcto del evento `voiceschanged`
- **Selección inteligente de voz**: Prioridad es-ES → es-MX → es-US → cualquier español
- **Cancelación automática**: Cancela síntesis previa antes de nuevas instrucciones
- **Configuración optimizada**:
  - Volumen: 0.8 → 1.0 (100%)
  - Velocidad: 0.9 → 0.95 (mejor claridad)
  - Timeout: 5s → 8s (instrucciones largas)
- **Nuevos métodos de debugging**:
  - `testVoice()`: Prueba el sistema de voz
  - `getVoiceInfo()`: Obtiene información de voces disponibles
- **Logs mejorados**: Información detallada para troubleshooting

### 🎨 UI/UX

#### Shadcn/UI Setup
- Agregadas dependencias de diseño:
  - `class-variance-authority@0.7.1`: Variantes de componentes
  - `clsx@2.1.1`: Gestión de clases CSS
  - `tailwind-merge@3.3.1`: Merge inteligente de clases Tailwind
  - `tailwindcss-animate@1.0.7`: Animaciones pre-configuradas
- Configuración completa de tema con variables CSS
- Soporte para dark mode (`darkMode: ["class"]`)
- Alias `@` configurado para imports absolutos
- Utilidad `cn()` en `src/lib/utils.ts`

#### Tailwind Theming
```css
Variables CSS para tema claro/oscuro:
- --background, --foreground
- --card, --card-foreground
- --primary, --primary-foreground
- --secondary, --muted, --accent
- --destructive, --border, --input, --ring
- --chart-1 through --chart-5
- --radius (border radius configurable)
```

### 🔧 Configuración

#### Vite Config
- **Alias path**: `@` apunta a `./src`
- **Code splitting manual**:
  ```javascript
  manualChunks: {
    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
    'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    'mapbox-vendor': ['mapbox-gl'],
    'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge']
  }
  ```
- **Target**: `esnext` para builds modernos
- **Minify**: `terser` para mejor compresión
- **ChunkSizeWarningLimit**: 1500KB (1.5MB)

#### TypeScript Config
- Actualizado `tsconfig.json` y `tsconfig.app.json`
- Soporte para paths aliases
- Configuración mejorada para imports absolutos

### 🐛 Fixes

#### PWA / Service Worker
- **Deshabilitado vite-plugin-pwa temporalmente**: Error con `workbox-build` en modo ESM
- **Service Worker manual operativo**: `public/sw.js` actualizado a v1.1.0
- **Exclusión de assets grandes**: `background.jpg` no se pre-cachea (runtime caching en su lugar)
- **PWAUpdateNotification**: Comentado temporalmente (depende de vite-plugin-pwa)
- **Resultado**: PWA sigue completamente funcional con manifest.json + sw.js manual

#### Build
- **Solucionado**: Error "Dynamic require of workbox-build is not supported"
- **Solucionado**: Error "Assets exceeding 2MB limit" en Netlify
- **Build exitoso**: 1m 12s sin errores ni warnings

### 📦 Dependencias

#### Agregadas
```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "tailwindcss-animate": "^1.0.7"
}
```

#### DevDependencies
```json
{
  "@types/node": "^24.5.2",
  "shadcn": "^3.3.1"
}
```

### 📄 Archivos Nuevos

- `.mcp.json`: Configuración MCP
- `components.json`: Configuración Shadcn/UI
- `src/lib/utils.ts`: Utilidades (función `cn()`)
- `CHANGELOG.md`: Este archivo
- `OPTIMIZATIONS.md`: Documentación técnica de optimizaciones

### 🗑️ Archivos Eliminados

- `public/assets/background.png` (9.6MB) - Reemplazado por background.jpg

### 📝 Archivos Modificados

#### Core
- `src/services/navigation.ts`: Sistema de voz completamente reescrito (+160 líneas)
- `src/App.tsx`: Cambiado a background.jpg, PWAUpdateNotification comentado
- `vite.config.ts`: Code splitting, PWA deshabilitado
- `public/sw.js`: Actualizado cache v1.1.0, removido background.png

#### Config
- `package.json`: Nuevas dependencias UI
- `package-lock.json`: Lockfile actualizado (+2326 líneas)
- `tailwind.config.js`: Configuración completa de tema (+55 líneas)
- `tsconfig.json` y `tsconfig.app.json`: Paths aliases
- `src/index.css`: Variables CSS de tema (+62 líneas)

---

## [1.0.0] - 2025-08-27

### Agregado
- Sistema GPS y Mensajería Completo
- Contactos reales con visibilidad en tiempo real
- Sistema de invitaciones mejorado
- Reactivación PWA
- Módulos Javascript PWA corregidos

### Features Principales
- Autenticación con Firebase (email/password)
- Mapas interactivos con Mapbox GL JS
- Tracking de ubicación en tiempo real
- Chat entre usuarios y conductores
- PWA con soporte offline
- Diseño responsive

---

## Notas de Migración

### Desde v1.0.0 a v1.1.0

#### Breaking Changes
- **Ninguno**: Todos los cambios son retrocompatibles

#### Recomendaciones
1. **Ejecutar `npm install`** para actualizar dependencias
2. **Revisar imports**: Preferir aliases `@/` para imports locales
3. **Service Worker**: Limpiar cache del navegador en primera carga
4. **GPS por Voz**: Verificar permisos de ubicación y audio en navegador

#### Optimizaciones Opcionales
1. **Comprimir background.jpg**:
   - Actual: 2.2MB
   - Target: ~500KB
   - Herramientas: TinyJPG, Squoosh

2. **Lazy Loading de componentes**:
   ```typescript
   const GPSMapComponent = lazy(() => import('./components/GPSMapComponent'));
   ```

3. **Reactivar vite-plugin-pwa** cuando se resuelva el issue de workbox-build

---

## Métricas de Performance

### Antes (v1.0.0)
- Bundle total: 844 KB (gzipped: 208 KB)
- Dist size: 13 MB
- Build time: ~1m 14s
- Lighthouse Score: No medido

### Después (v1.1.0)
- Bundle principal: 245 KB (gzipped: 59 KB)
- Dist size: 3.3 MB
- Build time: ~1m 12s
- Mejora: **70% reducción de bundle, 75% reducción total**

---

## Roadmap

### ✅ Completado

| Versión | Fase | Descripción |
|---|---|---|
| v1.1.0 | — | Optimizaciones de bundle (70%), GPS por voz, Shadcn/UI |
| v1.3.0 | Fase 3 | Capa de pagos Stripe: Bronce/Plata/Oro, Cloud Functions |
| v1.3.0 | Fase 4 | Empresa, Flota, Conductores, 18 modalidades de transporte |
| v1.3.0 | Fase 5 | Mantenimiento de vehículos: log, scheduler, alertas, semáforo |
| v1.3.0 | Fase 6 | Bóveda de documentos, dashboard de vencimientos |
| v1.3.0 | Fase 7 | FleetAnalytics (Plata/Oro gated) |
| v1.4.0 | Fase 8 | Portal Admin en /admin con 7 secciones |

---

### 🚨 Pendiente — Botón de Pánico (v1.5.0)

**Descripción:** Botón de emergencia disponible en todos los planes de pago (Bronce, Plata, Oro).
Al activarse, notifica a contactos de emergencia predefinidos y/o a un panel de monitoreo, registrando la ubicación GPS en tiempo real del conductor o usuario.

**Eventos a cubrir:**

| Evento | Descripción |
|---|---|
| 🚨 Accidente | Colisión o accidente vial — alerta con coordenadas |
| 🔫 Robo | Asalto al vehículo o conductor — modo silencioso disponible |
| 😰 Secuestro | Activación encubierta (código PIN falso) para no levantar sospechas |
| 🔧 Avería de vehículo | Falla mecánica o eléctrica — solicita asistencia |
| 🚦 Congestión vehicular | Reporta atasco para alertar a otros conductores de la flota |
| ⚠️ Incidente / Accidente en vía | Advertencia a conductores de la flota de peligro en ruta |

**Componentes a implementar:**
- `PanicButton.tsx` — Botón flotante en la interfaz principal (hold 3s para activar, evita falsas alarmas)
- `PanicEventSelector.tsx` — Selector del tipo de emergencia antes de enviar
- `PanicAlertBanner.tsx` — Banner en tiempo real para conductores de la misma empresa (congestión/incidentes)
- Cloud Function `sendPanicAlert` — Envía push notifications + registra evento en Firestore
- Colección Firestore `panic_events/{eventId}` — Historial de alertas con coordenadas, tipo, timestamp
- Sección en AdminPortal: `AdminPanicEvents.tsx` — Mapa de alertas activas en tiempo real
- Feature gate: solo disponible en planes Bronce, Plata y Oro

**Consideraciones de seguridad:**
- Activación por long-press (3 segundos) para evitar activaciones accidentales
- Modo silencioso para secuestros: activa alerta sin mostrar feedback visual obvio
- Desactivación requiere PIN para evitar falsas alarmas continuas
- Logs inmutables en Firestore (sin `allow delete`)

---

### 🎟️ Pendiente — Sistema de Cupones de Descuento (v1.6.0)

**Descripción:** Sistema de cupones de un solo uso aplicables al momento de suscribirse a cualquier plan de pago (Bronce, Plata, Oro). Especificaciones detalladas pendientes de recibir.

**Tipos de cupón definidos:**

| Tipo | Descuento | Uso |
|---|---|---|
| Básico | 10% | Un solo uso por usuario |
| Estándar | 50% | Un solo uso por usuario |
| Full | 100% | Un solo uso por usuario — acceso gratuito al plan |

**Notas preliminares:**
- Aplicable a cualquier plan (Bronce, Plata, Oro) y cualquier ciclo (mensual / anual)
- Cada cupón es de un solo uso — se invalida tras ser canjeado
- Integración con Stripe (coupon / promotion code) o lógica propia en Cloud Functions
- Colección Firestore `discount_coupons/{code}` con campos: `discount`, `used`, `usedBy`, `usedAt`, `expiresAt`
- ⏳ *Especificaciones completas pendientes*

---

### Pendiente — Otras mejoras

- [ ] Reactivar vite-plugin-pwa con workbox fixes
- [ ] Comprimir background.jpg a ~500KB
- [ ] Agregar bundle analyzer
- [ ] Optimizar re-renders con React.memo
- [ ] Virtualización de listas largas
- [ ] Mejoras de accesibilidad (a11y)
- [ ] Exportación de reportes a PDF/Excel desde AdminPortal
- [ ] Notificaciones push (FCM) para alertas de mantenimiento y vencimientos

---

## Contribuyendo

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama de feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request
6. Actualiza CHANGELOG.md con tus cambios

---

## Enlaces Útiles

- [Documentación del Proyecto](./PROJECT-CONTEXT.md)
- [Guía de Optimizaciones](./OPTIMIZATIONS.md)
- [README Principal](./README.md)
- [Issues en GitHub](https://github.com/Mario24874/urban_drive_master/issues)
- [Deploy en Netlify](https://urban-drive.netlify.app)

---

**Generado con [Claude Code](https://claude.com/claude-code)**
