#!/bin/bash

echo "🔄 Reiniciando sistema Urban Drive..."

# Detener servidor si está ejecutándose
echo "⏹️ Deteniendo servidor anterior..."
pkill -f "serve-apk.cjs" 2>/dev/null || true
sleep 2

# Verificar que el APK existe
if [ ! -f "public/downloads/urban-drive.apk" ]; then
    echo "📱 Generando APK..."
    python3 create-simple-apk.py
fi

# Verificar APK
echo "🔍 Verificando APK..."
if [ -f "public/downloads/urban-drive.apk" ]; then
    SIZE=$(du -h "public/downloads/urban-drive.apk" | cut -f1)
    echo "   ✅ APK disponible: $SIZE"
else
    echo "   ❌ APK no encontrado"
    exit 1
fi

# Iniciar servidor
echo "🌐 Iniciando servidor APK..."
nohup node serve-apk.cjs > server.log 2>&1 &
sleep 3

# Verificar servidor
echo "🔍 Verificando servidor..."
if curl -s http://localhost:3001/apk-info > /dev/null; then
    echo "   ✅ Servidor funcionando"
    
    # Mostrar información del APK
    APK_INFO=$(curl -s http://localhost:3001/apk-info)
    echo "   📱 APK Status: $(echo "$APK_INFO" | grep -o '"available":[^,]*' | cut -d: -f2)"
    echo "   📦 Tamaño: $(echo "$APK_INFO" | grep -o '"size":[^,]*' | cut -d: -f2) bytes"
else
    echo "   ❌ Servidor no responde"
    echo "   📋 Log del servidor:"
    tail -10 server.log 2>/dev/null || echo "   No hay logs disponibles"
    exit 1
fi

echo ""
echo "✅ Sistema reiniciado exitosamente!"
echo ""
echo "📱 Para probar:"
echo "   1. Abre: urban-drive-portable.html"
echo "   2. Haz clic en 'Descargar APK'"
echo "   3. Debe iniciar la descarga del archivo APK"
echo ""
echo "🔗 Enlaces directos:"
echo "   - APK Info: http://localhost:3001/apk-info"
echo "   - Descargar: http://localhost:3001/download-apk"
echo ""
echo "💡 Si sigue fallando, verifica los logs: tail -f server.log"