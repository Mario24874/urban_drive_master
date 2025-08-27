import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface VisibilityToggleProps {
  userId: string;
  userType: 'user' | 'driver';
  className?: string;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ 
  userId, 
  userType,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Suscribirse a cambios de visibilidad en tiempo real
  useEffect(() => {
    if (!userId) return;

    const collection = userType === 'driver' ? 'drivers' : 'users';
    const docRef = doc(db, collection, userId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentVisibility = data.isVisible || false;
        setIsVisible(currentVisibility);
        
        // Mostrar última actualización
        if (data.lastVisibilityChange) {
          setLastUpdate(new Date(data.lastVisibilityChange));
        }
        
        console.log(`Visibilidad actualizada en tiempo real: ${currentVisibility}`);
      }
    }, (error) => {
      console.error('Error al escuchar cambios de visibilidad:', error);
    });

    return () => unsubscribe();
  }, [userId, userType]);

  const toggleVisibility = async () => {
    if (loading) return;
    
    setLoading(true);
    const newVisibility = !isVisible;
    
    try {
      const collection = userType === 'driver' ? 'drivers' : 'users';
      const docRef = doc(db, collection, userId);
      
      await updateDoc(docRef, {
        isVisible: newVisibility,
        lastVisibilityChange: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
      
      // El estado se actualizará automáticamente por el listener
      console.log(`Visibilidad cambiada a: ${newVisibility}`);
      
      // Notificación visual
      if (newVisibility) {
        showNotification('Ahora eres visible para tus contactos');
      } else {
        showNotification('Ya no eres visible para tus contactos');
      }
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
      showNotification('Error al cambiar visibilidad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <button
        onClick={toggleVisibility}
        disabled={loading}
        className={`
          relative inline-flex items-center justify-center
          w-20 h-10 rounded-full transition-all duration-300
          ${isVisible 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-gray-400 hover:bg-gray-500'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isVisible ? 'Ocultar mi ubicación' : 'Mostrar mi ubicación'}
      >
        {/* Toggle slider */}
        <div className={`
          absolute left-1 transition-transform duration-300
          w-8 h-8 bg-white rounded-full shadow-md
          flex items-center justify-center
          ${isVisible ? 'transform translate-x-10' : ''}
        `}>
          {isVisible ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </button>
      
      <div className="text-center">
        <div className="text-sm font-medium">
          {loading ? (
            <span className="text-gray-500">Actualizando...</span>
          ) : isVisible ? (
            <span className="text-green-600">Visible</span>
          ) : (
            <span className="text-gray-600">Oculto</span>
          )}
        </div>
        
        {lastUpdate && (
          <div className="text-xs text-gray-500">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisibilityToggle;