import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fcmService } from './services/fcmService';
import { Loader2 } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import { AppProvider } from './contexts/AppContext';

// Lazy load heavy components for code splitting
const PortableInterface = lazy(() => import('./components/PortableInterfaceNew'));
const PWAUpdateNotification = lazy(() => import('./components/PWAUpdateNotification'));
const AdminPortal = lazy(() => import('./admin/AdminPortal'));

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

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(!isAdminRoute);
  const authUidRef = useRef<string | null>(null);

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
            ...userData,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData?.displayName || '',
            photoURL: firebaseUser.photoURL || userData?.photoURL || '',
          };

          setUser(completeUser);
          setIsAuthenticated(true);

          // Initialize FCM push notifications
          authUidRef.current = firebaseUser.uid;
          fcmService.initialize(firebaseUser.uid).catch(() => {});
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
          authUidRef.current = firebaseUser.uid;
          fcmService.initialize(firebaseUser.uid).catch(() => {});
        }
      } else {
        if (authUidRef.current) {
          fcmService.cleanup(authUidRef.current).catch(() => {});
          authUidRef.current = null;
        }
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin route — clean background, no splash
  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <AdminPortal />
      </Suspense>
    );
  }

  // Main app route
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Persistent background image — always rendered */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/assets/background.jpg)` }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 bg-black/60" />

      {/* Splash screen on first load */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="relative z-10 flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            <PortableInterface
              user={user}
              isAuthenticated={isAuthenticated}
              onUserUpdate={(updatedUser) => setUser(updatedUser)}
            />
          </Suspense>
        </div>
      )}

      {/* PWA Update Notification */}
      <Suspense fallback={null}>
        <PWAUpdateNotification />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
