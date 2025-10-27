import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Deshabilitado temporalmente por error ESM
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // VitePWA deshabilitado - usando service worker manual en public/sw.js
    // VitePWA({
    //   strategies: 'injectManifest',
    //   srcDir: 'public',
    //   filename: 'sw.js',
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: false
    //   },
    //   injectManifest: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     globIgnores: ['**/assets/background.jpg', '**/sw.js'],
    //     maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
    //   },
    //   includeAssets: ['favicon.ico', 'assets/UrbanDrive.png'],
    //   manifest: {
    //     name: 'Urban Drive - GPS & Messaging',
    //     short_name: 'Urban Drive',
    //     description: 'GPS navigation and real-time messaging for urban mobility',
    //     theme_color: '#3b82f6',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/assets/UrbanDrive.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: '/assets/UrbanDrive.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   }
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Allow external connections for mobile testing
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1500, // Increase limit to 1.5 MB
    target: 'esnext', // Modern build for better performance
    minify: 'terser', // Better compression
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors principales
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Firebase en su propio chunk
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Mapbox en su propio chunk (es grande)
          'mapbox-vendor': ['mapbox-gl'],
          // UI components
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/auth', 'firebase/firestore'],
  },
});