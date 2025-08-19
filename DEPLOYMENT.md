# 🚀 Urban Drive - Deployment Guide

Urban Drive has been completely modernized and is now ready for multi-platform deployment. This guide covers all deployment options.

## 📋 Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- Firebase account and project configured
- Mapbox API key
- Android Studio (for APK generation)
- Git installed

## 🌐 Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# App Configuration
VITE_APP_NAME=Urban Drive
VITE_APP_URL=https://your-domain.com
```

## 🔧 Build and Deployment Options

### 1. 📱 Progressive Web App (PWA)

The fastest way to deploy Urban Drive as a PWA:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the build
npm run preview
```

The built files will be in the `dist/` folder. Deploy this folder to any static hosting service:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your Git repository
- **Firebase Hosting**: Use Firebase CLI
- **GitHub Pages**: Upload to your repository

#### PWA Features Included:
- ✅ Offline functionality
- ✅ App installation prompt
- ✅ Background sync
- ✅ Push notifications (when configured)
- ✅ Responsive design for all screen sizes

### 2. 🤖 Native Android APK

Generate a native Android APK using Capacitor:

#### Option A: Quick Setup (Recommended)
```bash
# Run the automated build script
./scripts/build-android.sh
```

#### Option B: Manual Setup
```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Initialize Capacitor (first time only)
npx cap init "Urban Drive" "com.urbandrive.app"

# Add Android platform (first time only)
npx cap add android

# Sync web assets to native project
npx cap sync

# Open in Android Studio
npx cap open android

# Or run directly on device
npx cap run android
```

#### Android Features:
- ✅ Native device permissions (location, camera, notifications)
- ✅ Haptic feedback
- ✅ Native status bar control
- ✅ Background geolocation
- ✅ Push notifications
- ✅ Native toast messages
- ✅ Device information access

### 3. 🌍 Multi-Browser Compatibility

Urban Drive is optimized for all modern browsers:

- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ UC Browser

#### Testing Across Browsers:
```bash
# Start development server
npm run dev

# Access from different devices on your network
# The server runs on all network interfaces
```

## 🔐 Firebase Configuration

### 1. Authentication Setup
1. Go to Firebase Console > Authentication
2. Enable Sign-in methods: Email/Password
3. Configure authorized domains

### 2. Firestore Database
1. Create Firestore database
2. Set up security rules (see `firestore.rules`)
3. Create required collections:
   - `users` - User profiles
   - `drivers` - Driver information
   - `rides` - Ride requests and history
   - `messages` - Chat messages

### 3. Firebase Hosting (Optional)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
npm run build
firebase deploy
```

## 🗺️ Mapbox Configuration

1. Create a Mapbox account
2. Generate an access token
3. Add the token to your `.env` file
4. Configure allowed URLs in Mapbox dashboard

## 📊 Performance Optimizations

Urban Drive includes several performance optimizations:

### Code Splitting
- Lazy-loaded components
- Route-based splitting
- Vendor chunk optimization

### Caching Strategy
- Service Worker with offline support
- Mapbox tiles caching
- Firebase data caching
- Image optimization

### Mobile Optimizations
- Touch-friendly UI elements
- Reduced bundle size for mobile
- Adaptive loading strategies
- GPU-accelerated animations

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set up environment variables
- [ ] Configure Firebase security rules
- [ ] Test on multiple devices and browsers
- [ ] Set up error monitoring (Sentry/Firebase Crashlytics)
- [ ] Configure analytics
- [ ] Set up SSL certificates
- [ ] Test PWA installation
- [ ] Test APK on real Android devices
- [ ] Set up continuous deployment
- [ ] Configure backup strategies

## 📱 APK Signing (for Production)

For production APK builds:

1. Generate a signing key:
```bash
keytool -genkey -v -keystore urbandrive-release.keystore -alias urbandrive -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`

3. Build signed APK:
```bash
cd android
./gradlew assembleRelease
```

## 🔄 Continuous Deployment

### GitHub Actions Example:
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Urban Drive
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## 📞 Support and Troubleshooting

### Common Issues:

1. **PWA not installing**: Check manifest.json and HTTPS
2. **APK build fails**: Ensure Android SDK is properly configured
3. **Location not working**: Check permissions and HTTPS
4. **Firebase errors**: Verify configuration and rules

### Getting Help:
- Check the browser console for errors
- Verify environment variables
- Test on different devices
- Review Firebase and Mapbox quotas

## 🎉 Success!

Your Urban Drive app is now ready for deployment across all platforms:
- 🌐 **Web (PWA)**: Installable web app with offline support
- 📱 **Android**: Native APK with device integrations
- 💻 **Desktop**: Responsive design for all screen sizes
- 🚀 **Production**: Optimized for performance and scalability

The app provides a modern, intuitive experience for both drivers and passengers, with real-time location tracking, messaging, and ride management capabilities.