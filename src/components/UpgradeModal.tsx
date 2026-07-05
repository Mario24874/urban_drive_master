/**
 * UpgradeModal — shown at plan-limit conversion moments.
 *
 * Reasons:
 *  - 'message_limit'    : reached 2 msg/day free limit
 *  - 'voice_notes'      : tried to send voice note on free plan
 *  - 'contact_limit'    : tried to add contact beyond free limit (handled in ContactList)
 */

import React from 'react';
import { Sparkles, MessageSquare, Mic, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type UpgradeReason = 'message_limit' | 'voice_notes' | 'contact_limit';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  reason: UpgradeReason;
  /** Remaining messages today (used for message_limit reason) */
  remaining?: number;
}

const REASON_CONFIG: Record<
  UpgradeReason,
  { icon: React.ReactNode; titleKey: string; descKey: string }
> = {
  message_limit: {
    icon: <MessageSquare className="w-8 h-8 text-amber-400" />,
    titleKey: 'upgradeMsgLimitTitle',
    descKey: 'upgradeMsgLimitDesc',
  },
  voice_notes: {
    icon: <Mic className="w-8 h-8 text-amber-400" />,
    titleKey: 'upgradeVoiceTitle',
    descKey: 'upgradeVoiceDesc',
  },
  contact_limit: {
    icon: <Zap className="w-8 h-8 text-amber-400" />,
    titleKey: 'contactLimitTitle',
    descKey: 'contactLimitDesc',
  },
};

const PLAN_FEATURES: { key: string }[] = [
  { key: 'upgradeFeatureContacts' },
  { key: 'upgradeFeatureMsgs' },
  { key: 'upgradeFeatureVoice' },
  { key: 'upgradeFeatureMap' },
];

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onUpgrade,
  reason,
}) => {
  const { t } = useApp();
  const config = REASON_CONFIG[reason];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-brand-ink border-white/10 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2 pb-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="p-3 rounded-full bg-amber-400/15 border border-amber-400/30"
            >
              {config.icon}
            </motion.div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-lg font-bold text-white">
                {t(config.titleKey)}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center">
                {t(config.descKey)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Feature list for Bronze plan */}
        <div className="bg-white/5 rounded-lg p-3 mx-1">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            {t('upgradePlanBronce')}
          </p>
          <ul className="space-y-1.5">
            {PLAN_FEATURES.map(({ key }) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => { onUpgrade(); onClose(); }}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-brand-ink font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('upgradePlan')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-white hover:bg-white/10"
          >
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
