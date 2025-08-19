# Urban Drive - Contexto Completo del Proyecto

**Fecha de creación:** 2025-07-24  
**Última actualización:** 2025-07-24  
**Estado:** En desarrollo activo - APK en construcción

---

## 🔄 SINCRONIZACIÓN ENTRE VERSIONES

**⚠️ ATENCIÓN CRÍTICA:** Este proyecto tiene DOS versiones que deben mantenerse sincronizadas:

### **📱 VERSIÓN APK (urban-drive-expo-standalone/)**
- **Propósito:** Aplicación nativa descargable para dispositivos móviles
- **Tecnología:** Expo + React Native
- **Target:** Android/iOS exclusivamente
- **Distribución:** APK directo, stores móviles

### **🌐 VERSIÓN MULTIPLATAFORMA (Urban-Drive-master/)**
- **Propósito:** Aplicación principal para navegadores y PWA
- **Tecnología:** React + Vite + PWA
- **Target:** PC, tablets, móviles (navegador)
- **Distribución:** Web, instalable como PWA

### **🎯 REQUISITOS DE SINCRONIZACIÓN:**

#### **1. BASE DE DATOS UNIFICADA**
- **✅ OBLIGATORIO:** Ambas versiones DEBEN usar la misma instancia Firebase
- **✅ OBLIGATORIO:** Mismas credenciales y configuración Firebase
- **✅ OBLIGATORIO:** Esquema de datos idéntico (usuarios, viajes, ubicaciones)
- **✅ OBLIGATORIO:** Autenticación compartida (mismo login en ambas)

#### **2. FUNCIONALIDADES ESPEJO**
- **✅ OBLIGATORIO:** Todas las funciones de la web DEBEN existir en APK
- **✅ OBLIGATORIO:** Todas las funciones del APK DEBEN existir en web
- **✅ OBLIGATORIO:** UX consistente pero optimizada por plataforma
- **✅ OBLIGATORIO:** Estados sincronizados (sesión, preferencias, datos)

#### **3. PROTOCOLO DE ACTUALIZACIÓN**
Cuando modifiques UNA versión:

1. **ANTES de empezar:**
   - Lee ambos codebases para entender diferencias actuales
   - Identifica qué componentes/funciones son equivalentes

2. **DURANTE el desarrollo:**
   - Documenta CADA cambio funcional realizado
   - Identifica qué cambios necesitan replicarse

3. **DESPUÉS de completar:**
   - **ACTUALIZA INMEDIATAMENTE** la otra versión
   - Prueba que ambas versiones funcionen igual
   - Actualiza esta documentación con cambios sincronizados

#### **4. MAPEO DE EQUIVALENCIAS**

```
WEB (React)                 ↔  APK (React Native)
===============               ==================
src/components/Navbar.tsx   ↔  screens/HomeScreen.js
src/components/Auth/        ↔  screens/AuthScreen.js  
src/components/Map/         ↔  screens/MapScreen.js
src/config/firebase.ts      ↔  services/firebase.js
urban-drive-portable.html   ↔  App.js (entry point)
```

#### **5. CONFIGURACIÓN FIREBASE COMPARTIDA**
**🔥 CRÍTICO:** Usar exactamente la misma configuración:

```javascript
// Configuración Firebase IDÉNTICA en ambas versiones:
const firebaseConfig = {
  apiKey: "[MISMO EN AMBAS]",
  authDomain: "[MISMO EN AMBAS]", 
  projectId: "[MISMO EN AMBAS]",
  storageBucket: "[MISMO EN AMBAS]",
  messagingSenderId: "[MISMO EN AMBAS]",
  appId: "[MISMO EN AMBAS]"
};
```

#### **6. FLUJO DE DESARROLLO RECOMENDADO**

1. **Desarrollo en versión principal (Web)** ← Más fácil testing
2. **Testing y validación funcional**
3. **Replicación inmediata en APK** ← Mismas funciones
4. **Testing APK en dispositivo real**
5. **Documentación de sincronización**

### **🚨 ALERTAS DE SINCRONIZACIÓN:**

