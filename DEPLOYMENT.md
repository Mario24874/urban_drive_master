# Urban Drive — Deployment Guide

## Stack actual (producción)

| Capa | Servicio | URL |
|---|---|---|
| Frontend (PWA) | Firebase Hosting | https://urbandrive-1082b.web.app |
| Base de datos | Firestore (Firebase) | Proyecto `urbandrive-1082b` |
| Autenticación | Firebase Auth | Proyecto `urbandrive-1082b` |
| Mapas | Mapbox GL JS | Token en `.env` |
| Pagos | Stripe + Cloud Functions | Ver sección Stripe |
| Funciones backend | Cloud Functions v2 (Node 20) | `us-central1` |

---

## Variables de entorno

### Frontend — `.env` (raíz del proyecto)

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=urbandrive-1082b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=urbandrive-1082b
VITE_FIREBASE_STORAGE_BUCKET=urbandrive-1082b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=...

# Stripe (solo clave pública — seguro en frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend — `functions/.env` (NO se sube a git)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://urbandrive-1082b.web.app
```

---

## Despliegue actual — Firebase

### Requisitos previos
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Proyecto en plan **Blaze** (requerido para Cloud Functions)
- `firebase login`

### Build y deploy completo

```bash
# 1. Build del frontend
npm run build

# 2. Instalar dependencias de functions (solo primera vez o tras cambios)
cd functions && npm install && cd ..

# 3. Desplegar todo
firebase deploy

# O por separado:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### URLs desplegadas

```
Frontend:  https://urbandrive-1082b.web.app
Webhook:   https://stripewebhook-lt4pemwk2q-uc.a.run.app
Checkout:  https://createcheckoutsession-lt4pemwk2q-uc.a.run.app
```

---

## Configuración de Stripe

### Price IDs configurados

| Plan | Ciclo | Price ID |
|---|---|---|
| Bronce | Mensual | `price_1T4npQB2WAG0h7ZP3FoSzeub` |
| Bronce | Anual | `price_1T4nx6B2WAG0h7ZPCe8k2700` |
| Plata | Mensual | `price_1T4nsDB2WAG0h7ZPCmamsZGT` |
| Plata | Anual | `price_1T4nxvB2WAG0h7ZPKXwVlx5M` |
| Oro | Mensual | `price_1T4ntQB2WAG0h7ZPXd5ipCOT` |
| Oro | Anual | `price_1T4nygB2WAG0h7ZPrHdrCcTb` |

### Webhook configurado

- **ID:** `we_1T4raRB2WAG0h7ZPGl6EJAla`
- **URL:** `https://stripewebhook-lt4pemwk2q-uc.a.run.app`
- **Eventos:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- **API version:** `2025-12-15.clover`

### Flujo de pago

```
Usuario selecciona plan
  → Frontend llama createCheckoutSession (Cloud Function callable)
  → Cloud Function crea sesión en Stripe API
  → Usuario paga en Stripe Checkout
  → Stripe envía evento al webhook
  → Webhook escribe en Firestore: subscriptions/{uid}
  → useSubscription() detecta cambio en tiempo real
  → UI actualiza plan del usuario
```

### Tarjeta de prueba (modo test)

```
Número: 4242 4242 4242 4242
Fecha:  12/29
CVC:    123
CP:     10001
```

---

## Autenticación y recuperación de contraseña

### Estado actual (Firebase Auth)

La recuperación de contraseña **ya está implementada y funciona** sin configuración adicional.

**Flujo actual:**
```
Usuario escribe su email en la pantalla de login
  → toca "Forgot your password?"
  → Firebase envía automáticamente un email con enlace de recuperación
  → Usuario hace clic en el enlace → elige nueva contraseña
  → Vuelve a la app e inicia sesión normalmente
```

El email proviene de `noreply@urbandrive-1082b.firebaseapp.com` con plantilla genérica de Firebase en inglés. Funcional para la fase de pruebas.

### Personalización del email (antes del lanzamiento público)

Antes de abrir al público, personalizar la plantilla en:
**Firebase Console → Authentication → Templates → Password reset**

Campos a actualizar:
- **From name:** `Urban Drive`
- **Subject:** `Recupera tu contraseña de Urban Drive`
- **Body:** mensaje en español con la marca

### Migración al VPS con dominio propio

Cuando la app esté en el VPS con dominio propio, hay dos opciones:

**Opción A — Mantener Firebase Auth (recomendado):**
- Firebase Auth sigue funcionando igual
- Solo hay que agregar el dominio propio a la lista de dominios autorizados:
  **Firebase Console → Authentication → Settings → Authorized domains → Add domain**
- El email de recuperación puede configurarse con dominio propio en:
  **Firebase Console → Authentication → Templates → Customize domain**
  (requiere verificación DNS del dominio)
- No se cambia ninguna línea de código

**Opción B — Migrar a autenticación propia (no recomendado):**
- Requiere implementar JWT, bcrypt, sesiones, refresh tokens, etc.
- Alto costo de desarrollo y riesgo de seguridad
- Solo tiene sentido si se abandona Firebase completamente

**Conclusión:** mantener Firebase Auth en la migración al VPS es la decisión correcta.

