import { useState, useEffect, lazy, Suspense } from 'react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for code splitting
const PortableInterface = lazy(() => import('./components/PortableInterfaceNew'));
const PWAUpdateNotification = lazy(() => import('./components/PWAUpdateNotification'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-16 w-16 rounded-2xl shadow-xl mb-2" />
      <Loader2 className="h-10 w-10 animate-spin text-white" />
      <p className="text-sm text-white/80">Loading...</p>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User authenticated, get complete data from Firestore
        try {
          // Try users collection first
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData = userDoc.exists() ? userDoc.data() : null;

          // If not found in users, try drivers collection
          if (!userData) {
            userDoc = await getDoc(doc(db, 'drivers', firebaseUser.uid));
            userData = userDoc.exists() ? userDoc.data() : null;
          }

          const completeUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData?.displayName,
            photoURL: firebaseUser.photoURL || userData?.photoURL,
            ...userData,
          };

          setUser(completeUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error getting user data:', error);
          // Fallback to basic Firebase auth data
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
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
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/assets/background.jpg)`,
        }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 -z-10 bg-black/60" />

      {/* Main content with Suspense for code splitting */}
      <div className="relative z-10 flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <PortableInterface user={user} isAuthenticated={isAuthenticated} />
        </Suspense>
      </div>

      {/* PWA Update Notification */}
      <Suspense fallback={null}>
        <PWAUpdateNotification />
      </Suspense>
    </div>
  );
}

export default App;
