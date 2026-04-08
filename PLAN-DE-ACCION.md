# Plan de Acción — Urban Drive v1.1 → v2.0
**Fecha:** 2026-04-08 | **Lanzamiento objetivo:** 2026-04-22 (2 semanas)

---

## 🔴 PUNTO 1 — Seguridad (Días 1-2) CRÍTICO

### 1.1 Limpiar API keys del historial de Git

**El problema:** `.env` está en `.gitignore` pero las keys están **hardcodeadas** en `src/services/firebase.ts` como fallback, y el `.env` fue commiteado en el pasado.

**Pasos (el usuario debe ejecutar esto):**

```bash
# Instalar BFG Repo Cleaner (https://rtyley.github.io/bfg-repo-cleaner/)
# 1. Descargar bfg.jar de https://rtyley.github.io/bfg-repo-cleaner/

# 2. Crear archivo con las strings a eliminar del historial:
echo 'TU_FIREBASE_API_KEY_AQUI' >> keys-to-remove.txt
echo 'TU_STRIPE_SECRET_KEY_AQUI' >> keys-to-remove.txt
echo 'TU_MAPBOX_TOKEN_AQUI' >> keys-to-remove.txt

# 3. Limpiar historial
java -jar bfg.jar --replace-text keys-to-remove.txt .
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 4. Force push (COORDINAR CON EL EQUIPO si hay colaboradores)
git push --force
```

**⚠️ ANTES de limpiar git: Rotar TODAS las keys en sus consolas:**
- Firebase Console → Proyecto → Configuración → Claves API → Regenerar
- Mapbox → Account → Access Tokens → Crear nuevo, borrar el actual
- Stripe → Dashboard → Developers → API Keys → Rotar

### 1.2 Eliminar hardcoded fallbacks en firebase.ts

**Archivo:** `src/services/firebase.ts`

Reemplazar el objeto `firebaseConfig` actual por:
```typescript
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail fast en desarrollo si faltan variables
if (import.meta.env.DEV) {
  Object.entries(requiredEnvVars).forEach(([key, val]) => {
    if (!val) console.error(`[Firebase] Missing env var: VITE_FIREBASE_${key.toUpperCase()}`);
  });
}

const firebaseConfig = requiredEnvVars;
```

### 1.3 Corregir Firestore Rules (colecciones permisivas)

**Archivo:** `firestore.rules`

Reemplazar las reglas permisivas de vehicles/company_drivers/etc.:

```
// ── Vehicles ────────────────────────────────────────────────────
match /vehicles/{vehicleId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    resource.data.companyId == null || // vehículo personal
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    (get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid ||
     request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.memberIds)
  );
  allow create: if isSignedIn();
  allow update, delete: if isSignedIn() && (
    isAdmin() ||
    resource.data.ownerId == request.auth.uid ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    (get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid ||
     request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.adminIds)
  );
}

// ── Company Drivers ──────────────────────────────────────────────
match /company_drivers/{driverId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    resource.data.userId == request.auth.uid ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.memberIds
  );
  allow write: if isSignedIn() && (
    isAdmin() ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    (get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid ||
     request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.adminIds)
  );
}

// ── Company Documents ────────────────────────────────────────────
match /company_documents/{documentId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.memberIds
  );
  allow write: if isSignedIn() && (
    isAdmin() ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    (get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid ||
     request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.adminIds)
  );
}

// ── Vehicle Maintenance ──────────────────────────────────────────
match /vehicle_maintenance/{recordId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.memberIds
  );
  allow write: if isSignedIn() && (
    isAdmin() ||
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)) &&
    (get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid ||
     request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.adminIds)
  );
}
```

### 1.4 Agregar rate limiting de mensajes en Firestore Rules

