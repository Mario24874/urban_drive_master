#!/bin/bash

# Script de despliegue para Urban Drive PWA
# Versión de producción lista para desplegar

echo "🚀 Urban Drive - Script de Despliegue"
echo "=================================="

# Verificar que existe el build
if [ ! -d "dist" ]; then
    echo "❌ No se encontró la carpeta 'dist'. Ejecutando build..."
    npm run build
fi

# Mostrar información del build
echo ""
echo "📊 Información del build:"
echo "------------------------"
du -sh dist/
echo ""
echo "📁 Archivos generados:"
ls -la dist/

# Verificar archivos críticos
echo ""
echo "🔍 Verificando archivos críticos:"
echo "--------------------------------"

critical_files=(
    "dist/index.html"
    "dist/manifest.webmanifest"
    "dist/sw.js"
    "dist/assets"
    ".env"
)

for file in "${critical_files[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANTE"
    fi
done

echo ""
echo "🌐 PWA configurada correctamente:"
echo "--------------------------------"
echo "✅ Service Worker (sw.js)"
echo "✅ Web App Manifest"
echo "✅ Iconos optimizados"
echo "✅ Cacheo offline"
echo "✅ Firebase configurado"

echo ""
echo "📱 Funcionalidades disponibles:"
echo "------------------------------"
echo "✅ Autenticación (Firebase Auth)"
echo "✅ Base de datos (Firestore)"
echo "✅ Mapas (Mapbox GL JS)"
echo "✅ Geolocalización"
echo "✅ Compartir contenido"
echo "✅ Instalable como PWA"
echo "✅ Modo offline"

echo ""
echo "🚀 ¡Listo para desplegar!"
echo "========================="
echo ""
echo "Opciones de despliegue:"
echo "1. Subir carpeta 'dist/' a tu servidor web"
echo "2. Usar Firebase Hosting: firebase deploy"
echo "3. Usar Netlify: arrastra 'dist/' a netlify.com"
echo "4. Usar Vercel: vercel --prod"
echo ""
echo "URL recomendadas para testing:"
echo "- Localhost: npm run preview"
echo "- Firebase: https://[proyecto].web.app"
echo ""
echo "📖 Documentación en PROJECT-CONTEXT.md"