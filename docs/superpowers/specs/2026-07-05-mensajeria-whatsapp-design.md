# Mensajería estilo WhatsApp — Spec de diseño

**Fecha:** 2026-07-05 · **Aprobado por:** Mario Moreno (ejecución directa autorizada hasta deploy)

## Objetivo
Que el chat de Urban Drive se comporte funcionalmente como WhatsApp en lo esencial, sobre la infraestructura existente (Firestore `messages`/`conversations`, notas de voz, push FCM). Sin backend nuevo.

## Funcionalidades
1. **Estados de entrega**: ✓ enviado → ✓✓ entregado (gris) → ✓✓ leído (amarillo de marca). Campo nuevo `delivered:boolean`; el receptor lo marca al recibir el mensaje por su listener activo; `read` se marca al abrir la conversación (ya existía).
2. **Indicador "escribiendo…"**: campo `typing.{uid}: millis` en el doc de conversación, escrito con throttle (2.5 s) mientras el usuario teclea; el otro cliente lo muestra si el timestamp tiene <6 s. Se limpia al enviar.
3. **Presencia**: heartbeat `lastActiveAt` (60 s + eventos focus/visibility) en el doc del usuario (`users` o `drivers`). El header del chat muestra "en línea" (<2 min) o "últ. vez hoy a las HH:MM" / fecha.
4. **Responder (citar)**: campo `replyTo {id, senderName, preview, type}` en el mensaje. Botón de respuesta en cada burbuja, preview cancelable en el composer, bloque citado dentro de la burbuja.
5. **Eliminación estilo WhatsApp**: solo mensajes propios, soft-delete (`deleted:true` + contenido vaciado) → tombstone "🚫 Mensaje eliminado" en ambos lados. Se elimina el borrado de mensajes recibidos.
6. **Badge de no leídos** en el tab Chat del tab bar (suma de `unreadCount` de todas las conversaciones).

## Reglas Firestore
- `messages` update: receptor puede tocar solo `read`/`delivered`; remitente puede tocar solo `deleted`/`content`/`voiceUrl` (tombstone).
- `messages` delete: solo el remitente (antes también el receptor).
- `conversations`: sin cambios (participantes ya escriben — cubre `typing`).
- Deploy con `firebase deploy --only firestore:rules`.

## Fuera de alcance
Grupos, reacciones, envío de imágenes, edición de mensajes, cifrado E2E — iteraciones futuras.

## Verificación
Tests de vitest para la lógica pura (estado de ticks, formato de presencia). Build + tests en verde, deploy EasyPanel (push) + deploy de reglas, prueba del flujo real en producción.
