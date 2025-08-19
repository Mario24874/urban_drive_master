# Urban Drive - Proyecto Expo

## 📱 Ubicación del Proyecto Expo

El proyecto Expo de Urban Drive se ha movido a un directorio separado para mantener el repositorio principal ligero:

**Ubicación:** `../urban-drive-expo-standalone/`

## 🚀 Cómo usar el proyecto Expo

### 1. Navegar al proyecto
```bash
cd ../urban-drive-expo-standalone
```

### 2. Abrir en Visual Studio Code
```bash
code .
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar en desarrollo
```bash
expo start
```

### 5. Generar APK real
```bash
# Instalar EAS CLI (solo primera vez)
npm install -g eas-cli

# Login en Expo
eas login

# Configurar build (solo primera vez)
eas build:configure

# Generar APK
eas build --platform android --profile preview
```

## ✅ Ventajas del Proyecto Expo

- **APK 100% funcional** - No será bloqueado por Gmail/WhatsApp
- **Certificado oficial** - Firmado por Expo
- **Instalable sin problemas** - Compatible con todos los Android
- **Editable en VS Code** - Proyecto React Native completo
- **Firebase integrado** - Base de datos y autenticación
- **Maps nativo** - Mejor rendimiento

## 📋 Estructura del Proyecto

```
urban-drive-expo-standalone/
├── App.js              # Navegación principal
├── screens/            # Pantallas de la app
│   ├── AuthScreen.js   # Login/Registro
│   ├── HomeScreen.js   # Pantalla principal
│   └── MapScreen.js    # Mapa con ubicación
├── services/           # Servicios
│   └── firebase.js     # Configuración Firebase
├── components/         # Componentes reutilizables
├── assets/            # Imágenes e iconos
├── app.json           # Configuración Expo
├── eas.json           # Configuración EAS Build
└── package.json       # Dependencias
```

## 🔧 Configuración Requerida

1. **Firebase**: Actualizar `services/firebase.js` con tu configuración
2. **Expo Account**: Crear cuenta en https://expo.dev
3. **EAS CLI**: Para generar APKs reales

## 💡 Notas Importantes

- El APK generado por EAS es completamente funcional
- No necesita Android Studio ni SDK de Android
- Se puede subir a Google Play Store
- Compatible con Expo Go para testing rápido

## 📤 Distribución

El APK se descarga desde tu dashboard de Expo después del build y se puede compartir directamente sin problemas de bloqueo.