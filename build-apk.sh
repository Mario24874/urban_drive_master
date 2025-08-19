#!/bin/bash

echo "🚀 Generando APK de Urban Drive..."

# Verificar que existe el directorio android
if [ ! -d "android" ]; then
    echo "❌ Directorio android no encontrado. Ejecutando configuración inicial..."
    npm run build
    npx cap add android
    npx cap sync android
fi

# Verificar Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME no está configurado."
    echo "📋 Ejecuta primero: ./setup-android-sdk.sh"
    exit 1
fi

# Compilar la aplicación web
echo "🔨 Compilando aplicación web..."
npm run build

# Sincronizar con Capacitor
echo "🔄 Sincronizando con Capacitor..."
npx cap sync android

# Generar APK
echo "📱 Generando APK..."
cd android

# Generar APK debug
echo "🔧 Compilando APK debug..."
./gradlew clean
./gradlew assembleDebug

# Verificar si se generó el APK
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ APK generado exitosamente!"
    
    # Copiar APK a la carpeta de descargas públicas
    echo "📂 Copiando APK a carpeta pública..."
    cd ..
    cp "android/$APK_PATH" "public/downloads/urban-drive.apk"
    
    # Información del APK
    APK_SIZE=$(du -h "public/downloads/urban-drive.apk" | cut -f1)
    echo ""
    echo "📋 Información del APK:"
    echo "   - Archivo: public/downloads/urban-drive.apk"
    echo "   - Tamaño: $APK_SIZE"
    echo "   - Tipo: Debug APK"
    echo "   - Package: com.urbandrive.app"
    echo ""
    echo "🎉 ¡APK listo para descargar!"
    echo "📱 URL de descarga: http://localhost:3001/downloads/urban-drive.apk"
    
else
    echo "❌ Error: No se pudo generar el APK"
    echo "📋 Verifica los logs de Gradle arriba para más información"
    exit 1
fi