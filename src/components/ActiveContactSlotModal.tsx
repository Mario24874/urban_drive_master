/**
 * ActiveContactSlotModal
 *
 * Shown when a free-tier user (1 contact slot) receives an invitation
 * while their slot is already occupied.
 *
 * Scenario:
 *  - User A (paid) is the current active contact → can see free user
 *  - User B (paid) sends invitation → free user gets this modal
 *
 * Options:
 *  1. Upgrade to Bronce → see all contacts
 *  2. Replace current contact with the new one
 *  3. Decline the new invitation
 */

import React from 'react';
import { Users, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Invitation } from '../types';
import type { Contact } from '../types';

interface ActiveContactSlotModalProps {
  open: boolean;
  onClose: () => void;
  /** The new invitation that triggered this modal */
  pendingInvitation: Invitation | null;
  /** The user's current active contact */
  currentContact: Contact | null;
  onUpgrade: () => void;
  /** Replace current contact with the new invitation's sender */
  onReplace: (invitation: Invitation) => void;
  /** Decline the new invitation */
  onDecline: (invitationId: string) => void;
}

function getInitials(name: string, email?: string) {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? '?';
}

const ActiveContactSlotModal: React.FC<ActiveContactSlotModalProps> = ({
  open,
  onClose,
  pendingInvitation,
  currentContact,
  onUpgrade,
  onReplace,
  onDecline,
}) => {
  const { t } = useApp();

  if (!pendingInvitation) return null;

  const newPersonName = pendingInvitation.fromName || pendingInvitation.fromEmail || '?';
  const currentPersonName = currentContact?.displayName || t('yourContact');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="p-3 rounded-full bg-blue-500/15 border border-blue-500/30"
            >
              <Users className="w-8 h-8 text-blue-400" />
            </motion.div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-base font-bold text-white">
                {t('slotModalTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-300 text-center">
                {t('slotModalDesc').replace('{name}', newPersonName)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Visual: current contact → new contact */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-10 h-10 border border-gray-600">
              <AvatarImage src={currentContact?.photoURL} />
              <AvatarFallback className="bg-gray-700 text-white text-xs">
                {getInitials(currentPersonName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-400 max-w-[70px] truncate text-center">
              {currentPersonName}
            </span>
            <span className="text-[10px] text-green-400">{t('slotCurrent')}</span>
          </div>

          <RefreshCw className="w-5 h-5 text-gray-500" />

          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-10 h-10 border border-blue-500/50">
              <AvatarFallback className="bg-blue-900/50 text-blue-300 text-xs">
                {getInitials(newPersonName, pendingInvitation.fromEmail)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-300 max-w-[70px] truncate text-center">
              {newPersonName}
            </span>
            <span className="text-[10px] text-blue-400">{t('slotNew')}</span>
          </div>
        </div>

        {/* Info hint */}
        <p className="text-xs text-center text-gray-500 px-2">
          {t('slotHint')}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={() => { onUpgrade(); onClose(); }}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-gray-900 font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('slotUpgrade')}
          </Button>

          <Button
            variant="outline"
            onClick={() => { onReplace(pendingInvitation); onClose(); }}
            className="w-full border-gray-600 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('slotReplace').replace('{name}', newPersonName)}
          </Button>

          <Button
            variant="ghost"
            onClick={() => { onDecline(pendingInvitation.id); onClose(); }}
            className="w-full text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            {t('slotDecline')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveContactSlotModal;