- **❌ NUNCA** implementes una función solo en una versión
- **❌ NUNCA** uses bases de datos diferentes
- **❌ NUNCA** cambies esquemas sin actualizar ambas
- **❌ NUNCA** modifiques auth sin sincronizar
- **✅ SIEMPRE** actualiza PROJECT-CONTEXT.md con cambios sincronizados
- **✅ SIEMPRE** prueba login/datos en ambas versiones después de cambios

### **🔧 COMANDOS DE VERIFICACIÓN:**

```bash
# Verificar que ambas versiones conectan a misma DB
# Web:
curl -s http://localhost:3000 # Verificar funcionalidad web

# APK: 
npx eas build:list # Verificar último build funcional
```

---

## 🤖 INSTRUCCIONES PARA AGENTES

**⚠️ IMPORTANTE:** Si eres un agente trabajando en este proyecto:

1. **LEE ESTE ARCHIVO COMPLETO** antes de hacer cualquier cambio
2. **ACTUALIZA ESTA SECCIÓN** al final del archivo con:
   - Fecha y hora de tu trabajo
   - Cambios realizados (detallados)
   - Problemas encontrados y soluciones aplicadas
   - Estado actual después de tus cambios
   - Próximos pasos recomendados
3. **MANTÉN LA COHERENCIA** con la arquitectura y decisiones ya tomadas
4. **NO ROMPAS** funcionalidades existentes sin documentar por qué
5. **COORDINA** con otros agentes mencionando en qué estás trabajando

---

## 📋 RESUMEN EJECUTIVO

**Urban Drive** es una aplicación de transporte urbano desarrollada en dos versiones:
- **Web/PWA** - Multiplataforma (React + Firebase + Mapbox)
- **APK Nativo** - Móviles Android (Expo/React Native)

**Usuario principal:** mario24874 (cuenta Expo configurada)
**Objetivo:** APK real instalable sin bloqueos de Gmail/WhatsApp

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### **Estructura de Directorios:**
```
Proyectos/
├── Urban-Drive-master/              # Proyecto principal WEB
│   ├── src/                        # Código React TypeScript
│   ├── public/                     # Assets estáticos
│   ├── urban-drive-portable.html   # Versión standalone para testing
│   ├── serve-apk.cjs              # Servidor para servir APKs (puerto 3001)
│   ├── android/                   # Directorio Capacitor Android
│   └── PROJECT-CONTEXT.md         # Este archivo
│
└── urban-drive-expo-standalone/    # Proyecto EXPO/React Native
    ├── App.js                     # App principal React Native
    ├── screens/                   # Pantallas móviles
    ├── services/                  # Firebase, APIs
    ├── app.json                   # Configuración Expo
    ├── eas.json                   # Configuración EAS Build
    └── package.json               # Dependencias RN
```

### **Stack Tecnológico:**

#### **Versión Web:**
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Maps:** Mapbox GL JS
- **Database:** Firebase (Firestore + Auth) - ACTIVO
- **Note:** Supabase instalado pero NO utilizado
- **PWA:** vite-plugin-pwa
- **Build:** Vite + Capacitor 6.0

#### **Versión Móvil:**
- **Framework:** Expo SDK 51 + React Native 0.74
- **Navigation:** React Navigation 6
- **Maps:** React Native Maps
- **Database:** Firebase (Firestore + Auth) - Debe usar misma instancia que web
- **Build:** EAS Build
- **Platform:** Android (APK)

---

## 🔥 CONFIGURACIÓN FIREBASE

**Base de datos compartida** entre web y móvil:
- **Firestore:** Colecciones de usuarios, viajes, ubicaciones
- **Authentication:** Email/Password + Google Sign-in
- **Ubicación de config:** 
  - Web: `src/` (buscada, no encontrada - usar urban-drive-portable.html como referencia)
  - Móvil: `services/firebase.js` (configuración placeholder)

**⚠️ PENDIENTE:** Extraer configuración real de Firebase del HTML portable

---

## 🗺️ CONFIGURACIÓN MAPBOX

- **API Key:** Configurada en urban-drive-portable.html
- **Funcionalidades:**
  - Mostrar ubicación del usuario por defecto
  - Marcadores interactivos
  - Rutas de navegación
- **Implementación:**
  - Web: Mapbox GL JS
  - Móvil: React Native Maps (alternativa nativa)

---

## 📱 ESTADO ACTUAL DEL PROYECTO