```
// ── Messages (con límite para tier Free) ──────────────────────────
match /messages/{messageId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn() &&
    request.resource.data.senderId == request.auth.uid &&
    // El límite de 2 msg/día se enforcea en Cloud Function, no aquí
    // La función valida el plan y el contador diario antes de escribir
    request.resource.data.keys().hasAll(['senderId', 'receiverId', 'content', 'timestamp', 'conversationId']);
  allow update: if isSignedIn() &&
    resource.data.receiverId == request.auth.uid &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
  allow delete: if isSignedIn() && (
    resource.data.senderId == request.auth.uid ||
    resource.data.receiverId == request.auth.uid
  );
}
```

---

## 🟠 PUNTO 2 — Reglas de Negocio Rediseñadas

### 2.1 Planes Individuales (usuarios y conductores independientes)

| Plan | Precio | Contactos | Vista mapa | Mensajes | Notas de voz | Extra |
|------|--------|-----------|------------|----------|--------------|-------|
| **Free** | $0 | 1 | 1 contacto | 2/día por chat | ❌ | Básico |
| **Bronze** | $4.99/mes | 15 | Todos en tiempo real | Ilimitados | ✅ | Historial 24h |
| **Silver** | $9.99/mes | 50 | Todos + historial 7d | Ilimitados | ✅ | Grupos, exportar |
| **Gold** | $19.99/mes | Ilimitados | Todos + historial 30d | Ilimitados | ✅ | Soporte prioritario |

### 2.2 Planes Empresariales (flotas de conductores)

| Plan | Precio | Conductores | Modalidades | Características |
|------|--------|-------------|-------------|-----------------|
| **Starter** | $29/mes | 5 | 1 | Seguimiento flota básico |
| **Professional** | $79/mes | 25 | 3 | Reportes, historial 30d |
| **Business** | $149/mes | 100 | 5 | API access, alertas |
| **Enterprise** | Custom | Ilimitados | Ilimitadas | SLA, white-label, soporte |

### 2.3 Solución al problema de multi-invitación (FREE tier)

**Escenario:** Usuario C (free) es invitado por Usuario A (paid) Y Usuario B (paid).

**Regla:** El tier Free tiene **1 "slot de contacto activo"**.

**Comportamiento:**
1. A invita a C → C acepta → A puede ver a C en mapa ✅, C puede ver a A ✅
2. B invita a C → C recibe la invitación → al aceptar, se muestra modal:

```
┌─────────────────────────────────────────────┐
│  Ya tienes 1 contacto activo ([Usuario A])  │
│  Tu plan gratuito permite ver solo 1.       │
│                                             │
│  2 personas te están viendo en el mapa.    │
│  ¿Quieres verlas a todas?                  │
│                                             │
│  [💎 Actualizar a Bronze - $4.99/mes]       │
│  [↔ Cambiar a [Usuario B]]                  │
│  [✗ Mantener [Usuario A]]                   │
└─────────────────────────────────────────────┘
```

**Reglas de visibilidad en este escenario:**
- A (paid) → ve a C en mapa ✅ (siempre, A está pagando)
- B (paid) → ve a C en mapa ✅ (siempre, B está pagando)
- C (free) → ve solo a su contacto activo (A o B, el que elija)
- C recibe mensajes de ambos pero con límite 2/día cada uno

**Dato clave:** Este escenario (2 usuarios pagos invitando al mismo usuario free) es el **mejor momento de conversión** — mostrar el contador "X personas te ven en el mapa pero tú solo puedes ver a 1".

### 2.4 Cambios en Firestore necesarios para las reglas de negocio

**Nuevo campo en `/users/{uid}`:**
```typescript
{
  // ... campos existentes ...
  plan: 'free' | 'bronze' | 'silver' | 'gold',      // default: 'free'
  planExpiresAt: Timestamp | null,
  activeContactId: string | null,   // solo relevante en plan free
  dailyMessageCount: { [date: string]: { [contactId: string]: number } }, // ej: { "2026-04-08": { "uid123": 2 } }
}
```

