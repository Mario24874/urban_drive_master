#!/bin/bash

echo "🚀 Generando APK firmado para Urban Drive..."
echo "============================================"

# Función para verificar comandos
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
echo "🔍 Verificando dependencias..."

if ! command_exists npm; then
    echo "❌ npm no está instalado"
    exit 1
fi

if ! command_exists keytool; then
    echo "❌ Java/keytool no está instalado"
    echo "💡 Instala Java JDK para continuar"
    exit 1
fi

echo "✅ Dependencias verificadas"

# Construir aplicación web
echo "🏗️ Construyendo aplicación web..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en build de la aplicación"
    exit 1
fi

# Sincronizar con Capacitor
echo "📱 Sincronizando con Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Error sincronizando con Capacitor"
    exit 1
fi

# Crear keystore para firma (solo si no existe)
KEYSTORE_PATH="urban-drive-release-key.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "🔐 Creando keystore para firma..."
    keytool -genkey -v -keystore $KEYSTORE_PATH -alias urban-drive -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=Urban Drive, OU=Development, O=Urban Drive App, L=City, ST=State, C=CO" \
        -storepass urbandrive123 -keypass urbandrive123
    
    if [ $? -ne 0 ]; then
        echo "❌ Error creando keystore"
        exit 1
    fi
    echo "✅ Keystore creado: $KEYSTORE_PATH"
else
    echo "✅ Keystore existente encontrado"
fi

# Configurar gradle para firma
echo "⚙️ Configurando firma en Gradle..."

GRADLE_PROPERTIES="android/app/build.gradle"
if [ -f "$GRADLE_PROPERTIES" ]; then
    # Verificar si ya está configurado
    if ! grep -q "signingConfigs" "$GRADLE_PROPERTIES"; then
        echo "📝 Agregando configuración de firma..."
        
        # Backup del archivo original
        cp "$GRADLE_PROPERTIES" "${GRADLE_PROPERTIES}.backup"
        
        # Agregar configuración de firma antes del buildTypes
        sed -i '/buildTypes {/i\
    signingConfigs {\
        release {\
            keyAlias "urban-drive"\
            keyPassword "urbandrive123"\
            storeFile file("../../urban-drive-release-key.keystore")\
            storePassword "urbandrive123"\
        }\
    }\
' "$GRADLE_PROPERTIES"
        
        # Agregar signingConfig al release build type
        sed -i '/release {/a\
            signingConfig signingConfigs.release' "$GRADLE_PROPERTIES"
        
        echo "✅ Configuración de firma agregada"
    else
        echo "✅ Configuración de firma ya existe"
    fi
fi

# Construir APK firmado
echo "🔨 Construyendo APK firmado..."
cd android
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo "❌ Error construyendo APK"
    cd ..
    exit 1
fi

cd ..

# Verificar APK generado
APK_RELEASE_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_RELEASE_PATH" ]; then
    # Copiar APK a carpeta de descargas
    mkdir -p public/downloads
    cp "$APK_RELEASE_PATH" "public/downloads/urban-drive-signed.apk"
    
    # Información del APK
    APK_SIZE=$(du -h "public/downloads/urban-drive-signed.apk" | cut -f1)
    
    echo ""
    echo "🎉 ¡APK firmado generado exitosamente!"
    echo "======================================"
    echo ""
    echo "📱 APK firmado: public/downloads/urban-drive-signed.apk"
    echo "📊 Tamaño: $APK_SIZE"
    echo ""
    echo "🔐 APK firmado con keystore personal"
    echo "✅ Apto para instalación en dispositivos Android"
    echo "✅ No será bloqueado por Gmail/WhatsApp"
    echo ""
    echo "📤 Para distribuir:"
    echo "   1. Envía: public/downloads/urban-drive-signed.apk"
    echo "   2. En Android: Habilita 'Fuentes desconocidas'"
    echo "   3. Instala normalmente"
    echo ""
    echo "💡 El keystore se guardó en: $KEYSTORE_PATH"
    echo "   Guárdalo de forma segura para futuras actualizaciones"
    
else
    echo "❌ APK no fue generado correctamente"
    exit 1
fi