# ✅ CHECKLIST DE SINCRONIZACIÓN

## 🎯 PARA MANTENER AMBAS APPS SINCRONIZADAS

### 📋 **CAMBIOS QUE REQUIEREN SINCRONIZACIÓN:**

#### 🔥 **Firebase/Supabase**
- [ ] Nuevas colecciones/tablas
- [ ] Cambios en estructura de datos
- [ ] Nuevos índices
- [ ] Reglas de seguridad

#### 🎨 **UI/Componentes**
- [ ] Nuevas pantallas
- [ ] Cambios en navegación
- [ ] Componentes compartidos
- [ ] Estilos y temas

#### ⚙️ **Configuraciones**
- [ ] Variables de entorno
- [ ] APIs externas (Mapbox, etc.)
- [ ] Permisos de aplicación
- [ ] Configuración de build

#### 🔧 **Servicios/Lógica**
- [ ] Nuevos servicios
- [ ] Cambios en autenticación
- [ ] Lógica de negocio
- [ ] Validaciones

### 🔄 **PROCESO DE SINCRONIZACIÓN:**

#### **1. CAMBIOS EN WEB → EXPO**
```bash
# 1. Identificar archivos modificados
git status

# 2. Copiar archivos necesarios
cp src/services/auth.js ../urban-drive-expo-standalone/services/
cp src/components/NewComponent.tsx ../urban-drive-expo-standalone/components/

# 3. Adaptar para React Native
# - import.meta.env → process.env.EXPO_PUBLIC_
# - localStorage → AsyncStorage
# - DOM específico → React Native equivalente

# 4. Actualizar dependencias si es necesario
cd ../urban-drive-expo-standalone
npm install nueva-dependencia
```

#### **2. CAMBIOS EN EXPO → WEB**
```bash
# 1. Desde directorio Expo
git status

# 2. Copiar archivos modificados
cp services/new-service.ts ../Urban-Drive-master/src/services/
cp components/NewComponent.tsx ../Urban-Drive-master/src/components/

# 3. Adaptar para Web
# - process.env.EXPO_PUBLIC_ → import.meta.env.VITE_
# - AsyncStorage → localStorage
# - React Native específico → DOM equivalente

# 4. Actualizar dependencias
cd ../Urban-Drive-master
npm install nueva-dependencia
```

### 📝 **TEMPLATE DE COMMIT SINCRONIZADO**

Usar este formato para commits que afectan ambas apps:

```
[SYNC] Descripción del cambio

- ✅ Web: Implementado
- ✅ Expo: Implementado
- ✅ Database: Actualizada
- ✅ Tests: Verificados

Files changed:
- src/services/auth.js → services/auth.ts
- src/components/Login.tsx → components/Login.tsx
```

### 🚨 **DIFERENCIAS CRÍTICAS A RECORDAR**

#### **Variables de Entorno:**
```javascript
// WEB (Vite)
import.meta.env.VITE_FIREBASE_API_KEY

// EXPO
process.env.EXPO_PUBLIC_FIREBASE_API_KEY
```

#### **Almacenamiento Local:**
```javascript
// WEB
localStorage.setItem('key', 'value')
localStorage.getItem('key')

// EXPO
AsyncStorage.setItem('key', 'value')
AsyncStorage.getItem('key')
```

#### **Navegación:**
```javascript
// WEB (React Router)
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/profile')

// EXPO (Expo Router)
import { router } from 'expo-router'
router.push('/profile')
```

#### **Ubicación:**
```javascript
// WEB
navigator.geolocation.getCurrentPosition()

// EXPO
import * as Location from 'expo-location'
Location.getCurrentPositionAsync()
```

### 📊 **MONITOREO POST-SINCRONIZACIÓN**

Después de sincronizar, verificar:

#### **✅ Base de Datos**
- [ ] Mismos usuarios en Firebase y Supabase
- [ ] Estructura de datos idéntica
- [ ] Sincronización funcionando

#### **✅ Funcionalidad**
- [ ] Login/Register funciona en ambas
- [ ] Mapas se cargan correctamente
- [ ] Invitaciones se envían
- [ ] APK se genera sin errores

#### **✅ Performance**
- [ ] Tiempos de carga similares
- [ ] Sin memory leaks
- [ ] Batería optimizada (móvil)

### 🔧 **HERRAMIENTAS ÚTILES**

#### **Comparar archivos:**
```bash
# Comparar servicios
diff src/services/auth.js ../urban-drive-expo-standalone/services/auth.ts

# Comparar componentes
diff -r src/components/ ../urban-drive-expo-standalone/components/
```

#### **Automatización:**
```bash
# Script para sincronizar automáticamente
#!/bin/bash
echo "🔄 Sincronizando cambios..."

# Copiar servicios modificados
rsync -av --exclude='*.test.*' src/services/ ../urban-drive-expo-standalone/services/

# Copiar componentes comunes
rsync -av --exclude='*.test.*' src/components/shared/ ../urban-drive-expo-standalone/components/shared/

echo "✅ Sincronización completada"
```

### 📱 **TESTING EN AMBAS PLATAFORMAS**

Antes de hacer push:

```bash
# Web
npm run dev
npm run build
npm run test

# Expo
cd ../urban-drive-expo-standalone
npx expo start
npx eas build --platform android --profile preview
```

### 🎯 **REGLA DE ORO**

> **"Si cambias algo en una app, inmediatamente verifica si necesita sincronizarse con la otra"**

Mantén siempre ambas aplicaciones funcionalmente idénticas.