import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'assets/UrbanDrive.png'],
      manifest: {
        name: 'Urban Drive - GPS & Messaging',
        short_name: 'Urban Drive',
        description: 'GPS navigation and real-time messaging for urban mobility',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/assets/UrbanDrive.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/assets/UrbanDrive.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Allow external connections for mobile testing
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group specific modules into separate chunks
            if (id.includes('react')) {
              return 'react';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('mapbox-gl')) {
              return 'mapbox-gl';
            }
            // Group the rest of node_modules into a 'vendor' chunk
            return 'vendor';
          }

          // Group all React components into a 'react-components' chunk
          if (id.includes('src/components')) {
            return 'react-components';
          }

          // Group all hooks into a 'hooks' chunk
          if (id.includes('src/hooks')) {
            return 'hooks';
          }

          // Group all pages into a 'pages' chunk
          if (id.includes('src/pages')) {
            return 'pages';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500, // Increase limit to 1.5 MB
    target: 'esnext', // Modern build for better performance
    minify: 'terser', // Better compression
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/auth', 'firebase/firestore'],
  },
});