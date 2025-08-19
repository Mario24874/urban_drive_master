// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración Firebase (PRODUCCIÓN)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_zQMqs8o3evjEtjkuXybPW-sdH4c573M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "urbandrive-1082b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "urbandrive-1082b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "urbandrive-1082b.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "470229432792",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:470229432792:web:defaultappid"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;