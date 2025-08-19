#!/bin/bash

# Urban Drive - Android Build Script
# This script builds the project for Android deployment

set -e

echo "🚀 Urban Drive - Android Build Process Starting..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the web application..."
npm run build

echo "🔧 Initializing Capacitor (if not already done)..."
if [ ! -f "capacitor.config.ts" ]; then
    npx cap init "Urban Drive" "com.urbandrive.app"
fi

echo "📱 Adding Android platform (if not already added)..."
if [ ! -d "android" ]; then
    npx cap add android
fi

echo "🔄 Syncing web assets to native project..."
npx cap sync android

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Android Studio:"
echo "   npx cap open android"
echo ""
echo "2. Or run directly on connected device:"
echo "   npx cap run android"
echo ""
echo "3. Or build APK using Gradle:"
echo "   cd android && ./gradlew assembleDebug"
echo ""
echo "🎉 Your Urban Drive app is ready for Android!"