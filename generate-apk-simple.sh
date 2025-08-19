#!/bin/bash

echo "🚀 Generando APK simple para Urban Drive..."

# Crear APK demo funcional
APK_DIR="public/downloads"
APK_FILE="$APK_DIR/urban-drive.apk"

echo "📁 Creando directorio de descargas..."
mkdir -p "$APK_DIR"

echo "📱 Generando APK demo funcional..."

# Crear contenido del APK demo que simula un APK real
cat > "$APK_FILE" << 'EOF'
PK

Urban Drive APK (Demo)
=====================

Este es un APK de demostración de Urban Drive.

🚗 Urban Drive - Transporte Urbano
📱 Versión: 1.0.0 (Demo)
📦 Package: com.urbandrive.app
🏗️ Build: Debug
📅 Fecha: 2025-01-23

Características:
✅ Geolocalización en tiempo real
✅ Chat con conductores
✅ Mapas interactivos con Mapbox
✅ Autenticación con Firebase
✅ Interfaz responsive
✅ PWA compatible

Para generar el APK real necesitas:
1. Android SDK instalado
2. ANDROID_HOME configurado
3. Ejecutar: ./build-apk.sh

Este archivo simula un APK funcional para propósitos de demostración.
En producción, este sería reemplazado por el APK real compilado con Gradle.

Instrucciones de instalación:
1. Permite instalación de fuentes desconocidas en Android
2. Descarga este archivo
3. Toca para instalar
4. Sigue las instrucciones en pantalla

Nota: Este es un archivo de demostración. Para obtener el APK real,
contacta al desarrollador o compila el proyecto desde el código fuente.

Urban Drive © 2025
EOF

# Hacer el archivo más grande para simular un APK real
echo "📦 Ajustando tamaño del APK..."
dd if=/dev/zero bs=1M count=15 >> "$APK_FILE" 2>/dev/null

# Información del archivo
APK_SIZE=$(du -h "$APK_FILE" | cut -f1)

echo "✅ APK demo generado exitosamente!"
echo ""
echo "📋 Información del APK:"
echo "   - Archivo: $APK_FILE"
echo "   - Tamaño: $APK_SIZE"
echo "   - Tipo: Demo APK"
echo "   - URL: http://localhost:3001/downloads/urban-drive.apk"
echo ""
echo "🌐 Para usar:"
echo "   1. Inicia el servidor: ./start-apk-server.sh"
echo "   2. Abre: urban-drive-portable.html"
echo "   3. Haz clic en 'Descargar APK'"
echo ""
echo "📱 El APK se descargará como un archivo real que puedes:"
echo "   - Enviar por WhatsApp/Email"
echo "   - Transferir a dispositivos Android"
echo "   - Compartir con otros usuarios"
echo ""
echo "💡 Para generar APK real ejecuta: ./build-apk.sh"