### **Versión Web (✅ FUNCIONAL):**
- ✅ **urban-drive-portable.html** - Standalone funcional
- ✅ **Componentes React** - Navbar, Auth, Maps, etc.
- ✅ **Servidor APK** - `serve-apk.cjs` en puerto 3001
- ✅ **Funciones de compartir** - WhatsApp, Email, descarga directa
- ✅ **PWA configurado** - Instalable en navegadores
- ✅ **Responsive design** - PC, tablet, móvil

### **Versión Móvil (🔄 EN DESARROLLO):**
- ✅ **Proyecto Expo creado** - Estructura completa
- ✅ **EAS CLI configurado** - Login exitoso como mario24874
- ✅ **Dependencias instaladas** - 1234 packages
- ❌ **Build falló** - Iconos faltantes (adaptive-icon.png, icon.png, etc.)
- 🔄 **En proceso** - Claude Code trabajando en solución de iconos

---

## 🚨 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### **1. APK Manual No Funcional**
**Problema:** APKs generados con scripts Python no eran instalables
- Error: "There was a problem parsing the package"
- Causa: Estructura APK inválida, falta de firma real

**Solución aplicada:** Migrar a Expo EAS Build para APK oficial

### **2. Bloqueo de Gmail/WhatsApp**
**Problema:** APKs caseros detectados como malware
**Solución:** EAS Build genera APKs con certificados válidos

### **3. Build EAS Fallando**
**Problema actual:** 
```
Error: [android.dangerous]: withAndroidDangerousBaseMod: ENOENT: no such file or directory, open './assets/adaptive-icon.png'
```

**Solución en proceso:** 
- Crear iconos faltantes: icon.png, adaptive-icon.png, splash.png, favicon.png
- Usar dimensiones correctas: 1024x1024 para icon, 32x32 para favicon
- Claude Code está trabajando en esto

### **4. Configuración Firebase Móvil**
**Problema:** Configuración placeholder en services/firebase.js
**Solución pendiente:** Extraer config real del HTML portable

---

## 🔧 COMANDOS Y SCRIPTS IMPORTANTES

### **Servidor Web:**
```bash
# Iniciar servidor APK
node serve-apk.cjs

# Verificar servidor
curl -s http://localhost:3001/apk-info

# Construir proyecto web
npm run build
```

### **Proyecto Expo:**
```powershell
# Verificar herramientas
npx expo --version        # 0.18.31
npx eas --version         # 16.17.3

# Build APK
npx eas build --platform android --profile preview

# Ver builds
npx eas build:list

# Login (ya configurado)
npx eas login             # mario24874
```

### **Gestión de Iconos (Pendiente):**
```python
# Script para crear iconos faltantes
python create_icons.py    # Claude Code trabajando en esto
```

---

## 📊 FUNCIONALIDADES IMPLEMENTADAS

### **Autenticación:**
- ✅ Login/Registro con email/password
- ✅ Validación de formularios
- ✅ Persistencia de sesión
- ✅ Estados de carga y error

### **Mapas y Ubicación:**
- ✅ Mostrar ubicación del usuario automáticamente
- ✅ Mapbox GL JS integrado
- ✅ Marcadores interactivos
- ✅ Permisos de geolocalización

### **Compartir APK:**
- ✅ Botón de descarga de APK
- ✅ Compartir por WhatsApp con mensaje personalizado
- ✅ Compartir por Email
- ✅ Web Share API para más opciones
- ✅ Detección de dispositivo (móvil/desktop)
- ✅ URLs dinámicas según contexto

### **PWA (Progressive Web App):**
- ✅ Manifest configurado
- ✅ Service Worker
- ✅ Instalable desde navegador
- ✅ Iconos y splash screen

### **Navegación:**
- ✅ React Router configurado
- ✅ Rutas protegidas por autenticación
- ✅ Navbar responsive
- ✅ Estados de navegación

---

## 🎯 OBJETIVOS Y PRÓXIMOS PASOS

### **Inmediatos (Prioridad Alta):**
1. **Solucionar iconos EAS Build** - Claude Code trabajando
2. **Generar APK funcional** - Testing en dispositivo real
3. **Extraer config Firebase real** - Del HTML a proyecto Expo
4. **Testing APK** - Instalación sin problemas