---

## Migración a VPS con Easypanel (Hoja de ruta futura)

> **Estado:** Planificado para después de la fase de pruebas en producción.

### Por qué migrar

- Dominio propio (ej. `urbandrive.app`)
- Control total sobre la infraestructura
- Sin dependencia de los límites del plan Blaze de Firebase
- Costos predecibles en escala

### Qué migrar y qué conservar

| Componente | Acción | Razón |
|---|---|---|
| Firebase Auth | **Conservar** | Robusto, gratuito, no requiere migración |
| Firestore | **Conservar** | Tiempo real, escala automático |
| Firebase Hosting | **Migrar** → Nginx en VPS | Dominio propio + control total |
| Cloud Functions (Stripe) | **Migrar** → Express en VPS | Mismo VPS que el frontend |

### Arquitectura en VPS con Easypanel

```
VPS (Ubuntu 22.04 LTS)
└── Easypanel
    ├── urban-drive-web      ← Nginx sirviendo dist/ (React/Vite)
    │   └── Puerto 80/443 → dominio propio con SSL (Let's Encrypt)
    └── urban-drive-api      ← Node.js (Express) con rutas Stripe
        └── Puerto 3000 (interno) → reverse proxy desde Nginx
```

### Pasos de migración

#### 1. Preparar el VPS

- Mínimo recomendado: **2 vCPU, 2 GB RAM, 20 GB SSD** (DigitalOcean, Hetzner, etc.)
- Instalar **Easypanel**: `curl -sSL https://easypanel.io/install.sh | sh`
- Apuntar el dominio al IP del VPS (registro A en tu DNS)

#### 2. Crear servicio `urban-drive-web` en Easypanel

```dockerfile
# Dockerfile para el frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf — SPA rewrite rule
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### 3. Crear servicio `urban-drive-api` en Easypanel

Extraer las Cloud Functions a un servidor Express:

```typescript
// server.ts (reemplaza functions/src/stripe.ts)
import express from 'express';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const app = express();

// POST /createCheckoutSession  (reemplaza la Cloud Function callable)
app.post('/createCheckoutSession', express.json(), async (req, res) => { ... });

// POST /webhook  (reemplaza stripeWebhook)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => { ... });

app.listen(3000);
```

Variables de entorno en Easypanel:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccount.json
APP_URL=https://tu-dominio.com
```

#### 4. Actualizar el frontend

En `src/features/enterprise/components/PricingPlans.tsx`, cambiar de Firebase callable a fetch:

```typescript
// Antes (Cloud Function callable):
const createSession = httpsCallable(functions, 'createCheckoutSession');
const result = await createSession({ priceId, userId, billing });

// Después (API REST propia):
const result = await fetch('https://api.tu-dominio.com/createCheckoutSession', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
  body: JSON.stringify({ priceId, userId, billing }),
}).then(r => r.json());
```

#### 5. Actualizar el webhook en Stripe

Cambiar la URL del webhook de:
```
https://stripewebhook-lt4pemwk2q-uc.a.run.app
```
a:
```
https://api.tu-dominio.com/webhook
```

#### 6. SSL y dominio

Easypanel gestiona automáticamente los certificados SSL con Let's Encrypt. Solo hay que:
1. Asignar el dominio en el panel de Easypanel
2. Esperar ~1 minuto a que el certificado se emita

### Checklist de migración

- [ ] VPS aprovisionado y Easypanel instalado
- [ ] Dominio apuntando al IP del VPS
- [ ] Dockerfile del frontend creado y probado
- [ ] Servidor Express con rutas Stripe creado y probado
- [ ] Service account de Firebase descargado y configurado en VPS
- [ ] Variables de entorno configuradas en Easypanel
- [ ] SSL activo en el dominio
- [ ] Webhook de Stripe actualizado a nueva URL
- [ ] Frontend actualizado para usar API REST propia
- [ ] Prueba de pago end-to-end en producción
- [ ] DNS propagado y app accesible desde dominio propio

---

## Producción — Checklist general

- [ ] Cambiar claves Stripe de `sk_test_` a `sk_live_` y `pk_live_`
- [ ] Cambiar Price IDs de test a producción en `config/stripe.ts`
- [ ] Actualizar `APP_URL` en `functions/.env` al dominio real
- [ ] Configurar reglas de Firestore para producción
- [ ] Activar Firebase App Check (anti-abuso)
- [ ] Configurar monitoreo de errores (Sentry o Firebase Crashlytics)
- [ ] Activar Google Analytics en Firebase
- [ ] Probar flujo completo de pago con tarjeta real (importe mínimo)
- [ ] Verificar que `firestore.rules` bloquea accesos no autorizados

---

## Comandos rápidos de referencia

```bash
# Desarrollo local
npm run dev

# Build producción
npm run build

# Deploy completo
firebase deploy

# Solo frontend
firebase deploy --only hosting

# Solo funciones
firebase deploy --only functions

# Solo reglas Firestore
firebase deploy --only firestore:rules

# Ver logs de funciones en tiempo real
firebase functions:log --follow

# Instalar dependencias de functions
cd functions && npm install
```
