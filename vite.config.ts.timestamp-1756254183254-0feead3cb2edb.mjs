// vite.config.ts
import { defineConfig } from "file:///mnt/c/Proyectos/Urban-Drive-master/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Proyectos/Urban-Drive-master/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///mnt/c/Proyectos/Urban-Drive-master/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}"],
        globIgnores: ["**/assets/background.png", "**/assets/background.jpg"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // 10MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mapbox-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 1 week
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "firestore-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
                // 1 day
              }
            }
          }
        ]
      },
      includeAssets: ["favicon.ico", "assets/UrbanDrive.png", "assets/marker.png"],
      manifest: {
        name: "Urban Drive - Ride Sharing App",
        short_name: "Urban Drive",
        description: "Modern ride sharing application for urban mobility",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/assets/UrbanDrive.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    // Allow external connections for mobile testing
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) {
              return "react";
            }
            if (id.includes("react-dom")) {
              return "react-dom";
            }
            if (id.includes("firebase")) {
              return "firebase";
            }
            if (id.includes("mapbox-gl")) {
              return "mapbox-gl";
            }
            return "vendor";
          }
          if (id.includes("src/components")) {
            return "react-components";
          }
          if (id.includes("src/hooks")) {
            return "hooks";
          }
          if (id.includes("src/pages")) {
            return "pages";
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    // Increase limit to 1 MB
    target: "esnext",
    // Modern build for better performance
    minify: "terser"
    // Better compression
  },
  optimizeDeps: {
    include: ["react", "react-dom", "firebase/auth", "firebase/firestore"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvUHJveWVjdG9zL1VyYmFuLURyaXZlLW1hc3RlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9jL1Byb3llY3Rvcy9VcmJhbi1Ecml2ZS1tYXN0ZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9jL1Byb3llY3Rvcy9VcmJhbi1Ecml2ZS1tYXN0ZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28sc3ZnLHdvZmYsd29mZjJ9J10sXG4gICAgICAgIGdsb2JJZ25vcmVzOiBbJyoqL2Fzc2V0cy9iYWNrZ3JvdW5kLnBuZycsICcqKi9hc3NldHMvYmFja2dyb3VuZC5qcGcnXSxcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDEwICogMTAyNCAqIDEwMjQsIC8vIDEwTUIgbGltaXRcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2FwaVxcLm1hcGJveFxcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ21hcGJveC1jYWNoZScsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3LCAvLyAxIHdlZWtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZpcmVzdG9yZVxcLmdvb2dsZWFwaXNcXC5jb21cXC8uKi9pLFxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2ZpcmVzdG9yZS1jYWNoZScsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsIC8vIDEgZGF5XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhc3NldHMvVXJiYW5Ecml2ZS5wbmcnLCAnYXNzZXRzL21hcmtlci5wbmcnXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdVcmJhbiBEcml2ZSAtIFJpZGUgU2hhcmluZyBBcHAnLFxuICAgICAgICBzaG9ydF9uYW1lOiAnVXJiYW4gRHJpdmUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01vZGVybiByaWRlIHNoYXJpbmcgYXBwbGljYXRpb24gZm9yIHVyYmFuIG1vYmlsaXR5JyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQnLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvYXNzZXRzL1VyYmFuRHJpdmUucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSwgLy8gQWxsb3cgZXh0ZXJuYWwgY29ubmVjdGlvbnMgZm9yIG1vYmlsZSB0ZXN0aW5nXG4gICAgcG9ydDogNTE3MyxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgLy8gR3JvdXAgc3BlY2lmaWMgbW9kdWxlcyBpbnRvIHNlcGFyYXRlIGNodW5rc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LWRvbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2ZpcmViYXNlJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdmaXJlYmFzZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ21hcGJveC1nbCcpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnbWFwYm94LWdsJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEdyb3VwIHRoZSByZXN0IG9mIG5vZGVfbW9kdWxlcyBpbnRvIGEgJ3ZlbmRvcicgY2h1bmtcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBHcm91cCBhbGwgUmVhY3QgY29tcG9uZW50cyBpbnRvIGEgJ3JlYWN0LWNvbXBvbmVudHMnIGNodW5rXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdzcmMvY29tcG9uZW50cycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3JlYWN0LWNvbXBvbmVudHMnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEdyb3VwIGFsbCBob29rcyBpbnRvIGEgJ2hvb2tzJyBjaHVua1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL2hvb2tzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnaG9va3MnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEdyb3VwIGFsbCBwYWdlcyBpbnRvIGEgJ3BhZ2VzJyBjaHVua1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnc3JjL3BhZ2VzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAncGFnZXMnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsIC8vIEluY3JlYXNlIGxpbWl0IHRvIDEgTUJcbiAgICB0YXJnZXQ6ICdlc25leHQnLCAvLyBNb2Rlcm4gYnVpbGQgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgIG1pbmlmeTogJ3RlcnNlcicsIC8vIEJldHRlciBjb21wcmVzc2lvblxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdmaXJlYmFzZS9hdXRoJywgJ2ZpcmViYXNlL2ZpcmVzdG9yZSddLFxuICB9LFxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUEyUixTQUFTLG9CQUFvQjtBQUN4VCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBR3hCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFNBQVM7QUFBQSxRQUNQLGNBQWMsQ0FBQyx1Q0FBdUM7QUFBQSxRQUN0RCxhQUFhLENBQUMsNEJBQTRCLDBCQUEwQjtBQUFBLFFBQ3BFLCtCQUErQixLQUFLLE9BQU87QUFBQTtBQUFBLFFBQzNDLGdCQUFnQjtBQUFBLFVBQ2Q7QUFBQSxZQUNFLFlBQVk7QUFBQSxZQUNaLFNBQVM7QUFBQSxZQUNULFNBQVM7QUFBQSxjQUNQLFdBQVc7QUFBQSxjQUNYLFlBQVk7QUFBQSxnQkFDVixZQUFZO0FBQUEsZ0JBQ1osZUFBZSxLQUFLLEtBQUssS0FBSztBQUFBO0FBQUEsY0FDaEM7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFVBQ0E7QUFBQSxZQUNFLFlBQVk7QUFBQSxZQUNaLFNBQVM7QUFBQSxZQUNULFNBQVM7QUFBQSxjQUNQLFdBQVc7QUFBQSxjQUNYLFlBQVk7QUFBQSxnQkFDVixZQUFZO0FBQUEsZ0JBQ1osZUFBZSxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBQzNCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsZUFBZSxDQUFDLGVBQWUseUJBQXlCLG1CQUFtQjtBQUFBLE1BQzNFLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxRQUNQLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sYUFBYSxJQUFJO0FBQ2YsY0FBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBRS9CLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEdBQUc7QUFDeEIscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsVUFBVSxHQUFHO0FBQzNCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLGdCQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIscUJBQU87QUFBQSxZQUNUO0FBRUEsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsZ0JBQWdCLEdBQUc7QUFDakMsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsV0FBVyxHQUFHO0FBQzVCLG1CQUFPO0FBQUEsVUFDVDtBQUdBLGNBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBO0FBQUEsSUFDdkIsUUFBUTtBQUFBO0FBQUEsSUFDUixRQUFRO0FBQUE7QUFBQSxFQUNWO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLGlCQUFpQixvQkFBb0I7QUFBQSxFQUN2RTtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