### **Mediano Plazo:**
1. **Sincronizar funcionalidades** web ↔ móvil
2. **Optimizar experiencias** por plataforma
3. **Testing multiplataforma** - Android, iOS, Web
4. **Documentar APIs** y componentes

### **Largo Plazo:**
1. **Publicar en stores** - Google Play, App Store
2. **Analytics e métricas** - Usuario, rendimiento
3. **Notificaciones push** - Para viajes y actualizaciones
4. **Escalabilidad** - Múltiples ciudades, idiomas

---

## 👥 INFORMACIÓN DE CUENTAS Y ACCESOS

- **Expo Account:** mario24874 (configurado y logueado)
- **EAS CLI:** Instalado y funcional
- **Firebase Project:** Configurado (extraer config del HTML)
- **Mapbox Account:** API key configurada (verificar cuotas)

---

## 📝 NOTAS TÉCNICAS IMPORTANTES

### **Compatibilidad:**
- **Web:** Chrome 90+, Firefox 88+, Safari 14+
- **Móvil:** Android 7.0+ (API 24+), iOS 12+
- **Node.js:** v22.16.0 (verificado funcionando)

### **Dependencias Críticas:**
- **React 18:** Funciones concurrentes, hydración mejorada
- **Expo SDK 51:** Última versión estable
- **Capacitor 6:** Bridge web-nativo actualizado
- **Firebase 10:** SDK modular optimizado

### **Rendimiento:**
- **Bundle size web:** ~2MB comprimido
- **APK size esperado:** 10-50MB (dependiendo de assets)
- **Tiempo de build EAS:** 10-15 minutos promedio

---

## 🔍 DEBUGGING Y LOGS

### **Logs importantes:**
- **EAS Build logs:** https://expo.dev/accounts/mario24874/projects/urban-drive/builds/
- **Servidor APK:** `server.log` en directorio raíz
- **Console errors:** DevTools de navegador

### **Comandos de debugging:**
```bash
# Ver estado servidor
curl -s http://localhost:3001/apk-info | python3 -m json.tool

# Verificar archivos APK
ls -la public/downloads/

# Check EAS builds
npx eas build:list --limit 5
```

---

## 🚀 BITÁCORA DE CAMBIOS

### **📅 2025-07-24 - Sesión Inicial (Claude Principal)**

**Contexto inicial:**
- Usuario quería probar Urban Drive en PC y crear APK para móviles
- Proyecto React existente con Firebase y Mapbox

**Cambios realizados:**
1. **Análisis completo del proyecto existente**
   - Identificada estructura React + TypeScript + Vite
   - Confirmado Capacitor 6.0 para builds nativos
   - Detectado urban-drive-portable.html como versión standalone

2. **Configuración del servidor APK**
   - Creado `serve-apk.cjs` para servir archivos APK en puerto 3001
   - Implementados endpoints: `/download-apk`, `/apk-info`, `/downloads/*`
   - Configurado CORS para acceso desde diferentes orígenes

3. **Intentos de generación APK manual**
   - Script Python `create-simple-apk.py` para estructura APK básica
   - Script Bash `generate-signed-apk.sh` para APK con firma simulada
   - **Resultado:** APKs no instalables por estructura inválida

4. **Migración a solución Expo**
   - Creado proyecto `urban-drive-expo-standalone/` con Expo SDK 51
   - Configurado EAS CLI y login exitoso (mario24874)
   - Estructura completa: App.js, screens/, services/, configuraciones

5. **Configuración de dependencias**
   - `npm install` completado: 1234 packages
   - Expo CLI 0.18.31 funcionando
   - EAS CLI 16.17.3 instalado y verificado

**Problemas encontrados:**
- APKs manuales no funcionan (parsing error en Android)
- Gmail/WhatsApp bloquean APKs sin certificados válidos
- EAS Build falló por iconos faltantes

**Estado al finalizar:**
- ✅ Proyecto web funcionando completamente
- ✅ Servidor APK sirviendo archivos correctamente
- ✅ Proyecto Expo creado y configurado
- ❌ Build EAS fallando por assets faltantes
- 🔄 Claude Code tomando el caso de iconos y build

**Próximos pasos definidos:**
1. Claude Code: Resolver iconos y generar APK funcional
2. Claude Principal: Continuar con mejoras web multiplataforma
3. Sincronización: Una vez APK listo, coordinar funcionalidades

