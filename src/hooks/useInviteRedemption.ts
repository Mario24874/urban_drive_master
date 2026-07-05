import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../services/firebase';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';

const STORAGE_KEY = 'ud_pending_invite';

/**
 * Canje de enlaces de invitación (/invite/:id).
 * - Sin sesión: guarda el código y manda al registro; se canjea tras autenticarse.
 * - Con sesión: canjea de inmediato vía Cloud Function (redeemInvitation).
 */
export function useInviteRedemption(isAuthenticated: boolean, loading: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useApp();
  const redeemingRef = useRef(false);

  // Capturar el código del enlace y salir de la ruta /invite
  useEffect(() => {
    const match = location.pathname.match(/^\/invite\/([A-Za-z0-9]+)\/?$/);
    if (!match) return;
    try {
      localStorage.setItem(STORAGE_KEY, match[1]);
    } catch { /* sin storage: solo funciona el canje inmediato con sesión */ }
    navigate(isAuthenticated ? '/' : '/register', { replace: true });
  }, [location.pathname, isAuthenticated, navigate]);

  // Canjear cuando haya sesión
  useEffect(() => {
    if (loading || !isAuthenticated || redeemingRef.current) return;

    let code: string | null = null;
    try {
      code = localStorage.getItem(STORAGE_KEY);
    } catch { return; }
    if (!code) return;

    redeemingRef.current = true;
    httpsCallable(getFunctions(app), 'redeemInvitation')({ invitationId: code })
      .then((res) => {
        const fromName = (res.data as { fromName?: string })?.fromName || '';
        toast.success(t('inviteRedeemedTitle'), {
          description: t('inviteRedeemedDesc').replace('{name}', fromName || t('contacts')),
        });
      })
      .catch((err: { message?: string }) => {
        const msg = err?.message ?? '';
        const description = msg.includes('not_pending')
          ? t('inviteUsed')
          : msg.includes('own_invitation')
            ? t('inviteOwn')
            : t('inviteInvalid');
        toast.error(t('inviteErrorTitle'), { description });
      })
      .finally(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignorar */ }
        redeemingRef.current = false;
      });
  }, [isAuthenticated, loading, t]);
}
