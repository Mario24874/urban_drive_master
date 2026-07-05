import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Invitation } from '../types';

interface InvitationBannerProps {
  invitation: Invitation | null;
  /** Total de invitaciones pendientes (para el texto "+N más") */
  count: number;
  onAccept: (invitation: Invitation) => void;
  onReject: (invitation: Invitation) => void;
  /** Tap en el cuerpo del banner: ir a la pestaña de contactos/invitaciones */
  onView: () => void;
}

const getInitials = (name: string, email?: string) =>
  name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0]?.toUpperCase() ?? '?');

/**
 * Banner prominente de invitación pendiente — aceptar/rechazar en 1 tap
 * sin tener que descubrir la pestaña de invitaciones.
 */
const InvitationBanner: React.FC<InvitationBannerProps> = ({
  invitation,
  count,
  onAccept,
  onReject,
  onView,
}) => {
  const { t } = useApp();

  return (
    <AnimatePresence>
      {invitation && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mx-3 mt-2 flex items-center gap-3 rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 px-3 py-2 backdrop-blur-md"
        >
          <div
            className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer"
            onClick={onView}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9 border border-brand-yellow/40">
                <AvatarFallback className="bg-brand-yellow/15 text-brand-yellow text-xs">
                  {getInitials(invitation.fromName, invitation.fromEmail)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-brand-yellow p-0.5">
                <UserPlus size={8} className="text-brand-ink" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {t('inviteBannerText').replace(
                  '{name}',
                  invitation.fromName || invitation.fromEmail,
                )}
              </p>
              {count > 1 && (
                <p className="text-xs text-white/60">
                  {t('inviteBannerMore').replace('{n}', String(count - 1))}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-1">
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-brand-yellow text-brand-ink hover:bg-brand-yellow/90"
              onClick={() => onAccept(invitation)}
              title={t('accept')}
            >
              <Check size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => onReject(invitation)}
              title={t('reject')}
            >
              <X size={16} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvitationBanner;
