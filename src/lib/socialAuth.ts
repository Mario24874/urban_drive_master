import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User } from '../hooks/useAuth';

export type SocialProvider = 'google' | 'apple';

/**
 * Inicia sesión con Google o Apple vía popup y resuelve el perfil de la app.
 * Si el usuario es nuevo (sin doc en Firestore), crea un doc mínimo en `users`.
 *
 * NOTA: requiere habilitar el proveedor en Firebase Console → Authentication →
 * Sign-in method (Apple además necesita un Services ID de Apple Developer).
 * Sin eso, Firebase devuelve `auth/operation-not-allowed`.
 */
export async function signInWithProvider(providerName: SocialProvider): Promise<User> {
  const provider =
    providerName === 'google'
      ? new GoogleAuthProvider()
      : new OAuthProvider('apple.com');

  if (providerName === 'apple') {
    provider.addScope('email');
    provider.addScope('name');
  }

  const cred: UserCredential = await signInWithPopup(auth, provider);
  const fbUser = cred.user;

  const userRef = doc(db, 'users', fbUser.uid);
  const driverRef = doc(db, 'drivers', fbUser.uid);
  const [userSnap, driverSnap] = await Promise.all([getDoc(userRef), getDoc(driverRef)]);

  let userType: 'user' | 'driver' = 'user';
  let data = userSnap.exists() ? userSnap.data() : null;

  if (driverSnap.exists()) {
    userType = 'driver';
    data = driverSnap.data();
  } else if (!userSnap.exists()) {
    // UID nuevo (sin perfil): antes de crear uno, verifica que este email no
    // pertenezca ya a otra cuenta (evita duplicados cuando alguien se registró
    // por email/password y luego entra por primera vez con Google/Apple).
    if (fbUser.email) {
      const [existingUsers, existingDrivers] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('email', '==', fbUser.email))),
        getDocs(query(collection(db, 'drivers'), where('email', '==', fbUser.email))),
      ]);
      const hasOtherAccount =
        existingUsers.docs.some((d) => d.id !== fbUser.uid) ||
        existingDrivers.docs.some((d) => d.id !== fbUser.uid);
      if (hasOtherAccount) {
        await auth.signOut();
        throw new Error(
          'Ya existe una cuenta registrada con este correo. Inicia sesión con tu método original (email y contraseña).'
        );
      }
    }
    // Primer ingreso social: crea un perfil de pasajero por defecto.
    data = {
      displayName: fbUser.displayName || '',
      email: fbUser.email || '',
      phone: fbUser.phoneNumber || '',
      photoURL: fbUser.photoURL || '',
      isVisible: true,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, data);
  }

  return {
    id: fbUser.uid,
    userType,
    displayName: data?.displayName || fbUser.displayName || '',
    email: fbUser.email || '',
    phone: data?.phone || '',
    isVisible: data?.isVisible ?? true,
  };
}
