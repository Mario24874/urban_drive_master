import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r?.scope);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      setShowUpdate(true);
    },
    onNeedRefresh() {
      console.log('New version available, refresh needed');
      setShowUpdate(true);
    },
  });

  const closeNotification = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowUpdate(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    closeNotification();
  };

  if (!showUpdate || (!offlineReady && !needRefresh)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {needRefresh ? (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              {needRefresh ? '¡Nueva versión disponible!' : 'App lista para usar offline'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {needRefresh 
                ? 'Haz clic en actualizar para obtener las últimas funciones.'
                : 'La app ahora funciona sin conexión a internet.'
              }
            </p>
            
            <div className="mt-3 flex space-x-2">
              {needRefresh && (
                <button
                  onClick={handleUpdate}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium transition-colors"
                >
                  Actualizar
                </button>
              )}
              
              <button
                onClick={closeNotification}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md font-medium transition-colors"
              >
                {needRefresh ? 'Más tarde' : 'Entendido'}
              </button>
            </div>
          </div>

          <button
            onClick={closeNotification}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;