import { useState, useEffect } from 'react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import PortableInterface from './components/PortableInterface';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitorear estado de autenticación (como en portable)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado, obtener datos completos de Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          const completeUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData.displayName,
            ...userData
          };
          
          setUser(completeUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner mr-3"></div>
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Background image matching portable version */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ 
          backgroundImage: `url(/assets/background.png)`
        }}
      />
      
      {/* Usar la misma interfaz que portable */}
      <div className="relative z-10">
        <PortableInterface 
          user={user} 
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}

export default App;