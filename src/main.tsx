import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA install prompt
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt fired');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button or banner
  const installBanner = document.createElement('div');
  installBanner.id = 'install-banner';
  installBanner.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #000; color: white; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; z-index: 1000;">
      <span>Install Urban Drive for a better experience</span>
      <button id="install-btn" style="background: white; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Install</button>
      <button id="dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Later</button>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('dismiss-btn');
  
  installBtn?.addEventListener('click', () => {
    // Hide the banner
    installBanner.remove();
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  });
  
  dismissBtn?.addEventListener('click', () => {
    installBanner.remove();
  });
});

// Hide install banner after successful installation
window.addEventListener('appinstalled', () => {
  console.log('Urban Drive was installed');
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)