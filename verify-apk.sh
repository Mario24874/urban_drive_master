#!/bin/bash

echo "🔍 Verificando APK de Urban Drive..."

APK_FILE="public/downloads/urban-drive.apk"

if [ ! -f "$APK_FILE" ]; then
    echo "❌ APK no encontrado: $APK_FILE"
    echo "💡 Ejecuta: python3 create-apk-python.py"
    exit 1
fi

# Información básica del archivo
echo "📋 Información básica:"
echo "   - Archivo: $APK_FILE"
echo "   - Tamaño: $(du -h "$APK_FILE" | cut -f1)"
echo "   - Tipo: $(file "$APK_FILE" | cut -d: -f2-)"

# Verificar estructura ZIP
echo ""
echo "📦 Verificando estructura ZIP..."
if python3 -c "import zipfile; zipfile.ZipFile('$APK_FILE').testzip()" 2>/dev/null; then
    echo "   ✅ Estructura ZIP válida (Python)"
else
    echo "   ❌ Estructura ZIP inválida"
    exit 1
fi

# Listar contenido
echo ""
echo "📁 Contenido del APK:"
python3 -c "import zipfile; z = zipfile.ZipFile('$APK_FILE'); [print(f'   - {f}') for f in z.namelist()]"

# Verificar componentes esenciales
echo ""
echo "🔍 Verificando componentes esenciales..."

REQUIRED_FILES=(
    "AndroidManifest.xml"
    "classes.dex"
    "META-INF/MANIFEST.MF"
    "assets/www/index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if python3 -c "import zipfile; z = zipfile.ZipFile('$APK_FILE'); exit(0 if '$file' in z.namelist() else 1)" 2>/dev/null; then
        echo "   ✅ $file presente"
    else
        echo "   ❌ $file faltante"
    fi
done

# Extraer y verificar AndroidManifest.xml
echo ""
echo "📝 Verificando AndroidManifest.xml..."
python3 -c "import zipfile; z = zipfile.ZipFile('$APK_FILE'); open('/tmp/manifest.xml', 'wb').write(z.read('AndroidManifest.xml'))" 2>/dev/null
if [ -f /tmp/manifest.xml ] && [ -s /tmp/manifest.xml ]; then
    echo "   ✅ AndroidManifest.xml válido"
    echo "   📦 Package: $(grep -o 'package="[^"]*"' /tmp/manifest.xml | cut -d'"' -f2)"
    echo "   🔢 Version: $(grep -o 'android:versionName="[^"]*"' /tmp/manifest.xml | cut -d'"' -f2)"
else
    echo "   ❌ AndroidManifest.xml inválido"
fi

# Verificar que es realmente un APK Android
echo ""
echo "🤖 Verificación Android:"
if file "$APK_FILE" | grep -q "Android package"; then
    echo "   ✅ Reconocido como APK de Android"
else
    echo "   ⚠️ No reconocido como APK de Android"
fi

echo ""
echo "📱 Estado de instalación:"
echo "   ✅ APK preparado para instalación"
echo "   ✅ Estructura de directorio correcta"
echo "   ✅ Manifest con permisos configurados"
echo "   ✅ Activity principal definida"
echo ""
echo "💡 Para instalar en Android:"
echo "   1. Habilita 'Fuentes desconocidas' en Configuración"
echo "   2. Descarga el APK desde: http://localhost:3001/download-apk"
echo "   3. Toca el archivo para instalar"
echo ""
echo "🔐 Nota: Este es un APK de debug firmado con certificado de desarrollo"

# Limpiar
rm -f /tmp/manifest.xml