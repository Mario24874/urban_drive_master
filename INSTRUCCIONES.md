# 🚗 Urban Drive - Cómo ver el proyecto localmente

## ⚡ **Método más rápido (recomendado)**

### **Opción 1: Archivo HTML directo**
1. Abre el archivo `start-dev.html` directamente en tu navegador
2. ¡Listo! El proyecto se ejecutará inmediatamente

### **Opción 2: Servidor local con Python**
```bash
# Si tienes Python instalado
double-click en run-local.bat

# O manualmente:
python -m http.server 3000
# Luego ve a: http://localhost:3000/start-dev.html
```

### **Opción 3: Servidor local con Node.js**
```bash
# Si tienes Node.js instalado
npx http-server . -p 3000
# Luego ve a: http://localhost:3000/start-dev.html
```

## 📱 **Para probar en móvil**

1. Inicia el servidor local (Opción 2 o 3)
2. Encuentra tu IP local:
   ```bash
   ipconfig
   # Busca tu IPv4 (ejemplo: 192.168.1.100)
   ```
3. En tu móvil ve a: `http://192.168.1.100:3000/start-dev.html`

## ✨ **Qué puedes ver en el demo**

### **Funcionalidades implementadas:**
- ✅ **Navegación responsive** - Se adapta automáticamente a móvil/desktop
- ✅ **Páginas funcionales** - Home, Login, Register
- ✅ **Diseño moderno** - UI limpia y profesional
- ✅ **Touch-friendly** - Optimizado para dispositivos móviles
- ✅ **Animaciones suaves** - Transiciones y efectos
- ✅ **Formularios funcionales** - Campos interactivos

### **Características del proyecto completo:**
- 🌐 **PWA (Progressive Web App)** - Instalable como app
- 📱 **Mobile-first design** - Optimizado para móviles
- 🔄 **Offline support** - Funciona sin internet
- 📦 **APK generation** - Se puede convertir a app Android
- 🌍 **Multi-browser** - Compatible con todos los navegadores

## 🔧 **Para desarrollo completo**

Si quieres el proyecto completo con todas las funcionalidades:

1. **Instala las dependencias:**
   ```bash
   npm install
   ```

2. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Para generar APK Android:**
   ```bash
   ./scripts/build-android.sh
   ```

## 🎯 **Problemas comunes**

**Error "vite no se reconoce":**
- Usa el archivo `start-dev.html` directamente
- O instala las dependencias: `npm install`

**El proyecto no se ve bien:**
- Asegúrate de que JavaScript esté habilitado
- Usa un navegador moderno (Chrome, Firefox, Edge, Safari)

**No se ve en móvil:**
- Verifica que estés en la misma red WiFi
- Usa la IP correcta del servidor

## 🚀 **Estado del proyecto**

Urban Drive ha sido **completamente modernizado** con:
- Arquitectura moderna React + TypeScript
- Diseño responsive para todas las pantallas
- Integración con Firebase y Mapbox
- Capacidades PWA y generación de APK
- Optimizaciones de rendimiento
- Soporte offline

¡El proyecto está listo para producción y puede desplegarse en cualquier plataforma!