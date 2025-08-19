#!/bin/bash

echo "🧪 Probando descarga de APK completa..."

# Verificar que el servidor esté ejecutándose
./check-server.sh

echo ""
echo "🔍 Verificando APK..."
./verify-apk.sh

echo ""
echo "🌐 Probando endpoints..."

# Probar endpoint de información
echo "📋 Probando /apk-info:"
curl -s http://localhost:3001/apk-info | python3 -m json.tool

echo ""
echo "📱 Probando descarga directa:"
curl -I http://localhost:3001/download-apk 2>/dev/null | head -5

echo ""
echo "📁 Probando descarga de archivo:"
curl -I http://localhost:3001/downloads/urban-drive.apk 2>/dev/null | head -5

echo ""
echo "✅ Pruebas completadas!"
echo ""
echo "📱 Para probar en tu móvil:"
echo "   1. Abre: http://localhost:8080/urban-drive-portable.html"
echo "   2. Haz clic en 'Descargar APK'"
echo "   3. Confirma la descarga"
echo "   4. Instala el APK descargado"
echo ""
echo "💡 Recuerda habilitar 'Fuentes desconocidas' en Android"