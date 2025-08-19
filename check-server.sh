#!/bin/bash

echo "🔍 Verificando estado del servidor APK..."

# Verificar si el servidor está ejecutándose
if pgrep -f "serve-apk.cjs" > /dev/null; then
    echo "✅ Servidor está ejecutándose"
    
    # Verificar conectividad
    if curl -s http://localhost:3001/apk-info > /dev/null; then
        echo "✅ Servidor responde correctamente"
        
        # Obtener información del APK
        APK_INFO=$(curl -s http://localhost:3001/apk-info)
        echo "📋 Información del APK:"
        echo "$APK_INFO" | jq '.' 2>/dev/null || echo "$APK_INFO"
        
    else
        echo "❌ Servidor no responde en puerto 3001"
        echo "🔧 Intenta reiniciar el servidor: ./start-apk-server.sh"
    fi
else
    echo "❌ Servidor no está ejecutándose"
    echo "🚀 Iniciando servidor..."
    ./start-apk-server.sh &
    sleep 3
    echo "✅ Servidor iniciado. Prueba de nuevo en unos segundos."
fi

echo ""
echo "📱 URLs disponibles:"
echo "   - APK Info: http://localhost:3001/apk-info"
echo "   - Descargar APK: http://localhost:3001/download-apk"
echo "   - APK Directo: http://localhost:3001/downloads/urban-drive.apk"