**Tiempo invertido:** ~3 horas de desarrollo activo

---

### **📝 TEMPLATE PARA FUTURAS ACTUALIZACIONES:**

```markdown
### **📅 [FECHA] - [DESCRIPCIÓN SESIÓN] ([AGENTE])**

**Contexto recibido:**
- [Describir estado del proyecto al iniciar]

**Cambios realizados:**
1. **[Categoría de cambio]**
   - [Detalle específico]
   - [Otro detalle]

**Problemas encontrados:**
- [Problema 1]: [Descripción y causa]
- [Problema 2]: [Descripción y solución aplicada]

**Estado al finalizar:**
- ✅ [Funcionalidad completada]
- ❌ [Problema persistente]
- 🔄 [En proceso]

**Próximos pasos:**
1. [Paso inmediato]
2. [Paso siguiente]

**Tiempo invertido:** [Duración estimada]
**Archivos modificados:** [Lista de archivos principales]

---
```

### **📅 2025-08-19 - Preparación para Producción (Claude Code)**

**Contexto recibido:**
- Proyecto con 65+ errores de linting y TypeScript
- Build fallando por problemas de tipos y configuración
- Variables Firebase sin configurar
- Análisis solicitado para preparar despliegue

**Cambios realizados:**
1. **Configuración Firebase**
   - Creado archivo .env con credenciales extraídas del HTML portable
   - Configuradas variables VITE_FIREBASE_* para el proyecto
   - Verificada conexión a Firebase urbandrive-1082b

2. **Corrección de errores TypeScript**
   - Creado archivo src/types/index.ts con tipos apropiados
   - Corregidos 50+ errores en PortableInterface.tsx
   - Añadidos tipos Contact, Message, Location, UserData
   - Eliminados imports no utilizados en database-sync.ts

3. **Corrección de React Hooks**
   - Corregidas dependencias faltantes en DriverLocation.tsx
   - Corregidas dependencias en Map.tsx
   - Reorganizado orden de funciones para evitar hoisting issues

4. **Optimización del build**
   - Build exitoso: 801 KB comprimido (13MB total)
   - PWA completamente funcional
   - Service Worker y manifest configurados
   - Cacheo optimizado para Mapbox y Firebase

**Problemas encontrados:**
- Error menor en vite-plugin-pwa: Dynamic require workbox-build (no afecta funcionalidad)
- Tipos any reemplazados por tipos específicos
- Imports duplicados y no utilizados eliminados

**Estado al finalizar:**
- ✅ Build de producción exitoso (npm run build)
- ✅ TypeScript compilation sin errores
- ✅ PWA lista para instalar en dispositivos
- ✅ Firebase configurado y funcionando
- ✅ Archivos de despliegue en dist/ (13MB)
- ✅ Script deploy-production.sh creado

**Próximos pasos:**
1. **DESPLIEGUE INMEDIATO**: Subir carpeta dist/ a hosting
2. Testing en dispositivos móviles reales
3. Configurar dominio personalizado
4. Implementar Analytics y métricas

**Tiempo invertido:** 2 horas de development activo
**Archivos modificados:** 
- .env (nuevo)
- src/types/index.ts (nuevo) 
- src/components/PortableInterface.tsx
- src/components/DriverLocation.tsx
- src/components/Map.tsx
- src/services/database-sync.ts
- deploy-production.sh (nuevo)

**Recomendación final:** 
✅ **PWA PRIORITARIO** - Proyecto listo para producción como PWA
❌ **APK SECUNDARIO** - Desarrollar después de validar PWA en uso real

---

**⚠️ IMPORTANTE:** Siempre actualiza esta bitácora antes de terminar tu sesión de trabajo.

---

## 📞 CONTACTO Y COORDINACIÓN

**Para coordinación entre agentes:**
- Menciona en la bitácora en qué estás trabajando
- No modifiques archivos que otro agente esté usando
- Si encuentras conflictos, documenta y comunica
- Prioriza la funcionalidad sobre la perfección

**Recursos útiles:**
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Reference](https://docs.expo.dev/build/introduction/)
- [Firebase Web Guide](https://firebase.google.com/docs/web/setup)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

---

**🎯 El objetivo final es tener un APK real, instalable y funcional que permita al usuario distribuir Urban Drive sin problemas técnicos.**