**Nueva Cloud Function `enforceMessageLimit`:**
```typescript
// functions/src/enforceMessageLimit.ts
// Se llama ANTES de escribir el mensaje
// 1. Lee el plan del sender desde /subscriptions/{uid}
// 2. Si es free, verifica dailyMessageCount[today][receiverId] < 2
// 3. Si superó el límite, retorna error { code: 'MESSAGE_LIMIT_REACHED' }
// 4. Si OK, incrementa el contador y permite la escritura
```

**Nueva Cloud Function `enforceContactLimit`:**
```typescript
// functions/src/enforceContactLimit.ts
// Verifica que un usuario free no tenga más de 1 contacto activo
// Llamada al aceptar invitaciones
```

---

## 🟡 PUNTO 3 — Type Safety y Estabilidad (Semana 1-2)

### 3.1 Error Boundaries

Agregar en `src/App.tsx` un ErrorBoundary wrapper:
```tsx
// src/components/ErrorBoundary.tsx (crear)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  // ...
}
```

### 3.2 Tipos TypeScript críticos a reemplazar

Archivos con `any` que afectan seguridad de datos:
- `src/services/messaging.ts` — `getNotifyFn()` retorna `any`
- `src/components/MapComponent.tsx` — props tipadas como `any`
- `src/services/voiceService.ts` — `(window as any).SpeechRecognition`
- `src/main.tsx` — `deferredPrompt: any`

### 3.3 Tipos de suscripción a crear

```typescript
// src/types/subscription.ts
export type IndividualPlan = 'free' | 'bronze' | 'silver' | 'gold';
export type EnterprisePlan = 'starter' | 'professional' | 'business' | 'enterprise';

export interface UserSubscription {
  userId: string;
  plan: IndividualPlan;
  status: 'active' | 'cancelled' | 'past_due' | 'trial';
  startedAt: Timestamp;
  expiresAt: Timestamp | null;
  paymentMethod: 'stripe' | 'mercadopago' | 'coupon' | null;
  activeContactId: string | null; // solo free tier
}

export const PLAN_LIMITS: Record<IndividualPlan, {
  maxContacts: number;
  messagesPerDay: number | null; // null = ilimitado
  voiceNotes: boolean;
  locationHistoryDays: number;
}> = {
  free:   { maxContacts: 1,         messagesPerDay: 2,    voiceNotes: false, locationHistoryDays: 0 },
  bronze: { maxContacts: 15,        messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 1 },
  silver: { maxContacts: 50,        messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 7 },
  gold:   { maxContacts: Infinity,  messagesPerDay: null, voiceNotes: true,  locationHistoryDays: 30 },
};
```

---

## 🟢 PUNTO 4 — Performance y UX (Semana 2)

### 4.1 Lazy load de Mapbox GL

```typescript
// Antes (carga siempre, ~3MB):
import mapboxgl from 'mapbox-gl';

// Después (carga solo cuando el tab de mapa es visible):
const GPSMapComponent = React.lazy(() => import('./components/GPSMapComponent'));
// mapbox-gl se importa DENTRO del componente, no en el bundle principal
```

### 4.2 Paginación en queries de Admin

```typescript
// src/admin/hooks/useAdminData.ts — reemplazar getDocs sin límite:
const ADMIN_PAGE_SIZE = 50;

const q = query(
  collection(db, 'users'),
  orderBy('createdAt', 'desc'),
  limit(ADMIN_PAGE_SIZE)
);
// Cursor para siguiente página:
// startAfter(lastDoc)
```

### 4.3 Eliminar console.logs de producción

En `vite.config.ts` agregar en `build.terserOptions`:
```typescript
terserOptions: {
  compress: {
    drop_console: true,  // elimina todos los console.* en prod
    drop_debugger: true,
  }
}
```

### 4.4 npm audit fix

```bash
npm audit fix                    # fixes automáticos
npm install firebase@latest      # parchea vulnerabilidad undici
npm install @capacitor/cli@8.3.0 # parchea vulnerabilidad tar
```

---

## 📅 Cronograma de Ejecución (2 semanas al lanzamiento)

