/**
 * BankTransferDialog
 *
 * Shows bank account details and creates a pending subscription record.
 * Admin manually verifies the transfer and activates the subscription
 * from the Admin Portal.
 *
 * Reference format: UD-{userId.slice(0,8).toUpperCase()}-{TIER}
 */

import React, { useState } from 'react';
import { Copy, Check, Building2, Loader2 } from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier, SubscriptionBilling } from '../types/subscription';

// Bank details come from env vars — admin configures these
const BANK_CONFIG = {
  bankName: import.meta.env.VITE_BANK_NAME || '',
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || '',
  accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER || '',
  accountType: import.meta.env.VITE_BANK_ACCOUNT_TYPE || '',
  routingCode: import.meta.env.VITE_BANK_ROUTING || '',
};

interface BankTransferDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  billing: SubscriptionBilling;
}


const CopyableField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono text-white">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

const BankTransferDialog: React.FC<BankTransferDialogProps> = ({
  open,
  onClose,
  userId,
  userName,
  tier,
  billing,
}) => {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const plan = SUBSCRIPTION_PLANS[tier];
  const amount = billing === 'yearly' ? plan.priceUsdPerYear : plan.priceUsdPerMonth;
  const reference = `UD-${userId.slice(0, 8).toUpperCase()}-${tier.toUpperCase()}`;

  const PLAN_LABELS: Record<string, string> = {
    bronce: 'Bronce', plata: 'Plata', oro: 'Oro',
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    try {
      const now = new Date();
      // Pending period — 3 days for admin to verify
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 3);

      await setDoc(doc(db, 'subscriptions', userId), {
        userId,
        ownerId: userId,
        ownerName: userName ?? '',
        adminIds: [userId],
        tier,
        billing,
        status: 'pending_transfer',
        transferReference: reference,
        transferAmount: amount,
        transferCurrency: 'USD',
        currentPeriodStart: Timestamp.fromDate(now),
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        cancelAtPeriodEnd: false,
        paymentMethod: 'bank_transfer',
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      setConfirmed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(t('transferError'), { description: message });
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm bg-brand-ink border-white/10 text-white">
          <DialogHeader>
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="p-3 rounded-full bg-green-500/15 border border-green-500/30">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <DialogTitle className="text-center">{t('transferConfirmedTitle')}</DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                {t('transferConfirmedDesc').replace('{ref}', reference)}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-500 text-white">
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-brand-ink border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-yellow/10 border border-brand-yellow/30">
              <Building2 className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <DialogTitle>{t('bankTransferTitle')}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('bankTransferDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Amount */}
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('transferAmount')}</p>
          <p className="text-2xl font-bold text-white">
            ${amount.toFixed(2)} <span className="text-base font-normal text-muted-foreground">USD</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {PLAN_LABELS[tier]} — {billing === 'yearly' ? t('billingYearly') : t('billingMonthly')}
          </p>
        </div>

        {/* Bank Details */}
        <div className="bg-white/5 rounded-lg px-3">
          <CopyableField label={t('bankName')} value={BANK_CONFIG.bankName} />
          <CopyableField label={t('bankAccountName')} value={BANK_CONFIG.accountName} />
          <CopyableField label={t('bankAccountNumber')} value={BANK_CONFIG.accountNumber} />
          <CopyableField label={t('bankAccountType')} value={BANK_CONFIG.accountType} />
          {BANK_CONFIG.routingCode && (
            <CopyableField label={t('bankRoutingCode')} value={BANK_CONFIG.routingCode} />
          )}
          <CopyableField label={t('bankTransferRef')} value={reference} />
        </div>

        <p className="text-xs text-amber-300/80 text-center px-2">
          {t('bankTransferRefHint')}
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleConfirmTransfer}
            disabled={loading}
            className="w-full bg-brand-yellow hover:bg-brand-amber text-brand-ink font-bold"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('transferring')}</>
              : t('transferDone')
            }
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

export default BankTransferDialog;
