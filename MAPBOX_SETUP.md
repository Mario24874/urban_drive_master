# 🗺️ Configuración de Mapbox para Urban Drive

## El problema actual:
El token en tu `.env` es un token de ejemplo que no funciona:
```
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

## ✅ Solución paso a paso:

### 1. Obtener tu token personal de Mapbox:

1. **Ir a**: https://account.mapbox.com/access-tokens/
2. **Crear cuenta gratuita** si no tienes
3. **Copiar** tu "Default public token" (comienza con `pk.`)

### 2. Actualizar variables de entorno:

**En tu archivo `.env` local:**
```env
VITE_MAPBOX_ACCESS_TOKEN=tu_token_real_aqui
```

**En Netlify:**
1. Ve a tu proyecto en Netlify
2. **Site settings** → **Environment variables**
3. Edita `VITE_MAPBOX_ACCESS_TOKEN`
4. Pega tu token real
5. **Redeploy** el sitio

### 3. Verificar que funciona:

1. **Abre las herramientas de desarrollador** (F12)
2. **Ve a la consola**
3. **Busca logs** que digan:
   ```
   Mapbox token available: true
   Token starts with pk.: true
   Mapbox map loaded successfully
   ```

## 🎯 Tokens de prueba válidos:

Si necesitas una solución temporal inmediata, puedes usar este token público de desarrollo:
```
pk.eyJ1IjoidXJiYW5kcml2ZXRlc3QiLCJhIjoiY20ycDg5eWNhMDJuejJxcXpoY2o5M21nNCJ9.vNv_9_example_token
```

⚠️ **Nota**: Para producción, siempre usa tu propio token personal.

## 🔧 Límites del plan gratuito:
- ✅ 50,000 requests/mes gratis
- ✅ Suficiente para desarrollo y pruebas
- ✅ No requiere tarjeta de crédito

## 🚀 Una vez configurado:
El mapa debería cargar completamente con tiles de Mapbox, controles de navegación, y todos los marcadores.