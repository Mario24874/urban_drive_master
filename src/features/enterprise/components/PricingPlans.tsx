import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Zap, Shield, Crown, Sparkles, Tag, Loader2,
  CreditCard, Building2,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'sonner';
import { useApp } from '../../../contexts/AppContext';
import { STRIPE_PRICE_IDS } from '../config/stripe';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import type { SubscriptionTier, SubscriptionBilling } from '../types/subscription';
import type { CouponType, DiscountCoupon } from '../../../admin/components/sections/AdminCoupons';
import BankTransferDialog from './BankTransferDialog';

type PaymentMethodOption = 'stripe' | 'transfer';

interface PricingPlansProps {
  userId: string;
  currentTier?: SubscriptionTier;
  onClose: () => void;
}

interface FeatureRow {
  label: string;
  bronce: string | boolean;
  plata: string | boolean;
  oro: string | boolean;
}

// Visual-only metadata — no localized strings here
const PLAN_VISUAL: Record<Exclude<SubscriptionTier, 'free'>, {
  icon: React.ReactNode;
  gradient: string;
  border: string;
  hasBadge: boolean;
  accentText: string;
  highlight: boolean;
}> = {
  bronce: {
    icon: <Zap size={22} />,
    gradient: 'from-amber-700 via-amber-600 to-orange-500',
    border: 'border-amber-500/40',
    hasBadge: false,
    accentText: 'text-amber-400',
    highlight: false,
  },
  plata: {
    icon: <Shield size={22} />,
    gradient: 'from-slate-500 via-slate-400 to-gray-300',
    border: 'border-slate-400/60',
    hasBadge: true,
    accentText: 'text-slate-300',
    highlight: true,
  },
  oro: {
    icon: <Crown size={22} />,
    gradient: 'from-yellow-500 via-amber-400 to-yellow-300',
    border: 'border-yellow-400/50',
    hasBadge: false,
    accentText: 'text-yellow-400',
    highlight: false,
  },
};

function FeatureValue({ value, accent }: { value: string | boolean; accent: string }) {
  if (value === false) return <span className="text-white/25 text-sm">—</span>;
  if (value === true) return <Check size={16} className={`${accent} flex-shrink-0`} />;
  return <span className={`text-xs font-medium ${accent}`}>{value as string}</span>;
}

const PlanCard: React.FC<{
  tier: Exclude<SubscriptionTier, 'free'>;
  billing: SubscriptionBilling;
  isCurrent: boolean;
  onSelect: (tier: Exclude<SubscriptionTier, 'free'>) => void;
  loading: boolean;
  features: FeatureRow[];
  label: string;
  tagline: string;
  badgeLabel: string | null;
  discountPct?: number;
}> = ({ tier, billing, isCurrent, onSelect, loading, features, label, tagline, badgeLabel, discountPct = 0 }) => {
  const { t } = useApp();
  const visual = PLAN_VISUAL[tier];
  const plan = SUBSCRIPTION_PLANS[tier];
  const basePrice = billing === 'monthly' ? plan.priceUsdPerMonth : Math.round(plan.priceUsdPerYear / 12);
  const price = discountPct > 0 ? Math.round(basePrice * (1 - discountPct)) : basePrice;
  const totalYear = plan.priceUsdPerYear;
  const saved = plan.priceUsdPerMonth * 12 - totalYear;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl border p-5 ${visual.border} ${
        visual.highlight
          ? 'bg-white/10 backdrop-blur-md shadow-2xl shadow-slate-400/20 ring-1 ring-slate-400/30'
          : 'bg-white/5 backdrop-blur-sm'
      }`}
    >
      {badgeLabel && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 bg-gradient-to-r from-slate-400 to-gray-300 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            <Sparkles size={11} /> {badgeLabel}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center text-white shadow-lg`}>
          {visual.icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">{label}</h3>
          <p className="text-white/50 text-xs leading-tight">{tagline}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-white/50 text-sm self-start mt-1">USD</span>
          {discountPct > 0 && discountPct < 1 && (
            <span className="text-white/30 text-xl line-through self-center">${basePrice}</span>
          )}
          <span className={`text-4xl font-black ${visual.accentText}`}>
            {discountPct >= 1 ? t('coupon100Label') : `$${price}`}
          </span>
          {discountPct < 1 && (
            <span className="text-white/50 text-sm mb-1">{t('billingPerMonth')}</span>
          )}
        </div>
        {billing === 'yearly' && discountPct === 0 && (
          <p className="text-white/40 text-xs mt-0.5">
            {t('billingYearlySave')
              .replace('{total}', `$${totalYear}`)
              .replace('{saved}', `$${saved}`)}
          </p>
        )}
        {discountPct > 0 && (
          <p className="text-green-400 text-xs mt-0.5 font-semibold">
            ✓ {couponDescription(discountPct, t)}
          </p>
        )}
      </div>

      <div className="space-y-2.5 flex-1 mb-5">
        {features.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2">
            <span className="text-white/60 text-xs">{f.label}</span>
            <FeatureValue
              value={f[tier as keyof FeatureRow] as string | boolean}
              accent={visual.accentText}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => !isCurrent && onSelect(tier)}
        disabled={isCurrent || loading}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
          isCurrent
            ? 'bg-white/10 text-white/50 cursor-default border border-white/10'
            : `bg-gradient-to-r ${visual.gradient} text-white hover:opacity-90 active:scale-95 shadow-lg`
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {t('planProcessing')}
          </span>
        ) : isCurrent ? (
          t('planCurrentCta')
        ) : (
          t('planSubscribeTo').replace('{plan}', label)
        )}
      </button>
    </motion.div>
  );
};

