import { GoogleAuthProvider, OAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';

export type SocialProvider = 'google' | 'apple';

/**
 * Inicia sesión con Google o Apple vía REDIRECT (más confiable que popup en móvil/PWA).
 * La página navega al proveedor y vuelve; el alta del perfil de un usuario social nuevo
 * la maneja App.tsx (onAuthStateChanged) al regresar.
 *
 * Requiere: proveedor habilitado en Firebase + el dominio en Authentication → Settings →
 * Authorized domains. Apple además: Services ID de Apple Developer.
 */
export async function startSocialSignIn(providerName: SocialProvider): Promise<void> {
  const provider =
    providerName === 'google'
      ? new GoogleAuthProvider()
      : new OAuthProvider('apple.com');

  if (providerName === 'apple') {
    provider.addScope('email');
    provider.addScope('name');
  }

  await signInWithRedirect(auth, provider);
}
