#!/bin/bash

echo "🚀 Iniciando servidor APK para Urban Drive..."

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si npm está disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install express cors
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/cors" ]; then
    echo "📦 Instalando dependencias del servidor APK..."
    npm install express cors
fi

echo "🌐 Iniciando servidor en puerto 3001..."
echo ""
echo "📱 URLs disponibles:"
echo "   - Servidor: http://localhost:3001"
echo "   - Descargar APK: http://localhost:3001/download-apk"
echo "   - Info APK: http://localhost:3001/apk-info"
echo ""
echo "💡 Para detener el servidor presiona Ctrl+C"
echo ""

# Iniciar servidor
node serve-apk.cjs