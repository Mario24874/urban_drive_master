import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Volume2, VolumeX, RotateCcw, X, MapPin, Clock } from 'lucide-react';
import navigationService, { NavigationState } from '../services/navigation';

interface NavigationInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  destination?: [number, number];
  contactName?: string;
}

const NavigationInterface: React.FC<NavigationInterfaceProps> = ({ 
  isVisible, 
  onClose, 
  destination, 
  contactName 
}) => {
  const [navState, setNavState] = useState<NavigationState>(navigationService.getState());
  const [isStarting, setIsStarting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStateChange = (newState: NavigationState) => {
      setNavState(newState);
    };

    navigationService.addListener(handleStateChange);

    return () => {
      navigationService.removeListener(handleStateChange);
    };
  }, []);

  const handleStartNavigation = async () => {
    if (!destination) return;

    setIsStarting(true);
    const success = await navigationService.startNavigation(destination, contactName);
    setIsStarting(false);

    if (!success) {
      alert('Error al iniciar la navegación. Verifica los permisos de ubicación.');
    }
  };

  const handleStopNavigation = () => {
    navigationService.stopNavigation();
  };

  const toggleVoice = () => {
    navigationService.toggleVoice(!navState.voiceEnabled);
  };

  const repeatInstruction = () => {
    navigationService.repeatInstruction();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation size={24} />
            <div>
              <h2 className="text-lg font-semibold">
                {navState.isNavigating ? 'Navegando' : 'Urban Drive GPS'}
              </h2>
              {contactName && (
                <p className="text-blue-100 text-sm">Hacia: {contactName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {navState.isNavigating && (
              <>
                <button
                  onClick={toggleVoice}
                  className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
                  title={navState.voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                >
                  {navState.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                
                <button
                  onClick={repeatInstruction}
                  className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
                  title="Repetir instrucción"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Info */}
      {navState.isNavigating && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatDistance(navState.remainingDistance)}
                </div>
                <div className="text-sm text-gray-600">Distancia</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(navState.remainingTime)}
                </div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
            </div>
            
            <button
              onClick={handleStopNavigation}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Finalizar
            </button>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Navigation size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">
                  {navState.nextInstruction || 'Calculando ruta...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {!navState.isNavigating ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <MapPin size={40} className="text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Navegación GPS
                </h3>
                <p className="text-gray-600">
                  {contactName ? 
                    `Inicia la navegación hacia ${contactName}` : 
                    'Selecciona un destino para comenzar'
                  }
                </p>
              </div>

              {destination && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {contactName || 'Destino seleccionado'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {destination[1].toFixed(6)}, {destination[0].toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartNavigation}
                    disabled={isStarting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isStarting ? (
                      <>
                        <Clock size={24} className="animate-spin" />
                        <span>Iniciando...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={24} />
                        <span>Iniciar Navegación</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-semibold text-gray-900 mb-2">Características:</h4>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Instrucciones de voz en tiempo real</li>
                  <li>• Navegación turn-by-turn</li>
                  <li>• Recalculo automático de ruta</li>
                  <li>• Optimizado para móviles</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Map placeholder during navigation
          <div className="h-full bg-gray-200 relative">
            <div 
              ref={mapRef}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}
            >
              <div>
                <Navigation size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Navegación Activa</h3>
                <p className="opacity-90">
                  {navState.userLocation ? 
                    `GPS: ${navState.userLocation[1].toFixed(6)}, ${navState.userLocation[0].toFixed(6)}` :
                    'Esperando señal GPS...'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con información adicional */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Urban Drive GPS</span>
            {navState.userLocation && (
              <span>
                📍 {navState.userLocation[1].toFixed(4)}, {navState.userLocation[0].toFixed(4)}
              </span>
            )}
          </div>
          {navState.isNavigating && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>GPS Activo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationInterface;