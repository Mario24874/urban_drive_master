# Guía de Despliegue — Urban Drive

**Arquitectura:**
- **Frontend PWA** → VPS con EasyPanel (Docker + nginx)
- **Cloud Functions** → Firebase (Google Cloud, no cambia)
- **Base de datos** → Firestore (Google Cloud, no cambia)

---

## PASO 1 — Rotar API Keys (hacer HOY)

### Firebase
1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Seleccionar proyecto `urbandrive-1082b`
3. Configuración del proyecto → Cuentas de servicio → **Regenerar clave privada**
4. En "Configuración general" → Agregar app web → copiar la nueva `apiKey`
5. Actualizar `.env` con la nueva key

### Mapbox
1. Ir a [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens)
2. Crear nuevo token con los mismos scopes
3. Eliminar el token anterior
4. Actualizar `VITE_MAPBOX_ACCESS_TOKEN` en `.env`

### Stripe
1. Ir a [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Hacer clic en "Rotar clave secreta"
3. Actualizar `STRIPE_SECRET_KEY` en `functions/.env`
4. La publishable key no cambia (es pública)

---

## PASO 2 — Configurar variables de entorno en producción

Tu archivo `.env` (local) nunca debe ir al servidor.
En EasyPanel las env vars se configuran en la interfaz gráfica.

**Variables requeridas:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=urbandrive-1082b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=urbandrive-1082b
VITE_FIREBASE_STORAGE_BUCKET=urbandrive-1082b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_MAPBOX_ACCESS_TOKEN=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_PAYPAL_CLIENT_ID=              # cuando tengas las credenciales PayPal
VITE_BANK_NAME=                     # nombre de tu banco
VITE_BANK_ACCOUNT_NAME=             # titular de la cuenta
VITE_BANK_ACCOUNT_NUMBER=           # número de cuenta
VITE_BANK_ACCOUNT_TYPE=             # Cuenta Corriente / Cuenta de Ahorros
VITE_BANK_ROUTING=                  # solo si recibes transferencias internacionales
```

**IMPORTANTE:** En EasyPanel las variables `VITE_*` se inyectan en tiempo de BUILD (no de runtime). Por eso el Dockerfile hace el build dentro del contenedor, leyendo las env vars de EasyPanel.

---

## PASO 3 — Desplegar Firebase (Cloud Functions + Reglas)

Ejecutar en tu máquina local desde `/mnt/c/Proyectos/Urban-Drive-master`:

```bash
# 1. Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Desplegar reglas de Firestore (seguridad)
firebase deploy --only firestore:rules

# 4. Desplegar Cloud Functions (Stripe + PayPal + Notificaciones)
cd functions
npm install
cd ..
firebase deploy --only functions

# Verificar que las funciones estén activas:
# https://console.firebase.google.com/project/urbandrive-1082b/functions
```

**Variables de Cloud Functions** — ejecutar una sola vez:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set PAYPAL_CLIENT_ID
firebase functions:secrets:set PAYPAL_CLIENT_SECRET
# PAYPAL_ENVIRONMENT se configura en functions/.env como variable normal
```

---

## PASO 4 — Limpiar historial de Git (hacer UNA SOLA VEZ)

Las API keys quedaron en commits anteriores. Limpiar con BFG:

```bash
# 1. Descargar BFG desde https://rtyley.github.io/bfg-repo-cleaner/
#    Guardar como bfg.jar en el directorio del proyecto

# 2. Crear archivo con las strings a eliminar
cat > keys-to-remove.txt << 'EOF'
TU_FIREBASE_API_KEY_AQUI
TU_STRIPE_SECRET_KEY_AQUI
TU_MAPBOX_TOKEN_AQUI
EOF

# 3. Limpiar (reemplaza las strings por "***REMOVED***" en todo el historial)
java -jar bfg.jar --replace-text keys-to-remove.txt .

# 4. Limpiar refs y hacer gc
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (COORDINAR si hay colaboradores)
git push --force

# 6. Eliminar archivo temporal
rm keys-to-remove.txt
```

---

## PASO 5 — Desplegar en EasyPanel (VPS)

### 5.1 Preparar el repositorio en GitHub

```bash
# Asegurarse que el Dockerfile y nginx.conf están commiteados
git add Dockerfile nginx.conf .dockerignore
git commit -m "Add Docker deployment config for EasyPanel"
git push origin master
```

### 5.2 Configurar el servicio en EasyPanel

1. Entrar a tu panel EasyPanel → **Create Service → App**
2. Seleccionar **GitHub** como fuente
3. Conectar tu cuenta GitHub y seleccionar el repo `Urban-Drive-master`
4. Configurar:
   - **Branch:** `master`
   - **Build method:** `Dockerfile`
   - **Port:** `80`

5. En la sección **Environment Variables**, agregar TODAS las variables del Paso 2

6. Hacer clic en **Deploy**

EasyPanel construirá la imagen Docker (ejecuta `npm run build` internamente con tus env vars) y la levantará.

### 5.3 Verificar el despliegue

```bash
# Probar desde tu máquina que el servidor responde
curl -I http://IP_DE_TU_VPS

# Debe responder HTTP/1.1 200 OK
```

---

## PASO 6 — Configurar el dominio (cuando lo compres)

### 6.1 En tu proveedor de dominio (GoDaddy, Namecheap, etc.)

Crear un registro DNS tipo **A**:
```
Nombre:  @  (o tu dominio raíz)
Valor:   IP_DE_TU_VPS
TTL:     3600
```

Si vas a usar `www`:
```
Nombre:  www
Tipo:    CNAME
Valor:   tu-dominio.com
TTL:     3600
```

### 6.2 En EasyPanel

1. Ir al servicio de Urban Drive
2. Sección **Domains** → **Add Domain**
3. Escribir tu dominio (ej: `urbandrive.app`)
4. Activar **HTTPS / Let's Encrypt** → EasyPanel gestiona el certificado SSL automáticamente

### 6.3 Actualizar Firebase Auth (obligatorio)

Firebase necesita saber que tu dominio es autorizado:
1. Firebase Console → Authentication → Settings → **Authorized domains**
2. Agregar tu dominio (ej: `urbandrive.app`)

### 6.4 Actualizar Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://us-central1-urbandrive-1082b.cloudfunctions.net/stripeWebhook`
   *(Esta URL no cambia — las Cloud Functions están en Firebase, no en tu VPS)*

---

## PASO 7 — Actualizar VAPID Key para PWA Push Notifications

Si rotaste las Firebase keys, actualizar también la VAPID key:
```
VITE_FIREBASE_VAPID_KEY=  # nueva key de Firebase Console → Cloud Messaging
```

---

## Flujo de actualización continua

Cada vez que hagas cambios y quieras actualizar producción:

```bash
# 1. Commit y push a GitHub
git add .
git commit -m "descripción del cambio"
git push origin master

# 2. EasyPanel detecta el push automáticamente y redeploya
#    (activar "Auto Deploy" en la configuración del servicio)

# 3. Si cambiaste Cloud Functions:
firebase deploy --only functions

# 4. Si cambiaste Firestore rules:
firebase deploy --only firestore:rules
```

---

## Arquitectura final en producción

```
Usuario
  │
  ├── https://tu-dominio.com  ──→  VPS (EasyPanel)
  │                                 └── Docker: nginx → dist/ (React PWA)
  │
  ├── Firestore / Auth  ──────────→  Firebase (Google Cloud)
  │
  ├── Cloud Functions  ───────────→  Firebase (Google Cloud)
  │    ├── createCheckoutSession (Stripe)
  │    ├── stripeWebhook
  │    ├── createPortalSession
  │    ├── createPayPalOrder
  │    ├── capturePayPalOrder
  │    └── sendMessageNotification
  │
  └── Storage (fotos)  ─────────→  Firebase Storage
```

---

## Checklist pre-lanzamiento

### Seguridad
- [ ] API keys rotadas (Firebase, Mapbox, Stripe)
- [ ] Historial git limpio (BFG ejecutado)
- [ ] Firestore rules desplegadas
- [ ] Variables de entorno en EasyPanel (no en el código)

### Firebase
- [ ] Cloud Functions desplegadas y activas
- [ ] Dominio autorizado en Firebase Auth
- [ ] Stripe webhook apuntando a la Cloud Function

### EasyPanel
- [ ] Servicio corriendo con status verde
- [ ] Variables de entorno configuradas
- [ ] HTTPS activado
- [ ] Auto-deploy desde GitHub activado

### Funcional
- [ ] Login / registro funciona
- [ ] Mapa GPS carga correctamente
- [ ] Invitar contacto funciona
- [ ] Chat envía mensajes
- [ ] Límite de 2 mensajes/día (free) funciona
- [ ] Checkout Stripe completa y activa plan
- [ ] PWA instalable desde el navegador
