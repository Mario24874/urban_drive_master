#!/bin/bash

echo "🚀 Iniciando Urban Drive - Sistema Completo"
echo "=========================================="

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
echo "🔍 Verificando dependencias..."

if ! command_exists node; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ Dependencias verificadas"

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
    echo "📦 Instalando dependencias..."
    npm install express cors
fi

# Generar APK si no existe
if [ ! -f "public/downloads/urban-drive.apk" ]; then
    echo "📱 Generando APK válido..."
    python3 create-simple-apk.py
fi

# Iniciar servidor APK
echo "🌐 Iniciando servidor APK..."
if pgrep -f "serve-apk.cjs" > /dev/null; then
    echo "✅ Servidor ya está ejecutándose"
else
    ./start-apk-server.sh &
    sleep 3
    echo "✅ Servidor APK iniciado"
fi

# Verificar que todo esté funcionando
echo "🔍 Verificando servicios..."
sleep 2

if curl -s http://localhost:3001/apk-info > /dev/null; then
    echo "✅ Servidor APK respondiendo correctamente"
    
    # Obtener información del APK
    APK_INFO=$(curl -s http://localhost:3001/apk-info)
    APK_SIZE=$(echo "$APK_INFO" | grep -o '"size":[0-9]*' | grep -o '[0-9]*')
    APK_SIZE_MB=$(echo "scale=1; $APK_SIZE / 1024 / 1024" | bc 2>/dev/null || echo "?")
    
    echo "📋 APK disponible: ${APK_SIZE_MB} MB"
else
    echo "❌ Error: Servidor APK no responde"
    exit 1
fi

echo ""
echo "🎉 Urban Drive iniciado exitosamente!"
echo "====================================="
echo ""
echo "📱 Para usar la aplicación:"
echo "   1. Abre: urban-drive-portable.html en tu navegador"
echo "   2. Haz clic en 'Descargar APK' para obtener el archivo"
echo "   3. Envía el archivo por WhatsApp/Email a tus contactos"
echo ""
echo "🌐 URLs disponibles:"
echo "   - Servidor APK: http://localhost:3001"
echo "   - Descargar APK: http://localhost:3001/download-apk"
echo "   - APK Directo: http://localhost:3001/downloads/urban-drive.apk"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver estado: ./check-server.sh"
echo "   - Generar APK real: ./build-apk.sh"
echo "   - Detener servidor: pkill -f serve-apk.cjs"
echo ""
echo "💡 El servidor seguirá ejecutándose en segundo plano."
echo "   Para detenerlo, usa: pkill -f serve-apk.cjs"