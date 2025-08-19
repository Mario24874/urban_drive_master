# 🚗 Urban Drive

**Modern ride-sharing Progressive Web Application (PWA)**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://urban-drive.netlify.app)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/Mario24874/urban_drive_master)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)

## 📱 Features

- **🔐 Authentication** - Firebase Auth with email/password
- **🗺️ Interactive Maps** - Mapbox GL JS integration
- **📍 Real-time Location** - Driver and user geolocation tracking
- **💬 Messaging** - Real-time chat between users and drivers
- **📱 PWA Ready** - Installable on mobile and desktop
- **🌐 Offline Support** - Service Worker with intelligent caching
- **📊 Responsive Design** - Works on all devices
- **🔄 Real-time Sync** - Firebase Firestore integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Mario24874/urban_drive_master.git
cd urban_drive_master

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

### Backend & Services
- **Firebase** - Authentication and Firestore database
- **Mapbox GL JS** - Interactive maps and geolocation
- **PWA** - Service Worker with Workbox

### Mobile
- **Capacitor 6** - Native mobile app wrapper
- **PWA** - Progressive Web App capabilities

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Map/            # Map-related components
│   └── UI/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # External service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

public/
├── assets/             # Static assets
├── manifest.json       # PWA manifest
└── sw.js              # Service Worker
```

## 🌐 Deployment

### Netlify (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to Netlify
3. Configure environment variables in Netlify dashboard

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### Manual Deployment

Upload the contents of the `dist/` folder to any static hosting service.

## 🔧 Configuration

### Environment Variables

Create a `.env` file with your configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your config to `.env`

### Mapbox Setup

1. Create an account at [Mapbox](https://mapbox.com)
2. Get your access token
3. Add to `.env` file

## 📱 PWA Installation

Urban Drive can be installed as a Progressive Web App:

1. **Mobile**: Open in browser → "Add to Home Screen"
2. **Desktop**: Open in Chrome → Install icon in address bar
3. **Works offline** with cached content

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Code Quality

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Prettier** - Code formatting (recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com) - Backend and authentication
- [Mapbox](https://mapbox.com) - Maps and geolocation
- [React](https://reactjs.org) - Frontend framework
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - CSS framework

## 📞 Support

If you have any questions or need help:

1. Check the [documentation](./PROJECT-CONTEXT.md)
2. Open an [issue](https://github.com/Mario24874/urban_drive_master/issues)
3. Contact the maintainer

---

**Made with ❤️ for modern urban mobility**