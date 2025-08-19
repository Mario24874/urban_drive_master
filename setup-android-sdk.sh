#!/bin/bash

echo "🚀 Configurando Android SDK para Urban Drive..."

# Variables
ANDROID_HOME="/opt/android-sdk"
ANDROID_SDK_ROOT="$ANDROID_HOME"
CMDLINE_TOOLS_VERSION="9477386"
BUILD_TOOLS_VERSION="34.0.0"
PLATFORM_VERSION="34"

# Crear directorio para Android SDK
echo "📁 Creando directorio Android SDK..."
sudo mkdir -p $ANDROID_HOME
sudo chown -R $USER:$USER $ANDROID_HOME

# Descargar Android Command Line Tools
echo "📥 Descargando Android Command Line Tools..."
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip
unzip -q commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip

# Mover command line tools
echo "📋 Instalando Command Line Tools..."
mkdir -p $ANDROID_HOME/cmdline-tools
mv cmdline-tools $ANDROID_HOME/cmdline-tools/latest

# Configurar variables de entorno
echo "🔧 Configurando variables de entorno..."
export ANDROID_HOME=$ANDROID_HOME
export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION

# Agregar al bashrc para persistencia
echo "export ANDROID_HOME=$ANDROID_HOME" >> ~/.bashrc
echo "export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT" >> ~/.bashrc
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION" >> ~/.bashrc

# Instalar componentes necesarios
echo "📦 Instalando componentes Android SDK..."
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "build-tools;$BUILD_TOOLS_VERSION" "platforms;android-$PLATFORM_VERSION"

# Crear local.properties para el proyecto
echo "📝 Configurando local.properties..."
cd /mnt/c/Proyectos/Urban-Drive-master/android
echo "sdk.dir=$ANDROID_HOME" > local.properties

echo "✅ Android SDK configurado exitosamente!"
echo ""
echo "📋 Información importante:"
echo "   - ANDROID_HOME: $ANDROID_HOME"
echo "   - Build Tools: $BUILD_TOOLS_VERSION"
echo "   - Platform: android-$PLATFORM_VERSION"
echo ""
echo "🔄 Reinicia tu terminal o ejecuta: source ~/.bashrc"
echo "📱 Luego ejecuta: ./build-apk.sh"