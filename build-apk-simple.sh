#!/bin/bash

echo "🚀 Generando APK firmado simple..."

# Verificar que existe el directorio android
if [ ! -d "android" ]; then
    echo "📱 Creando proyecto Android..."
    npx cap add android
fi

# Crear keystore si no existe
KEYSTORE_FILE="urban-drive.keystore"
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "🔐 Creando keystore..."
    keytool -genkey -v -keystore $KEYSTORE_FILE -alias urban-drive -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=Urban Drive, OU=Dev, O=Urban Drive, L=City, ST=State, C=CO" \
        -storepass urbandrive123 -keypass urbandrive123
fi

# Configurar build.gradle para firma
cd android/app

# Crear gradle.properties local si no existe
if [ ! -f "gradle.properties" ]; then
    echo "⚙️ Configurando gradle..."
    cat > gradle.properties << EOF
android.useAndroidX=true
android.enableJetifier=true
MYAPP_UPLOAD_STORE_FILE=../../urban-drive.keystore
MYAPP_UPLOAD_KEY_ALIAS=urban-drive
MYAPP_UPLOAD_STORE_PASSWORD=urbandrive123
MYAPP_UPLOAD_KEY_PASSWORD=urbandrive123
EOF
fi

# Modificar build.gradle para agregar signingConfigs
if ! grep -q "signingConfigs" build.gradle; then
    echo "📝 Agregando configuración de firma..."
    
    # Crear backup
    cp build.gradle build.gradle.backup
    
    # Agregar signingConfigs antes de buildTypes
    sed -i '/android {/a\
    signingConfigs {\
        release {\
            if (project.hasProperty("MYAPP_UPLOAD_STORE_FILE")) {\
                storeFile file(MYAPP_UPLOAD_STORE_FILE)\
                storePassword MYAPP_UPLOAD_STORE_PASSWORD\
                keyAlias MYAPP_UPLOAD_KEY_ALIAS\
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD\
            }\
        }\
    }' build.gradle
    
    # Agregar signingConfig al buildType release
    sed -i '/release {/a\
            signingConfig signingConfigs.release' build.gradle
fi

# Construir APK
echo "🔨 Construyendo APK firmado..."
cd ..
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    # Copiar APK a public/downloads
    cd ..
    mkdir -p public/downloads
    cp android/app/build/outputs/apk/release/app-release.apk public/downloads/urban-drive-signed.apk
    
    echo ""
    echo "✅ APK firmado generado!"
    echo "📱 Ubicación: public/downloads/urban-drive-signed.apk"
    echo "📊 Tamaño: $(du -h public/downloads/urban-drive-signed.apk | cut -f1)"
    echo ""
    echo "🔐 APK firmado y listo para distribución"
    echo "✅ Compatible con Gmail/WhatsApp"
else
    echo "❌ Error generando APK"
    cd ..
    exit 1
fi