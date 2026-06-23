import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signInWithProvider, type SocialProvider } from '../../lib/socialAuth';
import type { User } from '../../hooks/useAuth';

interface Props {
  /** Texto del divisor (p.ej. "o continúa con"). */
  label?: string;
  /** Se llama con el perfil resuelto tras un login social exitoso. */
  onAuthenticated: (user: User) => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M16.36 1.43c0 1.14-.42 2.2-1.25 3.06-.99 1.02-2.18 1.61-3.47 1.5a3.7 3.7 0 0 1 1.27-3.01C13.78 2.1 15.05 1.5 16.13 1.43h.23zM20.5 17.1c-.6 1.38-.88 2-1.66 3.22-1.08 1.7-2.6 3.81-4.49 3.82-1.67.02-2.1-1.08-4.37-1.07-2.27.01-2.74 1.09-4.42 1.07-1.88-.01-3.32-1.92-4.4-3.62C-1.3 15.7-1.62 9.96 1.2 6.9 2.2 5.8 3.62 5.1 5.16 5.1c1.7 0 2.77 1.1 4.18 1.1 1.36 0 2.19-1.1 4.16-1.1 1.37 0 2.83.74 3.86 2.03-3.4 1.86-2.84 6.7.14 7.97z" />
  </svg>
);

export default function SocialAuthButtons({ label = 'o continúa con', onAuthenticated }: Props) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const handle = async (providerName: SocialProvider) => {
    setBusy(providerName);
    try {
      const user = await signInWithProvider(providerName);
      onAuthenticated(user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // El usuario cerró el popup; no es un error que mostrar.
      } else if (code === 'auth/operation-not-allowed') {
        toast.error('Proveedor no habilitado', {
          description: `Activa ${providerName === 'google' ? 'Google' : 'Apple'} en Firebase → Authentication → Sign-in method.`,
        });
      } else {
        toast.error('No se pudo iniciar sesión', {
          description: (err as { message?: string })?.message || 'Intenta de nuevo.',
        });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative mb-4 flex items-center">
        <span className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => handle('google')}>
          {busy === 'google' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="flex items-center gap-2"><GoogleIcon /> Google</span>
          )}
        </Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => handle('apple')}>
          {busy === 'apple' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="flex items-center gap-2"><AppleIcon /> Apple</span>
          )}
        </Button>
      </div>
    </div>
  );
}
