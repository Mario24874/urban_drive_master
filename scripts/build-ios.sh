#!/bin/bash

# Urban Drive - iOS Build Script
# This script builds the project for iOS deployment

set -e

echo "🍎 Urban Drive - iOS Build Process Starting..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  Warning: iOS development requires macOS and Xcode"
    echo "   You can still prepare the iOS project, but building requires macOS"
fi

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

echo "🍎 Adding iOS platform (if not already added)..."
if [ ! -d "ios" ]; then
    npx cap add ios
fi

echo "🔄 Syncing web assets to native project..."
npx cap sync ios

echo "✅ iOS Build completed successfully!"
echo ""
echo "📋 Next steps:"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "1. Open Xcode (macOS required):"
    echo "   npx cap open ios"
    echo ""
    echo "2. Or run directly on iOS simulator:"
    echo "   npx cap run ios"
    echo ""
    echo "3. Or build for iOS using Xcode:"
    echo "   - Open ios/App/App.xcworkspace in Xcode"
    echo "   - Select your device/simulator"
    echo "   - Press Build and Run"
else
    echo "1. Transfer the 'ios' folder to a macOS system with Xcode"
    echo "2. On macOS, open ios/App/App.xcworkspace in Xcode"
    echo "3. Build and run the project"
fi

echo ""
echo "🎉 Your Urban Drive app is ready for iOS!"