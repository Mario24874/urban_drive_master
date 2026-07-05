# Reglas de visibilidad y límites de plan (free vs suscrito)

**Fecha:** 2026-07-05 · **Estado:** aprobado (Enfoque A: cliente, sin migración)

## Reglas de producto

1. **Aceptar invitaciones nunca se bloquea por plan.** Cualquier usuario (free incluido)
   puede aceptar todas las invitaciones que reciba y chatear con todos sus contactos.
   Los límites de mensajes/día por contacto del plan free no cambian.
2. **Enviar invitaciones sigue limitado por `maxContacts` del plan** (comportamiento
   actual del botón "Agregar contacto": al límite → diálogo de upgrade).
3. **Mapa según plan de quien mira:**
   - Free: ve **un solo contacto** en el mapa — su *slot activo* (`activeMapContactId`
     en su propio doc). Si no está definido o ya no es contacto, fallback al primer
     contacto del array. El usuario cambia su slot desde la lista de contactos.
   - Planes pagos (bronce/plata/oro): ven todos sus contactos (filtro `contactVisibility`
     existente se mantiene).
4. **Asimetría invitador/invitado:** al **enviar** una invitación, el invitador queda
   **oculto por defecto** para el invitado (`contactVisibility[invitadoId] = false` en el
   doc PROPIO del invitador — modelo push existente). El invitador abre visibilidad por
   contacto con el toggle de ojo ya existente en su lista. Quien acepta sí es visible
   para el invitador (eso es lo que acepta).
   - Invitado no registrado al enviar (`toId` null): cuando la invitación se resuelve,
     el cliente del invitador aplica el default a sus invitaciones `pending` con `toId`
     que aún no tengan entrada en su `contactVisibility`.
5. **Sin migración, sin tocar Firestore rules.** Contactos existentes conservan su
   visibilidad actual (entrada ausente = visible). Invitaciones ya aceptadas no se tocan.

## Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/hooks/useInvitations.ts` | En `sendInvitation`: si el destinatario existe, escribir `contactVisibility.{toId}=false` en doc propio. Nuevo efecto sobre `sent`: aplicar el mismo default a invitaciones `pending` con `toId` sin entrada previa. |
| `src/hooks/useContacts.ts` | Exponer `activeMapContactId` (ya escucha el doc propio) y `setActiveMapContact()`. |
| `src/hooks/useContactTracking.ts` | Nuevo parámetro `tier`. Doc propio pasa de `getDoc` a `onSnapshot` (contactos y slot en vivo). Si `tier==='free'`, el mapa solo muestra el slot activo. |
| `src/components/GPSMapComponent.tsx` | Obtiene `tier` con `useSubscription` y lo pasa al tracking. |
| `src/components/contacts/ContactList.tsx` | Aceptar ya no se intercepta por límite (se retira `ActiveContactSlotModal` del flujo; el componente queda sin uso). Nuevo control por contacto "En mapa" (solo plan free) para elegir el slot activo. |
| `src/contexts/AppContext.tsx` | Claves i18n en/es del control de slot. |
| `public/map-diag.html` | Página de diagnóstico del mapa (persiste tras redeploys). |
| `public/sw.js` (o equivalente) | Bump de versión de caché para forzar ciclo de actualización PWA. |

## Qué NO cambia

- Firestore rules, Cloud Functions, modelo de datos existente (solo campos aditivos).
- Chat, conversaciones, límites de mensajes free (localStorage).
- Toggle global `isVisible` y toggle por contacto existentes.

## Enforcement

Client-side (igual que todos los límites actuales de la app). Endurecimiento
server-side (rules/Functions) queda como fase posterior documentada.

## Casos borde

- Free con `activeMapContactId` que apunta a un ex-contacto → fallback a `contacts[0]`.
- Free con 1 contacto ya existente → sin cambio visible (su único contacto es el slot).
- Free existente con >1 contactos (el límite nunca se aplicó): pasa a ver 1 en el mapa
  con selector para elegir cuál — es la regla de negocio pedida, no una regresión.
- Invitación vieja ya `accepted` → no se aplica default (no romper relaciones actuales).