```
SEMANA 1 (Días 1-7):
  Día 1-2: ✅ PUNTO 1 — Seguridad (keys, firebase.ts, firestore.rules)
  Día 3-4: ✅ Diseño UI de planes (página de precios, modal upgrade)
  Día 5-6: ✅ PUNTO 2 — Implementar límites Free en cliente (contacto activo, msg/día)
  Día 7:   ✅ PUNTO 3 — ErrorBoundary + tipos críticos

SEMANA 2 (Días 8-14):
  Día 8-9: ✅ Cloud Functions para enforceMessageLimit + enforceContactLimit
  Día 10-11: ✅ PUNTO 4 — Performance (lazy Mapbox, paginación, console.logs)
  Día 12-13: ✅ Integración MercadoPago (primera pasarela, LATAM)
  Día 14:  ✅ Testing completo + deploy producción + campaña de ventas
```

---

## 💡 Estrategia de Conversión para la Campaña de Ventas

### Momentos clave de upgrade (triggers):

| Trigger | Mensaje sugerido |
|---------|-----------------|
| 2do mensaje del día | "Alcanzaste tu límite diario. Actualiza y chatea sin límites." |
| 2do contacto intenta conectar | "2 personas te están viendo. Actualiza para verlas a todas." |
| Intento de enviar nota de voz | "Las notas de voz son exclusivas de planes pagos." |
| Contacto aparece/desaparece del mapa | "Tu contacto está activo ahora. Actualiza para verlo siempre." |

### Precio de lanzamiento recomendado (primeras 4 semanas):
- Free → sin cambio
- Bronze: ~~$4.99~~ **$2.99/mes** (promo lanzamiento)
- Silver: ~~$9.99~~ **$5.99/mes** (promo lanzamiento)
- Gold: ~~$19.99~~ **$9.99/mes** (promo lanzamiento)

**Justificación:** LATAM es sensible al precio. Un 40% de descuento en lanzamiento acelera adopción y reviews. Subir al precio real en semana 5.

---

## 🏢 Plan Empresarial — Diferenciadores Clave para la Campaña

### Argumentos de venta por segmento:

**Transporte de carga:**
> "Sepa dónde está su flota en tiempo real. Sin mensajes, sin llamadas. Solo el mapa."

**Courier/mensajería:**
> "Sus clientes saben dónde está su paquete. Usted sabe dónde está su conductor."

**Transporte de pasajeros:**
> "Menos llamadas de ¿dónde está el bus?. Más confianza de sus pasajeros."

### Características únicas del plan Enterprise que nadie más ofrece en LATAM:
1. Visibilidad GPS en tiempo real (no cada X minutos, sino en vivo)
2. Sin app para los clientes — se comparte un link de seguimiento
3. Funciona como PWA (sin instalar nada)
4. Mensajería integrada conductor ↔ despachador
5. Notas de voz (clave para conductores que no pueden escribir mientras manejan)

---

## ✅ Checklist Pre-Lanzamiento

### Seguridad:
- [ ] Todas las API keys rotadas
- [ ] Historial git limpio (BFG)
- [ ] Hardcoded fallbacks eliminados de firebase.ts
- [ ] Firestore rules actualizadas (vehicles, company_drivers, etc.)
- [ ] npm audit fix completado

### Negocio:
- [ ] Página de precios implementada
- [ ] Modal de upgrade en momentos de conversión
- [ ] Límite de mensajes Free (2/día) activo
- [ ] Límite de contactos Free (1) activo
- [ ] Modal de "contacto activo" cuando llega 2da invitación (free user)
- [ ] Integración MercadoPago activa (Colombia/México/Argentina)
- [ ] Integración Stripe activa (pagos internacionales)

### Técnico:
- [ ] Error Boundaries en App.tsx
- [ ] console.logs eliminados en prod (terser config)
- [ ] Lazy load mapbox
- [ ] Build sin warnings

### Marketing:
- [ ] Campaña email/WhatsApp con precios de lanzamiento
- [ ] Landing page con tabla de precios visible
- [ ] Enlace de referidos (cada usuario puede invitar y ganar 1 mes gratis)
