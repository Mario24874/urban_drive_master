# Invitaciones fase 2: link compartible, push y banner de 1 tap

**Fecha:** 2026-07-05 · **Estado:** aprobado · Continúa la spec de reglas de planes.

## Problema

Hoy la invitación solo conecta cuentas por coincidencia exacta de email/teléfono,
sin ningún aviso externo. Invitar "por WhatsApp/Instagram/Gmail" es imposible.
Bug adicional: invitaciones por teléfono a no registrados nunca se resuelven
(el auto-resolve solo busca por email).

## Diseño

### 1. Link de invitación compartible (+ QR)

- Nuevo tipo de invitación `kind: 'link'` en la colección `invitations`
  (fromId/fromName/etc. iguales; `toId` y `toIdentifier` null hasta canjearse).
- El usuario genera el link desde "Agregar contacto" → botón "Compartir enlace":
  crea el doc y comparte `https://urbandrive.cloud/invite/{invitationId}` vía
  Web Share API (WhatsApp, Instagram, Gmail, lo que el SO ofrezca); fallback:
  copiar al portapapeles. Se muestra también como QR (dep nueva: `qrcode.react`).
- **Canje vía Cloud Function callable `redeemInvitation`** (admin SDK), porque
  las rules no permiten que un tercero lea/edite la invitación — y así se queda:
  cero cambios en rules. La función valida (pending, no self, no ya-contactos),
  agrega a ambos en `contacts`, aplica el default de fase 1
  (`contactVisibility[canjeador]=false` en doc del invitador) y marca la
  invitación `accepted` con `toId`.
- Un link = un uso (primer canje lo consume). El invitador puede cancelarlo
  (borrar la invitación) y el link muere.
- Ruta `/invite/:id`: si hay sesión → canjear al instante (toast con resultado);
  si no → guardar en `localStorage` y canjear automáticamente tras login/registro.

### 2. Push al invitado registrado

- Nueva Cloud Function `onInvitationCreated` (trigger Firestore v2 sobre
  `invitations/{id}`): si la invitación trae `toId`, busca `fcm_tokens/{toId}`
  y envía push "«fromName» te invitó a conectar en Urban Drive".
  Infraestructura FCM existente (fcmService + fcm_tokens) sin cambios.

### 3. Banner de 1 tap

- Nuevo componente `InvitationBanner` en el shell (PortableInterfaceNew, bajo el
  header): visible cuando hay invitaciones pendientes; muestra la primera con
  Aceptar / Rechazar inline y tap para ir a la pestaña de contactos.

### 4. Fix invitaciones por teléfono

- `useInvitations` acepta `userPhone` y agrega una tercera query
  (`toIdentifier == phone`) con el mismo auto-resolve de `toId` que email.

### 5. Notificaciones de chat: sonido y silenciar (pedido durante la fase)

- La cadena de push de mensajes ya existe (cliente → `sendMessageNotification` →
  FCM → SW de background); se completa con:
  - **Sonido** en primer plano: beep corto vía WebAudio al recibir mensaje con
    la app abierta (el push de background usa el sonido nativo del SO).
  - **Silenciar**: campo `muted` en `fcm_tokens/{uid}` (el dueño puede escribirlo,
    rules existentes lo permiten). Las functions (`sendMessageNotification`,
    `onInvitationCreated`) no envían si `muted`; el primer plano lo respeta vía
    espejo en localStorage. Toggle en Ajustes.

## Qué NO cambia

- Firestore rules (el canje va por Cloud Function con admin SDK).
- El flujo actual por email/teléfono sigue funcionando igual.
- Reglas de planes de fase 1 (el canje aplica los mismos defaults).

## Despliegue

- Frontend: push a master → EasyPanel.
- Functions: `npx firebase-tools deploy --only functions` (CLI autenticada en el VPS).

## Casos borde

- Link ya canjeado/cancelado → toast "no válida o ya usada", sin efectos.
- Canjear tu propio link → rechazado por la función.
- Ya son contactos → la función marca accepted sin duplicar (arrayUnion idempotente).
- Invitado sin token FCM → push se omite en silencio (queda el banner in-app).
