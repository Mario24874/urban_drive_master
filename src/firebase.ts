// src/firebase.ts - Re-exports from the canonical service file
// This file exists for backward compatibility with components that import from '../firebase'
// DO NOT add a second initializeApp() here - that causes "App already exists" crash

export { auth, db, default } from './services/firebase';

// messaging is exported as null - use firebase/messaging directly if needed
export const messaging = null;
