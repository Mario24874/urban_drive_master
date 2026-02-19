import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Deshabilitado temporalmente por error ESM
import path from 'path';
import fs from 'fs';

/**
 * Plugin that rewrites CACHE_NAME in dist/sw.js with a build timestamp.
 * This guarantees the browser always detects a new SW on every deploy,
 * triggering the update flow (updatefound → skipWaiting → controllerchange → reload).
 */
function injectSwVersion(): Plugin {
  return {
    name: 'inject-sw-version',
    apply: 'build',
    writeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(swPath)) return;
      let content = fs.readFileSync(swPath, 'utf-8');
      content = content.replace(
        /const CACHE_NAME = '[^']*';/,
        `const CACHE_NAME = 'urban-drive-${Date.now()}';`,
      );
      fs.writeFileSync(swPath, content);
      console.log('[inject-sw-version] Injected build timestamp into dist/sw.js');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    injectSwVersion(),
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