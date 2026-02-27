# 🚗 Urban Drive

**Modern ride-sharing Progressive Web Application (PWA)**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://urbandrive-1082b.web.app)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/Mario24874/urban_drive_master)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Version](https://img.shields.io/badge/Version-1.4.0-blue)](./CHANGELOG.md)
[![Bundle Size](https://img.shields.io/badge/Bundle-245KB-success)](./OPTIMIZATIONS.md)

## 📱 Features

### Core Features
- **🔐 Authentication** - Firebase Auth with email/password
- **🗺️ Interactive Maps** - Mapbox GL JS integration with 3D buildings
- **📍 Real-time Location** - Driver and user geolocation tracking with high accuracy
- **💬 Messaging** - Real-time chat between users and drivers
- **📱 PWA Ready** - Installable on mobile and desktop
- **🌐 Offline Support** - Service Worker with intelligent caching
- **📊 Responsive Design** - Works on all devices (mobile-first)
- **🔄 Real-time Sync** - Firebase Firestore integration

### New in v1.4.0 ✨
- **🛡️ Admin Portal** — Full back-office at `/admin` (Phase 8)
  - Firebase Auth + `admins/{uid}` Firestore collection guard
  - Dashboard with KPI cards, plan distribution bars, recent companies
  - Users table (all users + drivers) with search, filters, pagination, detail dialog
  - Companies, Subscriptions, Fleet, Maintenance, Documents sections
  - MRR estimation from active subscriptions
  - Responsive: desktop sidebar + mobile hamburger Sheet
  - Lazy-loaded chunk — zero impact on main app bundle
- **🐛 Firestore security fixes**
  - Subscriptions: rule now matches by doc ID (`isOwner(subscriptionId)`) instead of missing field
  - Invitations: corrected field names (`fromId` / `toId` / `toIdentifier`) for all 4 operations
- **🌐 Pricing i18n fix** — PricingPlans fully rewritten to use `t()` — no more hardcoded Spanish strings
- **🎨 UX fixes**
  - Settings sheet auto-closes before opening company/fleet/driver/maintenance/documents/analytics screens
  - CompanySetup: stepper and footer centered (`max-w-lg mx-auto`) and responsive on all screen sizes

### New in v1.3.0
- **💳 Subscription payments** — Stripe integration with Bronce / Plata / Oro plans
  - Monthly and annual billing with 17% discount
  - Full pricing UI with same app background
  - Real-time subscription state via Firestore
- **🏢 Enterprise layer (Phases 4–7)** — Company setup, Fleet manager, Driver manager,
  Vehicle Maintenance log + scheduler + alerts, Document vault + expiration dashboard,
  Fleet analytics dashboard (Plata/Oro gated)
- **🌐 Full i18n** — All UI strings translated (ES/EN) via AppContext
- **👤 Avatar markers** — Contact avatars on GPS map
- **🔔 Persistent PWA install dialog**

### New in v1.1.0
- **🎙️ GPS Voice Navigation** - Turn-by-turn voice instructions in Spanish
- **⚡ Optimized Performance** - 70% bundle size reduction (844KB → 245KB)
- **📦 Code Splitting** - Smart chunking for better caching
- **🎨 Shadcn/UI Integration** - Modern, accessible UI components
- **🌓 Dark Mode Ready** - Theme system with CSS variables
- **📍 Contact Tracking** - Real-time visibility of nearby drivers/users
- **🔔 Invitation System** - Invite contacts to share location

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

## ⚡ Performance Metrics

| Metric | v1.0.0 | v1.1.0 | Improvement |
|--------|--------|--------|-------------|
| **Bundle Size (JS)** | 844 KB | 245 KB | ↓ 70% |
| **Gzipped Bundle** | 208 KB | 59 KB | ↓ 72% |
| **Total Size** | 13 MB | 3.3 MB | ↓ 75% |
| **Build Time** | 1m 14s | 1m 12s | ↓ 3% |
| **First Load** | ~4.5s | ~1.3s | ↓ 71% |

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript 5.6** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework with custom theme
- **Shadcn/UI** - Beautifully designed components built with Radix UI

### Backend & Services
- **Firebase 10.14** - Authentication and Firestore database
- **Firebase Cloud Functions v2** - Stripe checkout session + webhook (Node 20)
- **Stripe** - Subscription payments (Bronce / Plata / Oro)
- **Mapbox GL JS 3.7** - Interactive 3D maps and turn-by-turn navigation
- **Service Worker** - Manual PWA implementation for optimal caching
- **Speech Synthesis API** - Native voice navigation

### Mobile & PWA
- **Capacitor 6** - Native mobile app wrapper (iOS & Android)
- **PWA** - Progressive Web App with offline support
- **Web APIs** - Geolocation, Notifications, Audio

### Development Tools
- **ESLint** - Code linting with TypeScript support
- **Path Aliases** - Clean imports with `@/` prefix
- **Code Splitting** - Optimized chunks for better caching

## 📂 Project Structure

```
src/
├── admin/              # Admin portal (NEW in v1.4.0) — lazy-loaded at /admin
│   ├── AdminPortal.tsx            # Entry point (auth guard)
│   ├── types/index.ts             # AdminUser, AdminSection types
│   ├── hooks/
│   │   ├── useAdminAuth.ts        # Firebase Auth + admins/{uid} check
│   │   └── useAdminData.ts        # Parallel Firestore reads (7 collections)
│   └── components/
│       ├── AdminLayout.tsx        # Desktop sidebar + mobile header
│       ├── AdminSidebar.tsx       # Nav items with lucide icons
│       ├── AdminMobileSidebar.tsx # Sheet hamburger menu
│       ├── AdminAccessDenied.tsx  # 403 screen for non-admins
│       └── sections/
│           ├── AdminDashboard.tsx     # KPI cards + plan distribution
│           ├── AdminUsers.tsx         # Users + drivers table (search, filter, paginate)
│           ├── AdminCompanies.tsx     # Companies table + detail dialog
│           ├── AdminSubscriptions.tsx # MRR + status chips
│           ├── AdminFleet.tsx         # Cross-company vehicles
│           ├── AdminMaintenance.tsx   # Overdue/warning/ok alerts
│           └── AdminDocuments.tsx     # Compliance bars per company
├── components/         # Shared React components
│   ├── GPSMapComponent.tsx        # GPS map with contact tracking
│   ├── NavigationInterface.tsx    # Voice navigation UI
│   ├── VisibilityToggle.tsx       # Location sharing controls
│   ├── InviteContact.tsx          # Contact invitation system
│   ├── ChatInterface.tsx          # Real-time messaging
│   ├── PortableInterface.tsx      # Main app interface
│   └── ...
├── features/enterprise/           # Enterprise layer (Phases 3–7)
│   ├── components/                # CompanySetup, FleetManager, etc.
│   ├── hooks/                     # useCompany, useFleet, useDrivers, etc.
│   └── types/                     # Company, Vehicle, Subscription, etc.
├── hooks/              # Custom React hooks
│   └── useContactTracking.ts
├── lib/                # Utilities
│   └── utils.ts        # cn() utility for classNames
├── services/           # External service integrations
│   ├── navigation.ts   # GPS voice navigation
│   ├── invitations.ts  # Contact invitation service
│   └── firebase.ts     # Firebase configuration
├── types/              # TypeScript type definitions
└── contexts/           # React contexts (AppContext — auth, i18n, theme)

public/
├── assets/             # Static assets
│   ├── UrbanDrive.png  # App icon (60KB)
│   ├── background.jpg  # Background image (2.2MB)
│   └── marker.png      # Map marker (56KB)
├── manifest.json       # PWA manifest
└── sw.js              # Service Worker (manual implementation)

Docs/
├── CHANGELOG.md        # Version history and changes (NEW)
├── OPTIMIZATIONS.md    # Technical optimization guide (NEW)
└── PROJECT-CONTEXT.md  # Project context and documentation
```

## 🌐 Deployment

### Firebase Hosting (actual — producción)

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only functions   # Cloud Functions (Stripe)
```

URL de producción: https://urbandrive-1082b.web.app

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas, configuración de Stripe y la hoja de ruta de migración a VPS con Easypanel.

### VPS + Easypanel + Dominio propio (hoja de ruta)

Planificado para la siguiente fase de producción. Ver sección "Migración a VPS con Easypanel" en [DEPLOYMENT.md](./DEPLOYMENT.md).

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

## 📚 Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and detailed change log
- **[OPTIMIZATIONS.md](./OPTIMIZATIONS.md)** - Technical guide on performance optimizations
- **[PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md)** - Project context and architecture

### Key Documentation Sections

#### GPS Voice Navigation
```typescript
// Test voice navigation
import navigationService from './services/navigation';
navigationService.testVoice();
navigationService.getVoiceInfo();
```

#### Code Splitting
```typescript
// Automatic chunking configured in vite.config.ts
// react-vendor: 140KB (React + Router)
// firebase-vendor: 454KB (Firebase services)
// mapbox-vendor: Lazy loaded
// ui-vendor: 4KB (UI utilities)
```

#### Service Worker
```javascript
// Manual PWA in public/sw.js
// Cache version: v1.1.0
// Precache: Essential assets only
// Runtime cache: Large images (background.jpg)
```

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com) - Backend and authentication
- [Mapbox](https://mapbox.com) - Maps and turn-by-turn navigation
- [React](https://reactjs.org) - Frontend framework
- [Vite](https://vitejs.dev) - Lightning-fast build tool
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Shadcn/UI](https://ui.shadcn.com) - Component library
- [Claude Code](https://claude.com/claude-code) - AI-powered development assistant

## 📞 Support

If you have any questions or need help:

1. Check the [documentation](./PROJECT-CONTEXT.md) and [CHANGELOG](./CHANGELOG.md)
2. Review [optimization guide](./OPTIMIZATIONS.md) for performance issues
3. Open an [issue](https://github.com/Mario24874/urban_drive_master/issues)
4. Contact the maintainer

### Common Issues

#### GPS Voice Not Working
```javascript
// Debug in browser console:
const voices = window.speechSynthesis.getVoices();
console.table(voices.filter(v => v.lang.startsWith('es')));
```

#### Build Failures
- Ensure Node.js 18+ is installed
- Run `npm install` to update dependencies
- Check [OPTIMIZATIONS.md](./OPTIMIZATIONS.md) troubleshooting section

---

**Made with ❤️ for modern urban mobility**

**Version:** 1.4.0 | **Last Updated:** 2026-02-26