// ── Coupon discount % per type ───────────────────────────────────────────────
const COUPON_DISCOUNT: Record<CouponType, number> = {
  discount_10:  0.10,
  discount_50:  0.50,
  discount_100: 1.00,
};

function couponDescription(discountPct: number, t: (key: string) => string): string {
  if (discountPct >= 1) return t('coupon100Label');
  return t('couponDiscApplied').replace('{pct}', String(Math.round(discountPct * 100)));
}

const PricingPlans: React.FC<PricingPlansProps> = ({ userId, currentTier = 'free', onClose }) => {
  const { t } = useApp();
  const [billing, setBilling] = useState<SubscriptionBilling>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('stripe');

  // Bank transfer state
  const [transferTier, setTransferTier] = useState<Exclude<SubscriptionTier, 'free'> | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponData, setCouponData] = useState<DiscountCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);

  // Plan names are the same in both languages
  const PLAN_NAMES: Record<Exclude<SubscriptionTier, 'free'>, string> = {
    bronce: 'Bronce',
    plata: 'Plata',
    oro: 'Oro',
  };

  const PLAN_TAGLINES: Record<Exclude<SubscriptionTier, 'free'>, string> = {
    bronce: t('planTaglineBronce'),
    plata: t('planTaglinePlata'),
    oro: t('planTaglineOro'),
  };

  const FEATURES: FeatureRow[] = [
    { label: t('featDrivers'),     bronce: t('featUpTo').replace('{n}', '3'),   plata: t('featUpTo').replace('{n}', '20'),  oro: t('featUnlimited') },
    { label: t('adminFleet'),      bronce: t('featUpTo').replace('{n}', '3'),   plata: t('featUpTo').replace('{n}', '20'),  oro: t('featUnlimited') },
    { label: t('featModalities'),  bronce: '1',                                  plata: '3',                                 oro: t('featAll') },
    { label: t('featActiveTrips'), bronce: t('featUpTo').replace('{n}', '20'),  plata: t('featUpTo').replace('{n}', '200'), oro: t('featUnlimited') },
    { label: t('featGPS'),         bronce: true,                                 plata: true,                                oro: true },
    { label: t('featChat'),        bronce: true,                                 plata: true,                                oro: true },
    { label: t('featStats'),       bronce: false,                                plata: t('featBasic'),                      oro: t('featAdvanced') },
    { label: t('featAPI'),         bronce: false,                                plata: false,                               oro: true },
    { label: t('featBranding'),    bronce: false,                                plata: false,                               oro: true },
    { label: t('featSupport'),     bronce: 'Email',                              plata: t('featPriorityEmail'),              oro: t('featPhoneEmail') },
  ];

  // ── Coupon validation ────────────────────────────────────────────────────

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponValidating(true);
    setCouponError('');
    setCouponData(null);

    try {
      // Firestore uses addDoc so we need to query by code field
      // We query the collection for a document with matching code field
      const { collection: col, getDocs: gd, query: q, where } = await import('firebase/firestore');
      const snap = await gd(q(col(db, 'discount_coupons'), where('code', '==', code)));

      if (snap.empty) {
        setCouponError(t('couponInvalid'));
        return;
      }

      const docSnap = snap.docs[0];
      const data = { id: docSnap.id, ...docSnap.data() } as DiscountCoupon;

      if (data.status !== 'active') {
        setCouponError(t('couponInvalid'));
        return;
      }
      if (data.expiresAt.toDate() < new Date()) {
        setCouponError(t('couponInvalid'));
        return;
      }

      setCouponData(data);
      toast.success(t('couponApplied'), { description: data.description });
    } catch (err: any) {
      setCouponError(err?.message ?? t('couponInvalid'));
    } finally {
      setCouponValidating(false);
    }
  };

  const clearCoupon = () => {
    setCouponData(null);
    setCouponInput('');
    setCouponError('');
  };

  // ── Plan selection (with coupon support) ─────────────────────────────────

  const handleSelectPlan = async (tier: Exclude<SubscriptionTier, 'free'>) => {
    // ── Bank transfer ────────────────────────────────────────────────────────
    if (paymentMethod === 'transfer') {
      setTransferTier(tier);
      return;
    }

    // ── 100% coupon: bypass Stripe, activate directly in Firestore ──────────
    if (couponData?.type === 'discount_100') {
      setLoadingTier(tier);
      try {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await setDoc(doc(db, 'subscriptions', userId), {
          userId,
          ownerId: userId,
          ownerName: '',
          adminIds: [userId],
          tier,
          billing,
          status: 'active',
          currentPeriodStart: Timestamp.fromDate(now),
          currentPeriodEnd: Timestamp.fromDate(periodEnd),
          cancelAtPeriodEnd: false,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
          couponCode: couponData.code,
          paymentMethod: 'coupon',
        });

        // Mark coupon as used
        await updateDoc(doc(db, 'discount_coupons', couponData.id), {
          status: 'used',
          usedAt: Timestamp.fromDate(now),
          usedBy: userId,
        });

        toast.success(t('couponActivated'));
        onClose();
      } catch (err: any) {
        console.error('Coupon activation error:', err);
        toast.error(t('couponActivateError'), { description: err?.message });
      } finally {
        setLoadingTier(null);
      }
      return;
    }

    // ── Regular Stripe checkout (with optional 10%/50% coupon) ──────────────
    const priceId = STRIPE_PRICE_IDS[tier][billing];
    if (!priceId.startsWith('price_') || priceId.includes('PLACEHOLDER')) {
      toast.error(t('planStripeNotConfigured'));
      return;
    }

    setLoadingTier(tier);
    try {
      const functions = getFunctions();
      const createSession = httpsCallable<
        { priceId: string; userId: string; billing: string; couponCode?: string; couponType?: CouponType },
        { url: string }
      >(functions, 'createCheckoutSession');
      const result = await createSession({
        priceId,
        userId,
        billing,
        ...(couponData ? { couponCode: couponData.code, couponType: couponData.type } : {}),
      });
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(t('portalError'), { description: err?.message });
    } finally {
      setLoadingTier(null);
    }
  };

  const tiers: Exclude<SubscriptionTier, 'free'>[] = ['bronce', 'plata', 'oro'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/background.jpg)' }}
      />
      <div className="absolute inset-0 -z-10 bg-black/70" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/UrbanDrive.png" alt="Urban Drive" className="h-9 w-9 rounded-xl shadow-lg" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">{t('pricingTitle')}</h1>
              <p className="text-white/50 text-xs">{t('pricingSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex-shrink-0 flex justify-center py-3 px-4">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              billing === 'monthly' ? 'bg-white text-gray-900 shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {t('billingMonthly')}
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              billing === 'yearly' ? 'bg-white text-gray-900 shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            {t('billingYearly')}
            <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              −17%
            </span>
          </button>
        </div>
      </div>

      {/* Payment method selector */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex items-center justify-center gap-2">
          {(
            [
              { key: 'stripe',   label: 'Stripe',              icon: <CreditCard size={13} /> },
              { key: 'transfer', label: t('bankTransferShort'), icon: <Building2 size={13} /> },
            ] as { key: PaymentMethodOption; label: string; icon: React.ReactNode }[]
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setPaymentMethod(key); setTransferTier(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                paymentMethod === key
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-white/50 hover:text-white border border-white/10 hover:border-white/30'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon input */}
      <div className="flex-shrink-0 px-4 pb-2">
        {!showCoupon ? (
          <button
            onClick={() => setShowCoupon(true)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mx-auto"
          >
            <Tag size={12} />
            {t('couponHave')}
          </button>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-white/70">{t('couponHave')}</span>
              <button
                onClick={() => { setShowCoupon(false); clearCoupon(); }}
                className="ml-auto text-white/30 hover:text-white/60 text-xs"
              >✕</button>
            </div>

            {!couponData ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="URBAN10-XXXXXXXX"
                  className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 font-mono focus:outline-none focus:border-amber-500/60"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponValidating || !couponInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  {couponValidating
                    ? <Loader2 size={14} className="animate-spin" />
                    : t('couponApply')}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/25 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" />
                  <span className="text-xs font-mono text-white/80">{couponData.code}</span>
                  <span className="text-xs text-green-400">{couponData.description}</span>
                </div>
                <button onClick={clearCoupon} className="text-white/30 hover:text-white/60 text-xs ml-2">✕</button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-red-400">{couponError}</p>
            )}
          </div>
        )}
      </div>

      {/* Plan cards — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={billing}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2"
          >
            {tiers.map((tier) => (
              <PlanCard
                key={tier}
                tier={tier}
                billing={billing}
                isCurrent={currentTier === tier}
                onSelect={handleSelectPlan}
                loading={loadingTier === tier}
                features={FEATURES}
                label={PLAN_NAMES[tier]}
                tagline={PLAN_TAGLINES[tier]}
                badgeLabel={tier === 'plata' ? t('planRecommended') : null}
                discountPct={couponData ? COUPON_DISCOUNT[couponData.type] : 0}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center py-6 space-y-1">
          <p className="text-white/30 text-xs">{t('planNoCommitment')}</p>
          <p className="text-white/20 text-xs">{t('planSecurePayments')}</p>
          {currentTier !== 'free' && (
            <p className="text-white/30 text-xs mt-2">{t('planCancelNote')}</p>
          )}
        </div>
      </div>

      {/* Bank transfer dialog */}
      {transferTier && (
        <BankTransferDialog
          open={!!transferTier}
          onClose={() => setTransferTier(null)}
          userId={userId}
          tier={transferTier}
          billing={billing}
        />
      )}
    </div>
  );
};

export default PricingPlans;
